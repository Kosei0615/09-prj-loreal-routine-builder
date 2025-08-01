// Cloudflare Worker for L'Oréal Routine Builder
// This worker handles OpenAI API requests securely

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  // Handle CORS preflight requests
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  // Only allow POST requests
  if (request.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  try {
    // Parse the request body
    const body = await request.json();

    // Validate that we have the required data
    if (!body.messages || !Array.isArray(body.messages)) {
      return new Response("Invalid request format", {
        status: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // Make request to OpenAI API
    const openaiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`, // This will be set as an environment variable
        },
        body: JSON.stringify({
          model: body.model || "gpt-4o",
          messages: body.messages,
          max_tokens: body.max_tokens || 1000,
          temperature: body.temperature || 0.7,
        }),
      }
    );

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error("OpenAI API error:", errorText);
      return new Response("OpenAI API error", {
        status: openaiResponse.status,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    const openaiData = await openaiResponse.json();

    // Return the response with CORS headers
    return new Response(JSON.stringify(openaiData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Worker error:", error);
    return new Response("Internal server error", {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
}
