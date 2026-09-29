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
assert.match(app, /title\.ordealHelp='问气机逆乱'/,
  'the new ordeal investigation should have an explicit prompt title');
assert.match(app, /description\.ordealHelp='[^']*调查不耗月份，也不锁路线/,
  'the new ordeal investigation should explain that inspection is free and does not lock a route');
assert.match(style, /@media\(max-width:767px\)\{\s*\.ui-redesign \.compact-values\{grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/s,
  'the mobile resource strip should keep all five values across one full-width row');
assert.match(style, /\.ui-redesign \.compact-values span\{[^}]*flex-direction:row[^}]*white-space:nowrap/,
  'each mobile resource label and value should stay on the same line');
assert.match(style, /@media\(max-width:1023px\)\{[\s\S]*?\.ui-redesign \.primary-tabs\{position:fixed[\s\S]*?\.ui-redesign \.compact-values\{display:flex;justify-content:space-between/,
  'the top resource strip and fixed bottom tabs should switch together, with resources distributed across the row');
assert.match(style, /@media\(max-width:767px\)\{[\s\S]*?\.ui-redesign \.collection-tabs\{position:static;top:auto;z-index:auto;background:transparent\}/,
  'mobile collection tabs should scroll with their content on the normal panel background');
assert.match(app, /新得法卷须按月参悟，参透且属性契合后才能转修/,
  'the manuscript menu must explain the new prerequisite before switching');
assert.doesNotMatch(app, /已得的功法可以随时切换/,
  'the old immediate-switch promise must not remain visible');

console.log('Deadline UI contract checks passed');
