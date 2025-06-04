import { test } from 'node:test';
import assert from 'node:assert';
import { loadEmbedded, loadEmbeddedChart, loadEmbeddedUtil } from '../src/embedded-loader.js';

test('Embedded Loader', async (t) => {
  await t.test('loadEmbedded', async (t) => {
    await t.test('should load and process a utility module', () => {
      const content = loadEmbedded('chart-utils');
      
      // Should contain the function definitions without export statements
      assert.strictEqual(content.includes('function generateTicks'), true);
      assert.strictEqual(content.includes('function formatNumber'), true);
      assert.strictEqual(content.includes('function generateColors'), true);
      assert.strictEqual(content.includes('function createSVGElement'), true);
      
      // Should have removed export statements
      assert.strictEqual(content.includes('export function'), false);
      assert.strictEqual(content.includes('import {'), false);
    });

    await t.test('should load from subdirectory', () => {
      const content = loadEmbedded('histogram-chart', 'charts');
      
      // Should contain histogram chart functions
      assert.strictEqual(content.includes('function generateHistogram'), true);
      assert.strictEqual(content.includes('function generateNumericHistogram'), true);
      assert.strictEqual(content.includes('function generateCategoricalHistogram'), true);
      
      // Should have removed export statements
      assert.strictEqual(content.includes('export function'), false);
    });

    await t.test('should throw error for non-existent module', () => {
      assert.throws(() => {
        loadEmbedded('non-existent-module');
      }, {
        message: /Failed to load embedded module 'non-existent-module'/
      });
    });

    await t.test('should throw error for non-existent subdirectory', () => {
      assert.throws(() => {
        loadEmbedded('some-module', 'non-existent-dir');
      }, {
        message: /Failed to load embedded module 'some-module'/
      });
    });
  });

  await t.test('loadEmbeddedChart', async (t) => {
    await t.test('should load histogram chart implementation', () => {
      const content = loadEmbeddedChart('histogram-chart');
      
      assert.strictEqual(content.includes('function generateHistogram'), true);
      assert.strictEqual(content.includes('function renderHistogramChart'), true);
      assert.strictEqual(content.includes('export function'), false);
    });

    await t.test('should load scatter chart implementation', () => {
      const content = loadEmbeddedChart('scatter-chart');
      
      assert.strictEqual(content.includes('function generateScatterChart'), true);
      assert.strictEqual(content.includes('function renderScatterChart'), true);
      assert.strictEqual(content.includes('export function'), false);
    });
  });

  await t.test('loadEmbeddedUtil', async (t) => {
    await t.test('should load chart utilities', () => {
      const content = loadEmbeddedUtil('chart-utils');
      
      assert.strictEqual(content.includes('function generateTicks'), true);
      assert.strictEqual(content.includes('function formatNumber'), true);
      assert.strictEqual(content.includes('export function'), false);
    });

    await t.test('should load filter utilities', () => {
      const content = loadEmbeddedUtil('filter-utils');
      
      assert.strictEqual(content.includes('function applyFilters'), true);
      assert.strictEqual(content.includes('function evaluateFilter'), true);
      assert.strictEqual(content.includes('export function'), false);
    });

    await t.test('should load UI components', () => {
      const content = loadEmbeddedUtil('ui-components');
      
      assert.strictEqual(content.includes('function createValueInput'), true);
      assert.strictEqual(content.includes('function createUIGroup'), true);
      assert.strictEqual(content.includes('export function'), false);
    });
  });

  await t.test('module syntax removal', async (t) => {
    await t.test('should remove export function statements', () => {
      const content = loadEmbeddedUtil('chart-utils');
      
      // Should not contain any export function statements
      assert.strictEqual(content.match(/export function/g), null);
      
      // Should still contain regular function statements
      assert.strictEqual(content.includes('function generateTicks'), true);
    });

    await t.test('should remove export blocks', () => {
      const content = loadEmbeddedUtil('filter-utils');
      
      // Should not contain export blocks like "export { ... }"
      assert.strictEqual(content.match(/export \{[^}]+\}/g), null);
    });

    await t.test('should remove import statements', () => {
      const content = loadEmbeddedUtil('ui-components');
      
      // Should not contain import statements
      assert.strictEqual(content.match(/import \{[^}]+\} from/g), null);
    });

    await t.test('should preserve function bodies and logic', () => {
      const content = loadEmbeddedUtil('chart-utils');
      
      // Should preserve complex logic inside functions
      assert.strictEqual(content.includes('Math.pow(10, Math.floor(Math.log10(roughStep)))'), true);
      assert.strictEqual(content.includes('document.createElementNS'), true);
      assert.strictEqual(content.includes('element.setAttribute'), true);
    });
  });

  await t.test('error handling', async (t) => {
    await t.test('should provide helpful error messages', () => {
      try {
        loadEmbedded('missing-file');
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.strictEqual(error.message.includes('Failed to load embedded module'), true);
        assert.strictEqual(error.message.includes('missing-file'), true);
      }
    });

    await t.test('should include file path in error message', () => {
      try {
        loadEmbeddedChart('missing-chart');
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.strictEqual(error.message.includes('missing-chart-impl.js'), true);
      }
    });
  });
});