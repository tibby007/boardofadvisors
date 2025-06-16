async function runBoardRoomFlow() {
  const question = document.getElementById("questionInput").value.trim();
  const outputArea = document.getElementById("outputArea");

  if (!question) {
    outputArea.innerHTML = "<p>Please enter a question first.</p>";
    return;
  }

  outputArea.innerHTML = "<p>Routing your question to the Board...</p>";

  // Advisor profile context
  const advisorProfiles = {
    "Sundar": "Sundar Pichai, CEO of Google - expert in AI, scale, data infrastructure, product development.",
    "Pamela": "Pamela Maynard, former EY Global VP - expert in enterprise transformation, consulting, operations.",
    "Arvind": "Arvind Krishna, IBM CEO - expert in cloud, cybersecurity, hybrid infrastructure.",
    "Tope": "Tope Awotona, Calendly founder - expert in SaaS, bootstrapping, product-led growth.",
    "Ime": "Ime Archibong, former Facebook VP - expert in partnerships, community, platform growth.",
    "Lisa": "Lisa Gelobter, tech executive - expert in DEI, product design, gov-tech.",
    "Kimberly": "Kimberly Bryant, Black Girls CODE founder - expert in STEM equity, team leadership, early-stage tech.",
    "Jensen": "Jensen Huang, NVIDIA CEO - expert in GPU, compute, AI infrastructure."
  };

  try {
    // 1. Route to advisor selector
    const routerResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer YOUR_OPENAI_API_KEY_HERE`
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are the Advisor Router for The Board Room app. Based on this user question, return a JSON array of the most relevant advisors to consult. Choose 3–5 advisors from: Sundar, Pamela, Arvind, Tope, Ime, Lisa, Kimberly, Jensen."
          },
          { role: "user", content: question }
        ],
        temperature: 0.3
      })
    });

    const routerResult = await routerResponse.json();
console.log("Raw router response:", routerResult.choices[0].message.content);

let advisorNames;
try {
  advisorNames = JSON.parse(routerResult.choices[0].message.content);
  // Fix: If array of objects, extract advisor names
  if (advisorNames.length && typeof advisorNames[0] === "object" && advisorNames[0] !== null && advisorNames[0].advisor) {
    advisorNames = advisorNames.map(obj => obj.advisor);
  }
  console.log("Normalized advisor names:", advisorNames);
} catch (err) {
  outputArea.innerHTML = "<p>Error: The router response is not a valid JSON array of advisor names. Raw: <br><pre>" + routerResult.choices[0].message.content + "</pre></p>";
  return;
}


    // 2. Get advisor responses (use profiles for better context)
    const advisors = await Promise.all(
      advisorNames.map(async (name) => {
        const profile = advisorProfiles[name] || name;
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization": `Bearer YOUR_OPENAI_API_KEY_HERE`
          },
          body: JSON.stringify({
            model: "gpt-4",
            messages: [
              {
                role: "system",
                content: `You are ${profile} Respond clearly and insightfully to the user's question as if you are consulting for Cheryl Tibbs.`
              },
              { role: "user", content: question }
            ],
            temperature: 0.5
          })
        });

        const result = await res.json();
        let resp = result.choices?.[0]?.message?.content;
        if (typeof resp !== "string") {
          resp = JSON.stringify(resp, null, 2);
        }
        return { name, response: resp };
      })
    );

    // 3. Chief of Staff summary
    const chiefRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer YOUR_OPENAI_API_KEY_HERE`
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are the Chief of Staff. Given the following advisor responses, reply ONLY in this exact JSON format:

{
  "summary": "...",
  "recommendation": "...",
  "confidence": 85,
  "risk": "Low"
}

Do not include any explanation or formatting. Just return the JSON. Here are the advisor responses:`
          },
          {
            role: "user",
            content: advisors.map(a => `${a.name}: ${a.response.replace(/\n/g, ' ')}`).join(" || ")
          }
        ],
        temperature: 0.4
      })
    });

    const chief = await chiefRes.json();
    let synthesis;
    try {
      synthesis = JSON.parse(chief.choices[0].message.content);
    } catch (e) {
      synthesis = { summary: "No summary", recommendation: "", confidence: "N/A", risk: "N/A" };
    }

    // 4. Output formatting
    let html = "<h3>Advisor Responses:</h3>";
    advisors.forEach((a) => {
      html += `<div class="advisor-card"><strong>${a.name}</strong><br/>${a.response}</div>`;
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
