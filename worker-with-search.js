/**
 * Cloudflare Worker for L'Oréal Routine Builder
 * This worker securely handles OpenAI API calls with fallback capabilities
 */

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    // Only allow POST requests
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    try {
      const requestData = await request.json();

      // Validate that we have an API key
      if (!env.OPENAI_API_KEY) {
        throw new Error("OpenAI API key not configured in worker environment");
      }

      // Try search preview model first, then fallback to regular gpt-4o
      let model = requestData.model || "gpt-4o-search-preview";

      console.log(`Attempting API call with model: ${model}`);

      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: model,
            messages: requestData.messages,
            max_tokens: requestData.max_tokens || 1000,
            temperature: requestData.temperature || 0.7,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `OpenAI API error with ${model}: ${response.status}`,
          errorText
        );

        // If search preview model fails with 400, try regular gpt-4o
        if (model === "gpt-4o-search-preview" && response.status === 400) {
          console.log("Falling back to gpt-4o model");

          const fallbackResponse = await fetch(
            "https://api.openai.com/v1/chat/completions",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${env.OPENAI_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "gpt-4o",
                messages: requestData.messages,
                max_tokens: requestData.max_tokens || 1000,
                temperature: requestData.temperature || 0.7,
              }),
            }
          );

          if (!fallbackResponse.ok) {
            const fallbackErrorText = await fallbackResponse.text();
            console.error(
              `Fallback API error: ${fallbackResponse.status}`,
              fallbackErrorText
            );
            throw new Error(
              `Both models failed. Last error: ${fallbackResponse.status}`
            );
          }

          const fallbackData = await fallbackResponse.json();
          return new Response(JSON.stringify(fallbackData), {
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          });
        }

        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`API call successful with model: ${model}`);

      return new Response(JSON.stringify(data), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch (error) {
      console.error("Worker error:", error);
      return new Response(
        JSON.stringify({
          error: "Internal server error",
          details: error.message,
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }
  },
};
