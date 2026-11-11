const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});let failed=0;try{
async function run(name,fn){const p=await b.newPage();try{await p.goto('http://127.0.0.1:4173');await fn(p);console.log('PASS:',name);}catch(e){failed++;console.error('FAIL:',name,e.message);}finally{await p.close();}}
await run('timed drill shows word counter immediately',async p=>{
 await p.evaluate(()=>{settingsStorage.setItem('timeLimitMode',true);});await p.reload();
 await p.evaluate(()=>{testTimeline.input('','x',correctAnswer);endGame();});await p.locator('#practiceMistakes').click();
 assert.equal(await p.locator('#scoreText').isVisible(),true);
});
await run('Progress rank uses selected historical identity and clears custom fingerprint for standard layouts',async p=>{
 await p.evaluate(()=>{
  const result={id:'custom-old',date:new Date().toISOString(),duration:30000,words:20,attempts:100,correctAttempts:98,wpm:120,accuracy:98};
  trainingHistory.save({...result,settings:{...trainingSettings(),layout:'custom',level:7,customFingerprint:'old-custom'}});
  trainingHistory.save({...result,id:'colemak-qualified',settings:{...trainingSettings(),layout:'colemak',level:7,customFingerprint:''}});
 });
 await p.locator('#openProgress').click();await p.locator('#progressLayout').selectOption('custom');
 const key=await p.locator('#progressGroup option').evaluateAll(options=>options.find(o=>o.value.includes('old-custom')).value);await p.locator('#progressGroup').selectOption(key);
 assert.match(await p.locator('#progressContent h3').first().innerText(),/Supreme Master/);await p.keyboard.press('Escape');
 await p.evaluate(()=>{currentLayout='custom';});await p.locator('#openProgress').click();await p.locator('#progressLayout').selectOption('colemak');
 assert.match(await p.locator('#progressContent h3').first().innerText(),/Supreme Master/);
});
await run('changing time limit starts a fresh recorder and comparison group',async p=>{
 await p.evaluate(()=>{settingsStorage.setItem('timeLimitMode',true);settingsStorage.setItem('timeMax',60);});await p.reload();await p.locator('#userInput').focus();await p.keyboard.type('a');
 await p.evaluate(()=>{timeLimitModeInput.value='120';timeLimitModeInput.dispatchEvent(new Event('change',{bubbles:true}));});
 assert.equal(await p.evaluate(()=>trainingSessionSettings),null);assert.equal(await p.locator('#openProgress').isEnabled(),true);
 await p.locator('#userInput').focus();await p.keyboard.type('a');await p.evaluate(()=>endGame());
 assert.equal(await p.evaluate(()=>trainingHistory.load().at(-1).settings.limit),120);
});
await run('mapping changes reset the recorder and comparison identity',async p=>{
 await p.locator('#userInput').focus();await p.keyboard.type('a');await p.locator('#keymapping').click();
 assert.equal(await p.evaluate(()=>trainingSessionSettings),null);assert.equal(await p.locator('#openProgress').isEnabled(),true);
 await p.locator('#userInput').focus();await p.keyboard.press('KeyA');await p.evaluate(()=>endGame());
 assert.equal(await p.evaluate(()=>trainingHistory.load().at(-1).settings.keyRemapping),true);
});
}finally{await b.close();}if(failed)process.exitCode=1;})().catch(e=>{console.error(e);process.exit(1)});
