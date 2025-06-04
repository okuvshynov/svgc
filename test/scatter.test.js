import { test, describe } from 'node:test';
import assert from 'node:assert';
import { loadEmbeddedFunction, createEmbeddedEnvironment } from './embedded-test-helper.js';

describe('Scatter Chart Generator (Embedded)', () => {
  let generateScatterChart;
  let environment;
  
  // Load the embedded scatter chart function before tests
  test.before(() => {
    generateScatterChart = loadEmbeddedFunction('scatter-chart.js', 'generateScatterChart');
    environment = createEmbeddedEnvironment();
  });
  
  const sampleData = {
    headers: ['x', 'y', 'size', 'group'],
    rows: [
      { x: 1, y: 10, size: 5, group: 'A' },
      { x: 2, y: 20, size: 10, group: 'A' },
      { x: 3, y: 15, size: 7, group: 'B' },
      { x: 4, y: 25, size: 12, group: 'B' }
    ]
  };
  
  test('should generate basic scatter chart', () => {
    // Set up environment
    Object.assign(environment, {
      embeddedData: sampleData,
      currentOptions: { filters: [] }
    });
    
    const options = {
      xField: 'x',
      yField: 'y'
    };
    
    // Call with bound environment
    const boundFunction = generateScatterChart.bind(environment);
    const result = boundFunction.call(environment, sampleData, options);
    
    assert.strictEqual(result.points.length, 4);
    assert.ok(result.xScale);
    assert.ok(result.yScale);
    assert.ok(result.chartBounds);
  });
  
  test('should handle constant values (zero range)', () => {
    const constantData = {
      headers: ['x', 'y'],
      rows: [
        { x: 5, y: 10 },
        { x: 5, y: 20 },
        { x: 5, y: 15 }
      ]
    };
    
    Object.assign(environment, {
      embeddedData: constantData,
      currentOptions: { filters: [] }
    });
    
    const options = {
      xField: 'x',
      yField: 'y'
    };
    
    const boundFunction = generateScatterChart.bind(environment);
    const result = boundFunction.call(environment, constantData, options);
    
    // Should not have NaN values
    result.points.forEach(point => {
      assert.ok(!isNaN(point.x), 'Point x coordinate should not be NaN');
      assert.ok(!isNaN(point.y), 'Point y coordinate should not be NaN');
    });
    
    // X scale should have proper range even with constant values
    assert.ok(result.xScale.range > 0, 'X scale range should be greater than 0');
    assert.ok(result.yScale.range > 0, 'Y scale range should be greater than 0');
  });
  
  test('should handle grouping', () => {
    Object.assign(environment, {
      embeddedData: sampleData,
      currentOptions: { filters: [] }
    });
    
    const options = {
      xField: 'x',
      yField: 'y',
      groupField: 'group'
    };
    
    const boundFunction = generateScatterChart.bind(environment);
    const result = boundFunction.call(environment, sampleData, options);
    
    assert.deepStrictEqual(result.groups, ['A', 'B']);
    assert.strictEqual(Object.keys(result.groupColorMap).length, 2);
    assert.ok(result.groupColorMap['A']);
    assert.ok(result.groupColorMap['B']);
  });
  
  test('should handle weight field for point sizes', () => {
    Object.assign(environment, {
      embeddedData: sampleData,
      currentOptions: { filters: [] }
    });
    
    const options = {
      xField: 'x',
      yField: 'y',
      weightField: 'size'
    };
    
    const boundFunction = generateScatterChart.bind(environment);
    const result = boundFunction.call(environment, sampleData, options);
    
    // Points should have different radii based on weight
    const radii = result.points.map(p => p.radius);
    const uniqueRadii = [...new Set(radii)];
    assert.ok(uniqueRadii.length > 1, 'Should have different radii for different weights');
  });
  
  test('should calculate proper scales', () => {
    Object.assign(environment, {
      embeddedData: sampleData,
      currentOptions: { filters: [] }
    });
    
    const options = {
      xField: 'x',
      yField: 'y'
    };
    
    const boundFunction = generateScatterChart.bind(environment);
    const result = boundFunction.call(environment, sampleData, options);
    
    // X values: 1, 2, 3, 4 -> min: 1, max: 4
    assert.ok(result.xScale.min < 1, 'X scale min should include padding');
    assert.ok(result.xScale.max > 4, 'X scale max should include padding');
    
    // Y values: 10, 20, 15, 25 -> min: 10, max: 25
    assert.ok(result.yScale.min < 10, 'Y scale min should include padding');
    assert.ok(result.yScale.max > 25, 'Y scale max should include padding');
  });
  
  test('should position points correctly within chart bounds', () => {
    Object.assign(environment, {
      embeddedData: sampleData,
      currentOptions: { filters: [] },
      chartDimensions: {
        width: 800,
        height: 600,
        padding: 60
      }
    });
    
    const options = {
      xField: 'x',
      yField: 'y'
    };
    
    const boundFunction = generateScatterChart.bind(environment);
    const result = boundFunction.call(environment, sampleData, options);
    
    const controlPanelWidth = 240;
    const leftBound = controlPanelWidth + environment.chartDimensions.padding;
    const rightBound = environment.chartDimensions.width - 20; // Account for the 20px margin in chart width calculation
    const topBound = environment.chartDimensions.padding;
    const bottomBound = environment.chartDimensions.height - environment.chartDimensions.padding;
    
    result.points.forEach(point => {
      assert.ok(point.x >= leftBound, `Point x ${point.x} should be >= left bound ${leftBound}`);
      assert.ok(point.x <= rightBound, `Point x ${point.x} should be <= right bound ${rightBound}`);
      assert.ok(point.y >= topBound, `Point y ${point.y} should be >= top bound ${topBound}`);
      assert.ok(point.y <= bottomBound, `Point y ${point.y} should be <= bottom bound ${bottomBound}`);
    });
  });
  
  test('should filter out non-numeric values', () => {
    const mixedData = {
      headers: ['x', 'y'],
      rows: [
        { x: 1, y: 10 },
        { x: 'invalid', y: 20 },
        { x: 3, y: 'invalid' },
        { x: 4, y: 25 }
      ]
    };
    
    Object.assign(environment, {
      embeddedData: mixedData,
      currentOptions: { filters: [] }
    });
    
    const options = {
      xField: 'x',
      yField: 'y'
    };
    
    const boundFunction = generateScatterChart.bind(environment);
    const result = boundFunction.call(environment, mixedData, options);
    
    // Should only include points with valid numeric values
    assert.strictEqual(result.points.length, 2);
  });
  
  test('should handle single data point', () => {
    const singlePointData = {
      headers: ['x', 'y'],
      rows: [{ x: 5, y: 10 }]
    };
    
    Object.assign(environment, {
      embeddedData: singlePointData,
      currentOptions: { filters: [] }
    });
    
    const options = {
      xField: 'x',
      yField: 'y'
    };
    
    const boundFunction = generateScatterChart.bind(environment);
    const result = boundFunction.call(environment, singlePointData, options);
    
    assert.strictEqual(result.points.length, 1);
    assert.ok(!isNaN(result.points[0].x));
    assert.ok(!isNaN(result.points[0].y));
    assert.ok(result.xScale.range > 0);
    assert.ok(result.yScale.range > 0);
  });
});