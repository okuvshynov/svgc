# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SVGC (SVG Chart Generator) creates interactive, self-contained SVG files with embedded JavaScript for data visualization. The tool converts CSV data into interactive charts that can be viewed offline without external dependencies.

## Key Design Principles

- **Self-contained output**: Generated SVG files contain all data, JavaScript, and styling inline
- **No external dependencies**: Charts work offline and don't require external JS libraries
- **Extensible architecture**: Modular design supports adding new chart types
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
3. Chart generator creates visualization based on data and options
4. UI generator adds interactive controls
5. SVG builder combines everything into a single output file

## Development Commands

- **Run the tool**: `node src/cli.js [options] <csv-file>`
- **Example usage**: `node src/cli.js -x n_depth -y avg_ts -g model data/qwen30b3a_q3.csv > chart.svg`
- **With dimensions**: `node src/cli.js -w 1024 -h 768 -x field1 -y field2 data.csv -o output.svg`
- **Run tests**: `npm test`
- **Install dependencies**: `npm install`

## Chart Types

### Scatter Chart (Primary)
- X/Y axis field selection
- Optional weight field for circle sizes
- Optional grouping field for colors
- Automatic scaling and legend generation

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

The project includes comprehensive unit tests for:
- CSV parsing and type inference
- Scatter chart scaling and point positioning
- SVG generation and structure
- Edge cases like constant values and invalid data

Tests use Node.js built-in test runner (no external dependencies).

## Continuous Integration

GitHub Actions workflows automatically:
- **Tests**: Run unit tests on Node.js 18.x, 20.x, and 22.x
- **Code Quality**: Check syntax, file structure, and package validity
- **Examples**: Generate sample charts and validate SVG output
- **Artifacts**: Upload generated charts for download and inspection

All workflows run on pushes to `main` and on pull requests.

## Implementation Notes

- Use ES6 modules for better organization
- Embedded JavaScript should be compatible with modern browsers
- SVG coordinate system: origin at top-left, positive Y downward
- Color schemes should be accessible and printer-friendly
- All measurements in the SVG should be scalable based on specified dimensions

## Development Practices

- **Git workflow**: Keep examples/ directory for visual regression testing
- **Temporary files**: Test files and generated SVGs are automatically ignored
- **Package publishing**: .npmignore excludes development files from npm packages
- **CI artifacts**: Generated examples available for 30 days after each build
- **Testing**: Always add tests for new functionality, especially edge cases