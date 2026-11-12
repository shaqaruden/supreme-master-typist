const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');
function setup(){const ctx=vm.createContext({});vm.runInContext(fs.readFileSync('scripts/layout-info.js','utf8')+';globalThis.defs=levelDictionaries;globalThis.maps=layoutMaps;',ctx);vm.runInContext(fs.readFileSync('scripts/movement-practice.js','utf8'),ctx);return ctx;}
test('Dvorak levels 2–6 use only familiar/new/same-familiar same-hand return reaches',()=>{
 const c=setup();for(let level=2;level<=6;level++)for(const hand of ['both','left','right']){
  const result=c.MovementPractice.create({layout:'dvorak',level,hand,levels:c.defs.dvorak,map:c.maps.dvorak});
  const prior=Array.from({length:level-1},(_,i)=>c.defs.dvorak['lvl'+(i+1)]).join('');const fresh=c.defs.dvorak['lvl'+level];
  if(level===5&&hand==='left'){assert.equal(result.words.length,0);continue;}
  assert.equal(result.words.length,20);for(const word of result.words){assert.equal(word.length,3);assert.equal(word[0],word[2]);assert.ok(prior.includes(word[0]));assert.ok(fresh.includes(word[1]));const h=c.MovementPractice.handOf(word[0],c.maps.dvorak);assert.equal(h,c.MovementPractice.handOf(word[1],c.maps.dvorak));if(hand!=='both')assert.equal(h,hand);}
  for(const key of fresh)if(hand==='both'||c.MovementPractice.handOf(key,c.maps.dvorak)===hand)assert.ok(result.words.some(word=>word[1]===key),'covers '+key);
 }
});
test('movement practice excludes other layouts and levels 1, All Words and sentences',()=>{const c=setup();for(const [layout,level] of [['colemak',3],['lefthandeddvorak',3],['dvorak',1],['dvorak',7],['dvorak','sentences'],['dvorak',2.5]])assert.equal(c.MovementPractice.create({layout,level,levels:c.defs.dvorak,map:c.maps.dvorak}).words.length,0);});
test('both-hand practice mixes sides throughout instead of a left block then a right block',()=>{
 const c=setup();vm.runInContext('Math.random=()=>0.1',c);
 for(const level of [2,3,4,6]){
  const result=c.MovementPractice.create({layout:'dvorak',level,hand:'both',levels:c.defs.dvorak,map:c.maps.dvorak});
  const hands=result.words.map(word=>c.MovementPractice.handOf(word[1],c.maps.dvorak));
  const transitions=hands.slice(1).filter((hand,i)=>hand!==hands[i]).length;
  assert.ok(transitions>1,'level '+level+' mixes hands across the drill');
 }
});
