# SVGC - SVG Chart Generator

Generate interactive, self-contained SVG charts from CSV data.

## Features

- **Self-contained**: No external dependencies, charts work offline
- **Dynamic & Interactive**: Live axis switching, hover highlighting, click to hide/show groups
- **Programmable**: Embedded JavaScript API for real-time chart manipulation
- **Professional**: Clean tick marks, grid lines, and human-readable axis labels
- **Extensible**: Modular architecture supports multiple chart types
- **Command-line**: Simple CLI interface with sensible defaults

## Quick Start

```bash
# Install dependencies
npm install

# Generate a chart
node src/cli.js -x n_depth -y avg_ts -g model data/qwen30b3a_q3.csv > chart.svg

# With custom dimensions
node src/cli.js -w 1024 -h 768 -x field1 -y field2 data.csv -o output.svg
```

## Usage

```
svgc [options] <csv-file>

Options:
  -w, --width <pixels>      Chart width (default: 800)
  -h, --height <pixels>     Chart height (default: 600)
  -o, --output <file>       Output SVG file (default: stdout)
  -x, --x-field <field>     Field to use for X axis
  -y, --y-field <field>     Field to use for Y axis
  -s, --size-field <field>  Field to use for point sizes (optional)
  -g, --group-field <field> Field to use for grouping/colors (optional)
  --help                    Show help message
```

## Example

The included sample data shows LLM performance benchmarks. Generate a chart showing the relationship between context depth and throughput:

```bash
node src/cli.js -x n_depth -y avg_ts -g model data/qwen30b3a_q3.csv > examples/performance.svg
```

This creates an interactive scatter plot showing how different model quantizations (Q2_K, Q3_K, Q4_K, etc.) perform across various context depths.

## Interactive Features

### Built-in UI Controls
- **Axis Selection Dropdowns**: Interactive dropdowns to change X and Y axis fields in real-time
- **Group Selection**: Choose grouping field from available columns, including "None" option
- **Data Filtering**: Add multiple filters to show/hide data points based on field values
- **HTML Integration**: Native HTML controls embedded via `foreignObject` for optimal usability

### Interactive Data Exploration
- **Legend Interaction**: Hover to highlight, click to hide/show data groups
- **Real-time Filtering**: Add filters like `model != 'Q8_K_ZL'` or `n_depth > 1000`
- **Multiple Filter Support**: Combine multiple conditions with AND logic
- **Smart Operators**: `=`, `!=`, `>`, `<`, `>=`, `<=`, `contains`, `starts with`, `ends with`
- **Type-aware Filtering**: Automatically handles numeric vs string comparisons
- **Visual feedback** with checkboxes and smooth transitions

### Dynamic Chart API
Once generated, charts can be modified programmatically:

```javascript
// Change X axis to a different field
changeAxis('x', 'model_size');

// Change Y axis 
changeAxis('y', 'stddev_ts');

// Update multiple options at once
updateChart({
  xField: 'n_gen',
  yField: 'avg_ts', 
  groupField: 'model_type'
});
```

### Professional Visuals
- **Smart axis ticks**: Clean intervals (1, 2, 2.5, 5 × 10^k)
- **Grid lines**: Subtle dotted guides for easy value reading  
- **Tick marks**: Visual indicators on axes
- **Range filtering**: Only shows ticks within data bounds

## Development

```bash
# Install dependencies (runtime only)
npm install --production

# Install all dependencies (including testing tools)
npm install

# Run unit tests
npm test

# Run integration tests (requires puppeteer)
npm run test:integration

# Run all tests
npm run test:all

# Generate example charts
node src/cli.js -x n_depth -y avg_ts -g model data/qwen30b3a_q3.csv > chart.svg
```

### Testing

The project includes two types of tests:

- **Unit Tests**: Test individual functions and modules using Node.js built-in test runner
- **Integration Tests**: Test generated SVG files in a real browser using Puppeteer

**For users** (runtime only):
```bash
npm install --production  # Only installs csv-parse
```

**For developers** (with testing):
```bash
npm install               # Installs puppeteer for browser testing
npm run test:all          # Run complete test suite
```

Integration tests:
- Load generated SVG files in headless Chrome
- Detect JavaScript errors and runtime issues
- Verify core functionality and DOM structure
- Validate that charts render properly in browsers

## Project Structure

The codebase is organized into focused, modular components:

```
src/
├── cli.js                    # Command-line interface
├── csv.js                    # CSV parsing and data processing  
├── svg.js                    # Main SVG generation coordinator
├── charts/
│   └── scatter.js            # Scatter plot chart generator
├── embedded/                 # Browser-side JavaScript (embedded in SVG)
│   ├── chart-runtime.js      # Chart rendering functions
│   └── interactivity.js      # Event handlers and interactive features
├── generators/               # SVG element generation utilities
│   └── svg-elements.js       # Axes, points, legend, CSS generation
└── utils/
    └── formatting.js         # Number formatting and tick calculation
```

**Key Benefits:**
- **Separation of concerns**: Generator code (Node.js) vs embedded code (browser)
- **Modularity**: Easy to add new chart types or features
- **Maintainability**: Smaller, focused files instead of monolithic code
- **Reusability**: Shared utilities across different components

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass: `npm run test:all`
6. Submit a pull request

The CI pipeline will automatically:
- **Unit Tests**: Run on Node.js 18.x, 20.x, and 22.x
- **Integration Tests**: Validate generated SVGs in headless browsers
- **Code Quality**: Check syntax, file structure, and package validity
- **Chart Generation**: Create multiple test charts and validate browser compatibility
- **Artifacts**: Upload generated charts and logs for inspection (30-day retention)
