/**
 * app.js - Main Application Controller
 *
 * This file ties everything together:
 * - Initializes the database
 * - Handles user interactions (clicks, file selection)
 * - Renders the UI
 * - Manages application state
 */

// ================================
// Application State
// ================================

const AppState = {
    currentCategory: 'all',
    products: [],
    isLoading: false
};

// ================================
// DOM Elements
// ================================

// We'll grab these after the page loads
let elements = {};

// ================================
// Initialization
// ================================

/**
 * Called when the page finishes loading.
 * Sets up the app and loads any existing data.
 */
async function initApp() {
    console.log('Initializing Beauty Inventory App...');

    // Cache DOM elements for quick access
    elements = {
        importBtn: document.getElementById('import-btn'),
        fileInput: document.getElementById('file-input'),
        productList: document.getElementById('product-list'),
        productCount: document.getElementById('product-count'),
        lowStockCount: document.getElementById('low-stock-count'),
        tabs: document.querySelectorAll('.tab')
    };

    // Initialize the database
    try {
        await Database.init();
        console.log('Database ready!');
    } catch (error) {
        console.error('Failed to initialize database:', error);
        showError('Failed to initialize database. Please refresh the page.');
        return;
    }

    // Set up event listeners
    setupEventListeners();

    // Load and display existing products
    await loadProducts();

    console.log('App initialized successfully!');
}

// ================================
// Event Listeners
// ================================

function setupEventListeners() {
    // Import button click -> trigger file input
    elements.importBtn.addEventListener('click', () => {
        elements.fileInput.click();
    });

    // File selection -> import Excel files
    elements.fileInput.addEventListener('change', handleFileSelect);

    // Category tabs -> filter products
    elements.tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const category = tab.dataset.category;
            setActiveCategory(category);
        });
    });
}

// ================================
// File Import Handling
// ================================

/**
 * Handles when user selects Excel files to import.
 */
async function handleFileSelect(event) {
    const files = event.target.files;
    if (!files.length) return;

    showStatus('Importing files...');

    try {
        const results = await ExcelImport.importMultiple(files);

        // Show results
        let totalImported = 0;
        results.forEach(result => {
            if (result.error) {
                console.error(`Failed to import ${result.fileName}: ${result.error}`);
            } else {
                totalImported += result.imported;
                console.log(`Imported ${result.imported} products from ${result.fileName}`);
            }
        });

        showStatus(`Imported ${totalImported} products!`, 2000);

        // Reload the product list
        await loadProducts();

    } catch (error) {
        console.error('Import failed:', error);
        showStatus('Import failed. Check console for details.', 3000);
    }

    // Clear the file input so the same file can be selected again
    event.target.value = '';
}

// ================================
// Product Loading & Display
// ================================

/**
 * Loads products from database and renders them.
 */
async function loadProducts() {
    AppState.isLoading = true;
    renderLoading();

    try {
        // Get all products
        AppState.products = await Database.getAll();

        // Update counts
        await updateStats();

        // Render the current view
        renderProducts();

    } catch (error) {
        console.error('Failed to load products:', error);
        showError('Failed to load products.');
    }

    AppState.isLoading = false;
}

/**
 * Updates the stats bar with current counts.
 */
async function updateStats() {
    const counts = await Database.getCounts();

    elements.productCount.textContent = `${counts.total} products`;

    if (counts.lowStock > 0) {
        elements.lowStockCount.textContent = `${counts.lowStock} low stock`;
        elements.lowStockCount.classList.remove('hidden');
    } else {
        elements.lowStockCount.classList.add('hidden');
    }
}

// ================================
// Category Filtering
// ================================

/**
 * Sets the active category and re-renders products.
 */
function setActiveCategory(category) {
    AppState.currentCategory = category;

    // Update tab styles
    elements.tabs.forEach(tab => {
        if (tab.dataset.category === category) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });

    // Re-render products
    renderProducts();
}

// ================================
// Rendering Functions
// ================================

/**
 * Renders the product list based on current filter.
 */
function renderProducts() {
    // Filter products by category
    let filtered = AppState.products;
    if (AppState.currentCategory !== 'all') {
        filtered = Models.filterByCategory(filtered, AppState.currentCategory);
    }

    // Sort by brand, then name
    filtered.sort((a, b) => {
        const brandCompare = a.brand.localeCompare(b.brand);
        if (brandCompare !== 0) return brandCompare;
        return a.productName.localeCompare(b.productName);
    });

    // Clear current list
    elements.productList.innerHTML = '';

    // Show empty state if no products
    if (filtered.length === 0) {
        elements.productList.innerHTML = `
            <div class="empty-state">
                <p>No products found!</p>
                <p>${AppState.currentCategory === 'all'
                    ? 'Import your Excel files to get started.'
                    : 'Try selecting a different category.'}</p>
            </div>
        `;
        return;
    }

    // Render each product
    filtered.forEach(product => {
        const card = createProductCard(product);
        elements.productList.appendChild(card);
    });
}

/**
 * Creates a product card element.
 *
 * @param {Object} product - The product to display
 * @returns {HTMLElement} - The card element
 */
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.category = product.category;
    card.dataset.id = product.id;

    // Build details based on what's available
    const details = [];

    // Quantity (with low stock warning)
    const qtyClass = Models.isLowStock(product) ? 'quantity low' : 'quantity';
    details.push(`<span class="detail-item"><span class="${qtyClass}">Qty: ${product.quantity}</span></span>`);

    // Size
    if (product.size) {
        details.push(`<span class="detail-item">${product.size}</span>`);
    }

    // Location
    if (product.storageLocation) {
        details.push(`<span class="detail-item"><span class="location">${product.storageLocation}</span></span>`);
    }

    // Color info for nail polish/makeup
    if (product.colorName) {
        details.push(`<span class="detail-item">${product.colorName}</span>`);
    }
    if (product.shade) {
        details.push(`<span class="detail-item">${product.shade}</span>`);
    }

    // Product type
    if (product.productType) {
        details.push(`<span class="detail-item">${product.productType}</span>`);
    }

    card.innerHTML = `
        <div class="brand">${escapeHtml(product.brand)}</div>
        <div class="name">${escapeHtml(product.productName)}</div>
        <div class="details">
            ${details.join('')}
        </div>
    `;

    return card;
}

/**
 * Shows loading state in product list.
 */
function renderLoading() {
    elements.productList.innerHTML = `
        <div class="loading">Loading products...</div>
    `;
}

// ================================
// UI Helpers
// ================================

/**
 * Shows a temporary status message.
 *
 * @param {string} message - Message to show
 * @param {number} duration - How long to show (ms), 0 = permanent
 */
function showStatus(message, duration = 0) {
    // Remove existing status
    const existing = document.querySelector('.import-status');
    if (existing) existing.remove();

    // Create new status
    const status = document.createElement('div');
    status.className = 'import-status';
    status.textContent = message;
    document.body.appendChild(status);

    // Auto-remove after duration
    if (duration > 0) {
        setTimeout(() => status.remove(), duration);
    }
}

/**
 * Shows an error message.
 */
function showError(message) {
    showStatus(`Error: ${message}`, 5000);
}

/**
 * Escapes HTML to prevent XSS attacks.
 * Always use this when displaying user data!
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ================================
// Start the App!
// ================================

// Wait for DOM to be ready, then initialize
document.addEventListener('DOMContentLoaded', initApp);

// Export for debugging in console
window.App = {
    state: AppState,
    loadProducts,
    setActiveCategory
};
