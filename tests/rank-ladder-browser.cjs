const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
const p=await b.newPage({viewport:{width:390,height:844}});const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:4173');
await p.evaluate(()=>{testTimeline.input('','a',correctAnswer);endGame();});
assert.equal(await p.locator('#rankBadge').evaluate(e=>e.tagName),'BUTTON','rank badge is keyboard-operable');
await p.locator('#rankBadge').click();assert.equal(await p.locator('#rankDialog').isVisible(),true);
assert.equal(await p.locator('#rankList li').count(),7);assert.equal(await p.locator('#rankList [aria-current=step]').innerText().then(s=>s.includes('Unranked')),true);
assert.match(await p.locator('#rankList').innerText(),/Supreme Master/);assert.match(await p.locator('#rankList').innerText(),/120 WPM/);assert.match(await p.locator('#rankList').innerText(),/Level 3 or above/);assert.match(await p.locator('#rankList').innerText(),/All Words or Full Sentences/);assert.match(await p.locator('#rankEligibility').innerText(),/30 seconds/);
await p.keyboard.press('Escape');assert.equal(await p.locator('#rankBadge').evaluate(e=>e===document.activeElement),true);
await p.evaluate(()=>{trainingHistory.save({id:'easy-fast',date:new Date().toISOString(),duration:30000,words:20,attempts:100,correctAttempts:100,wpm:200,accuracy:100,settings:{...trainingSettings(),level:1}});trainingHistory.save({id:'harder-slow',date:new Date().toISOString(),duration:30000,words:20,attempts:100,correctAttempts:100,wpm:29,accuracy:100,settings:{...trainingSettings(),level:3}});reset();testTimeline.input('','a',correctAnswer);endGame();});assert.equal(await p.locator('#rankBadge').innerText(),'Apprentice');
await p.evaluate(()=>{trainingHistory.save({id:'qualified',date:new Date().toISOString(),duration:30000,words:20,attempts:100,correctAttempts:94,wpm:55,accuracy:94,settings:{...trainingSettings(),level:3}});reset();testTimeline.input('','a',correctAnswer);endGame();});
await p.locator('#rankBadge').focus();await p.keyboard.press('Enter');assert.match(await p.locator('#rankList [aria-current=step]').innerText(),/Adept/);await p.locator('#closeRanks').click();
await p.locator('#openProgress').click();const progressRank=p.locator('#progressContent .rankBadge');await progressRank.click();assert.match(await p.locator('#rankList [aria-current=step]').innerText(),/Adept/);
await p.keyboard.press('Escape');assert.equal(await p.locator('#progressDialog').isVisible(),true);assert.equal(await progressRank.evaluate(e=>e===document.activeElement),true);
await p.keyboard.press('Escape');assert.deepEqual(errors,[]);
console.log('PASS: complete rank ladder, unranked/current tier markers, exact requirements, click/Enter/Escape, nested Progress focus and mobile');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1)});
