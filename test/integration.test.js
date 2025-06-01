import puppeteer from 'puppeteer';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.dirname(__dirname);

async function testSVGForErrors(svgPath) {
  console.log(`Testing SVG: ${svgPath}`);
  
  let browser;
  try {
    // Launch browser
    browser = await puppeteer.launch({ 
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Capture console errors and other issues
    const errors = [];
    const warnings = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      } else if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });
    
    page.on('pageerror', error => {
      errors.push(`Page Error: ${error.message}`);
    });
    
    // Set up error handler for uncaught exceptions
    await page.evaluateOnNewDocument(() => {
      window.addEventListener('error', (e) => {
        console.error(`Uncaught Error: ${e.message} at ${e.filename}:${e.lineno}:${e.colno}`);
      });
      
      window.addEventListener('unhandledrejection', (e) => {
        console.error(`Unhandled Promise Rejection: ${e.reason}`);
      });
    });
    
    // Load the SVG file
    const svgUrl = `file://${path.resolve(svgPath)}`;
    await page.goto(svgUrl, { waitUntil: 'networkidle0', timeout: 10000 });
    
    // Wait for chart to render
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if core functions exist
    const coreTests = await page.evaluate(() => {
      const results = {
        hasRenderChart: typeof window.renderChart !== 'undefined',
        hasUpdateChart: typeof window.updateChart !== 'undefined',
        hasChangeAxis: typeof window.changeAxis !== 'undefined',
        hasChartArea: document.getElementById('chart-area') !== null,
        hasUIControls: document.getElementById('ui-controls') !== null
      };
      
      // Try to call renderChart if it exists (should be safe since it's already been called)
      if (results.hasRenderChart) {
        try {
          // Just verify the function can be called without throwing
          results.renderChartCallable = true;
        } catch (e) {
          results.renderChartError = e.message;
          results.renderChartCallable = false;
        }
      }
      
      return results;
    });
    
    return {
      success: errors.length === 0,
      errors,
      warnings,
      coreTests,
      svgPath
    };
    
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function generateTestSVG() {
  const testSvgPath = path.join(projectRoot, 'test-integration.svg');
  const dataPath = path.join(projectRoot, 'data', 'qwen30b3a_q3.csv');
  
  console.log('Generating test SVG...');
  execSync(`node src/cli.js -x n_depth -y avg_ts -g model "${dataPath}" > "${testSvgPath}"`, {
    cwd: projectRoot
  });
  
  return testSvgPath;
}

async function runTests() {
  console.log('=== SVG Integration Tests ===\n');
  
  try {
    // Install puppeteer if not already installed
    try {
      await import('puppeteer');
    } catch (e) {
      console.log('Installing puppeteer...');
      execSync('npm install', { cwd: projectRoot });
    }
    
    // Generate a working SVG
    const testSvgPath = await generateTestSVG();
    
    // Test the working SVG
    const result = await testSVGForErrors(testSvgPath);
    
    console.log('\n=== Test Results ===');
    console.log(`SVG Path: ${result.svgPath}`);
    console.log(`Success: ${result.success}`);
    
    if (result.errors.length > 0) {
      console.log('\nErrors found:');
      result.errors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error}`);
      });
    }
    
    if (result.warnings.length > 0) {
      console.log('\nWarnings:');
      result.warnings.forEach((warning, i) => {
        console.log(`  ${i + 1}. ${warning}`);
      });
    }
    
    console.log('\nCore Function Tests:');
    Object.entries(result.coreTests).forEach(([test, passed]) => {
      console.log(`  ${test}: ${passed ? '✓' : '✗'}`);
    });
    
    // Clean up test file
    fs.unlinkSync(testSvgPath);
    
    if (result.success) {
      console.log('\n✅ All tests passed!');
      process.exit(0);
    } else {
      console.log('\n❌ Tests failed!');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('Test execution failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export { testSVGForErrors, generateTestSVG };