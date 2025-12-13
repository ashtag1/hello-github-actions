/**
 * database.js - IndexedDB Storage Layer
 *
 * IndexedDB is a browser database that stores data locally.
 * It's like a mini database right in your browser!
 *
 * Key concepts:
 * - Database: Container for all data (like a folder)
 * - Object Store: A table (like a spreadsheet)
 * - Index: Allows fast searching on specific fields
 * - Transaction: Groups operations together
 */

const DB_NAME = 'BeautyInventoryDB';
const DB_VERSION = 1;
const STORE_NAME = 'products';

let db = null;

// ================================
// Database Initialization
// ================================

/**
 * Opens (or creates) the database.
 * This is called once when the app starts.
 *
 * Returns a Promise that resolves when the DB is ready.
 */
function initDatabase() {
    return new Promise((resolve, reject) => {
        console.log('Opening database...');

        // Open a connection to the database
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        // Called if the database needs to be created or upgraded
        request.onupgradeneeded = (event) => {
            console.log('Creating/upgrading database schema...');
            const database = event.target.result;

            // Create the products store if it doesn't exist
            if (!database.objectStoreNames.contains(STORE_NAME)) {
                // 'keyPath' is like the primary key - each product needs a unique 'id'
                const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });

                // Create indexes for fast searching
                // Think of indexes like the index in a book - helps find things quickly
                store.createIndex('category', 'category', { unique: false });
                store.createIndex('brand', 'brand', { unique: false });
                store.createIndex('barcode', 'barcode', { unique: false });
                store.createIndex('storageLocation', 'storageLocation', { unique: false });

                console.log('Database schema created!');
            }
        };

        // Called when the database opens successfully
        request.onsuccess = (event) => {
            db = event.target.result;
            console.log('Database opened successfully!');
            resolve(db);
        };

        // Called if there's an error
        request.onerror = (event) => {
            console.error('Database error:', event.target.error);
            reject(event.target.error);
        };
    });
}

// ================================
// CRUD Operations
// ================================

/**
 * Adds a single product to the database.
 *
 * @param {Object} product - The product to add
 * @returns {Promise} - Resolves with the product ID
 */
function addProduct(product) {
    return new Promise((resolve, reject) => {
        // Start a transaction (like beginning a database operation)
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        const request = store.add(product);

        request.onsuccess = () => {
            console.log(`Added product: ${product.brand} - ${product.productName}`);
            resolve(product.id);
        };

        request.onerror = (event) => {
            // If error is due to duplicate key, try updating instead
            if (event.target.error.name === 'ConstraintError') {
                console.log(`Product already exists, updating: ${product.id}`);
                resolve(updateProduct(product));
            } else {
                reject(event.target.error);
            }
        };
    });
}

/**
 * Adds multiple products at once (bulk import).
 * Much faster than adding one at a time!
 *
 * @param {Array} products - Array of products to add
 * @returns {Promise} - Resolves when all products are added
 */
function addProducts(products) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        let addedCount = 0;
        let updatedCount = 0;

        products.forEach(product => {
            const request = store.put(product); // 'put' adds or updates

            request.onsuccess = () => {
                addedCount++;
            };
        });

        transaction.oncomplete = () => {
            console.log(`Bulk import complete: ${addedCount} products`);
            resolve({ added: addedCount });
        };

        transaction.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

/**
 * Gets a single product by ID.
 *
 * @param {string} id - The product ID
 * @returns {Promise} - Resolves with the product or undefined
 */
function getProduct(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);

        const request = store.get(id);

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

/**
 * Gets all products from the database.
 *
 * @returns {Promise} - Resolves with array of all products
 */
function getAllProducts() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);

        const request = store.getAll();

        request.onsuccess = () => {
            resolve(request.result || []);
        };

        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

/**
 * Gets products by category using the index.
 *
 * @param {string} category - The category to filter by
 * @returns {Promise} - Resolves with array of products in that category
 */
function getProductsByCategory(category) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index('category');

        const request = index.getAll(category);

        request.onsuccess = () => {
            resolve(request.result || []);
        };

        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

/**
 * Gets a product by barcode.
 *
 * @param {string} barcode - The barcode to search for
 * @returns {Promise} - Resolves with the product or undefined
 */
function getProductByBarcode(barcode) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index('barcode');

        const request = index.get(barcode);

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

/**
 * Updates an existing product.
 *
 * @param {Object} product - The product with updated fields
 * @returns {Promise} - Resolves when update is complete
 */
function updateProduct(product) {
    return new Promise((resolve, reject) => {
        // Update the timestamp
        product.updatedAt = new Date().toISOString();

        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        const request = store.put(product);

        request.onsuccess = () => {
            console.log(`Updated product: ${product.brand} - ${product.productName}`);
            resolve(product.id);
        };

        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

/**
 * Deletes a product by ID.
 *
 * @param {string} id - The product ID to delete
 * @returns {Promise} - Resolves when deletion is complete
 */
function deleteProduct(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        const request = store.delete(id);

        request.onsuccess = () => {
            console.log(`Deleted product: ${id}`);
            resolve(id);
        };

        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

/**
 * Clears all products from the database.
 * Use with caution!
 *
 * @returns {Promise} - Resolves when clear is complete
 */
function clearAllProducts() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        const request = store.clear();

        request.onsuccess = () => {
            console.log('All products cleared!');
            resolve();
        };

        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

// ================================
// Statistics
// ================================

/**
 * Gets count of products by category.
 *
 * @returns {Promise} - Resolves with object of category counts
 */
async function getProductCounts() {
    const products = await getAllProducts();

    const counts = {
        total: products.length,
        byCategory: {},
        lowStock: 0,
        expiringSoon: 0
    };

    products.forEach(product => {
        // Count by category
        counts.byCategory[product.category] = (counts.byCategory[product.category] || 0) + 1;

        // Count low stock
        if (Models.isLowStock(product)) {
            counts.lowStock++;
        }

        // Count expiring soon
        if (Models.isExpiringSoon(product)) {
            counts.expiringSoon++;
        }
    });

    return counts;
}

// ================================
// Export for use in other files
// ================================

window.Database = {
    init: initDatabase,
    add: addProduct,
    addBulk: addProducts,
    get: getProduct,
    getAll: getAllProducts,
    getByCategory: getProductsByCategory,
    getByBarcode: getProductByBarcode,
    update: updateProduct,
    delete: deleteProduct,
    clear: clearAllProducts,
    getCounts: getProductCounts
};
