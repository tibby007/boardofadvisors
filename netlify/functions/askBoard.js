const fetch = require('node-fetch');

exports.handler = async function(event) {
  const { question } = JSON.parse(event.body || "{}");
  const apiKey = process.env.OPENAI_API_KEY;

  // Example: Just a simple advisor answer. Expand with full logic as needed.
  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are an expert Board Room advisor." },
        { role: "user", content: question }
      ],
      temperature: 0.3
    })
  });

  const data = await openaiRes.json();

  return {
    statusCode: 200,
    body: JSON.stringify(data)
  };
};

