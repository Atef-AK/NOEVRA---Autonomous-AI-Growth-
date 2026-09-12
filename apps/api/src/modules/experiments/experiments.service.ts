import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import type {
  CreateExperimentDto,
  RecordVariantMetricDto,
  RecordTouchpointDto,
} from './dto/experiments.dto';

export interface ExperimentVariant {
  id: string;
  name: string;
  trafficShare: number;
  impressions: number;
  conversions: number;
  conversionRate: number;
}

@Injectable()
export class ExperimentsService {
  private readonly logger = new Logger(ExperimentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // A/B TESTING & STATISTICAL SIGNIFICANCE
  // ==========================================

  calculateSignificance(
    control: { impressions: number; conversions: number },
    challenger: { impressions: number; conversions: number },
  ): { zScore: number; confidence: number; isSignificant: boolean } {
    const n1 = control.impressions;
    const x1 = control.conversions;
    const n2 = challenger.impressions;
    const x2 = challenger.conversions;

    if (n1 < 20 || n2 < 20) {
      return { zScore: 0, confidence: 50.0, isSignificant: false };
    }

    const p1 = x1 / n1;
    const p2 = x2 / n2;
    const pPooled = (x1 + x2) / (n1 + n2);

    if (pPooled === 0 || pPooled === 1) {
      return { zScore: 0, confidence: 50.0, isSignificant: false };
    }

    const se = Math.sqrt(pPooled * (1 - pPooled) * (1 / n1 + 1 / n2));
    if (se === 0) {
      return { zScore: 0, confidence: 50.0, isSignificant: false };
    }

    const zScore = (p2 - p1) / se;

    // Approximate error function for normal CDF
    const t = 1.0 / (1.0 + 0.2316419 * Math.abs(zScore));
    const d = 0.3989422804014337 * Math.exp(-0.5 * zScore * zScore);
    const prob =
      1.0 -
      d *
        t *
        (0.31938153 +
          t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));

    // One-sided confidence
    const confidence = Math.min(99.9, Math.max(50.0, Math.round(prob * 1000) / 10));
    const isSignificant = confidence >= 95.0 && zScore > 0;

    return {
      zScore: Math.round(zScore * 100) / 100,
      confidence,
      isSignificant,
    };
  }

  async listExperiments(organizationId: string, status?: string) {
    const where: any = { organizationId };
    if (status) {
      where.status = status;
    }

    return this.prisma.growthExperiment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getExperiment(organizationId: string, id: string) {
    const experiment = await this.prisma.growthExperiment.findFirst({
      where: { id, organizationId },
    });

    if (!experiment) {
      throw new NotFoundException(`Experiment with id '${id}' not found`);
    }

    return experiment;
  }

  async createExperiment(organizationId: string, dto: CreateExperimentDto) {
    const variants: ExperimentVariant[] = dto.variants.map((v) => {
      const imp = v.impressions ?? 0;
      const conv = v.conversions ?? 0;
      const rate = imp > 0 ? Math.round((conv / imp) * 1000) / 10 : 0;
      return {
        id: v.id,
        name: v.name,
        trafficShare: v.trafficShare,
        impressions: imp,
        conversions: conv,
        conversionRate: rate,
      };
    });

    let confidence = 0.0;
    let winningVariant: string | null = null;

    if (variants.length >= 2 && variants[0] && variants[1]) {
      const sig = this.calculateSignificance(variants[0], variants[1]);
      confidence = sig.confidence;
      if (sig.isSignificant) {
        winningVariant = variants[1].id;
      }
    }

    return this.prisma.growthExperiment.create({
      data: {
        organizationId,
        title: dto.title,
        hypothesis: dto.hypothesis,
        metricName: dto.metricName,
        status: 'running',
        variants: variants as any,
        confidence,
        winningVariant,
        startedAt: new Date(),
      },
    });
  }

  async recordVariantMetrics(
    organizationId: string,
    id: string,
    dto: RecordVariantMetricDto,
  ) {
    const exp = await this.getExperiment(organizationId, id);
    const existingVariants = (exp.variants as any as ExperimentVariant[]) || [];

    const updatedVariants = existingVariants.map((v) => {
      if (v.id === dto.variantId) {
        const totalImp = v.impressions + dto.impressions;
        const totalConv = v.conversions + dto.conversions;
        const rate = totalImp > 0 ? Math.round((totalConv / totalImp) * 1000) / 10 : 0;
        return {
          ...v,
          impressions: totalImp,
          conversions: totalConv,
          conversionRate: rate,
        };
      }
      return v;
    });

    let confidence = exp.confidence;
    let winningVariant = exp.winningVariant;

    if (updatedVariants.length >= 2 && updatedVariants[0] && updatedVariants[1]) {
      const sig = this.calculateSignificance(updatedVariants[0], updatedVariants[1]);
      confidence = sig.confidence;
      if (sig.isSignificant) {
        winningVariant = updatedVariants[1].id;
      }
    }

    return this.prisma.growthExperiment.update({
      where: { id },
      data: {
        variants: updatedVariants as any,
        confidence,
        winningVariant,
      },
    });
  }

  // ==========================================
  // MULTI-TOUCH ATTRIBUTION ENGINE
  // ==========================================

  async recordTouchpoint(organizationId: string, dto: RecordTouchpointDto) {
    return this.prisma.attributionTouch.create({
      data: {
        organizationId,
        visitorId: dto.visitorId,
        channel: dto.channel,
        campaignName: dto.campaignName ?? null,
        touchpointType: dto.touchpointType,
        revenueImpact: dto.revenueImpact ?? 0,
      },
    });
  }

  async getAttributionSummary(
    organizationId: string,
    modelType: 'linear' | 'first_touch' | 'last_touch' | 'u_shaped' = 'linear',
  ) {
    const touches = await this.prisma.attributionTouch.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'asc' },
    });

    // Group by visitor
    const visitorMap = new Map<string, typeof touches>();
    for (const t of touches) {
      const list = visitorMap.get(t.visitorId) ?? [];
      list.push(t);
      visitorMap.set(t.visitorId, list);
    }

    const channelRevenue: Record<string, number> = {
      organic_search: 0,
      twitter: 0,
      linkedin: 0,
      referral: 0,
      direct: 0,
    };

    const channelTouchesCount: Record<string, number> = {
      organic_search: 0,
      twitter: 0,
      linkedin: 0,
      referral: 0,
      direct: 0,
    };

    for (const [, visitorTouches] of visitorMap.entries()) {
      const totalRevenue = visitorTouches.reduce((sum, t) => sum + t.revenueImpact, 0);
      const count = visitorTouches.length;
      if (count === 0) continue;

      visitorTouches.forEach((t, index) => {
        channelTouchesCount[t.channel] = (channelTouchesCount[t.channel] ?? 0) + 1;

        if (totalRevenue > 0) {
          let weight = 1 / count; // default linear

          if (modelType === 'first_touch') {
            weight = index === 0 ? 1 : 0;
          } else if (modelType === 'last_touch') {
            weight = index === count - 1 ? 1 : 0;
          } else if (modelType === 'u_shaped') {
            if (count === 1) {
              weight = 1;
            } else if (count === 2) {
              weight = 0.5;
            } else {
              if (index === 0) weight = 0.4;
              else if (index === count - 1) weight = 0.4;
              else weight = 0.2 / (count - 2);
            }
          }

          channelRevenue[t.channel] =
            (channelRevenue[t.channel] ?? 0) + Math.round(totalRevenue * weight);
        }
      });
    }

    return {
      modelType,
      totalTouches: touches.length,
      channelRevenue,
      channelTouchesCount,
      totalAttributedRevenue: Object.values(channelRevenue).reduce((a, b) => a + b, 0),
    };
  }
}
