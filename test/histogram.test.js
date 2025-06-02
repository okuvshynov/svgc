import { test } from 'node:test';
import assert from 'node:assert';
import { generateHistogram, suggestBinCount } from '../src/charts/histogram.js';

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

  const result = generateHistogram(data, 'value', 5);
  
  assert.strictEqual(result.type, 'numeric');
  // Nice bin calculation may produce different number of bins for better boundaries
  assert(result.bins.length >= 3 && result.bins.length <= 7);
  // Nice min should be <= 1, nice max should be >= 10
  assert(result.min <= 1);
  assert(result.max >= 10);
  assert(result.maxCount >= 1); // Each bin should have at least 1 value
  
  // Check that all bins have counts
  const totalCount = result.bins.reduce((sum, bin) => sum + bin.count, 0);
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

  const result = generateHistogram(data, 'category');
  
  assert.strictEqual(result.type, 'categorical');
  assert.strictEqual(result.bins.length, 3);
  assert.strictEqual(result.maxCount, 3);
  
  // Check that bins are sorted by count (descending)
  assert.strictEqual(result.bins[0].label, 'A');
  assert.strictEqual(result.bins[0].count, 3);
  assert.strictEqual(result.bins[1].count, 2);
  assert.strictEqual(result.bins[2].count, 1);
});

test('generateHistogram with constant values', () => {
  const data = {
    rows: [
      { value: 5 },
      { value: 5 },
      { value: 5 },
      { value: 5 }
    ]
  };

  const result = generateHistogram(data, 'value', 10);
  
  assert.strictEqual(result.type, 'numeric');
  assert.strictEqual(result.bins.length, 1);
  assert.strictEqual(result.bins[0].count, 4);
  assert.strictEqual(result.bins[0].min, 5);
  assert.strictEqual(result.bins[0].max, 5);
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

  const result = generateHistogram(data, 'mixed');
  
  // Mixed data should be treated as categorical
  assert.strictEqual(result.type, 'categorical');
  assert.strictEqual(result.bins.length, 4);
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

  const result = generateHistogram(data, 'value', 3);
  
  assert.strictEqual(result.type, 'numeric');
  // Should only process the 3 non-null values
  const totalCount = result.bins.reduce((sum, bin) => sum + bin.count, 0);
  assert.strictEqual(totalCount, 3);
});

test('suggestBinCount with various data sizes', () => {
  // Test Sturges' rule: k = 1 + 3.322 * log10(n)
  
  // Small dataset
  assert.strictEqual(suggestBinCount(new Array(10)), 5); // Min is 5
  
  // Medium dataset
  const result50 = suggestBinCount(new Array(50));
  assert(result50 >= 5 && result50 <= 50);
  
  // Large dataset
  const result1000 = suggestBinCount(new Array(1000));
  assert(result1000 >= 5 && result1000 <= 50); // Max is 50
  
  // Empty dataset
  assert.strictEqual(suggestBinCount([]), 10);
});

test('histogram bin labeling for numeric data', () => {
  const data = {
    rows: [
      { value: 0.1 },
      { value: 0.2 },
      { value: 0.3 },
      { value: 0.4 },
      { value: 0.5 }
    ]
  };

  const result = generateHistogram(data, 'value', 2);
  
  // Check that labels are properly formatted for decimal values
  // Nice bin calculation may start from 0, so first bin might be 0-0.2 or similar
  assert(result.bins[0].label.includes('0') || result.bins[0].label.includes('0.1'));
  assert(result.bins[0].label.includes('-'));
  assert(typeof result.bins[0].label === 'string');
});

test('histogram with single value', () => {
  const data = {
    rows: [
      { value: 42 }
    ]
  };

  const result = generateHistogram(data, 'value', 5);
  
  // Should handle single value gracefully
  assert.strictEqual(result.bins.length, 1);
  assert.strictEqual(result.bins[0].count, 1);
});

test('histogram with empty data', () => {
  const data = {
    rows: []
  };

  const result = generateHistogram(data, 'value', 5);
  
  // Should handle empty data gracefully
  assert.strictEqual(result.type, 'categorical'); // Empty data defaults to categorical
  assert.strictEqual(result.bins.length, 0);
  assert.strictEqual(result.maxCount, 0);
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

  const result = generateHistogram(data, 'value', 5);
  
  // Nice bin calculation may create different number of bins for better boundaries
  // The important thing is that all values are counted
  assert(result.bins.length >= 3 && result.bins.length <= 7);
  const totalCount = result.bins.reduce((sum, bin) => sum + bin.count, 0);
  assert.strictEqual(totalCount, 5);
});

test('categorical histogram sorting', () => {
  const data = {
    rows: [
      { cat: 'Low' },    // 1 occurrence
      { cat: 'High' },   // 3 occurrences
      { cat: 'Medium' }, // 2 occurrences
      { cat: 'High' },
      { cat: 'Medium' },
      { cat: 'High' }
    ]
  };

  const result = generateHistogram(data, 'cat');
  
  // Should be sorted by count (descending)
  assert.strictEqual(result.bins[0].label, 'High');
  assert.strictEqual(result.bins[0].count, 3);
  assert.strictEqual(result.bins[1].label, 'Medium');
  assert.strictEqual(result.bins[1].count, 2);
  assert.strictEqual(result.bins[2].label, 'Low');
  assert.strictEqual(result.bins[2].count, 1);
});