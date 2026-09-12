import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { MembersModule } from './modules/members/members.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { AgentsModule } from './modules/agents/agents.module';
import { BrainModule } from './modules/brain/brain.module';
import { StrategyModule } from './modules/strategy/strategy.module';
import { ContentModule } from './modules/content/content.module';
import { ConnectorsModule } from './modules/connectors/connectors.module';
import { SeoModule } from './modules/seo/seo.module';
import { LeadsModule } from './modules/leads/leads.module';
import { ExperimentsModule } from './modules/experiments/experiments.module';
import { OrchestratorModule } from './modules/orchestrator/orchestrator.module';
import { HealthModule } from './modules/health/health.module';
import { DatabaseModule } from './common/database/database.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';

@Module({
  imports: [
    // Rate limiting
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 10,
      },
      {
        name: 'medium',
        ttl: 60_000,
        limit: 100,
      },
      {
        name: 'long',
        ttl: 900_000,
        limit: 1000,
      },
    ]),

    // Core infrastructure
    DatabaseModule,

    // Feature modules
    HealthModule,
    AuthModule,
    UsersModule,
    OrganizationsModule,
    MembersModule,
    ProjectsModule,
    AgentsModule,
    BrainModule,
    StrategyModule,
    ContentModule,
    ConnectorsModule,
    SeoModule,
    LeadsModule,
    ExperimentsModule,
    OrchestratorModule,
    OnboardingModule,
  ],
})
export class AppModule {}
