# 🗺️ Factory Chain Flow – The Board Room  
This document shows exactly **how to wire every block together** in Factory so a user question travels from the input screen through all advisor blocks and returns a synthesized recommendation.

---

## 1. High-Level Flow Diagram (ASCII)

```
USER
 │
 ▼
[Page 1 – Submit Button]
 │  (passes `question`)
 ▼
┌───────────────────┐
│ GPT: advisor_router│
└───────────────────┘
 │  returns JSON →  state.selectedAdvisors
 │
 ├─► if "Sundar Pichai"   ─┐
 │                         │
 ├─► if "Pamela Maynard"   ─┤
 │                         │
 ├─► if "Arvind Krishna"   ─┤
 │   … (same for all 8)    │  ≤ conditional fork
 │                         │
 └───────────────┬─────────┘
                 ▼
         (Promise.all)
                 ▼
    array advisorResponses  (each object: name, domain, response)
                 │
                 ▼
┌────────────────────────┐
│ GPT: chief_of_staff    │
└────────────────────────┘
                 │
                 ▼
    synthesizedSummary
                 │
                 ▼
[Page 2 – Advisor Cards]  +  [Page 3 – Summary]
```

---

## 2. Block-by-Block Wiring

| # | Block | Factory Action | Inputs | Outputs / Mapping |
|---|-------|----------------|--------|-------------------|
| 1 | **advisor_router** | `Run GPT Block` | `question` (string) | `selected_advisors` (array) – store in `state.selectedAdvisors` |
| 2 | **Conditional Router** | `Condition` node(s) | `state.selectedAdvisors` | For each advisor name → run its GPT block |
| 3 | **advisor_* (8 blocks)** | `Run GPT Block` | `question` (string) | `response` (text) – push to `state.advisorResponses[]` |
| 4 | **chief_of_staff** | `Run GPT Block` | `question` (string)<br>`advisorResponses` (array joined by `\n\n`) | `summary`, `confidence`, `recommendation`, etc. |
| 5 | **UI Render** | `Navigate / Set State` | All data above | Displays cards & summary |

### Conditional Node Setup

1. Add a **Condition** immediately after `advisor_router`.
2. For **each** advisor name (exact match):  
   - *Condition expression*: `state.selectedAdvisors.includes("Advisor Name")`  
   - *Action*: `Run GPT Block → advisor_[name]` with input `{ question: state.question }`  
   - *On success*: `Push { name, domain, response } into state.advisorResponses`

3. After the last branch, add a **JS Action**:  
   ```
   await Promise.all(state.$branches);   // Waits for all advisor blocks
   ```

---

## 3. Parameter Mappings

| Variable | Source | Destination |
|----------|--------|-------------|
| `question` | Page 1 input field | advisor_router + every advisor GPT block |
| `selectedAdvisors` | advisor_router JSON | Condition nodes (`includes`) |
| `advisorResponses` | Each advisor GPT output | chief_of_staff input (`advisorResponses`) |
| `summary / recommendation / confidence` | chief_of_staff output | Page 3 summary card |

---

## 4. Detailed Action Chain (Code View)

```js
// Submit Button → onClick
await factory.runGptBlock("advisor_router", { question })
  .then(({ selected_advisors }) => {
    state.selectedAdvisors = selected_advisors;
    const advisorPromises = [];

    selected_advisors.forEach(name => {
      advisorPromises.push(
        factory.runGptBlock(`advisor_${name.toLowerCase().split(' ')[0]}`, { question })
          .then(resp => ({
            name,
            domain: advisorInfo[name].domain,
            response: resp
          }))
      );
    });

    return Promise.all(advisorPromises);
  })
  .then(responses => {
    state.advisorResponses = responses;
    const combined = responses
      .map(r => `${r.name} (${r.domain}): ${r.response}`)
      .join("\n\n");

    return factory.runGptBlock("chief_of_staff", {
      question,
      advisorResponses: combined
    });
  })
  .then(summary => {
    state.coSSummary = summary;
    factory.navigate("AdvisorResponsesPage", { state });
  });
```

`advisorInfo` is imported from `factory_conditional_flow.js`.

---

## 5. Tips & Checks

1. **Output Type Settings**  
   - `advisor_router`: JSON (raw)  
   - Advisor blocks: Text  
   - `chief_of_staff`: Text / Structured

2. **Timeouts**  
   Set advisor blocks `max_tokens` ≤ 400 to keep latency low (<20 s for 5 advisors).

3. **Error Handling**  
   Wrap each advisor call in `try/catch`; push an error message object if it fails so UI never breaks.

4. **Testing**  
   Use the cases in `test_cases.md`—ensure length of `selected_advisors` ∈ [3, 5].

---

## 6. Ready-to-Import JSON (Optional)

If you prefer Factory’s JSON import:

1. Export any existing page as JSON to get the schema.
2. Replace the `"actions"` section with the code flow above.
3. Re-import.

*(Visual editor users can skip this.)*

---

Your chain flow is now fully specified. Drop these connections into Factory and you’ve got a **click-to-recommendation** pipeline ready for live demos. 🚀
