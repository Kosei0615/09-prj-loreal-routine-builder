# L'Oréal Smart Routine & Product Advisor

A sophisticated web application that helps users discover L'Oréal products and generate personalized beauty routines using AI technology.

## 🌟 Features

### Core Functionality

- **Product Selection**: Click on products to select/unselect them with visual feedback
- **Product Categories**: Browse products by category (skincare, makeup, haircare, etc.)
- **Product Descriptions**: Reveal detailed product descriptions with a toggle button
- **Selected Products Management**: View, remove, and clear selected products
- **AI-Powered Routine Generation**: Generate personalized routines using OpenAI API
- **Interactive Chat**: Ask follow-up questions about your routine
- **Persistent Storage**: Selected products are saved using localStorage

### LevelUp Features (Bonus)

- **Product Search**: Real-time search functionality to filter products by name or keyword
- **RTL Language Support**: Complete right-to-left language layout support
- **Responsive Design**: Works seamlessly on mobile and desktop devices

## 🎨 Design Features

- **L'Oréal Brand Colors**: Uses official brand colors (#ff003b and #e3a535)
- **Modern UI**: Clean, sophisticated design with smooth animations
- **Accessibility**: Proper ARIA labels and keyboard navigation support
- **Visual Feedback**: Clear selection states and hover effects

## 🚀 Getting Started

### Prerequisites

- OpenAI API key
- Cloudflare account (recommended for secure API handling)

### Setup

1. **Clone or download the project files**

2. **Set up Cloudflare Worker** (recommended):

   - Follow instructions in `DEPLOYMENT.md` to deploy the worker
   - Update `WORKER_URL` constant in `script.js` with your worker URL

3. **Alternative: Direct API usage** (not recommended for production):

   - Keep your OpenAI API key in `secrets.js`
   - Update the API calls in `script.js` to use direct OpenAI endpoints

4. **Open `index.html`** in a web browser

## 📁 Project Structure

```
├── index.html          # Main HTML structure
├── style.css           # Styling with L'Oréal branding
├── script.js           # Main application logic
├── products.json       # L'Oréal product database
├── secrets.js          # API key (for local development only)
├── worker.js           # Cloudflare Worker for secure API handling
├── DEPLOYMENT.md       # Deployment instructions
└── img/
    └── loreal-logo.png # L'Oréal logo
```

## 🔧 Technical Implementation

### Product Selection System

- Visual selection feedback with borders and checkmarks
- LocalStorage persistence for selected products
- Dynamic updates to selected products list

### AI Integration

- Secure API key handling through Cloudflare Workers
- Conversation history maintenance
- Beauty-focused prompt engineering

### Search & Filter System

- Real-time product filtering by category and search terms
- Debounced search input for performance
- Combined filter logic for category + search

### RTL Language Support

- Complete layout mirroring for right-to-left languages
- Text direction adjustments
- Preserved functionality in RTL mode

## 🎯 User Experience

1. **Discovery**: Users browse products by category
2. **Search**: Filter products using the search functionality
3. **Selection**: Click products to add them to their routine
4. **Routine Generation**: AI creates a personalized routine
5. **Interaction**: Users can ask follow-up questions
6. **Persistence**: Selections are remembered across sessions

## 🔒 Security Features

- API keys stored securely in Cloudflare Workers
- CORS handling for cross-origin requests
- Input validation and error handling

## 📱 Responsive Design

- Mobile-first approach
- Flexible grid layouts
- Touch-friendly interface elements
- Optimized for various screen sizes

## 🌐 Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- JavaScript ES6+ features
- CSS Grid and Flexbox layouts

## 🛠️ Development

### Adding New Products

Edit `products.json` to add new L'Oréal products with the following structure:

```json
{
  "id": 36,
  "brand": "Brand Name",
  "name": "Product Name",
  "category": "category",
  "image": "image-url",
  "description": "Product description"
}
```

### Customizing Styles

The design uses CSS custom properties and can be easily customized:

- L'Oréal brand colors are defined in CSS variables
- Responsive breakpoints in media queries
- Modular CSS architecture

## 📈 Performance

- Lazy loading of product data
- Efficient DOM manipulation
- Optimized image loading
- Debounced search input

## 🎓 Educational Value

This project demonstrates:

- Modern JavaScript ES6+ features
- Responsive web design principles
- API integration best practices
- User experience design
- Accessibility considerations
- Security-first development

## 📝 License

This project is for educational purposes. L'Oréal branding and product data are used for demonstration only.oject 9: L'Oréal Routine Builder
L’Oréal is expanding what’s possible with AI, and now your chatbot is getting smarter. This week, you’ll upgrade it into a product-aware routine builder.

Users will be able to browse real L’Oréal brand products, select the ones they want, and generate a personalized routine using AI. They can also ask follow-up questions about their routine—just like chatting with a real advisor.
