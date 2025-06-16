// public/advisor_router_logic.js

// Profile info (OPTIONAL: You can pass more detail in the backend if you want)
const advisorProfiles = {
  Sundar: "Sundar Pichai, CEO of Google - expert in AI, scale, data infrastructure, product development",
  Pamela: "Pamela Maynard, former EY Global VP - expert in enterprise transformation, consulting, operations",
  Arvind: "Arvind Krishna, IBM CEO - expert in cloud, cybersecurity, hybrid infrastructure",
  Tope: "Tope Awotona, Calendly founder - expert in SaaS, bootstrapping, product-led growth",
  Ime: "Ime Archibong, former Facebook VP - expert in partnerships, community, platform growth",
  Lisa: "Lisa Gelobter, tech executive - expert in DEI, product design, gov-tech",
  Kimberly: "Kimberly Bryant, Black Girls CODE founder - expert in STEM equity, team leadership, early-stage tech",
  Jensen: "Jensen Huang, NVIDIA CEO - expert in GPU, compute, AI infrastructure"
};

async function runBoardRoomFlow() {
  const question = document.getElementById("questionInput").value.trim();
  const outputArea = document.getElementById("outputArea");

  if (!question) {
    outputArea.innerHTML = "<p>Please enter a question first.</p>";
    return;
  }

  outputArea.innerHTML = "<p>Routing your question to the Board...</p>";

  try {
    // 1. ROUTER FUNCTION: Ask Netlify function for which advisors to consult
    const routerResponse = await fetch("/.netlify/functions/askBoard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "router", question })
    });
    const routerResult = await routerResponse.json();
    const advisorNames = routerResult.names; // Should be ["Sundar", "Pamela", ...]

    // 2. ADVISOR RESPONSES: Ask each advisor via Netlify function
    const advisors = await Promise.all(
      advisorNames.map(async (name) => {
        const res = await fetch("/.netlify/functions/askBoard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "advisor",
            name,
            question,
            profile: advisorProfiles[name] // Optional: backend can ignore if not used
          })
        });
        const result = await res.json();
        return {
          name,
          response: result.response // Should be advisor's string response
        };
      })
    );

    // 3. CHIEF OF STAFF: Ask for synthesis
    const chiefRes = await fetch("/.netlify/functions/askBoard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "chief",
        advisors, // [{ name, response }, ...]
        question
      })
    });
    const chief = await chiefRes.json();
    const synthesis = chief.summary; // Should be { summary, recommendation, confidence, risk }

    // 4. OUTPUT to UI
    let html = "<h3>Advisor Responses:</h3>";
    advisors.forEach((a) => {
      html += `
        <div class="advisor-card">
          <strong>${a.name}</strong><br/>
          ${a.response}
        </div>
      `;
    });

    html += `
      <div class="chief-summary">
        <h3>Chief of Staff Summary</h3>
        <p><strong>Summary:</strong> ${synthesis.summary}</p>
        <p><strong>Recommendation:</strong> ${synthesis.recommendation}</p>
        <p><strong>Confidence:</strong> ${synthesis.confidence}%</p>
        <p><strong>Risk:</strong> ${synthesis.risk}</p>
      </div>
    `;

    outputArea.innerHTML = html;
  } catch (err) {
    outputArea.innerHTML = `<p>Error: ${err.message}</p>`;
    console.error(err);
  }
}
