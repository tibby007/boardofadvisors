// public/advisor_router_logic.js

// Entry point: wired to your Submit button in index.html
document.addEventListener('DOMContentLoaded', () => {
  const submitBtn = document.getElementById("askBoardBtn");
  if (submitBtn) submitBtn.addEventListener("click", runBoardRoomFlow);
  // Optional: support Enter key
  const input = document.getElementById("questionInput");
  if (input) {
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        runBoardRoomFlow();
      }
    });
  }
});

async function runBoardRoomFlow() {
  const question = document.getElementById("questionInput").value.trim();
  const outputArea = document.getElementById("outputArea");

  if (!question) {
    outputArea.innerHTML = "<p>Please enter a question first.</p>";
    return;
  }
  outputArea.innerHTML = "<p>Routing your question to the Board...</p>";

  try {
    // --- Step 1: Advisor Router ---
    const routerRes = await fetch("/.netlify/functions/askBoard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "router", question })
    });
    const routerData = await routerRes.json();
    if (!routerData.advisorNames || !Array.isArray(routerData.advisorNames)) {
      outputArea.innerHTML = `<p>Error routing to board: ${routerData.error || "No advisor names returned"}</p>`;
      return;
    }
    const advisorNames = routerData.advisorNames;

    // --- Step 2: Get advisor responses ---
    outputArea.innerHTML = `<p>Consulting selected advisors: ${advisorNames.join(", ")}...</p>`;
    const advisorRes = await fetch("/.netlify/functions/askBoard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "advisor", question, advisors: advisorNames })
    });
    const advisorData = await advisorRes.json();
    if (!advisorData.advisorAnswers || !Array.isArray(advisorData.advisorAnswers)) {
      outputArea.innerHTML = `<p>Error getting advisor responses: ${advisorData.error || "No advisor answers"}</p>`;
      return;
    }
    const advisorAnswers = advisorData.advisorAnswers;

    // --- Step 3: Chief of Staff summary ---
    outputArea.innerHTML = `<p>Summarizing board advice...</p>`;
    const summaryRes = await fetch("/.netlify/functions/askBoard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "summary", question, advisors: advisorAnswers })
    });
    const summaryData = await summaryRes.json();
    if (!summaryData.summary) {
      outputArea.innerHTML = `<p>Error getting summary: ${summaryData.error || "No summary returned"}</p>`;
      return;
    }

    // --- Output formatting ---
    let html = "<h3>Advisor Responses:</h3>";
    advisorAnswers.forEach((a) => {
      html += `<div class="advisor-card"><strong>${a.name}</strong><br/>${a.response}</div>`;
    });

    html += `
      <div class="chief-summary">
        <h3>Chief of Staff Summary</h3>
        <p><strong>Summary:</strong> ${summaryData.summary.summary}</p>
        <p><strong>Recommendation:</strong> ${summaryData.summary.recommendation}</p>
        <p><strong>Confidence:</strong> ${summaryData.summary.confidence}%</p>
        <p><strong>Risk:</strong> ${summaryData.summary.risk}</p>
      </div>
    `;
    outputArea.innerHTML = html;
  } catch (err) {
    outputArea.innerHTML = `<p style="color: red;"><strong>Error:</strong> ${err.message}</p>`;
    console.error(err);
  }
}
