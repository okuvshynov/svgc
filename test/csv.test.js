import { test, describe } from 'node:test';
import assert from 'node:assert';
import { writeFileSync, unlinkSync } from 'fs';
import { parseCSV, inferFieldTypes, getNumericFields, getStringFields } from '../src/csv.js';

describe('CSV Parser', () => {
  const testFile = 'test/test-data.csv';
  
  test('should parse basic CSV with headers', () => {
    const csvContent = `name,age,score
John,25,85.5
Jane,30,92.0
Bob,22,78.3`;
    
    writeFileSync(testFile, csvContent);
    
    try {
      const result = parseCSV(testFile);
      
      assert.deepStrictEqual(result.headers, ['name', 'age', 'score']);
      assert.strictEqual(result.rows.length, 3);
      assert.strictEqual(result.rows[0].name, 'John');
      assert.strictEqual(result.rows[0].age, 25);
      assert.strictEqual(result.rows[0].score, 85.5);
    } finally {
      unlinkSync(testFile);
    }
  });
  
  test('should handle quoted values with commas', () => {
    const csvContent = `name,description,value
"John Smith","A person, who works",100
"Jane Doe","Another person, also working",200`;
    
    writeFileSync(testFile, csvContent);
    
    try {
      const result = parseCSV(testFile);
      
      assert.strictEqual(result.rows[0].name, 'John Smith');
      assert.strictEqual(result.rows[0].description, 'A person, who works');
      assert.strictEqual(result.rows[0].value, 100);
    } finally {
      unlinkSync(testFile);
    }
  });
  
  test('should infer field types correctly', () => {
    const data = {
      headers: ['name', 'age', 'score', 'active'],
      rows: [
        { name: 'John', age: 25, score: 85.5, active: 'true' },
        { name: 'Jane', age: 30, score: 92.0, active: 'false' },
        { name: 'Bob', age: 22, score: 78.3, active: 'true' }
      ]
    };
    
    const types = inferFieldTypes(data);
    
    assert.strictEqual(types.name, 'string');
    assert.strictEqual(types.age, 'number');
    assert.strictEqual(types.score, 'number');
    assert.strictEqual(types.active, 'string');
  });
  
  test('should get numeric fields correctly', () => {
    const data = {
      headers: ['name', 'age', 'score', 'active'],
      rows: [
        { name: 'John', age: 25, score: 85.5, active: 'true' },
        { name: 'Jane', age: 30, score: 92.0, active: 'false' }
      ]
    };
    
    const numericFields = getNumericFields(data);
    assert.deepStrictEqual(numericFields, ['age', 'score']);
  });
  
  test('should get string fields correctly', () => {
    const data = {
      headers: ['name', 'age', 'score', 'active'],
      rows: [
        { name: 'John', age: 25, score: 85.5, active: 'true' },
        { name: 'Jane', age: 30, score: 92.0, active: 'false' }
      ]
    };
    
    const stringFields = getStringFields(data);
    assert.deepStrictEqual(stringFields, ['name', 'active']);
  });
  
  test('should handle empty fields', () => {
    const csvContent = `name,age,score
John,25,85.5
Jane,,92.0
Bob,22,`;
    
    writeFileSync(testFile, csvContent);
    
    try {
      const result = parseCSV(testFile);
      
      assert.strictEqual(result.rows[1].age, '');
      assert.strictEqual(result.rows[2].score, '');
    } finally {
      unlinkSync(testFile);
    }
  });
  
  test('should throw error for empty file', () => {
    const csvContent = '';
    
    writeFileSync(testFile, csvContent);
    
    try {
      assert.throws(() => {
        parseCSV(testFile);
      }, /CSV file contains no data rows/);
    } finally {
      unlinkSync(testFile);
    }
  });
});