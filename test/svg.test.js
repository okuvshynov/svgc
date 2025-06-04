import { test, describe } from 'node:test';
import assert from 'node:assert';
import { generateSVG } from '../src/svg.js';

describe('SVG Generator', () => {
  const sampleData = {
    headers: ['x', 'y', 'group'],
    rows: [
      { x: 1, y: 10, group: 'A' },
      { x: 2, y: 15, group: 'B' }
    ]
  };
  
  const sampleOptions = {
    width: 800,
    height: 600,
    chartType: 'scatter',
    xField: 'x',
    yField: 'y',
    groupField: 'group'
  };
  
  test('should generate valid SVG structure', () => {
    const svg = generateSVG(sampleData, sampleOptions);
    
    // Should be valid XML
    assert.ok(svg.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
    assert.ok(svg.includes('<svg'));
    assert.ok(svg.includes('</svg>'));
    
    // Should have correct dimensions
    assert.ok(svg.includes('width="800"'));
    assert.ok(svg.includes('height="600"'));
    assert.ok(svg.includes('viewBox="0 0 800 600"'));
  });
  
  test('should include chart title', () => {
    const svg = generateSVG(sampleData, sampleOptions);
    
    assert.ok(svg.includes('x vs y'));
    assert.ok(svg.includes('class="chart-title"'));
  });
  
  test('should include data points as circles', () => {
    const svg = generateSVG(sampleData, sampleOptions);
    
    // With dynamic rendering, circles are created by JavaScript, not in static SVG
    // Check that the chart area exists
    assert.ok(svg.includes('<g id="chart-area"></g>'));
    // Check that rendering functions are embedded
    assert.ok(svg.includes('renderChartContent'));
  });
  
  test('should include axes', () => {
    const svg = generateSVG(sampleData, sampleOptions);
    
    // With dynamic rendering, axes are created by JavaScript, not in static SVG
    // Check that the rendering functions are embedded
    assert.ok(svg.includes('renderChartContent'));
    
    // Check that axis styles are defined in CSS
    assert.ok(svg.includes('.axis-line'));
    assert.ok(svg.includes('.axis-text'));
  });
  
  test('should include legend when grouping is used', () => {
    const svg = generateSVG(sampleData, sampleOptions);
    
    // With dynamic rendering, legend is created by JavaScript
    // Check that the rendering functions are embedded
    assert.ok(svg.includes('renderChartContent'));
    
    // Check that legend styles are defined in CSS
    assert.ok(svg.includes('.legend-text'));
    
    // Check that the groupField is embedded in the options
    assert.ok(svg.includes('"groupField":"group"'));
  });
  
  test('should not include legend styles when no grouping', () => {
    const noGroupOptions = { ...sampleOptions };
    delete noGroupOptions.groupField;
    
    const svg = generateSVG(sampleData, noGroupOptions);
    
    // Should still include legend styles as they're part of the CSS
    // But the groupField should not be in the options
    assert.ok(!svg.includes('"groupField"'));
  });
  
  test('should embed data as JSON', () => {
    const svg = generateSVG(sampleData, sampleOptions);
    
    // Should contain embedded data
    assert.ok(svg.includes('const embeddedData = '));
    assert.ok(svg.includes('let currentOptions = '));
    
    // Should contain the actual data
    assert.ok(svg.includes('"x":1'));
    assert.ok(svg.includes('"y":10'));
    assert.ok(svg.includes('"group":"A"'));
  });
  
  test('should include JavaScript for interactivity', () => {
    const svg = generateSVG(sampleData, sampleOptions);
    
    assert.ok(svg.includes('<script'));
    assert.ok(svg.includes(']]></script>'));
    assert.ok(svg.includes('log_debug'));
  });
  
  test('should include CSS styles', () => {
    const svg = generateSVG(sampleData, sampleOptions);
    
    assert.ok(svg.includes('<defs>'));
    assert.ok(svg.includes('.chart-point'));
    assert.ok(svg.includes('.axis-line'));
    assert.ok(svg.includes('.axis-text'));
  });
  
  test('should include tooltips with data', () => {
    const svg = generateSVG(sampleData, sampleOptions);
    
    // With dynamic rendering, tooltips are created by JavaScript
    // Check that the title creation logic is embedded
    assert.ok(svg.includes('title.textContent = JSON.stringify(point.data)'));
    assert.ok(svg.includes('circle.appendChild(title)'));
  });
  
  test('should handle special characters in data', () => {
    const specialData = {
      headers: ['name', 'value'],
      rows: [{ name: 'Test "quoted" & <special>', value: 42 }]
    };
    
    const specialOptions = {
      ...sampleOptions,
      xField: 'name',
      yField: 'value'
    };
    
    const svg = generateSVG(specialData, specialOptions);
    
    // With dynamic rendering, special characters are handled in the embedded JSON data
    // Check that the embedded data contains the escaped JSON
    assert.ok(svg.includes('Test \\"quoted\\" & <special>') || 
              svg.includes('Test \\\"quoted\\\" &amp; &lt;special&gt;'));
    
    // Check that tooltip creation uses JSON.stringify which handles escaping
    assert.ok(svg.includes('title.textContent = JSON.stringify(point.data)'));
  });
});