# SVGC - SVG Chart Generator

Generate interactive, self-contained SVG charts from CSV data. All chart rendering happens in the browser using embedded JavaScript.

## Features

- **Self-contained**: No external dependencies, charts work offline
- **Pure Browser Rendering**: All chart generation happens client-side via embedded JavaScript
- **Multiple Chart Types**: Scatter plots and histograms with more types coming
- **Dynamic & Interactive**: Live chart type switching, axis selection, hover highlighting
- **Data Filtering**: Interactive filtering with multiple operators and real-time updates
- **Programmable**: Embedded JavaScript API for real-time chart manipulation
- **Professional**: Clean tick marks, grid lines, and human-readable axis labels
- **Extensible**: Modular architecture makes adding new chart types simple
- **Command-line**: Simple CLI interface with sensible defaults
- **Minimal Server Footprint**: Node.js only creates the SVG container (71 lines)

## Quick Start

```bash
# Install dependencies
npm install

# Generate a scatter plot
node src/cli.js -x n_depth -y avg_ts -g model data/qwen30b3a_q3.csv > scatter.svg

# Generate a histogram
node src/cli.js -t histogram -f model data/qwen30b3a_q3.csv > histogram.svg

# Generate a numeric histogram with custom bins
node src/cli.js -t histogram -f avg_ts -b 15 data/qwen30b3a_q3.csv > numeric_histogram.svg
```

## Usage

```
svgc [options] <csv-file>

Options:
  -w, --width <pixels>      Chart width (default: 800)
  -h, --height <pixels>     Chart height (default: 600)
  -o, --output <file>       Output SVG file (default: stdout)
  -t, --type <type>         Chart type: scatter, histogram (default: scatter)
  
  Scatter chart options:
  -x, --x-field <field>     Field to use for X axis
  -y, --y-field <field>     Field to use for Y axis
  -s, --size-field <field>  Field to use for point sizes (optional)
  -g, --group-field <field> Field to use for grouping/colors (optional)
  
  Histogram options:
  -f, --field <field>       Field to use for histogram
  -b, --bins <count>        Number of bins for numeric data (default: auto)
  
  Other options:
  --debug                   Enable debug logging in generated SVG
  --help                    Show help message
```

## Examples

The included sample data shows LLM performance benchmarks. Here are different ways to visualize this data:

### Scatter Plot - Performance Analysis
```bash
node src/cli.js -x n_depth -y avg_ts -g model data/qwen30b3a_q3.csv > examples/performance.svg
```
Creates an interactive scatter plot showing how different model quantizations (Q2_K, Q3_K, Q4_K, etc.) perform across various context depths.

### Histogram - Model Distribution
```bash
node src/cli.js -t histogram -f model data/qwen30b3a_q3.csv > examples/model_distribution.svg
```
Creates a bar chart showing the count of each model type in the dataset.

### Histogram - Performance Distribution
```bash
node src/cli.js -t histogram -f avg_ts -b 20 data/qwen30b3a_q3.csv > examples/performance_dist.svg
```
Creates a histogram showing the distribution of throughput values with 20 bins.

## Interactive Features

### Built-in UI Controls
- **Chart Type Selector**: Switch between scatter plots and histograms in real-time
- **Axis Selection Dropdowns**: Interactive dropdowns to change X and Y axis fields (scatter plots)
- **Field Selection**: Choose which field to visualize in histograms
- **Bin Count Control**: Adjust the number of bins for numeric histograms
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

The project includes comprehensive testing:

- **Unit Tests**: Test CSV parsing and embedded chart functions using a mock browser environment
- **Integration Tests**: Test generated SVG files in a real browser using Puppeteer
- **Embedded Testing**: Direct testing of browser-side JavaScript via `embedded-test-helper.js`

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

## Architecture

This project uses a pure embedded rendering approach:

- **Node.js Role**: Only creates the SVG container and embeds data/JavaScript
- **Browser Role**: All chart rendering happens client-side
- **Zero Server-side Chart Logic**: No chart generation on the server
- **Self-contained Output**: Generated SVGs work offline without any dependencies

## Project Structure

```
src/
├── cli.js                            # Command-line interface
├── csv.js                            # CSV parsing with type inference
├── svg.js                            # Minimal SVG coordinator (71 lines)
├── embedded/                         # All chart rendering code (browser-side)
│   ├── chart-runtime.js              # Chart framework and registry
│   ├── chart-utils-impl.js           # Chart utility functions
│   ├── embedded-loader.js            # Generalized module loader
│   ├── filter-utils-impl.js          # Data filtering utilities
│   ├── interactivity.js              # Event handling and public API
│   ├── ui-components-impl.js          # UI component rendering
│   └── charts/                       # Chart implementations
│       ├── histogram-chart-impl.js   # Histogram chart implementation
│       └── scatter-chart-impl.js     # Scatter plot implementation
└── generators/                       # Minimal server utilities
    └── svg-elements.js               # CSS generation only

test/
├── embedded-test-helper.js           # Mock browser environment
└── *.test.js                         # Unit and integration tests
```

**Key Benefits:**
- **Pure Client-side Rendering**: All charts generated in the browser
- **Testable Embedded Code**: Chart logic in separate files, not strings
- **Minimal Server Footprint**: Node.js code is minimal and focused
- **Easy Extension**: Add new charts by creating embedded modules only

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
