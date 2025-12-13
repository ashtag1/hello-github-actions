/**
 * models.js - Data Models for Beauty Inventory
 *
 * This file defines the structure of our data.
 * Think of it as a "blueprint" for what a product looks like.
 */

// ================================
// Category Definitions
// ================================

const CATEGORIES = {
    skincare: {
        id: 'skincare',
        name: 'Skincare',
        fileName: 'skincare_inventory.xlsx'
    },
    makeup: {
        id: 'makeup',
        name: 'Makeup',
        fileName: 'makeup_inventory.xlsx'
    },
    haircare: {
        id: 'haircare',
        name: 'Hair Care',
        fileName: 'hair_care_inventory.xlsx'
    },
    nail_polish: {
        id: 'nail_polish',
        name: 'Nail Polish',
        fileName: 'nail_polish_inventory.xlsx'
    }
};

// ================================
// Storage Locations
// ================================

const STORAGE_LOCATIONS = [
    'Drawers between sinks',
    'On top of dresser',
    "Under user's sink",
    "Under Bobby's sink",
    'Blue hutch in closet',
    'Basket under sinks'
];

// ================================
// Product Model
// ================================

/**
 * Creates a new product object with all required fields.
 *
 * @param {Object} data - Raw data (from Excel or manual entry)
 * @param {string} category - Product category (skincare, makeup, etc.)
 * @returns {Object} - Formatted product object
 */
function createProduct(data, category) {
    // Generate a unique ID if one doesn't exist
    const id = data.id || generateId();

    // Base product structure (all categories have these)
    const product = {
        id: id,
        category: category,

        // Core fields from Excel
        brand: cleanString(data.brand || data.Brand || ''),
        productName: cleanString(data.productName || data['Product Name'] || ''),
        productType: cleanString(data.productType || data['Product Type'] || ''),
        size: cleanString(data.size || data.Size || ''),
        quantity: parseNumber(data.quantity || data.Quantity, 1),
        barcode: cleanString(data.barcode || data['Barcode/UPC'] || data.Barcode || data.UPC || ''),
        storageLocation: cleanString(data.storageLocation || data['Storage Location'] || ''),
        expirationDate: parseDate(data.expirationDate || data['Expiration Date']),
        notes: cleanString(data.notes || data.Notes || ''),

        // Metadata
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    // Category-specific fields
    if (category === 'makeup') {
        product.shade = cleanString(data.shade || data['Shade/Color'] || '');
    }

    if (category === 'nail_polish') {
        product.colorName = cleanString(data.colorName || data['Color Name'] || '');
        product.colorFamily = cleanString(data.colorFamily || data['Color Family'] || '');
        product.finish = cleanString(data.finish || data.Finish || '');
    }

    return product;
}

// ================================
// Helper Functions
// ================================

/**
 * Generates a unique ID for new products.
 * Uses timestamp + random string for uniqueness.
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

/**
 * Cleans and trims string values.
 * Handles null, undefined, and non-string values.
 */
function cleanString(value) {
    if (value === null || value === undefined) return '';
    return String(value).trim();
}

/**
 * Parses a number from various formats.
 * Returns default value if parsing fails.
 */
function parseNumber(value, defaultValue = 0) {
    if (value === null || value === undefined || value === '') {
        return defaultValue;
    }
    const num = parseInt(value, 10);
    return isNaN(num) ? defaultValue : num;
}

/**
 * Parses dates from Excel or string format.
 * Excel stores dates as numbers (days since 1900-01-01).
 */
function parseDate(value) {
    if (!value) return null;

    // If it's already a valid date string
    if (typeof value === 'string') {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0]; // YYYY-MM-DD format
        }
    }

    // If it's an Excel date number
    if (typeof value === 'number') {
        // Excel dates start from 1900-01-01, but there's a leap year bug
        const excelEpoch = new Date(1899, 11, 30);
        const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
        return date.toISOString().split('T')[0];
    }

    return null;
}

/**
 * Checks if a product is low on stock (quantity = 1).
 */
function isLowStock(product) {
    return product.quantity <= 1;
}

/**
 * Checks if a product is expiring soon (within 30 days).
 */
function isExpiringSoon(product) {
    if (!product.expirationDate) return false;

    const expDate = new Date(product.expirationDate);
    const today = new Date();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;

    return (expDate.getTime() - today.getTime()) <= thirtyDays;
}

/**
 * Checks if a product is expired.
 */
function isExpired(product) {
    if (!product.expirationDate) return false;

    const expDate = new Date(product.expirationDate);
    const today = new Date();

    return expDate < today;
}

// ================================
// Search & Filter Helpers
// ================================

/**
 * Checks if a product matches a search query.
 * Searches brand, name, and barcode.
 */
function matchesSearch(product, query) {
    if (!query) return true;

    const lowerQuery = query.toLowerCase();
    return (
        product.brand.toLowerCase().includes(lowerQuery) ||
        product.productName.toLowerCase().includes(lowerQuery) ||
        product.barcode.includes(query)
    );
}

/**
 * Filters products by category.
 */
function filterByCategory(products, category) {
    if (!category || category === 'all') return products;
    return products.filter(p => p.category === category);
}

// Export for use in other files (works in browser)
window.Models = {
    CATEGORIES,
    STORAGE_LOCATIONS,
    createProduct,
    generateId,
    isLowStock,
    isExpiringSoon,
    isExpired,
    matchesSearch,
    filterByCategory
};
