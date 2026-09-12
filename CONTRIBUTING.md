# Contributing to GrowthOS

## Development Setup
See README.md Quick Start section.

## Code Standards
- TypeScript strict mode — zero `any` unless justified with comment
- ESLint + Prettier enforced
- No magic strings — use constants from `packages/shared/src/constants`
- No circular dependencies between packages
- No giant files (>500 lines is a code smell)
- Dependency injection via NestJS DI system
- Every public function/class must have JSDoc for packages/

## Branch Strategy
- `main` — production-ready, protected
- `develop` — integration branch
- `phase/N-name` — per-phase development branches
- `feat/description` — feature branches off develop
- `fix/description` — bug fix branches

## Commit Messages
Format: `type(scope): description`
Types: feat, fix, chore, docs, test, refactor, perf, ci
Example: `feat(auth): implement JWT refresh token rotation`

## Testing Requirements
- All business logic must have unit tests
- All API endpoints must have integration tests
- Tenant isolation must be tested explicitly
- Permission enforcement must be tested explicitly
- Secret isolation must be tested explicitly

## Security Rules
- Never commit secrets (even test/fake secrets go in .env.example as placeholders)
- Never trust client-provided tenant IDs
- Always validate user input at API boundary
- Follow SSRF protection rules for all URL inputs
- Run `pnpm audit` before releasing

## Pull Request Checklist
- [ ] Tests pass (pnpm test)
- [ ] TypeScript compiles (pnpm typecheck)
- [ ] Lint passes (pnpm lint)
- [ ] Tenant isolation not broken
- [ ] No secrets in code
- [ ] Documentation updated if applicable
