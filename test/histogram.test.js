import { test, describe } from 'node:test';
import assert from 'node:assert';
import { loadEmbeddedFunction, createEmbeddedEnvironment } from './embedded-test-helper.js';

describe('Histogram Chart Generator (Embedded)', () => {
  let generateHistogram;
  let generateNumericHistogram;
  let generateCategoricalHistogram;
  let environment;
  
  // Load the embedded histogram functions before tests
  test.before(() => {
    generateHistogram = loadEmbeddedFunction('histogram-chart-impl.js', 'generateHistogram');
    generateNumericHistogram = loadEmbeddedFunction('histogram-chart-impl.js', 'generateNumericHistogram');
    generateCategoricalHistogram = loadEmbeddedFunction('histogram-chart-impl.js', 'generateCategoricalHistogram');
    environment = createEmbeddedEnvironment();
  });
  
  test('generateHistogram with numeric data', () => {
    const data = {
      rows: [
        { value: 1 },
        { value: 2 },
        { value: 3 },
        { value: 4 },
        { value: 5 },
        { value: 6 },
        { value: 7 },
        { value: 8 },
        { value: 9 },
        { value: 10 }
      ]
    };
    
    Object.assign(environment, {
      embeddedData: data,
      currentOptions: { filters: [] }
    });

    const options = {
      histogramField: 'value',
      binCount: 5
    };
    
    const boundFunction = generateHistogram.bind(environment);
    const result = boundFunction.call(environment, data, options);
    
    assert.strictEqual(result.type, 'histogram');
    assert.ok(result.histogramData);
    assert.ok(result.histogramData.isNumeric);
    assert.ok(result.histogramData.bins.length >= 3 && result.histogramData.bins.length <= 7);
    
    // Check that all values are counted
    const totalCount = result.histogramData.bins.reduce((sum, bin) => sum + bin.count, 0);
    assert.strictEqual(totalCount, 10);
  });

  test('generateHistogram with categorical data', () => {
    const data = {
      rows: [
        { category: 'A' },
        { category: 'B' },
        { category: 'A' },
        { category: 'C' },
        { category: 'B' },
        { category: 'A' }
      ]
    };
    
    Object.assign(environment, {
      embeddedData: data,
      currentOptions: { filters: [] }
    });

    const options = {
      histogramField: 'category'
    };
    
    const boundFunction = generateHistogram.bind(environment);
    const result = boundFunction.call(environment, data, options);
    
    assert.strictEqual(result.type, 'histogram');
    assert.ok(result.histogramData);
    assert.strictEqual(result.histogramData.isNumeric, false);
    assert.strictEqual(result.histogramData.bins.length, 3);
    
    // Check that bins are sorted by count (descending)
    assert.strictEqual(result.histogramData.bins[0].label, 'A');
    assert.strictEqual(result.histogramData.bins[0].count, 3);
    assert.strictEqual(result.histogramData.bins[1].count, 2);
    assert.strictEqual(result.histogramData.bins[2].count, 1);
  });

  test('generateNumericHistogram with constant values', () => {
    const values = [5, 5, 5, 5];
    
    const boundFunction = generateNumericHistogram.bind(environment);
    const result = boundFunction.call(environment, values, 10);
    
    assert.strictEqual(result.isNumeric, true);
    assert.strictEqual(result.bins.length, 1);
    assert.strictEqual(result.bins[0].count, 4);
    assert.deepStrictEqual(result.bins[0].range, [5, 5]);
  });

  test('generateHistogram with mixed data types', () => {
    const data = {
      rows: [
        { mixed: 'text' },
        { mixed: 42 },
        { mixed: 'more text' },
        { mixed: 'another' }
      ]
    };
    
    Object.assign(environment, {
      embeddedData: data,
      currentOptions: { filters: [] }
    });

    const options = {
      histogramField: 'mixed'
    };
    
    const boundFunction = generateHistogram.bind(environment);
    const result = boundFunction.call(environment, data, options);
    
    // Mixed data should be treated as categorical
    assert.strictEqual(result.histogramData.isNumeric, false);
    assert.strictEqual(result.histogramData.bins.length, 4);
  });

  test('generateHistogram with null/undefined values', () => {
    const data = {
      rows: [
        { value: 1 },
        { value: null },
        { value: 2 },
        { value: undefined },
        { value: 3 }
      ]
    };
    
    Object.assign(environment, {
      embeddedData: data,
      currentOptions: { filters: [] }
    });

    const options = {
      histogramField: 'value',
      binCount: 3
    };
    
    const boundFunction = generateHistogram.bind(environment);
    const result = boundFunction.call(environment, data, options);
    
    assert.ok(result.histogramData.isNumeric);
    // Should only process the 3 non-null values
    const totalCount = result.histogramData.bins.reduce((sum, bin) => sum + bin.count, 0);
    assert.strictEqual(totalCount, 3);
  });

  test('histogram bin distribution', () => {
    // Test that values are correctly distributed across bins
    const data = {
      rows: [
        { value: 0 },
        { value: 10 },
        { value: 20 },
        { value: 30 },
        { value: 40 }
      ]
    };
    
    Object.assign(environment, {
      embeddedData: data,
      currentOptions: { filters: [] }
    });

    const options = {
      histogramField: 'value',
      binCount: 5
    };
    
    const boundFunction = generateHistogram.bind(environment);
    const result = boundFunction.call(environment, data, options);
    
    // Nice bin calculation may create different number of bins for better boundaries
    assert(result.histogramData.bins.length >= 3 && result.histogramData.bins.length <= 7);
    const totalCount = result.histogramData.bins.reduce((sum, bin) => sum + bin.count, 0);
    assert.strictEqual(totalCount, 5);
  });

  test('generateNumericHistogram with decimal values', () => {
    const values = [0.1, 0.2, 0.3, 0.4, 0.5];
    
    const boundFunction = generateNumericHistogram.bind(environment);
    const result = boundFunction.call(environment, values, 2);
    
    // Check that labels are properly formatted for decimal values
    assert(result.bins[0].label.includes('-'));
    assert(typeof result.bins[0].label === 'string');
    
    // All values should be counted
    const totalCount = result.bins.reduce((sum, bin) => sum + bin.count, 0);
    assert.strictEqual(totalCount, 5);
  });

  test('generateCategoricalHistogram sorting', () => {
    const values = ['Low', 'High', 'Medium', 'High', 'Medium', 'High'];
    
    const boundFunction = generateCategoricalHistogram.bind(environment);
    const result = boundFunction.call(environment, values);
    
    // Should be sorted by count (descending)
    assert.strictEqual(result.bins[0].label, 'High');
    assert.strictEqual(result.bins[0].count, 3);
    assert.strictEqual(result.bins[1].label, 'Medium');
    assert.strictEqual(result.bins[1].count, 2);
    assert.strictEqual(result.bins[2].label, 'Low');
    assert.strictEqual(result.bins[2].count, 1);
  });

  test('histogram with single value', () => {
    const data = {
      rows: [
        { value: 42 }
      ]
    };
    
    Object.assign(environment, {
      embeddedData: data,
      currentOptions: { filters: [] }
    });

    const options = {
      histogramField: 'value',
      binCount: 5
    };
    
    const boundFunction = generateHistogram.bind(environment);
    const result = boundFunction.call(environment, data, options);
    
    // Should handle single value gracefully
    assert.strictEqual(result.histogramData.bins.length, 1);
    assert.strictEqual(result.histogramData.bins[0].count, 1);
  });

  test('histogram with empty data', () => {
    const data = {
      rows: []
    };
    
    Object.assign(environment, {
      embeddedData: data,
      currentOptions: { filters: [] }
    });

    const options = {
      histogramField: 'value',
      binCount: 5
    };
    
    const boundFunction = generateHistogram.bind(environment);
    const result = boundFunction.call(environment, data, options);
    
    // Should handle empty data gracefully
    assert.strictEqual(result.histogramData.isNumeric, false);
    assert.strictEqual(result.histogramData.bins.length, 0);
  });

  test('generateNumericHistogram with zero values', () => {
    const values = [];
    
    const boundFunction = generateNumericHistogram.bind(environment);
    const result = boundFunction.call(environment, values, 10);
    
    assert.strictEqual(result.isNumeric, true);
    assert.strictEqual(result.bins.length, 0);
  });

  test('histogram chart bounds', () => {
    const data = {
      rows: [
        { value: 1 },
        { value: 2 },
        { value: 3 }
      ]
    };
    
    Object.assign(environment, {
      embeddedData: data,
      currentOptions: { filters: [] },
      chartDimensions: {
        width: 800,
        height: 600,
        padding: 60
      }
    });

    const options = {
      histogramField: 'value',
      binCount: 3
    };
    
    const boundFunction = generateHistogram.bind(environment);
    const result = boundFunction.call(environment, data, options);
    
    assert.ok(result.chartBounds);
    assert.strictEqual(result.chartBounds.left, 240 + 60); // controlPanelWidth + padding
    assert.strictEqual(result.chartBounds.top, 60);
    assert.strictEqual(result.chartBounds.width, 800 - 240 - 60 - 20); // width - controlPanelWidth - padding - 20
    assert.strictEqual(result.chartBounds.height, 600 - 2 * 60); // height - 2 * padding
  });
});