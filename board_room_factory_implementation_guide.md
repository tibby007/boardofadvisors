# The Board Room – Factory Implementation Guide

This guide walks you, start-to-finish, through building **The Board Room** decision-support application inside Factory. Follow the steps in order; nothing extra is required outside Factory, Supabase, and the assets included in this project.

---

## 0. Prerequisites

| Item | Purpose |
|------|---------|
| Factory workspace | Where you build the app |
| Supabase project | Stores logs & analytics |
| Advisor avatars (optional) | Display in UI cards |

Clone / copy the project skeleton you received (architecture file + code assets) into your Factory workspace.

---

## 1. Create Core GPT Blocks

### 1.1 Advisor Router  
1. **Blocks → + New GPT Block → `advisor_router`**  
2. Paste the complete System Prompt from **Step 1** of the “Copy + Paste” instructions.  
3. Response Type → **JSON** (raw).  
4. Save.

### 1.2 Individual Advisor Blocks  
Create eight GPT blocks – one per advisor:

| Block Name | Prompt Source |
|------------|---------------|
| `advisor_sundar` | Sundar Pichai prompt |
| `advisor_pamela` | Pamela Maynard prompt |
| `advisor_arvind` | Arvind Krishna prompt |
| `advisor_tope` | Tope Awotona prompt |
| `advisor_ime` | Ime Archibong prompt |
| `advisor_lisa` | Lisa Gelobter prompt |
| `advisor_kimberly` | Kimberly Bryant prompt |
| `advisor_jensen` | Jensen Huang prompt |

Paste each prompt exactly as provided.  
Response Type → **Text**.

### 1.3 Chief of Staff Synthesizer  
1. Block name **`chief_of_staff`**.  
2. Paste the Chief-of-Staff prompt.  
3. Response Type → **Structured Text** (freeform).

---

## 2. Supabase Setup

1. Create a new Supabase project.  
2. Open SQL Editor → run the entire script from **`supabase_schema.sql`** (provided).  
3. Note the anon/public API key and project URL – add them to Factory secrets as `SUPABASE_URL` and `SUPABASE_KEY`.

---

## 3. UI Components

### 3.1 Page 1 – Ask the Board  
- **Text Input** for Cheryl’s question  
- **Submit Button** with action flow (see Section 4)  
- Hidden capture of `auth.user.id` & timestamp

### 3.2 Advisor Card Component  
Import **`advisor_card_component.js`** into Factory’s code assets.  
Add **Repeat/List** element on Page 2 that renders one card per advisor response.

### 3.3 Page 2 – Advisor Responses  
- Vertical stack or 2-column grid of AdvisorCard components  
- Spinner or loading state until all responses resolve

### 3.4 Page 3 – Synthesis Report  
- Rich text block showing the Chief-of-Staff summary, key points, recommendation, confidence score

### 3.5 Page 4 – Decision Archive  
Bind to Supabase view `vw_question_complete` for historical browsing.

---

## 4. Conditional Flow Logic

1. Import **`factory_conditional_flow.js`** into code assets.  
2. In Page 1 **Submit** button → **Action Chain**:

```
Run GPT Block  advisor_router
→ JS Action    processBoardRoomQuestion(question, factory, supabase, user)
   (returns full session object)
→ Navigate     Page 2, pass session object as param
```

3. **Page 2** receives the session object. Bind `session.advisorResponses` to AdvisorCard list; bind Chief-of-Staff result for Page 3.

---

## 5. Testing

### 5.1 Manual Smoke  
- Ask: “Should we launch the Canadian vendor workflow fully automated, or start manual?”  
  Expect 3-5 advisors with Sundar, Tope, Pamela, Arvind present.

### 5.2 Automated Suite  
1. Open Factory **Test Runner**.  
2. Add tests from **`test_cases.md`**: input → expect advisor names array includes listed advisors; length ≤ 5.  
3. Run on every commit.

---

## 6. Deployment & Best Practices

| Checklist | Why |
|-----------|-----|
| Enable RLS policies in Supabase | Data privacy per user |
| Set Factory environment secrets | No raw keys in code |
| Limit GPT block `max_tokens` | Cost control |
| Implement retry logic (in JS) | Resilience to transient LLM errors |
| CI: run automated test suite | Prevent regression |
| Monitor Supabase logs & analytics view | Product insights |

When ready, use **Factory → Deploy → Production**. Smoke-test again with live Supabase credentials.

---

## 7. Next Enhancements (Optional)

- “Request Follow-Up” button wiring to spawn a threaded GPT chat with selected advisor  
- Notion / Email export integration  
- Dashboard page showing advisor usage stats from `analytics` table

---

You now have everything required to stand up **The Board Room** from zero to production inside Factory. Happy building! 🎉
