# GrowthOS — Agent Architecture

## Agent Hierarchy
1. **Executive Agent** — strategy, prioritization, goal decomposition, delegation
2. **Strategy Agent** — positioning, ICP, channel strategy, messaging
3. **Research Agent** — web/market/competitor research, trend analysis
4. **Company Intelligence Agent** — maintains and updates Company Brain
5. **Competitor Intelligence Agent** — competitor tracking and snapshots
6. **SEO Agent** — crawl, technical audit, keyword research, recommendations
7. **Content Agent** — generation, brand check, fact check, quality check
8. **Media Agent** — image/video generation pipeline
9. **Social Agent** — multi-platform publishing abstraction
10. **Community Agent** — discovery, classification, response drafts (anti-spam enforced)
11. **Lead Agent** — identification, scoring, pipeline management
12. **Analytics Agent** — metrics, attribution, performance analysis
13. **Learning Agent** — experiment evaluation, pattern extraction, strategy updates

## Agent Execution Model
Every agent execution creates an `agent_run` record with:
- `id`, `tenantId`, `projectId`, `agentId`, `goal`, `input`, `context`
- `toolCalls[]`, `outputs[]`, `costs`, `latency`, `errors`, `status`, `timestamps`

Statuses: queued → running → waiting_approval | completed | failed | cancelled | timeout

## Tool Permission Matrix
| Action           | L1      | L2       | L3       | L4       | L5      |
|------------------|---------|----------|----------|----------|---------|
| Research         | AI      | AI       | AI       | AI       | AI      |
| Draft content    | AI      | AI       | AI       | AI       | AI      |
| Schedule content | Human   | Human    | Approval | AI       | AI      |
| Publish content  | Human   | Approval | Approval | Policy   | Policy  |
| Community reply  | Human   | Approval | Approval | Policy   | Policy  |
| Email            | Human   | Approval | Approval | Policy   | Policy  |
| Paid ads         | Human   | Human    | Approval | Approval | Policy  |
| Website changes  | Human   | Human    | Approval | Approval | Policy  |

## Ethics Hard Stops
Agents are prohibited from:
- Creating fake accounts, identities, or engagement
- Mass unsolicited outreach (spam)
- CAPTCHA bypass or rate-limit circumvention
- Browser automation to circumvent platform API restrictions
- Posting irrelevant promotional content for backlinks
- Impersonating humans or automated harassment
