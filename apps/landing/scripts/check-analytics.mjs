// Run with: node scripts/check-analytics.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const component = readFileSync(new URL('../src/components/Analytics.astro', import.meta.url), 'utf8');
const source = component.match(/<script is:inline>([\s\S]*?)<\/script>/)[1];
const key = 'sqp-analytics-consent';
const measurementId = 'G-4X9B1G9ESM';
const headers = readFileSync(new URL('../public/_headers', import.meta.url), 'utf8');
assert.match(headers, /script-src[^;]*https:\/\/www\.googletagmanager\.com/);
assert.match(headers, /connect-src[^;]*https:\/\/\*\.google-analytics\.com/);

function visit(saved, { hostname = 'sidequestplugins.com', blockedStorage = false } = {}) {
  const elements = new Map();
  for (const id of ['analytics-consent', 'analytics-accept', 'analytics-reject', 'settings']) {
    elements.set(id, { hidden: true, addEventListener(type, fn) { this[type] = fn; }, focus() {} });
  }
  const scripts = [];
  const deletedCookies = [];
  let stored = saved;
  let reloads = 0;
  const document = {
    getElementById: id => elements.get(id),
    querySelector: () => elements.get('settings'),
    referrer: 'https://example.com/tutorial?email=private@example.com',
    createElement: () => ({}),
    head: { appendChild: script => scripts.push(script) },
    get cookie() { return '_ga=old; _ga_4X9B1G9ESM=session; essential=keep'; },
    set cookie(value) { deletedCookies.push(value); },
  };
  const window = { addEventListener(type, fn) { this[type] = fn; } };
  vm.runInNewContext(source, {
    document, window, URL, URLSearchParams,
    location: { hostname, href: `https://${hostname}/?utm_source=youtube&utm_campaign=launch&token=secret#private`, reload() { reloads++; } },
    localStorage: {
      getItem() { if (blockedStorage) throw Error('blocked'); return stored ?? null; },
      setItem(name, value) { if (blockedStorage) throw Error('blocked'); assert.equal(name, key); stored = value; },
    },
  });
  return { elements, scripts, window, deletedCookies, get stored() { return stored; }, get reloads() { return reloads; } };
}

const fresh = visit();
assert.equal(fresh.scripts.length, 0);
assert.equal(fresh.elements.get('analytics-consent').hidden, false);
fresh.window.gtag('event', 'purchase', { transaction_id: 'before-consent' });
assert.equal(fresh.window.dataLayer.length, 1, 'Pre-consent checkout events must be discarded');
fresh.elements.get('analytics-accept').click();
assert.equal(fresh.scripts.length, 1);
assert.match(fresh.scripts[0].src, /G-4X9B1G9ESM$/);
const config = fresh.window.dataLayer.find(entry => entry[0] === 'config')[2];
assert.equal(config.page_location, 'https://sidequestplugins.com/?utm_source=youtube&utm_campaign=launch');
assert.equal(config.page_referrer, 'https://example.com/tutorial');
assert.equal(config.allow_google_signals, false);
fresh.window.gtag('event', 'purchase', { transaction_id: 'after-consent' });
assert.equal(fresh.window.dataLayer.at(-1)[1], 'purchase');
fresh.elements.get('analytics-accept').click();
assert.equal(fresh.scripts.length, 1, 'Consent must not load duplicate tags');
assert.equal(visit(fresh.stored).scripts.length, 1, 'Consent persists across page loads');
fresh.elements.get('settings').click();
assert.equal(fresh.elements.get('analytics-consent').hidden, false);
fresh.elements.get('analytics-reject').click();
assert.equal(fresh.window['ga-disable-' + measurementId], true);
assert.equal(fresh.reloads, 1);
assert.ok(fresh.deletedCookies.some(cookie => cookie.startsWith('_ga=')));
assert.ok(fresh.deletedCookies.every(cookie => !cookie.startsWith('essential=')));
const rejected = visit(fresh.stored);
assert.equal(rejected.scripts.length, 0);
assert.equal(rejected.elements.get('analytics-consent').hidden, true);
rejected.window.storage({ key });
assert.equal(rejected.reloads, 1, 'Other tabs must pick up changed consent');
for (const saved of ['broken', JSON.stringify({ accepted: true, expires: 1 })]) {
  const page = visit(saved);
  assert.equal(page.scripts.length, 0);
  assert.equal(page.elements.get('analytics-consent').hidden, false);
}
const blocked = visit(null, { blockedStorage: true });
blocked.elements.get('analytics-reject').click();
assert.equal(blocked.scripts.length, 0);
const local = visit(null, { hostname: 'localhost' });
local.elements.get('analytics-accept').click();
assert.equal(local.scripts.length, 0, 'Development traffic must not reach production GA');
console.log('Analytics consent, attribution, checkout events, withdrawal, and storage checks passed.');
