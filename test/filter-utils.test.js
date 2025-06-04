import { test } from 'node:test';
import assert from 'node:assert';
import { applyFilters, evaluateFilter, createNewFilter } from '../src/embedded/filter-utils.js';

test('Filter Utilities', async (t) => {
  const sampleData = [
    { name: 'Alice', age: 25, city: 'New York', score: 95.5 },
    { name: 'Bob', age: 30, city: 'Los Angeles', score: 87.2 },
    { name: 'Charlie', age: 25, city: 'New York', score: 92.0 },
    { name: 'David', age: 35, city: 'Chicago', score: 88.5 },
    { name: 'Eve', age: 28, city: 'Los Angeles', score: 91.3 }
  ];

  await t.test('evaluateFilter', async (t) => {
    await t.test('should handle equality operator (=)', () => {
      const filter = { field: 'age', operator: '=', value: '25' };
      assert.strictEqual(evaluateFilter(sampleData[0], filter), true);  // Alice is 25
      assert.strictEqual(evaluateFilter(sampleData[1], filter), false); // Bob is 30
    });

    await t.test('should handle inequality operator (!=)', () => {
      const filter = { field: 'city', operator: '!=', value: 'New York' };
      assert.strictEqual(evaluateFilter(sampleData[0], filter), false); // Alice is in NY
      assert.strictEqual(evaluateFilter(sampleData[1], filter), true);  // Bob is in LA
    });

    await t.test('should handle greater than operator (>)', () => {
      const filter = { field: 'score', operator: '>', value: '90' };
      assert.strictEqual(evaluateFilter(sampleData[0], filter), true);  // 95.5 > 90
      assert.strictEqual(evaluateFilter(sampleData[1], filter), false); // 87.2 > 90
    });

    await t.test('should handle less than operator (<)', () => {
      const filter = { field: 'age', operator: '<', value: '30' };
      assert.strictEqual(evaluateFilter(sampleData[0], filter), true);  // 25 < 30
      assert.strictEqual(evaluateFilter(sampleData[1], filter), false); // 30 < 30
      assert.strictEqual(evaluateFilter(sampleData[3], filter), false); // 35 < 30
    });

    await t.test('should handle greater than or equal operator (>=)', () => {
      const filter = { field: 'age', operator: '>=', value: '30' };
      assert.strictEqual(evaluateFilter(sampleData[0], filter), false); // 25 >= 30
      assert.strictEqual(evaluateFilter(sampleData[1], filter), true);  // 30 >= 30
      assert.strictEqual(evaluateFilter(sampleData[3], filter), true);  // 35 >= 30
    });

    await t.test('should handle less than or equal operator (<=)', () => {
      const filter = { field: 'score', operator: '<=', value: '90' };
      assert.strictEqual(evaluateFilter(sampleData[0], filter), false); // 95.5 <= 90
      assert.strictEqual(evaluateFilter(sampleData[1], filter), true);  // 87.2 <= 90
      assert.strictEqual(evaluateFilter(sampleData[3], filter), true);  // 88.5 <= 90
    });

    await t.test('should handle contains operator (case insensitive)', () => {
      const filter = { field: 'name', operator: 'contains', value: 'li' };
      assert.strictEqual(evaluateFilter(sampleData[0], filter), true);  // Alice contains 'li'
      assert.strictEqual(evaluateFilter(sampleData[1], filter), false); // Bob doesn't contain 'li'
      assert.strictEqual(evaluateFilter(sampleData[2], filter), true);  // Charlie contains 'li'
    });

    await t.test('should handle starts_with operator (case insensitive)', () => {
      const filter = { field: 'city', operator: 'starts_with', value: 'new' };
      assert.strictEqual(evaluateFilter(sampleData[0], filter), true);  // New York starts with 'new'
      assert.strictEqual(evaluateFilter(sampleData[1], filter), false); // Los Angeles doesn't start with 'new'
    });

    await t.test('should handle ends_with operator (case insensitive)', () => {
      const filter = { field: 'city', operator: 'ends_with', value: 'angeles' };
      assert.strictEqual(evaluateFilter(sampleData[0], filter), false); // New York doesn't end with 'angeles'
      assert.strictEqual(evaluateFilter(sampleData[1], filter), true);  // Los Angeles ends with 'angeles'
    });

    await t.test('should convert string filter values to numbers for numeric fields', () => {
      const filter = { field: 'age', operator: '>', value: '25' };
      assert.strictEqual(evaluateFilter(sampleData[0], filter), false); // 25 > 25
      assert.strictEqual(evaluateFilter(sampleData[1], filter), true);  // 30 > 25
    });

    await t.test('should handle type coercion for equality', () => {
      const filter = { field: 'age', operator: '=', value: '25' };
      assert.strictEqual(evaluateFilter(sampleData[0], filter), true); // 25 == '25'
    });

    await t.test('should handle unknown operators (default to true)', () => {
      const filter = { field: 'age', operator: 'unknown_op', value: '25' };
      assert.strictEqual(evaluateFilter(sampleData[0], filter), true);
    });

    await t.test('should handle string comparisons for string operators', () => {
      const filter = { field: 'name', operator: 'contains', value: 'ALICE' };
      assert.strictEqual(evaluateFilter(sampleData[0], filter), true); // Case insensitive
    });

    await t.test('should handle numeric strings in data', () => {
      const data = { value: '42' };
      const filter = { field: 'value', operator: '>', value: '40' };
      assert.strictEqual(evaluateFilter(data, filter), true); // '42' > 40
    });
  });

  await t.test('applyFilters', async (t) => {
    await t.test('should return all rows when no filters provided', () => {
      const result = applyFilters(sampleData, null);
      assert.deepStrictEqual(result, sampleData);
    });

    await t.test('should return all rows when empty filters array', () => {
      const result = applyFilters(sampleData, []);
      assert.deepStrictEqual(result, sampleData);
    });

    await t.test('should apply single filter correctly', () => {
      const filters = [{ field: 'city', operator: '=', value: 'New York' }];
      const result = applyFilters(sampleData, filters);
      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].name, 'Alice');
      assert.strictEqual(result[1].name, 'Charlie');
    });

    await t.test('should apply multiple filters with AND logic', () => {
      const filters = [
        { field: 'city', operator: '=', value: 'New York' },
        { field: 'age', operator: '=', value: '25' }
      ];
      const result = applyFilters(sampleData, filters);
      assert.strictEqual(result.length, 2); // Alice and Charlie are both 25 in NY
    });

    await t.test('should handle complex filter combinations', () => {
      const filters = [
        { field: 'score', operator: '>', value: '90' },
        { field: 'city', operator: '!=', value: 'Chicago' }
      ];
      const result = applyFilters(sampleData, filters);
      assert.strictEqual(result.length, 3); // Alice, Charlie, Eve (score > 90 and not in Chicago)
    });

    await t.test('should return empty array when no rows match filters', () => {
      const filters = [
        { field: 'age', operator: '>', value: '100' }
      ];
      const result = applyFilters(sampleData, filters);
      assert.strictEqual(result.length, 0);
    });

    await t.test('should handle text filters with numbers', () => {
      const filters = [
        { field: 'name', operator: 'contains', value: 'e' }
      ];
      const result = applyFilters(sampleData, filters);
      assert.strictEqual(result.length, 3); // Alice, Charlie, Eve
    });
  });

  await t.test('createNewFilter', async (t) => {
    await t.test('should create filter with default values', () => {
      const fields = ['name', 'age', 'city'];
      const filter = createNewFilter(fields);
      
      assert.strictEqual(filter.field, 'name'); // First field
      assert.strictEqual(filter.operator, '=');
      assert.strictEqual(filter.value, '');
      assert.strictEqual(typeof filter.id, 'number');
    });

    await t.test('should create unique IDs for filters', async () => {
      const fields = ['name', 'age'];
      const filter1 = createNewFilter(fields);
      
      // Wait a tiny bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 1));
      
      const filter2 = createNewFilter(fields);
      
      assert.notStrictEqual(filter1.id, filter2.id);
    });

    await t.test('should use first field from provided array', () => {
      const fields = ['score', 'name', 'age'];
      const filter = createNewFilter(fields);
      
      assert.strictEqual(filter.field, 'score');
    });

    await t.test('should handle empty fields array', () => {
      const fields = [];
      const filter = createNewFilter(fields);
      
      assert.strictEqual(filter.field, undefined);
      assert.strictEqual(filter.operator, '=');
      assert.strictEqual(filter.value, '');
    });
  });
});