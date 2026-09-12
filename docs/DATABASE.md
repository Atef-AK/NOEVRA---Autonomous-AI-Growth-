# GrowthOS — Database Schema

## ORM: Prisma (single, consistent)
## Database: PostgreSQL 16 + pgvector extension

## Multi-tenancy Pattern
Every tenant-scoped table has `organizationId String` FK.
All Prisma queries in service layer MUST include `where: { organizationId }`.
Tenant isolation integration tests verify cross-tenant access returns 404.

## Phase 1 Tables
- users
- organizations
- organization_members
- projects
- audit_logs
- refresh_tokens

## Future Phases (see IMPLEMENTATION_PLAN.md)
Phase 2: agents, agent_runs, agent_steps, agent_tool_calls, usage_events
Phase 3: company_brain, company_brain_versions, knowledge_sources, knowledge_documents,
         knowledge_chunks, knowledge_embeddings, memories, memory_links
Phase 4: goals, missions, tasks, opportunities
Phase 5: content, content_versions, content_assets, content_publications
Phase 6: connectors, connector_accounts, connector_capabilities, oauth_credentials
Phase 7: seo_projects, seo_crawls, seo_issues, seo_keywords, seo_opportunities
Phase 8: leads, lead_events, lead_scores, community_sources, community_opportunities,
         community_interactions, competitors, competitor_snapshots
Phase 9: experiments, experiment_variants, experiment_results, analytics_sources,
         analytics_events, attribution_events
Phase 10: subscriptions, plans, usage_ledger

## Migration Rules
- Every schema change uses Prisma migrations (`prisma migrate dev`)
- Never manually modify production database
- Rollback considerations documented per migration
- All migrations committed to git
