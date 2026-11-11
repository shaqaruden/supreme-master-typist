const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try {
 const page=await browser.newPage({viewport:{width:1280,height:900}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173');
 await page.evaluate(()=>{localStorage.clear();localStorage.setItem('wordMax',10);localStorage.setItem('scoreMax',10);});await page.reload();
 assert.ok(await page.locator('#openProgress').isEnabled());
 await page.locator('#openProgress').click();assert.equal(await page.locator('#progressDialog').isVisible(),true);
 assert.match(await page.locator('#progressContent').innerText(),/No completed tests/);
 await page.keyboard.press('Escape');assert.equal(await page.locator('#openProgress').evaluate(e=>e===document.activeElement),true);
 await page.locator('#userInput').focus();const first=await page.evaluate(()=>correctAnswer);
 await page.keyboard.type(first[0]==='x'?'z':'x');await page.keyboard.press('Backspace');
 assert.equal(await page.locator('#openProgress').isDisabled(),true);
 for(let i=0;i<10;i++) {const word=await page.evaluate(()=>correctAnswer);await page.keyboard.type(word,{delay:8});if(await page.locator('#testTimeline').isHidden())await page.keyboard.press('Space');}
 assert.equal(await page.locator('#openProgress').isEnabled(),true);
 assert.ok(await page.locator('#practiceMistakes').isEnabled());
 assert.equal(await page.locator('.timelineEvent.word').count(),10);
 assert.equal(await page.locator('.timelineEvent.error').count(),1);
 assert.equal(await page.locator('#wpmText').innerText().then(s=>/Infinity|NaN/.test(s)),false);
 assert.equal(await page.locator('.speedLine').count(),1);
 await page.getByRole('tab',{name:'Mistakes',exact:true}).click();assert.ok((await page.locator('#mistakesPanel').innerText()).includes(first[0]));
 await page.getByRole('tab',{name:'Heatmap',exact:true}).click();assert.ok(await page.locator('#heatmapPanel [data-character]').count()>0);
 await page.getByRole('tab',{name:'Timeline',exact:true}).click();
 await page.locator('#openProgress').click();assert.match(await page.locator('#progressContent').innerText(),/Recent tests/);await page.keyboard.press('Escape');
 const original=await page.evaluate(()=>({word:localStorage.getItem('wordMax'),time:localStorage.getItem('timeLimitMode')}));
 await page.locator('#practiceMistakes').click();assert.equal(await page.locator('#drillBanner').isVisible(),true);assert.equal(await page.evaluate(()=>scoreMax),20);
 assert.equal(await page.evaluate(()=>timeLimitMode),false);
 await page.locator('#exitDrill').click();assert.equal(await page.locator('#drillBanner').isVisible(),false);assert.equal(await page.evaluate(()=>Number(scoreMax)),10);
 assert.deepEqual(await page.evaluate(()=>({word:localStorage.getItem('wordMax'),time:localStorage.getItem('timeLimitMode')})),original);
 await page.reload();await page.locator('#openProgress').click();assert.ok(await page.locator('#progressContent tbody tr').count()>=1);
 page.once('dialog',dialog=>dialog.accept());await page.locator('#clearHistory').click();assert.match(await page.locator('#progressContent').innerText(),/No completed tests/);await page.keyboard.press('Escape');
 for(const viewport of [{width:390,height:844},{width:844,height:390}]){
  await page.setViewportSize(viewport);await page.evaluate(()=>{reset();testTimeline.input('','x',correctAnswer);endGame();});
  await page.waitForFunction(()=>{const r=document.querySelector('#resetButton').getBoundingClientRect();return r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight;});
  for(const tab of ['Mistakes','Heatmap','Timeline']){await page.getByRole('tab',{name:tab,exact:true}).click();assert.equal(await page.locator('#resetButton').isVisible(),true);}
 }
 assert.deepEqual(errors,[]);
 console.log('PASS: analysis tabs, finite results, speed curve, drills/settings restore, persistent history/clear, progress focus/active guard, mobile/landscape');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
