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
- **Interactive UI**: Built-in controls for selecting axes, grouping, and chart options

## Architecture

### Core Components

- **CLI Interface** (`src/cli.js`): Command-line argument parsing and main entry point
- **CSV Parser** (`src/csv.js`): Reads and parses CSV data with type inference
- **Chart Generators** (`src/charts/`): Modular chart rendering (scatter, line, bar, etc.)
- **SVG Builder** (`src/svg.js`): Constructs complete SVG documents with embedded JS
- **UI Generator** (`src/ui.js`): Creates interactive controls within the SVG

### Data Flow

1. CLI parses command-line arguments (`-w`, `-h`, input file)
2. CSV parser reads and processes data file
3. SVG builder embeds data and chart generation functions as JavaScript
4. Browser renders chart dynamically when SVG loads
5. Embedded API enables real-time chart updates and interaction

### Dynamic Architecture

The system now uses **embedded chart rendering** where:
- Chart generation functions live inside the SVG's JavaScript
- Data is embedded as JSON within the SVG
- Charts render dynamically when the SVG loads
- Public API allows live chart updates without regeneration

## Development Commands

- **Run the tool**: `node src/cli.js [options] <csv-file>`
- **Example usage**: `node src/cli.js -x n_depth -y avg_ts -g model data/qwen30b3a_q3.csv > chart.svg`
- **With dimensions**: `node src/cli.js -w 1024 -h 768 -x field1 -y field2 data.csv -o output.svg`
- **Run tests**: `npm test`
- **Install dependencies**: `npm install`

## Chart Types

### Scatter Chart (Primary)
- X/Y axis field selection with live switching capability
- Optional weight field for circle sizes
- Optional grouping field for colors with interactive legend
- Automatic scaling with smart tick generation (1, 2, 2.5, 5 × 10^k)
- Visual enhancements: tick marks, grid lines, range filtering
- Interactive features: hover highlighting, click to hide/show groups

### Future Chart Types
- Line charts
- Bar charts
- Histograms
- Box plots

## File Structure

- `src/` - Core application code
- `data/` - Sample CSV files for testing
- `examples/` - Generated SVG examples (tracked in git)
- `test/` - Unit tests using Node.js built-in test runner
- `.github/workflows/` - CI/CD automation
- `.gitignore` - Excludes temporary files, node_modules, generated test files
- `.npmignore` - Excludes development files from npm package

## Testing

The project includes comprehensive testing at multiple levels:

### Unit Tests
- CSV parsing and type inference
- Scatter chart scaling and point positioning  
- SVG generation and structure
- Edge cases like constant values and invalid data
- Uses Node.js built-in test runner (no external dependencies)

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

### HTML-based Dropdowns with foreignObject
- **Native HTML Implementation**: Uses HTML `<select>` elements embedded in SVG via `<foreignObject>`
- **Real-time Field Switching**: Users can change X/Y axis fields using native dropdowns
- **Smart Field Filtering**: Only numeric fields are available for axis selection
- **Group Field Selection**: Includes all fields (numeric and string) with "None" option for grouping
- **Better UX**: Native keyboard navigation, accessibility, and familiar dropdown behavior

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

- Use ES6 modules for better organization
- Embedded JavaScript should be compatible with modern browsers
- SVG coordinate system: origin at top-left, positive Y downward
- Color schemes should be accessible and printer-friendly
- All measurements in the SVG should be scalable based on specified dimensions
- Chart rendering logic is embedded within SVG for dynamic updates
- Axis ticks use smart intervals for professional appearance
- Grid lines and tick marks enhance readability

## Development Practices

- **Git workflow**: Keep examples/ directory for visual regression testing
- **Temporary files**: Test files and generated SVGs are automatically ignored
- **Package publishing**: .npmignore excludes development files from npm packages
- **CI artifacts**: Generated examples available for 30 days after each build
- **Testing**: Always add tests for new functionality, especially edge cases
- **Integration testing**: Run `npm run test:all` before commits to catch browser compatibility issues