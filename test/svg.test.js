import { test, describe } from 'node:test';
import assert from 'node:assert';
import { generateSVG } from '../src/svg.js';

describe('SVG Generator', () => {
  const sampleChartData = {
    points: [
      { x: 100, y: 200, radius: 5, color: '#ff0000', group: 'A', data: { x: 1, y: 10 }, index: 0 },
      { x: 200, y: 150, radius: 7, color: '#00ff00', group: 'B', data: { x: 2, y: 15 }, index: 1 }
    ],
    xScale: { min: 0, max: 10, range: 10 },
    yScale: { min: 0, max: 20, range: 20 },
    groupColorMap: { A: '#ff0000', B: '#00ff00' },
    groups: ['A', 'B'],
    chartBounds: { left: 60, top: 60, width: 680, height: 480 }
  };
  
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
    xField: 'x',
    yField: 'y',
    groupField: 'group'
  };
  
  test('should generate valid SVG structure', () => {
    const svg = generateSVG(sampleChartData, sampleData, sampleOptions);
    
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
    const svg = generateSVG(sampleChartData, sampleData, sampleOptions);
    
    assert.ok(svg.includes('x vs y'));
    assert.ok(svg.includes('class="chart-title"'));
  });
  
  test('should include data points as circles', () => {
    const svg = generateSVG(sampleChartData, sampleData, sampleOptions);
    
    // Should have circle elements
    assert.ok(svg.includes('<circle'));
    assert.ok(svg.includes('cx="100"'));
    assert.ok(svg.includes('cy="200"'));
    assert.ok(svg.includes('r="5"'));
    assert.ok(svg.includes('fill="#ff0000"'));
  });
  
  test('should include axes', () => {
    const svg = generateSVG(sampleChartData, sampleData, sampleOptions);
    
    // Should have axis lines
    assert.ok(svg.includes('class="axis-line"'));
    
    // Should have axis labels
    assert.ok(svg.includes('class="axis-text"'));
  });
  
  test('should include legend when grouping is used', () => {
    const svg = generateSVG(sampleChartData, sampleData, sampleOptions);
    
    assert.ok(svg.includes('class="legend-text"'));
    assert.ok(svg.includes(sampleOptions.groupField));
  });
  
  test('should not include legend when no grouping', () => {
    const noGroupOptions = { ...sampleOptions };
    delete noGroupOptions.groupField;
    
    const noGroupChartData = {
      ...sampleChartData,
      groups: ['default'],
      groupColorMap: { default: '#1f77b4' }
    };
    
    const svg = generateSVG(noGroupChartData, sampleData, noGroupOptions);
    
    // Should not include legend class for single group
    assert.ok(!svg.includes('class="legend-text"'));
  });
  
  test('should embed data as JSON', () => {
    const svg = generateSVG(sampleChartData, sampleData, sampleOptions);
    
    // Should contain embedded data
    assert.ok(svg.includes('const embeddedData = '));
    assert.ok(svg.includes('const embeddedOptions = '));
    
    // Should contain the actual data
    assert.ok(svg.includes('"x":1'));
    assert.ok(svg.includes('"y":10'));
    assert.ok(svg.includes('"group":"A"'));
  });
  
  test('should include JavaScript for interactivity', () => {
    const svg = generateSVG(sampleChartData, sampleData, sampleOptions);
    
    assert.ok(svg.includes('<script'));
    assert.ok(svg.includes(']]></script>'));
    assert.ok(svg.includes('console.log'));
  });
  
  test('should include CSS styles', () => {
    const svg = generateSVG(sampleChartData, sampleData, sampleOptions);
    
    assert.ok(svg.includes('<style>'));
    assert.ok(svg.includes('.chart-point'));
    assert.ok(svg.includes('.axis-line'));
    assert.ok(svg.includes('.axis-text'));
  });
  
  test('should include tooltips with data', () => {
    const svg = generateSVG(sampleChartData, sampleData, sampleOptions);
    
    // Should have title elements for tooltips
    assert.ok(svg.includes('<title>'));
    assert.ok(svg.includes('&quot;x&quot;:1'));
    assert.ok(svg.includes('&quot;y&quot;:10'));
  });
  
  test('should handle special characters in data', () => {
    const specialData = {
      headers: ['name', 'value'],
      rows: [{ name: 'Test "quoted" & <special>', value: 42 }]
    };
    
    const specialChartData = {
      ...sampleChartData,
      points: [{
        x: 100, y: 200, radius: 5, color: '#ff0000', group: 'A',
        data: { name: 'Test "quoted" & <special>', value: 42 },
        index: 0
      }]
    };
    
    const svg = generateSVG(specialChartData, specialData, { ...sampleOptions, xField: 'name', yField: 'value' });
    
    // Should properly escape special characters in tooltips
    assert.ok(svg.includes('&quot;'));
    // Should not contain unescaped quotes or angle brackets in JSON
    assert.ok(!svg.includes('"quoted"') || svg.includes('&quot;quoted&quot;'));
  });
});