// Compatibility report across pool, manual, and representative personal affinities.
const G = require('../dist/engine.js');
const assert = require('node:assert/strict');
const elements = Object.keys(G.ELEMENT_BEATS);
const profiles = [];
for (const element of elements) for (const polarity of ['yin', 'yang']) {
  const affinityPoints = Object.fromEntries(G.AFFINITY_KEYS.map(key => [key, 0]));
  for (const key of elements) affinityPoints[key] = key === element ? 5 : 2;
  affinityPoints[polarity] = 5;
  affinityPoints[polarity === 'yin' ? 'yang' : 'yin'] = 2;
  profiles.push({ name: `${element}/${polarity}`, elements: [element], polarity, affinityPoints });
}
const rows = [];
for (let manual = 1; manual < G.ITEMS.manual.length; manual++) {
  for (let pool = 1; pool < G.ITEMS.spring.length; pool++) {
    const results = profiles.map(profile => {
      const state = G.create(profile);
      state.manual = manual;
      state.affinityPoints = { ...profile.affinityPoints };
      return G.springHarmony(state, pool);
    });
    const average = key => Number((results.reduce((sum, result) => sum + result[key], 0) / results.length).toFixed(2));
    const levels = Object.fromEntries(['上佳', '相合', '尚可', '相冲'].map(level => [level, results.filter(x => x.level === level).length]));
    rows.push({
      manual,
      manualName: G.ITEMS.manual[manual].name,
      pool,
      poolName: G.ITEMS.spring[pool].name,
      rarity: G.ITEMS.spring[pool].rarity,
      power: G.ITEMS.spring[pool].power,
      averageScore: average('score'),
      averageChanceModifier: average('chance'),
      averageQualityModifier: average('quality'),
      levels,
    });
  }
}

const waterBuild = G.create({ origin: 'scholar', elements: ['water'], polarity: 'yin' });
waterBuild.manual = 2;
waterBuild.affinityPoints.water = 5;
waterBuild.affinityPoints.yin = 5;
waterBuild.spring = 2;
const aligned = { chance: G.chance(waterBuild), quality: G.quality(waterBuild) };
waterBuild.spring = 3;
const premiumClash = { chance: G.chance(waterBuild), quality: G.quality(waterBuild) };
assert.ok(aligned.chance > premiumClash.chance, 'a strongly aligned spirit-grade pool should beat the premium clash for this build');
assert.ok(aligned.quality > premiumClash.quality, 'fit should sometimes outweigh a rarity/power step');

console.log(JSON.stringify({ profileCount: profiles.length, table: rows }, null, 2));
