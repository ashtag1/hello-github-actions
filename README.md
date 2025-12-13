# Beauty Inventory App

A local-first web app to manage your personal beauty product inventory across multiple categories.

## Features (Phase 1)

- **View products** by category (Skincare, Makeup, Hair Care, Nail Polish)
- **Import Excel files** matching your existing inventory spreadsheets
- **Local storage** using IndexedDB (data stays on your device)
- **Category color coding** for easy visual identification
- **Low stock alerts** for products with quantity = 1

## Quick Start

1. Open `index.html` in your browser
2. Click "Import Excel" to load your inventory files
3. Use the category tabs to filter products

### Testing Without Excel Files

Open the browser console (F12) and run:
```javascript
loadSampleData()
```

To clear all data:
```javascript
clearAllData()
```

## File Structure

```
├── index.html          # Main HTML page
├── css/
│   └── styles.css      # Styling with CSS variables
└── js/
    ├── models.js       # Data models & helper functions
    ├── database.js     # IndexedDB storage layer
    ├── excel-import.js # Excel file parsing
    ├── app.js          # Main application logic
    └── sample-data.js  # Sample data for testing
```

## Excel File Format

Your Excel files should have these columns:
- Brand
- Product Name
- Product Type
- Size
- Quantity
- Barcode/UPC
- Storage Location
- Expiration Date
- Notes

### Category-Specific Columns

**Makeup:**
- Shade/Color

**Nail Polish:**
- Color Name
- Color Family
- Finish

## Upcoming Phases

- **Phase 2:** Add/Edit/Delete products manually
- **Phase 3:** Search & filter functionality
- **Phase 4:** Low stock & expiration alerts
- **Phase 5:** Barcode scanning
- **Phase 6:** Progressive Web App (installable on iPhone)

## Technologies Used

- Vanilla JavaScript (no frameworks - easier to learn!)
- IndexedDB for local storage
- SheetJS for Excel file parsing
- CSS Variables for theming
