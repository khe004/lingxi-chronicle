const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('dist/index.html', 'utf8');
const app = fs.readFileSync('dist/app.js', 'utf8');
const style = fs.readFileSync('dist/style.css', 'utf8');

assert.match(html, /class="data-row small chapter-deadline-row"[^>]*>.*?id="chapter-deadline"/s,
  'the chapter deadline belongs in the always-visible status block');
assert.match(app, /chapterRemain<=24/,
  'the deadline should enter urgent state with two years or less remaining');
assert.match(app, /closest\('\.chapter-deadline-row'\)\.classList\.toggle\('urgent-deadline',urgentDeadline\)/,
  'urgent state must reach the whole deadline row');
assert.match(style, /\.chapter-deadline-row\.urgent-deadline\{[^}]*border-color:/,
  'urgent state must have a visible row treatment');
assert.match(style, /\.chapter-deadline-row\.urgent-deadline>span,\.chapter-deadline-row\.urgent-deadline>b\{color:/,
  'urgent text must also change color for visibility');

console.log('Deadline UI contract checks passed');
