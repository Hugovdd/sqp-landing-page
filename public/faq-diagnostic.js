// FAQ Diagnostic Script - Comprehensive Testing
// Copy and paste this entire script into your browser console at http://localhost:4321/

console.clear();
console.log('%c=== FAQ ACCORDION DIAGNOSTIC REPORT ===', 'color: #4ec9b0; font-size: 16px; font-weight: bold');
console.log('Generated:', new Date().toLocaleString());
console.log('\n');

// Step 1: Check for console errors (manual check)
console.log('%c1. CONSOLE ERRORS:', 'color: #569cd6; font-weight: bold');
console.log('   → Check above this line for any red error messages');
console.log('\n');

// Step 2: Find FAQ section
console.log('%c2. FAQ SECTION:', 'color: #569cd6; font-weight: bold');
const faqSection = document.querySelector('section.py-28.lg\\:py-32, section.py-28');
console.log('   Found:', !!faqSection);
if (faqSection) {
    console.log('   Element:', faqSection);
    console.log('   Visible:', window.getComputedStyle(faqSection).display !== 'none');
    console.log('   Opacity:', window.getComputedStyle(faqSection).opacity);
}
console.log('\n');

// Step 3: Check all astro-island elements
console.log('%c3. ALL ASTRO-ISLAND ELEMENTS:', 'color: #569cd6; font-weight: bold');
const islands = document.querySelectorAll('astro-island');
console.log('   Total islands found:', islands.length);
islands.forEach((island, idx) => {
    console.log(`\n   Island ${idx + 1}:`);
    console.log('   Component:', island.getAttribute('component-export'));
    console.log('   Client directive:', island.getAttribute('client'));
    console.log('   HTML (first 500 chars):', island.outerHTML.substring(0, 500));
    console.log('   All attributes:');
    Array.from(island.attributes).forEach(attr => {
        console.log(`     - ${attr.name}: ${attr.value}`);
    });
});
console.log('\n');

// Step 4: Find FAQ-specific astro-island
console.log('%c4. FAQ ASTRO-ISLAND (SPECIFIC):', 'color: #569cd6; font-weight: bold');
const faqIsland = Array.from(islands).find(island => 
    island.getAttribute('component-export') === 'FAQ' ||
    island.querySelector('[data-slot="accordion"]')
);
if (faqIsland) {
    console.log('   Found FAQ island');
    console.log('   Component URL:', faqIsland.getAttribute('component-url'));
    console.log('   Component Export:', faqIsland.getAttribute('component-export'));
    console.log('   Client directive:', faqIsland.getAttribute('client'));
    console.log('   SSR attribute:', faqIsland.getAttribute('ssr'));
    console.log('   Props:', faqIsland.getAttribute('props'));
    console.log('   Complete outerHTML:', faqIsland.outerHTML);
} else {
    console.log('   ❌ No FAQ island found');
}
console.log('\n');

// Step 5: Check AnimateOnScroll wrapper
console.log('%c5. ANIMATE-ON-SCROLL WRAPPER:', 'color: #569cd6; font-weight: bold');
if (faqSection) {
    const animateWrapper = faqSection.closest('[data-animate]');
    if (animateWrapper) {
        console.log('   Found wrapper with data-animate');
        console.log('   Animation type:', animateWrapper.getAttribute('data-animate'));
        console.log('   Has is-visible class:', animateWrapper.classList.contains('is-visible'));
        console.log('   All classes:', Array.from(animateWrapper.classList).join(', '));
        console.log('   Computed styles:');
        const styles = window.getComputedStyle(animateWrapper);
        console.log('     - opacity:', styles.opacity);
        console.log('     - transform:', styles.transform);
        console.log('     - display:', styles.display);
        console.log('   Element:', animateWrapper);
    } else {
        console.log('   No animate wrapper found');
    }
}
console.log('\n');

// Step 6: Check accordion elements
console.log('%c6. ACCORDION ELEMENTS:', 'color: #569cd6; font-weight: bold');
const accordions = document.querySelectorAll('[data-slot="accordion"]');
console.log('   Accordions found:', accordions.length);
accordions.forEach((acc, idx) => {
    console.log(`\n   Accordion ${idx + 1}:`);
    console.log('   Tag:', acc.tagName);
    console.log('   data-slot:', acc.getAttribute('data-slot'));
    console.log('   Element:', acc);
});
console.log('\n');

// Step 7: Check accordion triggers
console.log('%c7. ACCORDION TRIGGERS:', 'color: #569cd6; font-weight: bold');
const triggers = document.querySelectorAll('[data-slot="accordion-trigger"]');
console.log('   Triggers found:', triggers.length);
triggers.forEach((trigger, idx) => {
    console.log(`\n   Trigger ${idx + 1}:`);
    console.log('   Text:', trigger.textContent.trim().substring(0, 60));
    console.log('   onclick:', trigger.onclick);
    console.log('   Has event listeners:', !!trigger.onclick);
    console.log('   Element:', trigger);
});
console.log('\n');

// Step 8: Check for Radix UI hydration
console.log('%c8. REACT/RADIX UI HYDRATION:', 'color: #569cd6; font-weight: bold');
const radixElements = document.querySelectorAll('[data-radix-collection-item], [data-state]');
console.log('   Radix UI elements found:', radixElements.length);
if (radixElements.length > 0) {
    console.log('   ✅ React/Radix appears to be hydrated');
    console.log('   Sample elements:', Array.from(radixElements).slice(0, 3));
} else {
    console.log('   ❌ No Radix UI elements found - component may not be hydrated');
}
console.log('\n');

// Step 9: Test click functionality
console.log('%c9. CLICK FUNCTIONALITY TEST:', 'color: #569cd6; font-weight: bold');
if (triggers.length > 0) {
    const firstTrigger = triggers[0];
    console.log('   First trigger element:', firstTrigger);
    console.log('   Parent accordion item:', firstTrigger.closest('[data-slot="accordion-item"]'));
    console.log('   Current data-state:', firstTrigger.getAttribute('data-state'));
    console.log('\n   → Now manually click the first FAQ question and observe changes');
} else {
    console.log('   ❌ No triggers found to test');
}
console.log('\n');

// Step 10: Check viewport position
console.log('%c10. VIEWPORT POSITION:', 'color: #569cd6; font-weight: bold');
if (faqSection) {
    const rect = faqSection.getBoundingClientRect();
    const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;
    console.log('   FAQ section in viewport:', isInViewport);
    console.log('   Distance from top:', rect.top, 'px');
    console.log('   Window height:', window.innerHeight, 'px');
    console.log('   Section height:', rect.height, 'px');
}
console.log('\n');

// Step 11: Summary and recommendations
console.log('%c11. SUMMARY:', 'color: #4ec9b0; font-weight: bold');
const issues = [];
if (!faqIsland) issues.push('FAQ astro-island not found');
if (triggers.length === 0) issues.push('No accordion triggers found');
if (radixElements.length === 0) issues.push('React/Radix not hydrated');

if (issues.length === 0) {
    console.log('   ✅ All checks passed - accordion should be functional');
} else {
    console.log('   ⚠️ Issues detected:');
    issues.forEach(issue => console.log(`     - ${issue}`));
}

console.log('\n%c=== END DIAGNOSTIC REPORT ===', 'color: #4ec9b0; font-size: 16px; font-weight: bold');
console.log('\nNext steps:');
console.log('1. Scroll to FAQ section if not visible');
console.log('2. Click on a FAQ question');
console.log('3. Re-run this script after clicking');
console.log('4. Report any changes in the console');
