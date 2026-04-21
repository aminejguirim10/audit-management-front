const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to the application
    console.log('Navigating to localhost:4200...');
    await page.goto('http://localhost:4200', { waitUntil: 'networkidle' });
    
    // Fill in the form fields using the provided element references
    console.log('Filling form fields...');
    
    // Fill title field (e129)
    await page.fill('[data-test-id="e129"]', 'Test4');
    console.log('? Title filled: Test4');
    
    // Fill dateDebut field (e140)
    await page.fill('[data-test-id="e140"]', '2026-12-01');
    console.log('? Date start filled: 2026-12-01');
    
    // Fill dateFin field (e143)
    await page.fill('[data-test-id="e143"]', '2026-12-15');
    console.log('? Date end filled: 2026-12-15');
    
    // Select security from typecombo (e136)
    await page.selectOption('[data-test-id="e136"]', 'security');
    console.log('? Type selected: security');
    
    // Click next button (e146)
    console.log('Clicking Suivant button...');
    await page.click('[data-test-id="e146"]');
    console.log('? Button clicked');
    
    // Wait for page transition
    await page.waitForLoadState('networkidle');
    console.log('? Step 2 reached');
    console.log('SUCCESS: Form filled and submitted');
    
  } catch (error) {
    console.error('ERROR:', error.message);
    process.exit(1);
  } finally {
    await context.close();
    await browser.close();
  }
})();
