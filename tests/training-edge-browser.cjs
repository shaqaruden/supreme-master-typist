const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});try{
 const page=await b.newPage({viewport:{width:1280,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Blocked','SecurityError');}}));
 await page.goto('http://127.0.0.1:4173');await page.locator('#userInput').focus();await page.keyboard.type('x');await page.evaluate(()=>endGame());
 assert.equal(await page.locator('#resetButton').isVisible(),true);assert.match(await page.locator('#storageNotice').innerText(),/storage is unavailable/);assert.deepEqual(errors,[]);await page.close();
 const p=await b.newPage({viewport:{width:390,height:844}});const failures=[];p.on('pageerror',e=>failures.push(e.message));await p.goto('http://127.0.0.1:4173');
 await p.evaluate(()=>{localStorage.clear();localStorage.setItem('timeLimitMode',true);localStorage.setItem('timeMax',1);});await p.reload();
 const before=Date.now();await p.locator('#userInput').focus();await p.keyboard.type('!');await p.waitForFunction(()=>!document.querySelector('#testTimeline').hidden);
 assert.ok(Date.now()-before>=950,'time test does not end early from interval phase');
 const result=await p.evaluate(()=>testTimeline.finish());assert.ok(result.duration>=1000&&result.duration<1500,'recorder measures timed deadline');
 await p.locator('#practiceMistakes').click();assert.equal(await p.evaluate(()=>timeLimitMode),false);
 await p.locator('#exitDrill').click();assert.equal(await p.evaluate(()=>timeLimitMode),true);assert.equal(await p.evaluate(()=>localStorage.getItem('timeMax')),'1');
 const countBefore=await p.evaluate(()=>trainingHistory.load().length);await p.evaluate(()=>{reset();testTimeline.input('','a',correctAnswer);endGame();endGame();});
 assert.equal(await p.evaluate(()=>trainingHistory.load().length),countBefore+1,'finish saves only once');
 const rank=await p.evaluate(()=>{const s={id:'qualified',date:new Date().toISOString(),settings:trainingSettings(),duration:30000,words:30,attempts:200,correctAttempts:196,wpm:120,accuracy:98};s.settings.drill=false;s.settings.level=7;trainingHistory.save(s);return TrainingCore.earnedRank(trainingHistory.load(),s.settings);});assert.equal(rank.name,'Supreme Master');
 await p.evaluate(()=>{reset();switchLevel(2);correctAnswer='had';testTimeline.input('','x','had');endGame();});
 await p.locator('#practiceMistakes').click();
 assert.ok(await p.evaluate(()=>trainingDrill.words.every(word=>wordLists['lvl2'].includes(word))), 'level-2 drills include previously learned letters and use real dictionary words');
 await p.locator('#exitDrill').click();
 await p.evaluate(()=>{testTimeline.input('','x',correctAnswer);endGame();});
 for(const theme of ['night','day']){
  await p.evaluate(theme=>{settingsStorage.setItem('theme',theme);if(theme==='night')forceNight();else forceDay();},theme);
  for(const name of ['Mistakes','Heatmap','Timeline'])await p.getByRole('tab',{name,exact:true}).click();
 }
 assert.deepEqual(failures,[]);await p.close();console.log('PASS: unavailable storage, accurate timed deadline, timed drill restoration, duplicate finish, rank integration and both themes');
 }finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1)});
