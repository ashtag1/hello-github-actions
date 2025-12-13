/**
 * excel-import.js - Excel File Import Handler
 *
 * Uses SheetJS (XLSX) library to read Excel files.
 * SheetJS converts Excel data into JavaScript arrays/objects.
 *
 * Flow:
 * 1. User selects Excel file(s)
 * 2. We read the file as binary
 * 3. SheetJS parses it into rows
 * 4. We convert rows into our Product format
 * 5. Products are saved to IndexedDB
 */

// ================================
// File Name to Category Mapping
// ================================

/**
 * Determines the category based on the filename.
 * This matches your existing file naming convention.
 */
function getCategoryFromFilename(filename) {
    const lowerName = filename.toLowerCase();

    if (lowerName.includes('skincare')) return 'skincare';
    if (lowerName.includes('makeup')) return 'makeup';
    if (lowerName.includes('hair')) return 'haircare';
    if (lowerName.includes('nail') || lowerName.includes('polish')) return 'nail_polish';

    // Default - ask user or use generic
    console.warn(`Unknown category for file: ${filename}`);
    return 'skincare'; // Default fallback
}

// ================================
// Excel File Processing
// ================================

/**
 * Reads an Excel file and returns the data as an array of objects.
 *
 * @param {File} file - The Excel file from file input
 * @returns {Promise<Array>} - Array of row objects
 */
function readExcelFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                // Parse the Excel file
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                // Get the first sheet (most Excel files have one sheet)
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                // Convert to array of objects (header row becomes keys)
                // { header: 1 } would give array of arrays instead
                const rows = XLSX.utils.sheet_to_json(worksheet, {
                    defval: '' // Default value for empty cells
                });

                console.log(`Read ${rows.length} rows from ${file.name}`);
                resolve(rows);

            } catch (error) {
                console.error(`Error parsing ${file.name}:`, error);
                reject(error);
            }
        };

        reader.onerror = (error) => {
            reject(error);
        };

        // Read file as ArrayBuffer (binary data)
        reader.readAsArrayBuffer(file);
    });
}

/**
 * Processes an Excel file and imports products into the database.
 *
 * @param {File} file - The Excel file to import
 * @returns {Promise<Object>} - Import results { count, category }
 */
async function importExcelFile(file) {
    // Determine category from filename
    const category = getCategoryFromFilename(file.name);
    console.log(`Importing ${file.name} as category: ${category}`);

    // Read the Excel file
    const rows = await readExcelFile(file);

    // Convert each row to a Product
    const products = rows.map(row => {
        return Models.createProduct(row, category);
    });

    // Check for duplicates before adding
    const existingProducts = await Database.getByCategory(category);
    const existingBarcodes = new Set(existingProducts.map(p => p.barcode).filter(b => b));

    // Filter out exact duplicates (same barcode)
    const newProducts = products.filter(product => {
        if (!product.barcode) return true; // No barcode, can't check duplicate
        if (existingBarcodes.has(product.barcode)) {
            console.log(`Skipping duplicate: ${product.brand} - ${product.productName}`);
            return false;
        }
        return true;
    });

    // Add to database
    await Database.addBulk(products); // Using all products with 'put' which updates duplicates

    return {
        fileName: file.name,
        category: category,
        totalRows: rows.length,
        imported: products.length
    };
}

/**
 * Imports multiple Excel files at once.
 *
 * @param {FileList} files - Files from file input
 * @returns {Promise<Array>} - Array of import results
 */
async function importMultipleFiles(files) {
    const results = [];

    for (const file of files) {
        try {
            const result = await importExcelFile(file);
            results.push(result);
        } catch (error) {
            results.push({
                fileName: file.name,
                error: error.message
            });
        }
    }

    return results;
}

// ================================
// Export Functionality (for later)
// ================================

/**
 * Exports products to Excel format.
 * We'll implement this fully in a later phase!
 *
 * @param {Array} products - Products to export
 * @param {string} filename - Output filename
 */
function exportToExcel(products, filename = 'beauty_inventory.xlsx') {
    // Group products by category for separate sheets
    const byCategory = {};
    products.forEach(product => {
        if (!byCategory[product.category]) {
            byCategory[product.category] = [];
        }
        byCategory[product.category].push(product);
    });

    // Create workbook with multiple sheets
    const workbook = XLSX.utils.book_new();

    Object.keys(byCategory).forEach(category => {
        const categoryProducts = byCategory[category];

        // Convert to Excel-friendly format (rename keys to match original headers)
        const excelData = categoryProducts.map(p => ({
            'Brand': p.brand,
            'Product Name': p.productName,
            'Product Type': p.productType,
            'Size': p.size,
            'Quantity': p.quantity,
            'Barcode/UPC': p.barcode,
            'Storage Location': p.storageLocation,
            'Expiration Date': p.expirationDate || '',
            'Notes': p.notes,
            // Category-specific
            ...(p.shade && { 'Shade/Color': p.shade }),
            ...(p.colorName && { 'Color Name': p.colorName }),
            ...(p.colorFamily && { 'Color Family': p.colorFamily }),
            ...(p.finish && { 'Finish': p.finish })
        }));

        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const sheetName = Models.CATEGORIES[category]?.name || category;
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });

    // Trigger download
    XLSX.writeFile(workbook, filename);
}

// ================================
// Export for use in other files
// ================================

window.ExcelImport = {
    importFile: importExcelFile,
    importMultiple: importMultipleFiles,
    export: exportToExcel,
    getCategoryFromFilename
};
