const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const p=await b.newPage({viewport:{width:1280,height:900}});const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://localhost:4173');
 await p.evaluate(()=>{changeLayout('dvorak');switchLevel(1)});assert.equal(await p.locator('#movementPractice').isVisible(),false);
 for(const level of [2,3,4,5,6]){await p.evaluate(level=>switchLevel(level),level);assert.equal(await p.locator('#startMovement').isVisible(),true);}
 assert.equal(await p.locator('#movementHand option[value=left]').isDisabled(),false);await p.evaluate(()=>switchLevel(5));assert.equal(await p.locator('#movementHand option[value=left]').isDisabled(),true);
 await p.evaluate(()=>{switchLevel(3);timeLimitMode=true;timeMax=75;scoreMax=45;reset()});
 await p.locator('#movementHand').selectOption('left');await p.locator('#startMovement').click();
 assert.equal(await p.evaluate(()=>timeLimitMode),false);assert.equal(await p.evaluate(()=>scoreMax),20);assert.match(await p.locator('#drillReason').innerText(),/Left hand/);assert.equal(await p.locator('#movementPractice').isVisible(),false);
 assert.equal(await p.evaluate(()=>trainingDrill.words.every(w=>MovementPractice.handOf(w[0],keyboardMap)==='left'&&w[0]===w[2])),true);
 await p.locator('#userInput').focus();for(let i=0;i<20;i++){await p.keyboard.type(await p.evaluate(()=>correctAnswer));if(await p.locator('#testTimeline').isHidden())await p.keyboard.press('Space');}
 assert.equal(await p.locator('#testTimeline').isVisible(),true);assert.equal(await p.locator('.timelineEvent.word').count(),20);
 assert.equal(await p.evaluate(()=>trainingHistory.load().at(-1).settings.practice),'movement');assert.equal(await p.evaluate(()=>trainingHistory.load().at(-1).settings.practiceHand),'left');assert.equal(await p.evaluate(()=>TrainingCore.rankFor(trainingHistory.load().at(-1)).index),-1);
 await p.locator('#exitDrill').click();assert.equal(await p.evaluate(()=>timeLimitMode),true);assert.equal(await p.evaluate(()=>scoreMax),45);assert.equal(await p.evaluate(()=>timeMax),75);
 await p.locator('#startMovement').click();await p.evaluate(()=>switchLevel(4));assert.equal(await p.evaluate(()=>trainingDrill),null);assert.equal(await p.evaluate(()=>timeLimitMode),true);
 await p.locator('#startMovement').click();await p.evaluate(()=>changeLayout('colemak'));assert.equal(await p.evaluate(()=>trainingDrill),null);assert.equal(await p.locator('#movementPractice').isVisible(),false);
 await p.evaluate(()=>{changeLayout('dvorak');switchLevel(7)});assert.equal(await p.locator('#movementPractice').isVisible(),false);await p.evaluate(()=>switchLevel(8));assert.equal(await p.locator('#movementPractice').isVisible(),false);
 for(const viewport of [{width:390,height:844},{width:844,height:390}]){await p.setViewportSize(viewport);await p.evaluate(()=>{switchLevel(3);GameMode.setEnabled(true)});await p.locator('#startMovement').click();assert.equal(await p.locator('#drillBanner').isVisible(),true);await p.locator('#exitDrill').click();const r=await p.locator('#startMovement').boundingBox();assert.ok(r.x>=0&&r.x+r.width<=viewport.width);}
 assert.deepEqual(errors,[]);console.log('PASS: movement availability, hand restrictions, completion/history/rank exclusion, settings restoration, level/layout exit and Game Mode/mobile');
 }finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)});
