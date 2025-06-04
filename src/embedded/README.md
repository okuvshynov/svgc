# Embedded JavaScript Modules

This directory contains all JavaScript code that gets **embedded into generated SVG files** and runs in the browser. These modules provide the interactive chart functionality.

## Execution Context

**⚠️ EMBEDDED CONTEXT**: All files in this directory run inside SVG documents in web browsers, not in Node.js.

### Key Constraints
- **No import/export statements**: Module syntax is stripped by `embedded-loader.js`
- **No external dependencies**: All code must be self-contained
- **Browser APIs only**: Access to DOM, SVG elements, and browser events
- **No Node.js APIs**: No file system, path, or other Node.js modules

### Available Global Variables
When embedded, these modules have access to:
- `embeddedData` - The CSV data as JSON
- `currentOptions` - Chart configuration object
- `chartDimensions` - Width, height, and padding values
- `currentChartData` - Generated chart data structure
- `visibleGroups` - Set tracking visible data groups
- `pendingFilters` - Array of pending filter configurations

## Module Overview

### Core Utilities
- **`chart-utils.js`** - Mathematical utilities for chart generation
  - `generateTicks()` - Smart axis tick generation
  - `formatNumber()` - Human-readable number formatting  
  - `generateColors()` - Color palette generation
  - `createSVGElement()` - SVG element creation helper

- **`filter-utils.js`** - Data filtering infrastructure
  - `evaluateFilter()` - Apply filter conditions to data rows
  - `createNewFilter()` - Create new filter objects

### Chart Rendering
- **`render-ui.js`** - Main UI rendering functions
  - `renderUIControls()` - Render the control panel
  - `renderFiltersSection()` - Render filter UI components
  - `renderChart()` - Main chart rendering coordinator
  - `renderChartContent()` - Render the actual chart visualization

- **`ui-components.js`** - UI component creation
  - `createUIGroup()` - Dropdown menus with labels
  - `createValueInput()` - Text input fields
  - `createButton()` - Interactive buttons
  - `createSaveButton()` - Save current view functionality

### Interactive Features
- **`filters.js`** - Filter management
  - `applyFilters()` - Apply filters to dataset
  - `addFilter()` - Add new filter to UI
  - `removeFilter()` - Remove filter from UI
  - `applyPendingFilters()` - Apply all pending filters

- **`interactivity.js`** - Event handling and public API
  - `initializeInteractivity()` - Set up event listeners
  - `setupEventListeners()` - Bind hover/click events
  - `setupPublicAPI()` - Expose global functions
  - `initializeChart()` - Main initialization function

### Chart Implementations

#### `charts/scatter-chart.js`
Scatter plot implementation with:
- Point positioning and scaling
- Grouping and color assignment
- Interactive legend
- Hover effects and tooltips

#### `charts/histogram-chart.js`
Histogram/bar chart implementation with:
- Automatic bin calculation
- Numeric vs categorical detection
- Bar rendering and labeling
- Dynamic bin count adjustment

## Development Guidelines

### Adding New Chart Types
1. Create `charts/[type]-chart.js` with these functions:
   ```javascript
   function generate[Type]Chart(data, options) {
     // Generate chart data structure
   }
   
   function render[Type]Chart(container, chartData, options) {
     // Render SVG elements
   }
   
   function render[Type]Controls(container, x, y, width) {
     // Render chart-specific UI controls
   }
   ```

2. Register in `../svg.js` chart registry:
   ```javascript
   const chartTypes = {
     [type]: {
       generate: generate[Type]Chart,
       render: render[Type]Chart,
       renderControls: render[Type]Controls
     }
   };
   ```

### Adding New Utilities
1. Create new `.js` file in this directory
2. Export functions using standard function declarations
3. Import in `../svg.js` using `loadEmbeddedUtil('[name]')`

### Testing Embedded Code
- Use `../test/embedded-test-helper.js` for mock browser environment
- Import embedded files directly in test files
- Test individual functions with sample data

## File Dependencies

```
interactivity.js
├── filters.js
├── render-ui.js
└── charts/*.js

render-ui.js
├── ui-components.js
├── filters.js
└── charts/*.js

ui-components.js
└── chart-utils.js

charts/*.js
├── chart-utils.js
├── filter-utils.js
└── ui-components.js
```

## Browser Compatibility

All code must work in modern browsers that support:
- ES6+ JavaScript features (arrow functions, const/let, template literals)
- SVG DOM manipulation
- HTML foreignObject elements (for native form controls)
- Modern DOM APIs (querySelector, addEventListener, etc.)

No transpilation is performed - code runs directly in browsers as written.