# Deployment Instructions for L'Oréal Routine Builder

## Cloudflare Worker Setup

### 1. Create a Cloudflare Account

- Sign up at [Cloudflare](https://cloudflare.com) if you don't have an account
- Go to the Workers & Pages section

### 2. Deploy the Worker

1. Click "Create Application" > "Create Worker"
2. Name your worker (e.g., "loreal-routine-api")
3. Copy the contents of `worker.js` and paste it into the worker editor
4. Click "Save and Deploy"

### 3. Set Environment Variables

1. In your worker dashboard, go to "Settings" > "Variables"
2. Add an environment variable:
   - Variable name: `OPENAI_API_KEY`
   - Value: Your OpenAI API key (the one from secrets.js)
   - Make sure to encrypt it

### 4. Update Your Application

1. Copy your worker URL (it will look like: `https://your-worker-name.your-subdomain.workers.dev`)
2. In `script.js`, replace the `WORKER_URL` constant with your actual worker URL:
   ```javascript
   const WORKER_URL = "https://your-worker-name.your-subdomain.workers.dev";
   ```

### 5. Remove Direct API Key Usage

After setting up the worker, you can:

1. Remove the `secrets.js` file (it's no longer needed)
2. Remove the script tag from `index.html` that loads `secrets.js`

## Testing the Application

1. Open `index.html` in a web browser
2. Select a category to view products
3. Click on products to select them
4. Click "Generate Routine" to test the API integration
5. Try asking follow-up questions in the chat

## Project Features Checklist

✅ **Product Selection**: Click products to select/unselect them
✅ **Visual Feedback**: Selected products show with border and checkmark
✅ **Selected Products List**: Updates as items are added/removed
✅ **Product Descriptions**: Click "Description" button to reveal details
✅ **Routine Generation**: Sends selected products to OpenAI API
✅ **Follow-up Chat**: Maintains conversation history
✅ **localStorage**: Selected products persist after page reload
✅ **Clear All**: Button to remove all selected products
✅ **Cloudflare Worker**: Secure API key handling
✅ **L'Oréal Branding**: Uses brand colors (#ff003b and #e3a535)
✅ **Responsive Design**: Works on mobile and desktop

## Optional Enhancements (LevelUp)

For extra credit, you can implement:

### Product Search (10 pts)

Add a search input field that filters products by name or keyword in real-time.

### Web Search Integration (10 pts)

Use OpenAI's web search capabilities or integrate with a search API for current product information.

### RTL Language Support (5 pts)

Add CSS for right-to-left language support with proper text direction and layout adjustments.

## Troubleshooting

### Worker Not Working

- Check that your OPENAI_API_KEY environment variable is set correctly
- Verify the worker URL is correct in script.js
- Check the browser console for error messages

### API Quota Exceeded

- Monitor your OpenAI API usage
- Consider adding rate limiting to the worker

### CORS Issues

- The worker includes CORS headers, but if you encounter issues, check the browser console
- Make sure you're not mixing HTTP and HTTPS requests
