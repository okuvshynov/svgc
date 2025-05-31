import { test, describe } from 'node:test';
import assert from 'node:assert';
import { generateScatterChart } from '../src/charts/scatter.js';

describe('Scatter Chart Generator', () => {
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
    const options = {
      width: 800,
      height: 600,
      xField: 'x',
      yField: 'y'
    };
    
    const result = generateScatterChart(sampleData, options);
    
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
    
    const options = {
      width: 800,
      height: 600,
      xField: 'x',
      yField: 'y'
    };
    
    const result = generateScatterChart(constantData, options);
    
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
    const options = {
      width: 800,
      height: 600,
      xField: 'x',
      yField: 'y',
      groupField: 'group'
    };
    
    const result = generateScatterChart(sampleData, options);
    
    assert.deepStrictEqual(result.groups, ['A', 'B']);
    assert.strictEqual(Object.keys(result.groupColorMap).length, 2);
    assert.ok(result.groupColorMap['A']);
    assert.ok(result.groupColorMap['B']);
  });
  
  test('should handle weight field for point sizes', () => {
    const options = {
      width: 800,
      height: 600,
      xField: 'x',
      yField: 'y',
      weightField: 'size'
    };
    
    const result = generateScatterChart(sampleData, options);
    
    // Points should have different radii based on weight
    const radii = result.points.map(p => p.radius);
    const uniqueRadii = [...new Set(radii)];
    assert.ok(uniqueRadii.length > 1, 'Should have different radii for different weights');
  });
  
  test('should calculate proper scales', () => {
    const options = {
      width: 800,
      height: 600,
      xField: 'x',
      yField: 'y'
    };
    
    const result = generateScatterChart(sampleData, options);
    
    // X values: 1, 2, 3, 4 -> min: 1, max: 4
    assert.ok(result.xScale.min < 1, 'X scale min should include padding');
    assert.ok(result.xScale.max > 4, 'X scale max should include padding');
    
    // Y values: 10, 20, 15, 25 -> min: 10, max: 25
    assert.ok(result.yScale.min < 10, 'Y scale min should include padding');
    assert.ok(result.yScale.max > 25, 'Y scale max should include padding');
  });
  
  test('should position points correctly within chart bounds', () => {
    const options = {
      width: 800,
      height: 600,
      padding: 60,
      xField: 'x',
      yField: 'y'
    };
    
    const result = generateScatterChart(sampleData, options);
    
    result.points.forEach(point => {
      assert.ok(point.x >= options.padding, 'Point should be within left bound');
      assert.ok(point.x <= options.width - options.padding, 'Point should be within right bound');
      assert.ok(point.y >= options.padding, 'Point should be within top bound');
      assert.ok(point.y <= options.height - options.padding, 'Point should be within bottom bound');
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
    
    const options = {
      width: 800,
      height: 600,
      xField: 'x',
      yField: 'y'
    };
    
    const result = generateScatterChart(mixedData, options);
    
    // Should only include points with valid numeric values
    assert.strictEqual(result.points.length, 2);
  });
  
  test('should handle single data point', () => {
    const singlePointData = {
      headers: ['x', 'y'],
      rows: [{ x: 5, y: 10 }]
    };
    
    const options = {
      width: 800,
      height: 600,
      xField: 'x',
      yField: 'y'
    };
    
    const result = generateScatterChart(singlePointData, options);
    
    assert.strictEqual(result.points.length, 1);
    assert.ok(!isNaN(result.points[0].x));
    assert.ok(!isNaN(result.points[0].y));
    assert.ok(result.xScale.range > 0);
    assert.ok(result.yScale.range > 0);
  });
});