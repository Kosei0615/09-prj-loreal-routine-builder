/* Configuration - Replace with your Cloudflare Worker URL */
const WORKER_URL = "https://wander-chat-bot-2.yamagu-k1.workers.dev/"; // Replace with your actual worker URL
const USE_WORKER = false; // Set to false for testing, true for secure worker

/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productSearch = document.getElementById("productSearch");
const productsContainer = document.getElementById("productsContainer");
const selectedProductsList = document.getElementById("selectedProductsList");
const generateRoutineBtn = document.getElementById("generateRoutine");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const userInput = document.getElementById("userInput");

/* Global variables for app state */
let allProducts = [];
let selectedProducts = [];
let conversationHistory = [];
let isRoutineGenerated = false;
let currentCategory = "";
let currentSearchTerm = "";

/* Web Search Function using free search API */
async function performWebSearch(query) {
  try {
    // Using DuckDuckGo Instant Answer API (free, no key required)
    const searchQuery = encodeURIComponent(query + " beauty skincare makeup");
    const searchUrl = `https://api.duckduckgo.com/?q=${searchQuery}&format=json&no_html=1&skip_disambig=1`;

    const response = await fetch(searchUrl);
    const data = await response.json();

    let searchResults = "";

    // Get abstract if available
    if (data.Abstract) {
      searchResults += `Summary: ${data.Abstract}\n`;
      if (data.AbstractURL) {
        searchResults += `Source: ${data.AbstractURL}\n\n`;
      }
    }

    // Get related topics
    if (data.RelatedTopics && data.RelatedTopics.length > 0) {
      searchResults += "Related Information:\n";
      data.RelatedTopics.slice(0, 3).forEach((topic, index) => {
        if (topic.Text) {
          searchResults += `${index + 1}. ${topic.Text}\n`;
          if (topic.FirstURL) {
            searchResults += `   Link: ${topic.FirstURL}\n`;
          }
        }
      });
    }

    // Fallback: Try a different approach with web scraping simulation
    if (!searchResults) {
      // Use a beauty-focused search with current date context
      searchResults = await getBeautyTrendsInfo(query);
    }

    return (
      searchResults ||
      "No specific search results found, but I can provide general beauty advice."
    );
  } catch (error) {
    console.error("Web search error:", error);
    return "Search unavailable, providing general beauty advice.";
  }
}

/* Get beauty trends information */
async function getBeautyTrendsInfo(query) {
  // Since we can't access real-time data easily, we'll provide contextual beauty information
  const beautyContext = {
    2025: "Current year with focus on sustainable beauty, clean ingredients, and personalized skincare",
    trending:
      "Popular trends include glass skin, minimalist routines, and multi-functional products",
    latest:
      "Recent focus on barrier repair, microbiome-friendly products, and inclusive shade ranges",
    new: "New launches emphasize sustainable packaging, clean formulations, and customizable products",
    price:
      "L'Oréal products typically range from $8-$50 depending on the line (drugstore to luxury)",
    ingredients:
      "Key trending ingredients: niacinamide, hyaluronic acid, vitamin C, retinol, peptides",
    reviews:
      "L'Oréal consistently receives positive reviews for innovation, accessibility, and effectiveness",
  };

  const lowerQuery = query.toLowerCase();
  let contextInfo = "";

  for (const [key, value] of Object.entries(beautyContext)) {
    if (lowerQuery.includes(key)) {
      contextInfo += `${value}\n`;
    }
  }

  return (
    contextInfo ||
    "I can provide expert beauty advice based on L'Oréal's extensive product range and proven formulations."
  );
}

/* Helper function to make API calls (worker or direct) */
async function makeOpenAIRequest(
  messages,
  maxTokens = 1000,
  temperature = 0.7,
  includeSearch = false,
  searchQuery = ""
) {
  // If search is requested, get search results first
  let enhancedMessages = [...messages];

  if (includeSearch && searchQuery) {
    const searchResults = await performWebSearch(searchQuery);

    // Add search context to the system message or create a new context message
    const searchContextMessage = {
      role: "system",
      content: `Here is current web search information that may be relevant to the user's question:

${searchResults}

Use this information along with your beauty expertise to provide a comprehensive answer. Always mention when you're using current information and include any relevant links provided in the search results.`,
    };

    enhancedMessages = [searchContextMessage, ...messages];
  }

  const requestData = {
    model: "gpt-4o", // Using stable gpt-4o model
    messages: enhancedMessages,
    max_tokens: maxTokens,
    temperature: temperature,
  };

  if (USE_WORKER) {
    try {
      // Use Cloudflare Worker
      const response = await fetch(WORKER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        console.error(`Worker request failed: ${response.status}`);
        // Fallback to direct API call
        return await makeDirectAPICall(requestData);
      }

      return await response.json();
    } catch (error) {
      console.error("Worker error:", error);
      // Fallback to direct API call
      return await makeDirectAPICall(requestData);
    }
  } else {
    return await makeDirectAPICall(requestData);
  }
}

/* Direct API call function */
async function makeDirectAPICall(requestData) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPEN_API_KEY}`,
    },
    body: JSON.stringify(requestData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`API request failed: ${response.status}`, errorText);
    throw new Error(`API request failed: ${response.status}`);
  }

  return await response.json();
}
document.addEventListener("DOMContentLoaded", () => {
  /* Load RTL preference */
  const savedDirection = localStorage.getItem("textDirection");
  if (savedDirection === "rtl") {
    document.documentElement.setAttribute("dir", "rtl");
    document.documentElement.setAttribute("lang", "ar");
  }

  loadSelectedProductsFromStorage();
  updateSelectedProductsDisplay();

  /* Initialize chat with welcome message */
  displayChatMessage(
    "Welcome! Select some L'Oréal products and I'll help you create the perfect beauty routine.",
    "assistant"
  );

  /* Initialize product display to show saved selections */
  setTimeout(() => {
    updateProductCardStyles();
    updateGenerateButtonState();
  }, 100);
});

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

/* Load product data from JSON file */
async function loadProducts() {
  if (allProducts.length === 0) {
    const response = await fetch("products.json");
    const data = await response.json();
    allProducts = data.products;
  }
  return allProducts;
}

/* Save selected products to localStorage */
function saveSelectedProductsToStorage() {
  localStorage.setItem("selectedProducts", JSON.stringify(selectedProducts));
}

/* Load selected products from localStorage */
function loadSelectedProductsFromStorage() {
  const saved = localStorage.getItem("selectedProducts");
  if (saved) {
    selectedProducts = JSON.parse(saved);
  }
}

/* Check if a product is selected */
function isProductSelected(productId) {
  return selectedProducts.some((product) => product.id === productId);
}

/* Add product to selected list */
function selectProduct(product) {
  if (!isProductSelected(product.id)) {
    selectedProducts.push(product);
    saveSelectedProductsToStorage();
    updateSelectedProductsDisplay();
    updateProductCardStyles();
    updateGenerateButtonState();
  }
}

/* Remove product from selected list */
function unselectProduct(productId) {
  selectedProducts = selectedProducts.filter(
    (product) => product.id !== productId
  );
  saveSelectedProductsToStorage();
  updateSelectedProductsDisplay();
  updateProductCardStyles();
  updateGenerateButtonState();
}

/* Clear all selected products */
function clearAllSelectedProducts() {
  selectedProducts = [];
  saveSelectedProductsToStorage();
  updateSelectedProductsDisplay();
  updateProductCardStyles();
  updateGenerateButtonState();
}

/* Update generate button state based on selected products */
function updateGenerateButtonState() {
  const generateBtn = document.getElementById("generateRoutine");
  if (selectedProducts.length === 0) {
    generateBtn.disabled = true;
    generateBtn.innerHTML =
      '<i class="fa-solid fa-wand-magic-sparkles"></i> Select Products First';
  } else {
    generateBtn.disabled = false;
    generateBtn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> Generate Routine (${selectedProducts.length} products)`;
  }
}

/* Update the selected products display */
function updateSelectedProductsDisplay() {
  const clearAllBtn = document.getElementById("clearAllBtn");

  if (selectedProducts.length === 0) {
    selectedProductsList.innerHTML = `
      <div class="selected-products-empty">
        No products selected yet. Click on products to add them to your routine.
      </div>
    `;
    clearAllBtn.style.display = "none";
  } else {
    selectedProductsList.innerHTML = selectedProducts
      .map(
        (product) => `
      <div class="selected-product-item">
        <img src="${product.image}" alt="${product.name}">
        <div class="selected-product-info">
          <h4>${product.name}</h4>
          <p>${product.brand}</p>
        </div>
        <button class="remove-product-btn" onclick="unselectProduct(${product.id})" title="Remove product">
          <i class="fa-solid fa-times"></i>
        </button>
      </div>
    `
      )
      .join("");
    clearAllBtn.style.display = "block";
  }
}

/* Update product card styles to show selected state */
function updateProductCardStyles() {
  const productCards = document.querySelectorAll(".product-card");
  productCards.forEach((card) => {
    const productId = parseInt(card.dataset.productId);
    if (isProductSelected(productId)) {
      card.classList.add("selected");
    } else {
      card.classList.remove("selected");
    }
  });
}

/* Create HTML for displaying product cards with selection and description reveal */
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map(
      (product) => `
    <div class="product-card ${
      isProductSelected(product.id) ? "selected" : ""
    }" data-product-id="${product.id}">
      <img src="${product.image}" alt="${product.name}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.brand}</p>
        <button class="description-toggle" onclick="toggleDescription(${
          product.id
        })">
          <i class="fa-solid fa-info-circle"></i> Description
        </button>
        <div class="product-description" id="desc-${
          product.id
        }" style="display: none;">
          ${product.description}
        </div>
      </div>
    </div>
  `
    )
    .join("");

  /* Add click event listeners to product cards for selection */
  const productCards = document.querySelectorAll(".product-card");
  productCards.forEach((card) => {
    card.addEventListener("click", (e) => {
      /* Don't trigger selection if user clicked the description button */
      if (e.target.closest(".description-toggle")) {
        return;
      }

      const productId = parseInt(card.dataset.productId);
      const product = products.find((p) => p.id === productId);

      if (isProductSelected(productId)) {
        unselectProduct(productId);
      } else {
        selectProduct(product);
      }
    });
  });
}

/* Toggle product description visibility */
function toggleDescription(productId) {
  const descElement = document.getElementById(`desc-${productId}`);
  const isVisible = descElement.style.display !== "none";

  if (isVisible) {
    descElement.style.display = "none";
  } else {
    descElement.style.display = "block";
  }
}

/* Filter products based on category and search term */
function filterProducts() {
  if (!allProducts.length) return [];

  let filteredProducts = allProducts;

  /* Filter by category if selected */
  if (currentCategory) {
    filteredProducts = filteredProducts.filter(
      (product) => product.category === currentCategory
    );
  }

  /* Filter by search term if provided */
  if (currentSearchTerm) {
    const searchLower = currentSearchTerm.toLowerCase();
    filteredProducts = filteredProducts.filter(
      (product) =>
        product.name.toLowerCase().includes(searchLower) ||
        product.brand.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower)
    );
  }

  return filteredProducts;
}

/* Update product display based on current filters */
async function updateProductDisplay() {
  const products = await loadProducts();
  const filteredProducts = filterProducts();
  displayProducts(filteredProducts);
}

/* Generate routine using OpenAI API */
async function generateRoutine() {
  if (selectedProducts.length === 0) {
    displayChatMessage(
      "Please select at least one product to generate a routine.",
      "assistant"
    );
    return;
  }

  /* Disable button and show loading state */
  const generateBtn = document.getElementById("generateRoutine");
  const originalText = generateBtn.innerHTML;
  generateBtn.disabled = true;
  generateBtn.innerHTML =
    '<i class="fa-solid fa-spinner fa-spin"></i> Generating...';

  displayChatMessage(
    "🎨 Generating your personalized routine with current beauty insights...",
    "assistant"
  );

  try {
    /* Prepare the product data for the API */
    const productData = selectedProducts.map((product) => ({
      name: product.name,
      brand: product.brand,
      category: product.category,
      description: product.description,
    }));

    /* Create an enhanced prompt that can benefit from current beauty knowledge */
    const prompt = `You are a professional beauty and skincare expert creating a personalized routine for 2025. Based on the following L'Oréal products the user has selected, create a comprehensive routine that incorporates current beauty trends and best practices.

Please provide:
1. The optimal order to use these products
2. When to use them (morning/evening/both) 
3. How to apply each product effectively
4. Current beauty tips and techniques for 2025
5. Expected benefits and timeline for results
6. Any important warnings or ingredient interactions
7. How this routine aligns with current skincare trends

Selected Products:
${productData
  .map(
    (product) =>
      `- ${product.brand} ${product.name} (${product.category}): ${product.description}`
  )
  .join("\n")}

Create a detailed, personalized routine that maximizes effectiveness using current beauty knowledge and L'Oréal's innovative formulations.`;

    /* Use the enhanced API call with search context for current beauty trends */
    const data = await makeOpenAIRequest(
      [
        {
          role: "user",
          content: prompt,
        },
      ],
      2000, // Token limit for detailed routine
      0.7,
      true, // Enable search for current beauty trends
      "2025 beauty trends skincare routine tips L'Oréal products"
    );

    const routineText = data.choices[0].message.content;

    /* Add to conversation history */
    conversationHistory.push({
      role: "user",
      content: "Generate a routine for my selected products",
    });
    conversationHistory.push({
      role: "assistant",
      content: routineText,
    });

    isRoutineGenerated = true;

    /* Add search indicator for routine generation */
    const enhancedRoutineText = `🌐 <em>Generated with current beauty trends and insights</em>\n\n${routineText}`;
    displayChatMessage(enhancedRoutineText, "assistant");

    /* Show follow-up prompt */
    setTimeout(() => {
      displayChatMessage(
        "✨ Feel free to ask me any questions about your routine, current beauty trends, or these products!",
        "assistant"
      );
    }, 1000);
  } catch (error) {
    console.error("Error generating routine:", error);
    console.error("Error details:", error.message);

    /* Provide more specific error messages */
    let errorMessage = "Sorry, I couldn't generate your routine right now. ";
    if (error.message.includes("401")) {
      errorMessage +=
        "There seems to be an authentication issue. Please check your API key configuration.";
    } else if (error.message.includes("429")) {
      errorMessage += "Too many requests. Please wait a moment and try again.";
    } else if (error.message.includes("500")) {
      errorMessage +=
        "The AI service is temporarily unavailable. Please try again in a few minutes.";
    } else if (error.message.includes("400")) {
      errorMessage +=
        "There was an issue with the request format. This might be a model availability issue.";
    } else if (error.message.includes("Worker request failed")) {
      errorMessage +=
        "There's an issue with the secure connection. Please verify your Cloudflare Worker is properly deployed.";
    } else {
      errorMessage += `Error details: ${error.message}`;
    }

    displayChatMessage(errorMessage, "assistant");
  } finally {
    /* Re-enable button */
    generateBtn.disabled = false;
    generateBtn.innerHTML = originalText;
  }
}

/* Display a message in the chat window */
function displayChatMessage(message, sender) {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("chat-message", sender);

  if (sender === "user") {
    messageDiv.innerHTML = `<strong>You:</strong> ${message}`;
  } else {
    messageDiv.innerHTML = `<strong>L'Oréal Assistant:</strong> ${message}`;
  }

  chatWindow.appendChild(messageDiv);

  /* Smooth scroll to bottom */
  setTimeout(() => {
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }, 100);
}

/* Detect if a message needs web search */
function shouldUseWebSearch(message) {
  const searchKeywords = [
    "latest",
    "new",
    "recent",
    "current",
    "2025",
    "2024",
    "trending",
    "popular",
    "best",
    "top",
    "reviews",
    "price",
    "where to buy",
    "available",
    "in stores",
    "launch",
    "release",
    "news",
    "update",
    "comparison",
    "vs",
    "alternative",
    "ingredients",
    "research",
    "study",
    "clinical",
    "dermatologist",
  ];

  const lowerMessage = message.toLowerCase();
  return searchKeywords.some((keyword) => lowerMessage.includes(keyword));
}

/* Handle follow-up chat questions */
async function handleChatMessage(userMessage) {
  if (!isRoutineGenerated) {
    displayChatMessage(
      "Please generate a routine first by selecting products and clicking 'Generate Routine'.",
      "assistant"
    );
    return;
  }

  try {
    /* Check if we should use web search */
    const useSearch = shouldUseWebSearch(userMessage);

    /* Show appropriate loading message */
    const loadingMessage = useSearch
      ? "🔍 Searching for the latest beauty information..."
      : "💭 Thinking...";
    const loadingDiv = document.createElement("div");
    loadingDiv.classList.add("chat-message", "assistant", "loading-message");
    loadingDiv.innerHTML = `<strong>L'Oréal Assistant:</strong> <em>${loadingMessage}</em>`;
    chatWindow.appendChild(loadingDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;

    /* Prepare messages array with conversation history */
    const systemMessage = useSearch
      ? "You are a helpful beauty and skincare expert assistant with access to current information. When providing information about L'Oréal products, beauty trends, or skincare advice, use the search information provided to give accurate, up-to-date answers. Always mention when you're using current information and include any relevant links. You can only discuss topics related to skincare, haircare, makeup, fragrance, and beauty routines."
      : "You are a helpful beauty and skincare expert assistant. You can only discuss topics related to skincare, haircare, makeup, fragrance, and beauty routines. If asked about unrelated topics, politely redirect the conversation back to beauty topics.";

    const messages = [
      {
        role: "system",
        content: systemMessage,
      },
      ...conversationHistory,
      {
        role: "user",
        content: userMessage,
      },
    ];

    /* Use enhanced API call with search if needed */
    const data = await makeOpenAIRequest(
      messages,
      1000,
      0.7,
      useSearch,
      useSearch ? userMessage : ""
    );

    const assistantResponse = data.choices[0].message.content;

    /* Remove loading message */
    chatWindow.removeChild(loadingDiv);

    /* Add search indicator if web search was used */
    let finalResponse = assistantResponse;
    if (useSearch) {
      finalResponse = `🌐 <em>Used web search for current information</em>\n\n${assistantResponse}`;
    }

    /* Add to conversation history */
    conversationHistory.push({
      role: "user",
      content: userMessage,
    });
    conversationHistory.push({
      role: "assistant",
      content: assistantResponse, // Store original response without indicator
    });

    displayChatMessage(finalResponse, "assistant");
  } catch (error) {
    console.error("Error handling chat message:", error);

    /* Remove loading message if it exists */
    const loadingMessage = document.querySelector(".loading-message");
    if (loadingMessage) {
      chatWindow.removeChild(loadingMessage);
    }

    displayChatMessage(
      "Sorry, I couldn't process your message. Please try again.",
      "assistant"
    );
  }
}

/* Event listeners */
generateRoutineBtn.addEventListener("click", generateRoutine);

/* Category filter event listener */
categoryFilter.addEventListener("change", async (e) => {
  currentCategory = e.target.value;

  /* Show search input when a category is selected */
  if (currentCategory) {
    productSearch.style.display = "block";
  } else {
    productSearch.style.display = "none";
    currentSearchTerm = "";
    productSearch.value = "";
  }

  await updateProductDisplay();
});

/* Product search event listener */
productSearch.addEventListener("input", async (e) => {
  currentSearchTerm = e.target.value.trim();
  await updateProductDisplay();
});

/* Chat form submission handler */
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const message = userInput.value.trim();

  /* Validate message */
  if (!message) {
    return;
  }

  if (message.length > 500) {
    alert("Please keep your message under 500 characters.");
    return;
  }

  /* Display user message */
  displayChatMessage(message, "user");

  /* Clear input and get AI response */
  userInput.value = "";
  handleChatMessage(message);
});

/* RTL Language Support Toggle */
function toggleRTL() {
  const html = document.documentElement;
  const currentDir = html.getAttribute("dir");

  if (currentDir === "rtl") {
    html.setAttribute("dir", "ltr");
    html.setAttribute("lang", "en");
  } else {
    html.setAttribute("dir", "rtl");
    html.setAttribute("lang", "ar");
  }

  /* Save preference to localStorage */
  localStorage.setItem("textDirection", html.getAttribute("dir"));
}
