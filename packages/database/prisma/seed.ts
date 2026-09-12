import { PrismaClient } from '@prisma/client';
import { ALL_SPECIALIZED_AGENTS } from '@growthos/agent-sdk';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting GrowthOS database seed...');

  // 1. Seed Organization
  const org = await prisma.organization.upsert({
    where: { slug: 'growthos-demo' },
    update: {},
    create: {
      name: 'GrowthOS Demo',
      slug: 'growthos-demo',
      plan: 'enterprise',
      logoUrl: 'https://growthos.ai/logo.png',
    },
  });
  console.log(`✅ Organization seeded: ${org.name} (${org.id})`);

  // 2. Seed Admin User
  // Secure default hash for GrowthOS123!
  const passwordHash = '$2a$10$w85GqQ9F.Kj7qKkUjGgHeeH3iP1WkX0dI0k.c0zQ6.F7jT/b5H4Ky';
  const user = await prisma.user.upsert({
    where: { email: 'admin@growthos.ai' },
    update: {},
    create: {
      email: 'admin@growthos.ai',
      passwordHash,
      name: 'GrowthOS Platform Administrator',
      emailVerified: true,
    },
  });
  console.log(`✅ Admin user seeded: ${user.email} (${user.id})`);

  // 3. Organization Membership
  await prisma.organizationMember.upsert({
    where: {
      organizationId_userId: {
        organizationId: org.id,
        userId: user.id,
      },
    },
    update: { role: 'owner' },
    create: {
      organizationId: org.id,
      userId: user.id,
      role: 'owner',
      joinedAt: new Date(),
      inviteStatus: 'accepted',
    },
  });
  console.log('✅ Admin membership linked as owner');

  // 4. Primary Project
  const project = await prisma.project.upsert({
    where: {
      organizationId_slug: {
        organizationId: org.id,
        slug: 'noevra-main',
      },
    },
    update: {},
    create: {
      organizationId: org.id,
      name: 'NOEVRA Main',
      slug: 'noevra-main',
      domain: 'https://growthos.ai',
      description: 'Autonomous AI Growth Platform Main Flagship Project',
      brandName: 'GrowthOS',
      brandVoice: 'authoritative, insightful, data-driven, engineering-grade, bold',
      targetAudience: 'Founders, Growth Leaders, Engineering Directors, Technical Marketers',
      valueProposition: 'Autonomous multi-agent growth engine replacing fragmented marketing tools',
    },
  });
  console.log(`✅ Project seeded: ${project.name} (${project.id})`);

  // 5. Seed All 13 Specialized Agents
  console.log(`🤖 Seeding ${ALL_SPECIALIZED_AGENTS.length} canonical specialized agents...`);
  for (const agentDef of ALL_SPECIALIZED_AGENTS) {
    await prisma.agent.upsert({
      where: {
        organizationId_slug: {
          organizationId: org.id,
          slug: agentDef.slug,
        },
      },
      update: {
        name: agentDef.name,
        description: agentDef.description,
        systemPrompt: agentDef.systemPrompt,
        allowedTools: agentDef.allowedTools as any,
        preferredModel: agentDef.preferredModel,
        maxSteps: agentDef.maxSteps,
        maxTokens: agentDef.maxTokens,
        temperatureX10: Math.round(agentDef.temperature * 10),
        isActive: true,
      },
      create: {
        organizationId: org.id,
        projectId: project.id,
        name: agentDef.name,
        slug: agentDef.slug,
        description: agentDef.description,
        systemPrompt: agentDef.systemPrompt,
        allowedTools: agentDef.allowedTools as any,
        preferredModel: agentDef.preferredModel,
        maxSteps: agentDef.maxSteps,
        maxTokens: agentDef.maxTokens,
        temperatureX10: Math.round(agentDef.temperature * 10),
        isActive: true,
      },
    });
  }
  console.log('✅ All 13 specialized agents synchronized in database');

  // 6. Company Brain Context
  const brain = await prisma.companyBrain.upsert({
    where: {
      organizationId_name: {
        organizationId: org.id,
        name: 'Primary Brain',
      },
    },
    update: {},
    create: {
      organizationId: org.id,
      projectId: project.id,
      name: 'Primary Brain',
      summary: 'GrowthOS (NOEVRA) is the autonomous AI Growth Operating System for modern software enterprises.',
      brandVoice: 'Authoritative, rigorous, engineering-grade, results-focused without marketing fluff.',
      targetAudience: 'B2B SaaS founders, VP of Growth, DevTools engineering teams.',
      valueProps: [
        'Deterministic ReAct Agent loop with strict ethics guardrails',
        'Unified 13-agent hierarchy covering strategy, SEO, content, social, and leads',
        'Self-optimizing attribution feedback loop connecting touches to revenue',
      ],
      competitors: ['HubSpot', 'Jasper AI', 'Traditional Ad Agencies', 'Fragmented Social Schedulers'],
      positioning: 'The only enterprise-grade autonomous growth operating system with verified guardrails.',
    },
  });
  console.log(`✅ Company Brain initialized: ${brain.name}`);

  // 7. Knowledge Source & Document
  const source = await prisma.knowledgeSource.create({
    data: {
      organizationId: org.id,
      projectId: project.id,
      type: 'url',
      sourceUrl: 'https://growthos.ai/docs/architecture',
      title: 'GrowthOS Master Architecture Specification',
      status: 'ready',
      lastCrawledAt: new Date(),
    },
  });

  await prisma.knowledgeDocument.create({
    data: {
      sourceId: source.id,
      organizationId: org.id,
      title: 'GrowthOS Master System Architecture',
      content:
        'GrowthOS operates 13 specialized agents under an Executive Director. Each agent enforces L1-L5 permissions through a deterministic policy engine. Actions requiring external mutations pass through strict brand safety checks.',
      contentType: 'text/markdown',
      tokenCount: 450,
    },
  });
  console.log('✅ Knowledge base source and document seeded');

  // 8. Growth Goals & Missions
  const goal = await prisma.growthGoal.create({
    data: {
      organizationId: org.id,
      projectId: project.id,
      title: 'Scale Organic Inbound ARR to $1.2M',
      metricName: 'ARR',
      targetValue: 1200000,
      currentValue: 480000,
      unit: 'usd',
      status: 'active',
      priority: 1,
      strategyNotes: 'High-intent programmatic SEO paired with deep technical authority content.',
    },
  });

  const mission = await prisma.growthMission.create({
    data: {
      organizationId: org.id,
      projectId: project.id,
      goalId: goal.id,
      title: 'Autonomous Developer-Led Content & SEO Dominance',
      objective: 'Establish top 3 rankings for 25 high-intent autonomous agent queries and distribute weekly benchmarks.',
      status: 'in_progress',
      progress: 55,
      ownerAgentRole: 'growth_director',
    },
  });

  const execAgent = await prisma.agent.findFirst({
    where: { organizationId: org.id, slug: 'executive' },
  });

  await prisma.growthTask.create({
    data: {
      organizationId: org.id,
      projectId: project.id,
      missionId: mission.id,
      agentId: execAgent?.id,
      title: 'Synthesize Weekly Multi-Agent Growth Report',
      description: 'Analyze keyword movement, social impressions, and conversion velocity.',
      status: 'completed',
      priority: 'high',
      output: 'Executive summary generated: +28% organic visibility, 42 qualified leads enriched.',
    },
  });

  await prisma.growthOpportunity.create({
    data: {
      organizationId: org.id,
      projectId: project.id,
      goalId: goal.id,
      title: 'Programmatic Comparison Pages: GrowthOS vs Traditional Marketing Clouds',
      description: 'Generate 12 deep comparison architectures analyzing agent-driven vs manual workflows.',
      category: 'seo',
      reach: 8.5,
      impact: 9.0,
      confidence: 8.0,
      effort: 4.0,
      riceScore: 153.0,
      iceScore: 612.0,
      status: 'approved',
    },
  });
  console.log('✅ Growth goals, missions, and opportunities seeded');

  // 9. Content Items
  const contentAgent = await prisma.agent.findFirst({
    where: { organizationId: org.id, slug: 'content' },
  });

  await prisma.contentItem.upsert({
    where: {
      organizationId_slug: {
        organizationId: org.id,
        slug: 'autonomous-growth-engines-vs-traditional-stacks',
      },
    },
    update: {},
    create: {
      organizationId: org.id,
      projectId: project.id,
      missionId: mission.id,
      authorAgentId: contentAgent?.id,
      title: 'Why Autonomous Growth Engines Beat Traditional Marketing Stacks',
      slug: 'autonomous-growth-engines-vs-traditional-stacks',
      type: 'blog_post',
      status: 'published',
      content:
        '# Why Autonomous Growth Engines Beat Traditional Marketing Stacks\n\nTraditional marketing stacks are fragmented, manual, and reactive. GrowthOS unifies strategy, execution, and attribution into 13 autonomous agents governed by hard deterministic safety policies.',
      tldr: 'Autonomous multi-agent architectures outperform legacy point solutions by reacting to market signals in seconds.',
      targetKeyword: 'autonomous growth engine',
      seoTitle: 'Autonomous Growth Engines vs Legacy Marketing Stacks | GrowthOS',
      seoDescription:
        'Compare autonomous multi-agent marketing architectures with legacy SaaS tools. Discover how deterministic guardrails and self-optimizing loops drive growth.',
      readingTimeMin: 6,
      brandVoiceScore: 98,
      publishedAt: new Date(),
    },
  });
  console.log('✅ Content items seeded');

  // 10. Connector Accounts & Social Posts
  const twitterConnector = await prisma.connectorAccount.upsert({
    where: {
      organizationId_provider_name: {
        organizationId: org.id,
        provider: 'twitter',
        name: '@growthos_ai',
      },
    },
    update: {},
    create: {
      organizationId: org.id,
      projectId: project.id,
      provider: 'twitter',
      name: '@growthos_ai',
      encryptedCredentials: 'enc:sample_verified_aes_gcm_token',
      status: 'connected',
      lastSyncAt: new Date(),
    },
  });

  await prisma.socialPost.create({
    data: {
      organizationId: org.id,
      projectId: project.id,
      connectorAccountId: twitterConnector.id,
      provider: 'twitter',
      status: 'published',
      payload: {
        text: 'GrowthOS v1.0 is live: 13 autonomous agents working as a unified growth department. Deterministic safety, zero hallucinations, full attribution. https://growthos.ai',
      },
      publishedAt: new Date(),
      impressions: 6420,
      engagements: 488,
      clicks: 215,
    },
  });
  console.log('✅ Connectors and social distribution seeded');

  // 11. SEO Audits & Keyword Tracking
  await prisma.seoAudit.create({
    data: {
      organizationId: org.id,
      projectId: project.id,
      targetUrl: 'https://growthos.ai',
      overallScore: 96,
      titleTag: 'GrowthOS - Autonomous AI Growth Operating System',
      metaDescription: 'Autonomous multi-agent system driving organic growth, content pipelines, and attribution.',
      canonicalUrl: 'https://growthos.ai',
      h1Count: 1,
      h2Count: 6,
      loadTimeMs: 185,
      status: 'completed',
    },
  });

  const keywords = [
    { keyword: 'autonomous ai growth', volume: 3800, difficulty: 42, currentRank: 2, targetRank: 1 },
    { keyword: 'multi agent marketing system', volume: 2100, difficulty: 36, currentRank: 1, targetRank: 1 },
    { keyword: 'ai growth operating system', volume: 4500, difficulty: 49, currentRank: 3, targetRank: 1 },
  ];

  for (const kw of keywords) {
    await prisma.keywordTrack.upsert({
      where: {
        organizationId_keyword: {
          organizationId: org.id,
          keyword: kw.keyword,
        },
      },
      update: {
        currentRank: kw.currentRank,
      },
      create: {
        organizationId: org.id,
        projectId: project.id,
        keyword: kw.keyword,
        searchVolume: kw.volume,
        difficulty: kw.difficulty,
        currentRank: kw.currentRank,
        targetRank: kw.targetRank,
        intent: 'commercial',
      },
    });
  }
  console.log('✅ SEO audits and keywords seeded');

  // 12. Leads & Community Interactions
  await prisma.lead.create({
    data: {
      organizationId: org.id,
      projectId: project.id,
      name: 'Elena Rostova',
      email: 'elena@tensorcloud.io',
      company: 'TensorCloud IO',
      title: 'VP of Growth',
      stage: 'qualified',
      score: 94,
      source: 'community',
      websiteUrl: 'https://tensorcloud.io',
      notes: 'Discovered via Reddit AI engineering thread. Interested in autonomous content distribution.',
    },
  });

  await prisma.communityInteraction.create({
    data: {
      organizationId: org.id,
      projectId: project.id,
      platform: 'twitter',
      postUrl: 'https://x.com/tech_leader/status/189283746192',
      author: '@tech_leader',
      title: 'Evaluating autonomous agent architectures for marketing',
      content: 'Has anyone tested an autonomous multi-agent pipeline with deterministic permission guardrails?',
      sentiment: 'positive',
      intentScore: 92,
      status: 'replied',
      replyDraft:
        'GrowthOS implements explicit L1-L5 policy levels and strict ethics hard stops to prevent rogue agent behavior: https://growthos.ai',
    },
  });
  console.log('✅ Leads and community interactions seeded');

  // 13. Autonomous Schedules
  const schedules = [
    { name: 'Daily Executive Calibration', cron: '0 8 * * *', role: 'growth_director' },
    { name: 'Hourly High-Intent Social & Community Sweep', cron: '0 * * * *', role: 'community_advocate' },
    { name: 'Daily Content Pipeline Generation', cron: '0 10 * * 1-5', role: 'content_creator' },
    { name: 'Weekly Technical SEO Audit', cron: '0 2 * * 0', role: 'seo_specialist' },
  ];

  for (const s of schedules) {
    await prisma.autonomousSchedule.create({
      data: {
        organizationId: org.id,
        projectId: project.id,
        name: s.name,
        cronExpression: s.cron,
        agentRole: s.role,
        isActive: true,
        nextRunAt: new Date(Date.now() + 3600 * 1000),
      },
    });
  }
  console.log('✅ Autonomous schedules seeded');

  console.log('🎉 GrowthOS database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
