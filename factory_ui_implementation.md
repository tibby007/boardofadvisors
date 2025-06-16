# Factory UI Implementation Guide  
**Project:** The Board Room – Executive Decision-Support App  
**Scope:** Page-by-page instructions to build a polished, production-ready interface in Factory.

---

## 0. Design Language & Assets

| Element            | Value                                    |
|--------------------|------------------------------------------|
| Primary Color      | `#233E7E`  (Executive Navy)              |
| Accent Color       | `#4A6CF7`  (Electric Indigo)             |
| Neutral Palette    | `#F8F9FC` (bg), `#E4E6EF` (lines), `#333` (text) |
| Font               | Inter (SemiBold for headings, Regular for body) |
| Corner Radius      | 12 px cards / 6 px inputs & buttons      |
| Shadow             | `0 4px 12px rgba(0,0,0,0.08)`            |
| Advisor Avatars    | 96 × 96 px, circular                     |
| Page Width         | 1280 px max, centered                    |

> Tip: Add these tokens in **Design → Theme** so every component inherits them.

---

## 1. Page 1 · “Ask the Board”

### 1.1 Wireframe Mock (ASCII)

```
┌──────────────────────────────────────────────┐
│  [Logo]   The Board Room                     │
│                                              │
│   “Ask the Board”                            │
│                                              │
│  ┌────────────────────────────────────────┐   │
│  │  textarea#questionInput (6 rows)       │   │
│  │                                        │   │
│  └────────────────────────────────────────┘   │
│                                              │
│  [🔵 Submit to Board]                        │
│                                              │
└──────────────────────────────────────────────┘
```

### 1.2 Component Breakdown

| Component            | Props / Notes                             |
|----------------------|-------------------------------------------|
| `Image`              | Logo (64 × 64) top-left                   |
| `Heading`            | H1 “Ask the Board”                        |
| `Textarea`           | id=`questionInput`, placeholder “What decision do you need help with?” |
| `Button`             | text=“Submit to Board”, size=`lg`, variant=`primary` |
| Hidden Fields        | `userId`, `timestamp` (auto via auth + `Date.now()`) |

### 1.3 Styling Steps in Factory

1. Set **Page BG** → `#F8F9FC`.  
2. Center a **Container** (`maxWidth: 640px; marginTop: 80px`).  
3. Apply **box-shadow** + **border-radius:12px** to the textarea on focus.  
4. Button: `height: 48px; font-weight: 600; letter-spacing: .4px`.

### 1.4 Actions

```
onClick (Submit):
  → validate textarea not empty
  → set state.question = textarea value
  → run GPT Block: advisor_router
  → store state.selectedAdvisors
  → navigate(Page 2, { question: state.question })
```

---

## 2. Page 2 · Advisor Responses

### 2.1 Wireframe Mock

```
┌──────────────────────────────────────────────┐
│  < Back to Question                          │
│                                              │
│  [Section Title]  Advisor Panel              │
│                                              │
│  ┌──────── Card (grid 2-col) ────────┐  ┌─── │
│  │  Avatar │ Name │ Domain           │  │ … │
│  │  ───────────────────────────────  │  │   │
│  │  Response text…                   │  │   │
│  │  ───────────────────────────────  │  │   │
│  │  Buttons: Share | Request Follow  │  │   │
│  └───────────────────────────────────┘  └─── │
│                                              │
│  [Continue →] (shows Chief-of-Staff summary) │
└──────────────────────────────────────────────┘
```

### 2.2 Using `AdvisorCard` Component

Import `advisor_card_component.js`, then:

```jsx
<List
  data={state.advisorResponses}
  grid={{ columns: 2, gap: 24 }}
  renderItem={(item) => (
    <AdvisorCard
      name={item.name}
      domain={item.domain}
      avatarUrl={item.avatarUrl}
      response={item.response}
      onRequestFollowUp={() => openFollowUp(item)}
      onShare={() => shareResponse(item)}
    />
  )}
/>
```

### 2.3 Page Actions

1. **Page Load** → run Promise.all of advisor GPT blocks (already triggered in Page 1 chain).  
2. After all resolve → enable “Continue” button.  
3. **Continue** → calls `chief_of_staff` GPT block with aggregated responses, then navigate to Page 3.

---

## 3. Page 3 · Chief of Staff Summary

### 3.1 Wireframe Mock

```
┌──────────────────────────────────────────────┐
│  < Back to Advisors                          │
│                                              │
│  Chief of Staff Synthesis                    │
│                                              │
│  ┌────────── Summary Card ────────────────┐  │
│  │  Key Insights (bullets)                │  │
│  │                                        │  │
│  │  Final Recommendation (bold)           │  │
│  │                                        │  │
│  │  Confidence: 87%   Risk: Moderate      │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  [Export to PDF]   [Log Decision]            │
└──────────────────────────────────────────────┘
```

### 3.2 Component Tree

| Component        | Description                                                 |
|------------------|-------------------------------------------------------------|
| `Heading` H2     | “Chief of Staff Synthesis”                                  |
| `Card`           | Container with shadow + radius 12 px                        |
| `List`           | Bullet list of key insights (`summary.keyInsights`)         |
| `Paragraph`      | Final recommendation, big & bold                            |
| `Tag`            | Confidence (green if ≥80 %, yellow 50-79 %, red <50 %)      |
| `Tag`            | Risk level (color-coded)                                    |
| `ButtonGroup`    | “Export to PDF”, “Log Decision” (calls Supabase insert)     |

### 3.3 Styling

```
Card:
  background: #FFFFFF;
  padding: 32px;
  
Paragraph.recommendation:
  font-size: 20px;
  font-weight: 600;
  color: #233E7E;

Tag.confidence.green   { background:#E6F4EA; color:#1E8E3E; }
Tag.confidence.yellow  { background:#FFF6E5; color:#F9AB00; }
Tag.confidence.red     { background:#FBEAEA; color:#D93025; }

Tag.risk.Low    { background:#E6F4EA; color:#1E8E3E; }
Tag.risk.Medium { background:#FFF6E5; color:#F9AB00; }
Tag.risk.High   { background:#FBEAEA; color:#D93025; }
```

### 3.4 Export Flow

1. **Export to PDF** → use Factory’s `Export` action or JS `html2pdf` library.  
2. **Log Decision** → modal to capture user note → call Supabase `decision_history` insert.

---

## 4. Global Navigation & UX Touches

| UX Detail           | Implementation                                                |
|---------------------|--------------------------------------------------------------|
| Sticky Progress Bar | Top of viewport, steps 1-3 (Ask → Advisors → Summary)        |
| Toaster Notifications | Success (“Responses ready”), Error (“Network issue…”)      |
| Dark Mode           | Optional: invert palette via theme tokens                    |
| Shortcuts           | `⌘+Enter` to submit question                                 |

---

## 5. Responsive Behavior

| Breakpoint | Change                                                         |
|------------|----------------------------------------------------------------|
| ≤768 px    | Advisor cards switch to **single-column**; page padding 16 px |
| ≤480 px    | Textarea rows = 4; buttons full-width, stacked                 |

---

## 6. Sample Screenshots

> Replace placeholders with real captures after you build pages.

| Page | Filename / Note                       |
|------|---------------------------------------|
| Input Screen | `/screenshots/page1_input.png` |
| Advisor Cards | `/screenshots/page2_cards.png` |
| Synthesis | `/screenshots/page3_summary.png`  |

Place images in `/public/screenshots` and reference them in docs or marketing.

---

## 7. Finishing Checklist

- [ ] Theme tokens set (colors, radius, font)  
- [ ] Page 1 validates empty input  
- [ ] Advisor cards load spinner until all responses ready  
- [ ] Chief of Staff tags color based on confidence/risk  
- [ ] Supabase logging wired on “Log Decision”  
- [ ] Mobile layout audited on iPhone 12 & Pixel 5  

---

Build these three pages and you’ll have a board-quality, executive-grade interface ready for demos and client pilots. Enjoy the launch! 🚀
