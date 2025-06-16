/**
 * factory_conditional_flow.js
 * 
 * This file contains the logic for conditionally calling advisor GPT blocks
 * based on the output from the Advisor Router in The Board Room application.
 * 
 * It handles:
 * 1. Processing the Advisor Router output
 * 2. Conditionally calling each advisor GPT block
 * 3. Collecting responses into a unified array
 * 4. Error handling throughout the process
 */

// Advisor information mapping for UI display
const advisorInfo = {
  "Sundar Pichai": {
    name: "Sundar Pichai",
    domain: "Strategy, Scale, Infrastructure",
    avatarUrl: "/images/advisors/sundar.png",
    blockName: "advisor_sundar"
  },
  "Pamela Maynard": {
    name: "Pamela Maynard",
    domain: "DEI, Culture, Enterprise Ops",
    avatarUrl: "/images/advisors/pamela.png",
    blockName: "advisor_pamela"
  },
  "Arvind Krishna": {
    name: "Arvind Krishna",
    domain: "Deep Tech, Hybrid Cloud, AI Ethics",
    avatarUrl: "/images/advisors/arvind.png",
    blockName: "advisor_arvind"
  },
  "Tope Awotona": {
    name: "Tope Awotona",
    domain: "GTM Strategy, SaaS, Product-led Growth",
    avatarUrl: "/images/advisors/tope.png",
    blockName: "advisor_tope"
  },
  "Ime Archibong": {
    name: "Ime Archibong",
    domain: "Ecosystems, Integrations, Product Management",
    avatarUrl: "/images/advisors/ime.png",
    blockName: "advisor_ime"
  },
  "Lisa Gelobter": {
    name: "Lisa Gelobter",
    domain: "Equity, Internal Tools, Inclusive Design",
    avatarUrl: "/images/advisors/lisa.png",
    blockName: "advisor_lisa"
  },
  "Kimberly Bryant": {
    name: "Kimberly Bryant",
    domain: "Education, Tech Access, Grassroots Innovation",
    avatarUrl: "/images/advisors/kimberly.png",
    blockName: "advisor_kimberly"
  },
  "Jensen Huang": {
    name: "Jensen Huang",
    domain: "AI Infrastructure, GPUs, Performance",
    avatarUrl: "/images/advisors/jensen.png",
    blockName: "advisor_jensen"
  }
};

/**
 * Process the Advisor Router output and call appropriate advisor GPT blocks
 * 
 * @param {Object} routerOutput - The JSON output from the Advisor Router
 * @param {string} question - The original user question
 * @param {Object} factory - The Factory API object for calling GPT blocks
 * @returns {Promise<Array>} - Promise resolving to array of advisor responses
 */
async function processAdvisorSelection(routerOutput, question, factory) {
  try {
    // Validate router output
    if (!routerOutput || !routerOutput.selected_advisors || !Array.isArray(routerOutput.selected_advisors)) {
      console.error("Invalid router output:", routerOutput);
      throw new Error("Invalid advisor selection output");
    }

    const selectedAdvisors = routerOutput.selected_advisors;
    console.log(`Selected advisors: ${selectedAdvisors.join(", ")}`);
    
    // Create an array of promises for each advisor response
    const advisorPromises = selectedAdvisors.map(async (advisorName) => {
      try {
        // Get advisor info from our mapping
        const advisor = advisorInfo[advisorName];
        if (!advisor) {
          console.error(`Unknown advisor: ${advisorName}`);
          return {
            name: advisorName,
            domain: "Unknown",
            avatarUrl: null,
            response: "Error: Advisor information not found",
            error: true
          };
        }

        // Call the advisor's GPT block
        console.log(`Calling ${advisor.blockName} for question: ${question.substring(0, 50)}...`);
        const response = await factory.runGptBlock(advisor.blockName, { question });
        
        // Return formatted advisor response
        return {
          ...advisor,
          response: response,
          error: false
        };
      } catch (advisorError) {
        console.error(`Error getting response from ${advisorName}:`, advisorError);
        
        // Return error information in a format that can still be displayed
        return {
          name: advisorName,
          domain: advisorInfo[advisorName]?.domain || "Unknown",
          avatarUrl: advisorInfo[advisorName]?.avatarUrl || null,
          response: `An error occurred while getting this advisor's response: ${advisorError.message}`,
          error: true
        };
      }
    });

    // Wait for all advisor responses (even if some fail)
    const advisorResponses = await Promise.allSettled(advisorPromises);
    
    // Process the responses, handling any that rejected
    const processedResponses = advisorResponses.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        // Handle rejected promises
        const advisorName = selectedAdvisors[index];
        console.error(`Failed to get response from ${advisorName}:`, result.reason);
        return {
          name: advisorName,
          domain: advisorInfo[advisorName]?.domain || "Unknown",
          avatarUrl: advisorInfo[advisorName]?.avatarUrl || null,
          response: `Unable to get response from this advisor: ${result.reason.message}`,
          error: true
        };
      }
    });

    // Log success
    const successCount = processedResponses.filter(r => !r.error).length;
    console.log(`Successfully received ${successCount} of ${selectedAdvisors.length} advisor responses`);
    
    return processedResponses;
  } catch (error) {
    console.error("Error in processAdvisorSelection:", error);
    throw error;
  }
}

/**
 * Call the Chief of Staff GPT block to synthesize advisor responses
 * 
 * @param {Array} advisorResponses - Array of advisor responses
 * @param {string} question - The original user question
 * @param {Object} factory - The Factory API object for calling GPT blocks
 * @returns {Promise<Object>} - Promise resolving to synthesis result
 */
async function synthesizeResponses(advisorResponses, question, factory) {
  try {
    // Format advisor responses for the Chief of Staff
    const formattedResponses = advisorResponses.map(advisor => {
      return `${advisor.name} (${advisor.domain}): ${advisor.response}`;
    }).join("\n\n");
    
    // Call the Chief of Staff GPT block
    const synthesisResult = await factory.runGptBlock("chief_of_staff", {
      question,
      advisorResponses: formattedResponses
    });
    
    return {
      summary: synthesisResult.summary || synthesisResult,
      keyInsights: synthesisResult.keyInsights || [],
      recommendation: synthesisResult.recommendation || synthesisResult.finalRecommendation || "",
      confidenceScore: synthesisResult.confidenceScore || synthesisResult.confidence || 0,
      riskLevel: synthesisResult.riskLevel || synthesisResult.risk || "N/A"
    };
  } catch (error) {
    console.error("Error in synthesizeResponses:", error);
    throw error;
  }
}

/**
 * Log the question, selected advisors, and responses to the database
 * 
 * @param {string} question - The original user question
 * @param {Array<string>} selectedAdvisors - Array of selected advisor names
 * @param {Array<Object>} advisorResponses - Array of advisor response objects
 * @param {Object} synthesis - The Chief of Staff synthesis
 * @param {Object} user - Current user information
 * @param {Object} supabase - Supabase client
 * @returns {Promise<Object>} - Promise resolving to the created log entry
 */
async function logBoardRoomSession(question, selectedAdvisors, advisorResponses, synthesis, user, supabase) {
  try {
    // Insert question record
    const { data: questionRecord, error: questionError } = await supabase
      .from('questions')
      .insert({
        user_id: user.id,
        question_text: question,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (questionError) throw questionError;
    const questionId = questionRecord.id;
    
    // Insert advisor selections
    const advisorSelectionPromises = selectedAdvisors.map(async (advisorName) => {
      // Get advisor ID from name
      const { data: advisorData } = await supabase
        .from('advisors')
        .select('id')
        .eq('name', advisorName)
        .single();
      
      if (!advisorData) return null;
      
      // Insert selection record
      return supabase
        .from('advisor_selections')
        .insert({
          question_id: questionId,
          advisor_id: advisorData.id,
          selected_at: new Date().toISOString()
        });
    });
    
    await Promise.all(advisorSelectionPromises);
    
    // Insert advisor responses
    const responsePromises = advisorResponses.map(async (response) => {
      // Get advisor ID from name
      const { data: advisorData } = await supabase
        .from('advisors')
        .select('id')
        .eq('name', response.name)
        .single();
      
      if (!advisorData) return null;
      
      // Insert response record
      return supabase
        .from('advisor_responses')
        .insert({
          question_id: questionId,
          advisor_id: advisorData.id,
          response_text: response.response,
          generated_at: new Date().toISOString(),
          response_tokens: response.response.length / 4 // Rough estimate
        });
    });
    
    await Promise.all(responsePromises);
    
    // Insert recommendation record
    await supabase
      .from('recommendations')
      .insert({
        question_id: questionId,
        summary: synthesis.summary,
        key_insights: synthesis.keyInsights,
        final_recommendation: synthesis.recommendation,
        confidence_score: synthesis.confidenceScore,
        risk_level: synthesis.riskLevel,
        generated_at: new Date().toISOString()
      });
    
    // Log analytics event
    await supabase.rpc('log_analytics_event', {
      p_question_id: questionId,
      p_user_id: user.id,
      p_event_type: 'board_room_session',
      p_event_data: {
        question,
        selected_advisors: selectedAdvisors,
        synthesis_confidence: synthesis.confidenceScore
      }
    });
    
    return { questionId };
  } catch (error) {
    console.error("Error logging session:", error);
    // Continue execution even if logging fails
    return { error };
  }
}

/**
 * Main function to process a question through the Board Room workflow
 * 
 * @param {string} question - The user's question
 * @param {Object} factory - The Factory API object
 * @param {Object} supabase - Supabase client
 * @param {Object} user - Current user information
 * @returns {Promise<Object>} - Promise resolving to complete Board Room result
 */
async function processBoardRoomQuestion(question, factory, supabase, user) {
  try {
    // Step 1: Call the Advisor Router to select advisors
    const routerResponse = await factory.runGptBlock("advisor_router", { question });
    let routerOutput;
    
    // Handle potential string JSON response
    if (typeof routerResponse === 'string') {
      try {
        routerOutput = JSON.parse(routerResponse);
      } catch (parseError) {
        console.error("Error parsing router response:", parseError);
        throw new Error("Invalid response from advisor router");
      }
    } else {
      routerOutput = routerResponse;
    }
    
    // Step 2: Call each selected advisor's GPT block
    const advisorResponses = await processAdvisorSelection(routerOutput, question, factory);
    
    // Step 3: Call the Chief of Staff to synthesize responses
    const synthesis = await synthesizeResponses(advisorResponses, question, factory);
    
    // Step 4: Log the session (non-blocking)
    logBoardRoomSession(
      question, 
      routerOutput.selected_advisors, 
      advisorResponses, 
      synthesis, 
      user, 
      supabase
    ).catch(error => {
      console.error("Error logging session (non-blocking):", error);
    });
    
    // Step 5: Return the complete result
    return {
      question,
      selectedAdvisors: routerOutput.selected_advisors,
      advisorResponses,
      synthesis,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error in processBoardRoomQuestion:", error);
    throw error;
  }
}

// Export the functions for use in Factory
module.exports = {
  processAdvisorSelection,
  synthesizeResponses,
  logBoardRoomSession,
  processBoardRoomQuestion,
  advisorInfo
};
