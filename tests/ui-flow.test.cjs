const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const G = require('../dist/engine.js');

test('the single action surface preserves event locks and settles each click once', () => {
  const html = fs.readFileSync('dist/index.html', 'utf8');
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
  assert.equal([...html.matchAll(/id="(?:mobile-action-list|action-list)"/g)].length, 1);
  const elements = new Map(), handlers = new Map();
  function element(id) {
    assert.ok(ids.has(id), `missing DOM id ${id}`);
    if (!elements.has(id)) elements.set(id, {
      id, hidden: false, innerHTML: '', textContent: '', style: {}, dataset: {},
      classList: {toggle() {}}, setAttribute() {}, addEventListener(type, fn) {handlers.set(`${id}:${type}`, fn);}, querySelectorAll() {return [];},
      closest() {return {classList: {toggle() {}}};}, focus() {}, scrollIntoView() {},
      getBoundingClientRect() {return {top: 300};}, getClientRects() {return [1];},
    });
    return elements.get(id);
  }
  const initial = G.create({origin: 'herbalist', talent: 'clarity'});
  initial.location = 'mountain'; initial.grain = 30; initial.focus = 100; initial.herbs = 3;
  const store = {value: JSON.stringify(initial)};
  const document = {
    getElementById: element, querySelectorAll() {return [];},
    addEventListener(type, fn) {handlers.set(`document:${type}`, fn);},
  };
  const context = {
    window: {LingxiEngine: G, matchMedia() {return {matches: false};}, scrollTo() {}, scrollBy() {}},
    document, localStorage: {getItem() {return store.value;}, setItem(_, value) {store.value = value;}, removeItem() {}},
    requestAnimationFrame(fn) {fn();}, console,
  };
  vm.runInNewContext(fs.readFileSync('dist/app.js', 'utf8'), context);
  function click(command) {
    handlers.get('document:click')({target: {id: '', closest() {return {
      disabled: false, dataset: {command}, textContent: command,
      getBoundingClientRect() {return {top: 300};},
    };}}});
    return JSON.parse(store.value);
  }
  const after = click('action:gather');
  assert.equal(after.month, initial.month + 1);
  assert.equal(after.pending, 'herbalist');
  assert.equal(element('mobile-action-list').innerHTML.includes('data-command="action:gather"'), false);
  assert.equal(element('latest-result').innerHTML.includes('口粮 +4'), true, 'show net grain after harvest and monthly cost');
  const beforeViewing = store.value;
  handlers.get('tab-profile:click')(); handlers.get('tab-events:click')();
  assert.equal(store.value, beforeViewing, 'reference pages do not advance game state');
  const choice = G.options(after).find(o => !o.disabled);
  assert.ok(choice);
  const resolved = click(`choice:${choice.id}`);
  assert.equal(resolved.pending, null);
  assert.equal(element('mobile-action-list').innerHTML.includes('data-command="action:gather"'), true);
  assert.equal(resolved.month, after.month + (choice.id === 'back' ? 0 : 1));
  const repeat = click('action:gather');
  assert.equal(repeat.month, resolved.month + 1, 'a repeat click settles exactly one month');
});
