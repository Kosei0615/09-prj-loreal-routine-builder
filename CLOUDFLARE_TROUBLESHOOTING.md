# Cloudflare Worker Deployment Troubleshooting Guide

## Quick Test Mode (Immediate Solution)

Since you already have `secrets.js` with your API key, you can test the application immediately:

1. **Set fallback mode in `script.js`:**

   ```javascript
   const USE_WORKER = false; // This enables direct API calls for testing
   ```

2. **Open `index.html` in your browser** - the application should work immediately using direct API calls.

## Cloudflare Worker Deployment Steps

### Step 1: Create the Worker

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Click "Workers & Pages" in the left sidebar
3. Click "Create Application" → "Create Worker"
4. Give it a name like `loreal-routine-api`

### Step 2: Deploy the Worker Code

1. **Delete the default code** in the Cloudflare editor
2. **Copy and paste this updated worker code:**

```javascript
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
          Authorization: `Bearer ${OPENAI_API_KEY}`,
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
```

3. **Click "Save and Deploy"**

### Step 3: Set Environment Variables

1. In your worker dashboard, click on "Settings" tab
2. Go to "Variables" section
3. Under "Environment Variables", click "Add variable"
4. Set:
   - **Variable name:** `OPENAI_API_KEY`
   - **Value:** Your OpenAI API key (the same one from secrets.js)
   - **Type:** Choose "Encrypt" to hide the value
5. Click "Save and Deploy"

### Step 4: Get Your Worker URL

1. After deployment, you'll see a URL like: `https://loreal-routine-api.your-username.workers.dev`
2. Copy this URL

### Step 5: Update Your Application

1. In `script.js`, update these lines:
   ```javascript
   const WORKER_URL = "https://loreal-routine-api.your-username.workers.dev"; // Your actual URL
   const USE_WORKER = true; // Enable worker mode
   ```

## Common Deployment Issues & Solutions

### Issue 1: "Deployment Failed"

**Solution:** Make sure you're using the addEventListener format, not the export default format.

### Issue 2: "Environment Variable Not Found"

**Solutions:**

- Make sure the variable name is exactly `OPENAI_API_KEY`
- Ensure you clicked "Save and Deploy" after adding the variable
- Try refreshing the worker settings page

### Issue 3: "CORS Error"

**Solution:** The worker code includes proper CORS headers. If you still get CORS errors:

- Make sure your worker URL is correct
- Check that the worker is deployed and responding

### Issue 4: "Worker Not Responding"

**Solutions:**

- Test the worker URL directly in a browser (you should see "Method not allowed")
- Check the worker logs in the Cloudflare dashboard
- Verify the environment variable is set

## Testing Your Deployment

1. **Test the Worker URL directly:**

   - Open your worker URL in a browser
   - You should see "Method not allowed" (this is correct!)

2. **Test with your application:**
   - Set `USE_WORKER = true` in script.js
   - Try generating a routine
   - Check browser console for any errors

## Fallback Plan

If you continue having issues with Cloudflare Workers:

1. Keep `USE_WORKER = false` in script.js
2. Your application will work using direct API calls
3. This is fine for development and testing
4. For production, you'd want to use the worker for security

## Need More Help?

If you're still having issues:

1. **Check the exact error message** in Cloudflare
2. **Look at browser console errors** when testing
3. **Verify your OpenAI API key** works (test it in OpenAI playground)
4. **Try the fallback mode first** to ensure the app works

The application is fully functional in both modes - use the fallback for now and try the worker later if needed!
