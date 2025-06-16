# Implementation Guide – Advisor Router Setup in Factory

This guide walks you through adding the Advisor Router component to **The Board Room** Factory app, wiring it into the existing chain flow, and validating it with automated tests.

---

## Prerequisites

| Requirement | Notes |
|-------------|-------|
| Factory account & workspace | Logged-in with edit access |
| “The Board Room” project skeleton | Pages & DB from the *Factory_Connection_Logic_and_Layout.md* spec |
| Supabase (optional) | Only if you prefer external logging; Factory’s built-in DB works too |

---

## 1. Create the Advisor Router GPT Block

1. Open **Factory → Blocks → “+ New GPT Block.”**  
2. Name it **`advisor_router`**.  
3. In the **System Prompt** field, paste the content from **`advisor_router_prompt.md`**.  
4. Set **Output Type** to `JSON`.  
5. (Optional) Enable **“Return raw JSON”** so Factory doesn’t wrap text.  
6. Save.

**Tip:** Keep `max_tokens` modest (<300) – the block only outputs a short JSON object.

---

## 2. Add Router Logic Code (Optional JS Helper)

If you’d like deterministic keyword matching instead of pure LLM inference, add the helper:

1. Create a **Code Block → `advisor_router_js`**.  
2. Paste the contents of **`factory_advisor_router_implementation.js`**.  
3. Expose the `processQuestion()` function.  
4. In the **`advisor_router` GPT block** advanced settings, call this helper first to pre-select advisors, then ask the LLM to _evaluate_ and finalise.  
   - This hybrid pattern combines rule-based guarantees with LLM nuance.

---

## 3. Wire the Block into Page 1 (“Ask the Board”)

1. Open **Page 1** canvas.  
2. Select the **Submit** button → **Actions**.  
3. Add an action: **Run GPT Block → `advisor_router`**.  
   - Pass the user’s **question text** as the sole input.  
4. Store the JSON result in local state, e.g. `state.selectedAdvisors`.

---

## 4. Conditional Advisor Blocks

For each advisor listed, you already have (or will create) an individual GPT block.

Example for **Sundar Pichai**:

- Block name: `advisor_sundar`
- System prompt: “You are Sundar Pichai… (domain expertise etc.)”
- Input: the original user question.

### Chain Flow

```
advisor_router  ──▶  state.selectedAdvisors
         ├─ if includes "Sundar Pichai"  ─▶ advisor_sundar
         ├─ if includes "Pamela Maynard" ─▶ advisor_pamela
         └─ … (repeat for each advisor)
```

Use Factory’s **Condition** node or inline JavaScript to inspect `state.selectedAdvisors`.

---

## 5. Persisting Logs (Optional)

Create a table `boardroom_logs` with columns:

| Column | Type | Example |
|--------|------|---------|
| id | UUID (PK) | — |
| timestamp | `timestamptz` | now() |
| user_id | text | auth UID |
| question | text | — |
| selected_advisors | jsonb | `["Sundar…"]` |

Add an **Insert Row** action after `advisor_router` to store the record.

---

## 6. Page 2: Display Advisor Responses

1. Add a **Repeat / List** component bound to the advisor response collection.  
2. Each “card” shows:
   - Avatar + Name
   - Domain blurb
   - GPT output

Ensure the render waits for all selected advisor blocks to finish (`Promise.all` in action chain).

---

## 7. Page 3: Chief-of-Staff Synthesis

Already spec’d in architecture doc. Just pipe **all advisor block outputs** into the `chief_of_staff` GPT block.

---

## 8. Testing

### Manual Smoke Test

1. Preview the app.  
2. Ask: **“Should we launch the Canadian vendor workflow fully automated, or start manual?”**  
3. Confirm router returns **4 advisors** (`Sundar`, `Tope`, `Pamela`, `Arvind`).

### Automated Tests

1. Create a **Test Suite** in Factory’s Test Runner.  
2. For each row in **`test_cases.md`**:  
   - Provide the *Test Question* as input.  
   - Assert `selected_advisors` **includes all expected names** and total length ≤ 5.  
3. Run suite; all cases should pass.

---

## 9. Troubleshooting

| Symptom | Fix |
|---------|-----|
| Output contains prose | Ensure GPT block *Response Type* = JSON & “Strip wrapper text” enabled |
| Fewer than 3 advisors | Check keyword list; fallback logic in `factory_advisor_router_implementation.js` must run |
| Advisor blocks not firing | Verify condition paths match **exact string** names from router output |

---

## 10. Next Steps

1. Add **“Request follow-up”** button on each advisor card to trigger a threaded GPT block.  
2. Integrate **Notion export** after Page 3 summary.  
3. Monitor Supabase logs → build analytics dashboard (adoption, advisor frequency, avg response time).

---

Happy building! 🎉
