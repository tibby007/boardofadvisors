# The Board Room – Factory Implementation Instructions
Complete, step-by-step guide to move from zero to a live MVP using Factory + Supabase.

---

## 0. Prerequisites

| Item | Why |
|------|-----|
| Factory workspace with edit rights | Where you build & deploy |
| Supabase project (free tier OK) | Logging + analytics |
| Advisor avatar images (optional) | UI polish |
| Project assets from this repo | Code & prompts |

Add two workspace secrets in **Settings → Environment**:  
`SUPABASE_URL`, `SUPABASE_KEY`.

---

## 1. Create GPT Blocks

### 1.1 Advisor Router  
1. **Blocks → + New GPT Block → _advisor_router_**  
2. System Prompt → paste the “Advisor Router” routing logic prompt.  
3. Response Type → **JSON (raw)**.  
4. Save.

### 1.2 Eight Advisor Blocks  
Create one per advisor, using the prompts supplied (Sundar, Pamela, Arvind, … Jensen).  
Response Type → **Text**.  
Naming pattern: `advisor_<first_name_lower>`.

### 1.3 Chief of Staff  
1. Name: **chief_of_staff**  
2. Prompt: synthesis instructions.  
3. Response Type → Text / Structured.  
Max tokens ≤ 500.

### 1.4 (Optional) Welcome Block  
Use the “Ask the Board” SYSTEM prompt if you prefer GPT to render the welcome copy.

---

## 2. JS Helper Blocks

### 2.1 _advisor_router_logic_  
Add a **Code Block**; paste `advisor_router_logic.js`.  
Exports `processBoardRoomQuestion()`.

### 2.2 _supabase_client_  
```js
import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);
```

---

## 3. Supabase Setup (≈ 10 min)

1. Open Supabase → **SQL Editor**.  
2. Paste the minimal schema from `supabase_minimal_setup.md` and run.  
3. (Optional) enable Row Level Security with the sample policy.  
4. Copy project URL + anon key → add to Factory secrets.

---

## 4. UI Pages

| Page | Purpose | Main Components |
|------|---------|-----------------|
| **Page 1** – Ask the Board | capture question | Logo, H1, textarea, Submit button |
| **Page 2** – Advisor Responses | show cards | `advisor_cards_ui.html` layout |
| **Page 3** – Chief of Staff Summary | synthesis | `chief_of_staff_summary_ui.html` layout |
| **Page 4** – Decision Log | history | Table bound to Supabase view (later) |

Import the two HTML files into **Display Blocks** or replicate with Factory components and theme tokens.

---

## 5. Wire the Chain Flow

1. **Page 1 → Submit (onClick)**  
```js
const { processBoardRoomQuestion } = await import('advisor_router_logic');
const result = await processBoardRoomQuestion({
  question: state.questionText,
  factory,
  supabase,
  user: auth.user()
});
state.boardRoom = result;
navigate('Page2');
```

2. **Page 2 – onLoad**  
Render `state.boardRoom.advisorResponses`.  
Enable “View Synthesis” button only when `advisorResponses.length > 0`.

3. **Page 2 → View Synthesis**  
`navigate('Page3');`

4. **Page 3 – onLoad**  
Display `state.boardRoom.synthesis`.  
“Log Decision” button → call `supabase_client.logBoardRoom()` with user note.

5. **Page 4** (optional)  
Bind table to Supabase `recommendations` joined with `questions`.

---

## 6. Styling Tokens

Add in **Design → Theme**:

```
primary:   #233E7E
accent:    #4A6CF7
bg:        #F8F9FC
radius-lg: 12px
radius-sm: 6px
shadow:    0 4px 12px rgba(0,0,0,.08)
font:      Inter
```

All cards & buttons inherit these.

---

## 7. Testing

### 7.1 Manual Smoke
Ask: “Should we launch the Canadian vendor workflow fully automated, or start manual?”  
Expect 3-5 advisors (Sundar, Tope, Pamela, Arvind) and coherent synthesis.

### 7.2 Automated Suite
Create **Test Runner** cases from `test_strategy.md`.  
Assert:
- `selected_advisors.length` ∈ 3…5  
- Mandatory names present / forbidden names absent.

---

## 8. Deployment Checklist

| Item | Done? |
|------|-------|
| All GPT blocks created & named correctly |
| Supabase URL/Key in secrets |
| Chain flow JS error-free (check console) |
| RLS enabled if external users |
| Token budgets set (Router < 150, Advisor < 400) |
| Test suite passes 100 % |
| Production deploy via **Factory → Deploy** |

---

## 9. Next Enhancements

1. Follow-up chat with individual advisors (threaded GPT).  
2. Export synthesis to PDF / Notion.  
3. Role-based access & multi-tenant schema.  
4. Stripe metered billing on token usage.  
5. White-label theming per tenant.

---

### You’re Live! 🚀  
Submit a question, watch eight virtual executives debate, and get a synthesized recommendation— all inside Factory.
