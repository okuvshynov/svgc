# SVGC - SVG Chart Generator

Generate interactive, self-contained SVG charts from CSV data.

## Features

- **Self-contained**: No external dependencies, charts work offline
- **Interactive**: Built-in controls for field selection and grouping
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

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Generate example charts
node src/cli.js -x n_depth -y avg_ts -g model data/qwen30b3a_q3.csv > chart.svg
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass: `npm test`
6. Submit a pull request

The CI pipeline will automatically:
- Run tests on multiple Node.js versions
- Check code quality and syntax
- Generate example charts
- Upload artifacts for inspection
