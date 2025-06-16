# Board Room – Deployment Roadmap  
From Internal MVP → Multi-Tenant Client Offering & White-Label Program

---

## Phase 0 · Internal MVP  (✓ Now)

| Area | Status | Notes |
|------|--------|-------|
| Core Chain Flow | ✅ | Advisor Router → Advisors → Chief of Staff |
| Supabase Logging | ✅ Minimal | tables: questions, selections, responses, recommendations |
| Pages | ✅ | Ask → Advisor Cards → Summary |
| Auth | ⚪ None | Internal use only (Factory preview) |
| Cost Guardrails | ⚪ Basic | per-block max_tokens; usage visible in Factory |

---

## Phase 1 · Private Beta (Internal Teams) – ⏳ 1 week

### Goals  
• Harden reliability • Capture telemetry • Role-based access

### Key Tasks
1. **Auth Upgrade** – Enable Factory Auth (email + magic link).  
2. **Error Handling & Retries** – wrap advisor calls with back-off retry (3×).  
3. **Usage Analytics** – log per-block latency & token cost → Supabase `analytics`.  
4. **RLS Policies** – enable row-level security; policies: `user_id = auth.uid()`.

### Exit Criteria  
- 95 % success rate across 100 internal queries  
- No PII leakage between users  

---

## Phase 2 · Client Pilot (Single Tenant) – ⏳ 2 weeks

### Goals  
• First external users • Basic branding • SLA monitoring

### Feature Additions
| Feature | Detail |
|---------|--------|
| **Custom Domain** | e.g., `boardroom.yourcompany.com` – Factory → Cloudflare |
| **Client Branding** | Theme tokens: logo, color palette override |
| **Rate Limiting** | 50 requests/day per user (Factory JS guard) |
| **Health Checks** | `/ping` route + uptime monitor (Statuspage) |
| **Data Export** | CSV & PDF export of decision archive |
| **Basic Billing Prep** | Track per-org token usage in Supabase `billing_usage` |

### Tech Notes  
- Keep single-tenant DB; isolate via auth.  
- Deploy to “Staging” & “Pilot” envs in Factory.

### Exit Criteria  
- One pilot client completes ≥25 decisions  
- SLA ≥99 % uptime during pilot window  

---

## Phase 3 · GA Client Offering (Multi-Tenant SaaS) – ⏳ 4 weeks

### Goals  
• True multi-tenant architecture • Subscription billing • Self-serve onboarding

#### Schema Migration
1. Add `tenant_id UUID` to all core tables.  
2. Create `tenants` table (`id`, `name`, `plan`, `created_at`).  
3. **RLS**: `tenant_id = current_setting('app.tenant_id')::uuid`.

#### Factory Changes
1. Load `tenant_id` into `sessionStorage` post-login.  
2. Include `tenant_id` hidden field on all inserts.  
3. **Env Configs** – per-tenant theme overrides stored in Supabase `tenant_settings`.

#### New Features
| Category | Addition |
|----------|----------|
| Onboarding | Org sign-up flow, email verification |
| Billing | Stripe integration; metered per-token plans |
| Admin UI | Usage dashboard, member invites, role management |
| Auditing | Advisor & synthesis outputs stored immutably (JSONB) |
| Support | In-app Intercom widget, SLA 99.5 % |

### Exit Criteria  
- Pay-as-you-go billing live  
- Two paying tenants onboarded  
- Data isolation tests pass (no cross-tenant reads)

---

## Phase 4 · White-Label Program – ⏳ 6 weeks

### Goals  
• Allow agencies/partners to resell Board Room under their own brand

#### White-Label Mechanics
1. **Theme Packs** – logo, palette, favicon, email templates per partner.  
2. **Sub-Domain Routing** – `*.myboardroom.ai` → resolve tenant via host header.  
3. **Advisor Packs** – allow partners to swap or supplement advisor prompts (stored in `tenant_prompts`).  
4. **Usage Quotas** – configurable per partner plan.

#### Factory Implementation
- Use Factory **Multi-Environment**: one codebase, env vars per partner.  
- Tenant-scoped S3 bucket for exports & avatars.  
- Optional: deploy isolated Supabase project per high-compliance partner (HIPAA/FIN).

### Legal & Compliance
- Whitelabel addendum in MSA  
- Trademark usage guide  
- SOC 2 roadmap kickoff

### Exit Criteria  
- First partner live with custom domain & branding  
- End-to-end demo with partner’s own advisor prompts

---

## Phase 5 · Enterprise Enhancements – ⏳ Ongoing

| Area | Feature | Notes |
|------|---------|-------|
| Security | SAML / SCIM | Okta, Azure AD |
| Compliance | SOC 2 Type 2 | Target audit in 6-12 months |
| Observability | Datadog dashboards | Per-tenant latency, error %, cost |
| Fine-Tuning Store | Client-specific advisor fine-tunes | Hosted in secure vault |
| AI Guardrails | Toxicity & PII scanners on output | Real-time filters |

---

## Roll-Out Timeline (Gantt-Style)

```
Week 0-1  | Phase 1
Week 2-3  | Phase 2
Week 4-7  | Phase 3
Week 8-13 | Phase 4 (overlaps)
Week 10+  | Phase 5 (continuous)
```

---

## Risk & Mitigation Matrix

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Multi-tenant data leak | Medium | Critical | Strict RLS, nightly row-isolation tests |
| GPT latency spikes | Medium | High | Caching layer, auto-retry, token budgets |
| Cost overruns | High | Medium | Per-tenant caps + alerting |
| White-label branding conflicts | Low | Medium | Approval workflow, brand guidelines |
| Compliance delays | Medium | High | Engage auditor early, gap analysis |

---

## Success Metrics

| Phase | KPI | Target |
|-------|-----|--------|
| Internal MVP | Weekly active users | ≥5 internal stakeholders |
| Client Pilot | Advisor recommendation satisfaction | ≥4 / 5 avg rating |
| GA SaaS | MRR | $20 k within 90 days |
| White-Label | Partners signed | 3 agencies in 6 months |
| Enterprise | Net revenue retention | ≥120 % |

---

## Next Actions

1. **Lock Phase 1 tasks** – assign owners & deadlines in Jira.  
2. **Prepare Stripe sandbox** – create usage-based pricing tiers.  
3. **Draft Partner Program deck** – include branding & revenue share.  
4. **Schedule security review** – static code scan + RLS test suite.  
5. **Book stakeholder demo** – show MVP flow end-to-end next Friday.

Get these rolling, and The Board Room will move from internal brilliance to a scalable, revenue-generating platform that clients proudly call their own.
