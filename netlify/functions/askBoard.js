// netlify/functions/askBoard.js

const fetch = require('node-fetch');

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

exports.handler = async function(event) {
  try {
    const { type, question, advisors } = JSON.parse(event.body || "{}");
    const apiKey = process.env.OPENAI_API_KEY;

    // Advisor router: pick the most relevant advisors
    if (type === "router") {
      const routerRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: `You are the Advisor Router. Given a user question, respond ONLY with a JSON array of 3–5 names (no explanation), e.g. ["Sundar","Pamela","Arvind","Tope"] from this list: Sundar, Pamela, Arvind, Tope, Ime, Lisa, Kimberly, Jensen.`
            },
            { role: "user", content: question }
          ],
          temperature: 0.2
        })
      });

      const data = await routerRes.json();
      let advisorNames;
      try {
        advisorNames = JSON.parse(data.choices[0].message.content);
        if (!Array.isArray(advisorNames)) throw new Error();
      } catch {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Router did not return a valid array", raw: data.choices[0].message.content })
        };
      }
      return {
        statusCode: 200,
        body: JSON.stringify({ advisorNames })
      };
    }

    // Advisor answer: get a response for each advisor
    if (type === "advisor" && advisors && advisors.length > 0) {
      const advisorAnswers = await Promise.all(
        advisors.map(async (name) => {
          const profile = advisorProfiles[name] || name;
          const res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              model: "gpt-4",
              messages: [
                { role: "system", content: `You are ${profile}. Respond clearly and insightfully to the user's question.` },
                { role: "user", content: question }
              ],
              temperature: 0.4
            })
          });
          const result = await res.json();
          return {
            name,
            response: result.choices[0].message.content
          };
        })
      );
      return {
        statusCode: 200,
        body: JSON.stringify({ advisorAnswers })
      };
    }

    // Chief of Staff summary: combine advisor answers
    if (type === "summary" && advisors && advisors.length > 0) {
      const chiefRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
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
Do not include any explanation or formatting. Here are the advisor responses:`
            },
            {
              role: "user",
              content: advisors.map(a => `${a.name}: ${a.response.replace(/\n/g, ' ')}`).join(" || ")
            }
          ],
          temperature: 0.3
        })
      });
      const chiefData = await chiefRes.json();
      let summary;
      try {
        summary = JSON.parse(chiefData.choices[0].message.content);
      } catch {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Chief did not return JSON", raw: chiefData.choices[0].message.content })
        };
      }
      return {
        statusCode: 200,
        body: JSON.stringify({ summary })
      };
    }

    return { statusCode: 400, body: JSON.stringify({ error: "Bad request" }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
