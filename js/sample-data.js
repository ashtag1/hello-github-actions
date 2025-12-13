/**
 * sample-data.js - Sample Data for Testing
 *
 * This file contains sample products you can load to test the app
 * without needing to import Excel files.
 *
 * To use: Open browser console and run: loadSampleData()
 */

const SAMPLE_PRODUCTS = [
    // Skincare
    {
        brand: 'CeraVe',
        productName: 'Hydrating Facial Cleanser',
        productType: 'Cleanser',
        size: '16 oz',
        quantity: 2,
        barcode: '301871942',
        storageLocation: 'Under user\'s sink',
        notes: 'Daily use'
    },
    {
        brand: 'Glossier',
        productName: 'Super Pure',
        productType: 'Serum',
        size: '30ml',
        quantity: 1,
        barcode: '',
        storageLocation: 'Drawers between sinks',
        notes: 'Niacinamide + Zinc'
    },
    {
        brand: 'COSRX',
        productName: 'Snail Mucin 96% Power Repairing Essence',
        productType: 'Essence',
        size: '100ml',
        quantity: 1,
        barcode: '8809416470016',
        storageLocation: 'Drawers between sinks',
        expirationDate: '2025-06-15',
        notes: 'K-beauty favorite'
    },

    // Makeup
    {
        brand: 'HAUS LABS',
        productName: 'Triclone Skin Tech Foundation',
        productType: 'Foundation',
        size: '30ml',
        quantity: 1,
        barcode: '',
        storageLocation: 'On top of dresser',
        shade: '210 Light Medium Neutral',
        notes: 'Clean beauty'
    },
    {
        brand: 'Rare Beauty',
        productName: 'Soft Pinch Liquid Blush',
        productType: 'Blush',
        size: '7.5ml',
        quantity: 2,
        barcode: '',
        storageLocation: 'On top of dresser',
        shade: 'Joy',
        notes: 'A little goes a long way!'
    },
    {
        brand: 'Glossier',
        productName: 'Boy Brow',
        productType: 'Brow Gel',
        size: '3.12g',
        quantity: 1,
        barcode: '',
        storageLocation: 'On top of dresser',
        shade: 'Brown'
    },

    // Hair Care
    {
        brand: 'Olaplex',
        productName: 'No. 3 Hair Perfector',
        productType: 'Treatment',
        size: '100ml',
        quantity: 1,
        barcode: '896364002350',
        storageLocation: 'Blue hutch in closet',
        notes: 'Use before shampoo'
    },
    {
        brand: 'K18',
        productName: 'Leave-In Molecular Repair Hair Mask',
        productType: 'Treatment',
        size: '50ml',
        quantity: 2,
        barcode: '',
        storageLocation: 'Blue hutch in closet',
        notes: '4 minutes, no rinse'
    },
    {
        brand: 'Color Wow',
        productName: 'Dream Coat Supernatural Spray',
        productType: 'Styling',
        size: '200ml',
        quantity: 1,
        barcode: '5060150185250',
        storageLocation: 'Under Bobby\'s sink'
    },

    // Nail Polish
    {
        brand: 'Holo Taco',
        productName: 'Scattered Holo Taco',
        productType: 'Nail Polish',
        size: '12ml',
        quantity: 1,
        barcode: '',
        storageLocation: 'Basket under sinks',
        colorName: 'Scattered Holo Taco',
        colorFamily: 'Clear/Holo',
        finish: 'Holo'
    },
    {
        brand: 'Essie',
        productName: 'Ballet Slippers',
        productType: 'Nail Polish',
        size: '13.5ml',
        quantity: 2,
        barcode: '095008000021',
        storageLocation: 'Basket under sinks',
        colorName: 'Ballet Slippers',
        colorFamily: 'Pink',
        finish: 'Sheer'
    },
    {
        brand: 'OPI',
        productName: 'Big Apple Red',
        productType: 'Nail Polish',
        size: '15ml',
        quantity: 1,
        barcode: '094100001784',
        storageLocation: 'Basket under sinks',
        colorName: 'Big Apple Red',
        colorFamily: 'Red',
        finish: 'Cream',
        notes: 'Classic red'
    }
];

/**
 * Loads sample data into the database.
 * Call this from the browser console: loadSampleData()
 */
async function loadSampleData() {
    console.log('Loading sample data...');

    // Determine categories and create products
    const categoryMap = {
        'Cleanser': 'skincare',
        'Serum': 'skincare',
        'Essence': 'skincare',
        'Moisturizer': 'skincare',
        'Foundation': 'makeup',
        'Blush': 'makeup',
        'Brow Gel': 'makeup',
        'Lipstick': 'makeup',
        'Treatment': 'haircare',
        'Styling': 'haircare',
        'Shampoo': 'haircare',
        'Conditioner': 'haircare',
        'Nail Polish': 'nail_polish'
    };

    const products = SAMPLE_PRODUCTS.map(data => {
        const category = categoryMap[data.productType] || 'skincare';
        return Models.createProduct(data, category);
    });

    // Add to database
    await Database.addBulk(products);

    // Refresh the UI
    await App.loadProducts();

    console.log(`Loaded ${products.length} sample products!`);
    return products;
}

/**
 * Clears all data and reloads the page.
 * Call this from console: clearAllData()
 */
async function clearAllData() {
    if (confirm('Are you sure you want to delete all products?')) {
        await Database.clear();
        await App.loadProducts();
        console.log('All data cleared!');
    }
}

// Make functions available globally
window.loadSampleData = loadSampleData;
window.clearAllData = clearAllData;
