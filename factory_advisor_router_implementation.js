/**
 * Advisor Router for The Board Room
 * 
 * This component analyzes a question and selects the most relevant advisors
 * based on their domains of expertise and priority rules.
 * 
 * Designed specifically for Factory GPT Block implementation.
 */

// Main function that will be called by Factory
function routeAdvisors(question) {
  // Define advisors and their domains of expertise
  const advisors = [
    {
      name: "Sundar Pichai",
      domains: ["strategy", "scale", "infrastructure", "product leadership"],
      keywords: ["scaling", "growth", "infrastructure", "strategy", "product", "leadership", "ai", "technology"]
    },
    {
      name: "Pamela Maynard",
      domains: ["DEI", "culture", "enterprise ops", "transformation"],
      keywords: ["dei", "diversity", "equity", "inclusion", "culture", "enterprise", "operations", "transformation", "team"]
    },
    {
      name: "Arvind Krishna",
      domains: ["deep tech", "hybrid cloud", "AI ethics", "compliance"],
      keywords: ["tech", "cloud", "ethics", "compliance", "risk", "data", "security", "governance", "ai"]
    },
    {
      name: "Tope Awotona",
      domains: ["GTM strategy", "SaaS", "product-led growth"],
      keywords: ["gtm", "go to market", "saas", "product-led", "growth", "startup", "bootstrapping", "sales", "marketing"]
    },
    {
      name: "Ime Archibong",
      domains: ["ecosystems", "integrations", "product management"],
      keywords: ["ecosystem", "integration", "product", "management", "partnership", "api", "platform"]
    },
    {
      name: "Lisa Gelobter",
      domains: ["equity", "internal tools", "inclusive product design"],
      keywords: ["equity", "internal tools", "inclusive", "design", "bias", "accessibility", "ux", "user experience"]
    },
    {
      name: "Kimberly Bryant",
      domains: ["education", "tech access", "grassroots innovation"],
      keywords: ["education", "access", "grassroots", "innovation", "community", "diversity", "inclusion", "learning"]
    },
    {
      name: "Jensen Huang",
      domains: ["AI infrastructure", "GPUs", "performance and scale"],
      keywords: ["ai", "infrastructure", "gpu", "performance", "scale", "hardware", "computing", "processing"]
    }
  ];

  // Priority override rules
  const priorityOverrides = [
    { topics: ["scaling", "growth", "ai", "infrastructure"], advisors: ["Sundar Pichai", "Jensen Huang"] },
    { topics: ["culture", "team", "diversity", "equity"], advisors: ["Pamela Maynard", "Lisa Gelobter", "Kimberly Bryant"] },
    { topics: ["product", "integration", "ecosystem"], advisors: ["Ime Archibong", "Tope Awotona"] },
    { topics: ["compliance", "ethics", "risk", "data"], advisors: ["Arvind Krishna"] },
    { topics: ["startup", "saas", "bootstrapping"], advisors: ["Tope Awotona"] },
    { topics: ["education", "access", "community"], advisors: ["Kimberly Bryant"] },
    { topics: ["internal tools", "bias", "equity"], advisors: ["Lisa Gelobter"] }
  ];

  // Convert question to lowercase for case-insensitive matching
  const lowerQuestion = question.toLowerCase();
  
  // Score each advisor based on keyword matches
  const advisorScores = advisors.map(advisor => {
    let score = 0;
    
    // Check for keyword matches
    advisor.keywords.forEach(keyword => {
      if (lowerQuestion.includes(keyword.toLowerCase())) {
        score += 1;
      }
    });
    
    return {
      name: advisor.name,
      score: score
    };
  });
  
  // Apply priority overrides
  priorityOverrides.forEach(override => {
    let hasMatch = false;
    
    // Check if the question contains any of the override topics
    override.topics.forEach(topic => {
      if (lowerQuestion.includes(topic.toLowerCase())) {
        hasMatch = true;
      }
    });
    
    // If there's a match, boost the scores of the priority advisors
    if (hasMatch) {
      advisorScores.forEach((advisorScore, index) => {
        if (override.advisors.includes(advisorScore.name)) {
          advisorScores[index].score += 3; // Significant boost for priority matches
        }
      });
    }
  });
  
  // Sort advisors by score (highest first)
  advisorScores.sort((a, b) => b.score - a.score);
  
  // Select top scoring advisors (between 3-5)
  let selectedAdvisors = advisorScores
    .filter(advisor => advisor.score > 0) // Only include advisors with some relevance
    .slice(0, 5) // Take up to 5 advisors
    .map(advisor => advisor.name);
  
  // Ensure we have at least 3 advisors
  if (selectedAdvisors.length < 3) {
    // Add additional advisors based on general relevance
    const additionalAdvisors = advisorScores
      .filter(advisor => !selectedAdvisors.includes(advisor.name))
      .slice(0, 3 - selectedAdvisors.length)
      .map(advisor => advisor.name);
    
    selectedAdvisors = [...selectedAdvisors, ...additionalAdvisors];
  }
  
  // If we still don't have 3 advisors, add default ones
  while (selectedAdvisors.length < 3) {
    const defaultAdvisors = ["Sundar Pichai", "Pamela Maynard", "Arvind Krishna"];
    for (const advisor of defaultAdvisors) {
      if (!selectedAdvisors.includes(advisor)) {
        selectedAdvisors.push(advisor);
        if (selectedAdvisors.length >= 3) break;
      }
    }
  }
  
  // Limit to 5 advisors maximum
  selectedAdvisors = selectedAdvisors.slice(0, 5);
  
  // Return the result in the required JSON format
  return {
    selected_advisors: selectedAdvisors
  };
}

// Factory GPT Block entry point
function processQuestion(userQuestion) {
  try {
    // Validate input
    if (!userQuestion || typeof userQuestion !== 'string' || userQuestion.trim() === '') {
      return JSON.stringify({
        selected_advisors: ["Sundar Pichai", "Pamela Maynard", "Arvind Krishna"]
      });
    }
    
    // Process the question and get selected advisors
    const result = routeAdvisors(userQuestion);
    
    // Return the JSON string for Factory to parse
    return JSON.stringify(result);
  } catch (error) {
    // Fallback in case of any errors
    console.error("Error processing question:", error);
    return JSON.stringify({
      selected_advisors: ["Sundar Pichai", "Pamela Maynard", "Arvind Krishna"]
    });
  }
}

// Example usage (for testing in Factory's environment)
// const question = "Should we launch the Canadian vendor workflow fully automated, or start manual?";
// const result = processQuestion(question);
// console.log(result);
