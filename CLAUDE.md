# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SVGC (SVG Chart Generator) creates interactive, self-contained SVG files with embedded JavaScript for data visualization. The tool converts CSV data into interactive charts that can be viewed offline without external dependencies.

## Key Design Principles

- **Self-contained output**: Generated SVG files contain all data, JavaScript, and styling inline
- **No external dependencies**: Charts work offline and don't require external JS libraries  
- **Dynamic rendering**: Chart generation logic embedded in SVG for runtime interactivity
- **Programmable API**: Exposed JavaScript functions enable live chart manipulation
- **Professional visualization**: Clean axes, grid lines, and human-readable formatting
- **Interactive UI**: Built-in controls for selecting axes, grouping, filtering, and chart options

## Architecture

### Core Components

- **CLI Interface** (`src/cli.js`): Command-line argument parsing and main entry point
- **CSV Parser** (`src/csv.js`): Reads and parses CSV data with type inference
- **SVG Coordinator** (`src/svg.js`): Minimal coordinator that embeds data and JavaScript (71 lines)
- **Embedded Runtime** (`src/embedded/`): All chart rendering logic runs browser-side
- **Generator Utilities** (`src/generators/`): CSS generation only

### Data Flow

1. CLI parses command-line arguments (`-w`, `-h`, input file)
2. CSV parser reads and processes data file
3. SVG builder creates minimal SVG structure with embedded data and JavaScript
4. Browser executes embedded JavaScript to render chart dynamically
5. User interactions (axis changes, filtering, grouping) trigger real-time updates
6. Public API enables programmatic chart manipulation

### Pure Embedded Architecture

The system uses **100% embedded rendering**:
- **No server-side chart generation**: Node.js only creates SVG container
- **All rendering browser-side**: Chart generation happens entirely in the browser
- **Data embedded as JSON**: CSV data converted to JSON and embedded in SVG
- **Self-contained JavaScript**: All chart logic included in the generated SVG
- **Zero external dependencies**: No external JS libraries or resources needed

### Generalized Embedded Module Loading

The system uses a **generalized embedded loader** (`embedded-loader.js`) for clean module management:
- **Unified Loading Pattern**: All embedded modules use `-impl.js` suffix for consistency
- **Module Syntax Stripping**: Automatically removes `export`/`import` statements for SVG embedding
- **Chart-specific Loading**: `loadEmbeddedChart(name)` loads chart implementations from `charts/` subdirectory
- **Utility Loading**: `loadEmbeddedUtil(name)` loads utility implementations from `embedded/` directory
- **Clean Separation**: Node.js modules with ES6 syntax become browser-compatible embedded code
- **Testable Architecture**: Implementation files can be tested directly with mock browser environment

## Development Commands

- **Run the tool**: `node src/cli.js [options] <csv-file>`
- **Scatter plot**: `node src/cli.js -x n_depth -y avg_ts -g model data/qwen30b3a_q3.csv > chart.svg`
- **Histogram**: `node src/cli.js -t histogram -f model data/qwen30b3a_q3.csv > histogram.svg`
- **Numeric histogram**: `node src/cli.js -t histogram -f avg_ts -b 15 data/qwen30b3a_q3.csv > numeric_hist.svg`
- **With dimensions**: `node src/cli.js -w 1024 -h 768 -t scatter -x field1 -y field2 data.csv -o output.svg`
- **Run tests**: `npm test`
- **Install dependencies**: `npm install`

## Chart Types

### Scatter Chart
- X/Y axis field selection with live switching capability
- Optional weight field for circle sizes
- Optional grouping field for colors with interactive legend
- Automatic scaling with smart tick generation (1, 2, 2.5, 5 × 10^k)
- Visual enhancements: tick marks, grid lines, range filtering
- Interactive features: hover highlighting, click to hide/show groups

### Histogram/Bar Chart
- Single field selection for data distribution visualization
- Automatic detection of numeric vs categorical data
- **Numeric histograms**: Configurable bin count with smart defaults (Sturges' rule)
- **Categorical bar charts**: Sorted by frequency with all unique values
- Bin count control for numeric data (3-100 bins)
- Automatic bin labeling with appropriate precision
- Y-axis shows counts with clean tick intervals

### Future Chart Types
- Line charts
- Box plots
- Time series charts

## File Structure

The codebase follows a modular architecture with clear separation of concerns:

```
src/
├── cli.js                            # Command-line interface and main entry point
├── csv.js                            # CSV parsing with automatic type inference
├── svg.js                            # Minimal SVG coordinator (71 lines)
├── embedded/                         # All chart rendering code (browser-side)
│   ├── chart-runtime.js              # Chart framework, registry, and utilities
│   ├── chart-utils-impl.js           # Chart utility functions implementation
│   ├── embedded-loader.js            # Generalized loader for embedded modules
│   ├── filter-utils-impl.js          # Data filtering utilities implementation
│   ├── interactivity.js              # Event handling, public API, filters
│   ├── ui-components-impl.js          # UI component rendering implementation
│   └── charts/                       # Chart-specific modules
│       ├── histogram-chart-impl.js   # Histogram chart implementation
│       └── scatter-chart-impl.js     # Scatter plot implementation
└── generators/                       # Minimal server-side utilities
    └── svg-elements.js               # CSS generation only

test/                                 # Unit and integration tests
├── embedded-test-helper.js           # Mock browser environment for testing
├── *.test.js                         # Unit tests using Node.js built-in test runner
└── integration.test.js               # Browser-based integration tests with Puppeteer

data/                                 # Sample CSV files for testing
examples/                             # Generated SVG examples (tracked in git)
.github/workflows/                    # CI/CD automation (unit, integration, linting)
```

### Key Architectural Benefits
- **Pure Embedded Rendering**: All chart generation happens in the browser, not server-side
- **Minimal Node.js Footprint**: Server only creates SVG container (71 lines in svg.js)
- **Testable Embedded Code**: Chart logic in separate .js files, not string templates
- **Chart Type Modularity**: Each chart type has its own embedded implementation
- **Generic Chart Framework**: Shared infrastructure in chart-runtime.js supports all chart types
- **Zero Server-side Chart Logic**: Complete separation of concerns
- **Extensible Design**: Add new chart types by creating embedded modules only

## Testing

The project includes comprehensive testing at multiple levels:

### Unit Tests
- CSV parsing and type inference
- Embedded scatter chart functions (using mock browser environment)
- Embedded histogram functions (numeric and categorical)
- SVG structure generation
- Edge cases like constant values, empty data, and invalid data
- Uses Node.js built-in test runner (no external dependencies)
- Tests embedded JavaScript directly via `embedded-test-helper.js`

### Integration Tests  
- Browser-based testing using Puppeteer
- Loads generated SVG files in headless Chrome
- Detects JavaScript errors and runtime issues
- Validates core functionality and DOM structure
- Ensures charts render properly in real browsers

### Test Commands
```bash
npm test                # Unit tests only
npm run test:integration # Integration tests only
npm run test:all        # Complete test suite
```

### Dependencies
- **Runtime**: Only `csv-parse` (lightweight for users)
- **Development**: Adds `puppeteer` for browser testing
- **Installation**: `npm install --production` for users, `npm install` for developers

## Continuous Integration

GitHub Actions workflows automatically:

### Separate Workflow Jobs
- **Unit Tests** (`test.yml`): Run on Node.js 18.x, 20.x, and 22.x with CLI functionality tests
- **Integration Tests** (`integration.yml`): Browser-based validation using Puppeteer across all Node versions
- **Code Quality** (`lint.yml`): Syntax checking, file structure validation, package configuration

### Integration Test Features
- Generates multiple test charts (basic, grouped, custom dimensions, different fields)
- Validates each SVG loads without JavaScript errors in headless Chrome
- Tests core functionality (renderChart, updateChart, changeAxis) 
- Uploads generated SVGs as artifacts (30-day retention)
- Provides detailed error reporting and logs

All workflows run on pushes to `main` and on pull requests.

## Interactive UI Controls

Generated SVG charts include built-in UI controls for real-time interaction:

### HTML-based Interactive Controls
- **Chart Type Selector**: Switch between scatter plots and histograms in real-time
- **Native HTML Implementation**: Uses HTML `<select>` and `<input>` elements embedded in SVG via `<foreignObject>`
- **Dynamic Control Rendering**: UI adapts based on selected chart type
- **Scatter Plot Controls**: X/Y axis dropdowns, grouping field selection
- **Histogram Controls**: Field selection dropdown, bin count input for numeric data
- **Smart Field Filtering**: Only numeric fields are available for scatter plot axes
- **Data Filtering**: Add/remove multiple filters with various operators to explore data subsets
- **Better UX**: Native keyboard navigation, accessibility, and familiar control behavior

### Technical Implementation for HTML UI Elements
When creating HTML elements within SVG using `foreignObject`:

```javascript
// Create foreignObject container
const foreignObject = createSVGElement('foreignObject', {
  x: x, y: y, width: 130, height: 22
});

// Create HTML elements in XHTML namespace (required for SVG compatibility)
const selectElement = document.createElementNS('http://www.w3.org/1999/xhtml', 'select');

// Use setAttribute for styling (not style property)
selectElement.setAttribute('style', 
  'width: 130px; height: 20px; font-family: Arial, sans-serif; ' +
  'border: 1px solid #ccc; background: white;'
);

// Create options in XHTML namespace
options.forEach(option => {
  const optionElement = document.createElementNS('http://www.w3.org/1999/xhtml', 'option');
  optionElement.setAttribute('value', option);
  optionElement.textContent = option;
  selectElement.appendChild(optionElement);
});

foreignObject.appendChild(selectElement);
```

**Key Requirements for HTML in SVG:**
- Use `createElementNS('http://www.w3.org/1999/xhtml', 'tagName')` instead of `createElement`
- Set styles with `setAttribute('style', ...)` not `element.style.property`
- Create all child elements (options, etc.) in XHTML namespace
- Event listeners work normally once elements are properly created

### Data Filtering System
The charts include a comprehensive filtering system for data exploration:

**Filter Interface:**
- **Multiple Filters**: Add/remove multiple filter conditions with AND logic
- **Field Selection**: Dropdown of all available fields in the dataset
- **Operator Support**: `=`, `!=`, `>`, `<`, `>=`, `<=`, `contains`, `starts with`, `ends with`
- **Type-aware**: Automatically handles numeric vs string comparisons
- **Real-time Updates**: Chart re-renders immediately when filters change

**Example Filters:**
```
model != "Q8_K_ZL"           # Exclude specific model
n_depth > 1000               # Show only high depth values  
avg_ts <= 50.0               # Performance threshold
model contains "Q3"          # Models containing Q3
```

**Implementation Notes:**
- Filtering logic runs entirely in embedded JavaScript (browser-side)
- No server requests needed - completely self-contained
- Filters are applied before chart scaling, so axes adjust to filtered data
- Filter state maintained in `currentFilters` array with unique IDs

## Interactive API

Generated SVG charts expose a JavaScript API for programmatic manipulation:

```javascript
// Change axis fields
changeAxis('x', 'fieldName');
changeAxis('y', 'fieldName'); 

// Update multiple chart options
updateChart({
  xField: 'newField',
  yField: 'otherField',
  groupField: 'categoryField'
});
```

## Implementation Notes

### Code Organization
- **ES6 modules**: All components use modern import/export syntax
- **Clear boundaries**: Generator code (Node.js) completely separated from embedded code (browser)
- **Single responsibility**: Each module handles one specific concern
- **Import structure**: Use relative imports within the src/ directory

### Technical Requirements  
- **Browser compatibility**: Embedded JavaScript should work with modern browsers
- **SVG coordinate system**: Origin at top-left, positive Y downward
- **Scalable design**: All measurements should be relative to specified dimensions
- **Accessibility**: Color schemes should be accessible and printer-friendly
- **Performance**: Chart rendering logic embedded within SVG for instant updates

### Visual Standards
- **Professional appearance**: Smart axis intervals (1, 2, 2.5, 5 × 10^k)
- **Grid enhancement**: Subtle grid lines and tick marks for readability
- **Consistent styling**: CSS classes for all visual elements

### Adding New Features
- **New chart types**: 
  1. Create `[type]-chart-impl.js` in `src/embedded/charts/` with chart logic
  2. Update chart registry in `chart-runtime.js` to load via `loadEmbeddedChart()`
  3. Add CLI options in `cli.js`
- **New embedded utilities**: Create `[utility]-impl.js` files in `src/embedded/`
- **CSS updates**: Modify `src/generators/svg-elements.js`

### Chart Type Implementation Pattern
Each chart type follows a consistent pattern using the generalized embedded loader:

**Embedded Implementation** (`src/embedded/charts/`):
- `[type]-chart-impl.js`: Contains actual chart implementation with functions like `generate[Type]Chart`, `render[Type]Chart`, `render[Type]Controls`
- Loaded automatically by `embedded-loader.js` which strips module syntax for SVG embedding
- Register in chart-runtime.js using `loadEmbeddedChart('[type]-chart')`
- All chart files use `-impl.js` suffix for consistent loading

**No server-side chart logic**: All chart generation happens in embedded JavaScript

## Development Practices

- **Git workflow**: Keep examples/ directory for visual regression testing
- **Temporary files**: Test files and generated SVGs are automatically ignored
- **Package publishing**: .npmignore excludes development files from npm packages
- **CI artifacts**: Generated examples available for 30 days after each build
- **Testing**: Always add tests for new functionality, especially edge cases
- **Integration testing**: Run `npm run test:all` before commits to catch browser compatibility issues