const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const p=await b.newPage({viewport:{width:1280,height:900}});const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:4173');
 await p.evaluate(()=>{changeLayout('dvorak');GameMode.setEnabled(true)});
 assert.equal(await p.locator('.cheatsheet').evaluate(e=>e.classList.contains('framed-golden-2')),true,'keyboard has gold case');
 const next=async()=>p.locator('.cheatsheet .game-next-key').evaluateAll(es=>es.map(e=>e.id));
 const expected=async()=>p.evaluate(()=>Object.keys(keyboardMap).find(code=>keyboardMap[code]===correctAnswer[fakeInput.innerText.length]));
 await p.waitForFunction(()=>document.querySelector('.game-next-key'));assert.ok((await next()).includes(await expected()));
 await p.locator('#userInput').focus();
 const first=await p.evaluate(()=>correctAnswer[0]);await p.keyboard.type(first);await p.waitForTimeout(30);assert.ok((await next()).includes(await expected()),'hint advances after correct input');
 await p.keyboard.down('z');assert.equal(await p.locator('.cheatsheet .game-key-miss').count()>0,true,'wrong key flashes red');await p.keyboard.up('z');
 await p.waitForTimeout(30);assert.ok((await next()).includes('BackSpace'),'wrong input points to correction');
 await p.keyboard.press('Backspace');await p.waitForTimeout(30);assert.ok((await next()).includes(await expected()));
 await p.evaluate(()=>reset());await p.keyboard.press('Space');assert.ok(await p.locator('.cheatsheet .game-key-miss').count(),'premature Space flashes red');
 await p.evaluate(()=>{reset();input.dispatchEvent(new KeyboardEvent('keydown',{key:'Unidentified',bubbles:true}));input.value='z';input.dispatchEvent(new Event('input',{bubbles:true}))});
 assert.ok(await p.locator('.cheatsheet .game-key-miss').count(),'mobile mistake flashes red');
 assert.equal(await p.locator('.cheatsheet key.homeRow:not(.game-next-key)').first().evaluate(e=>getComputedStyle(e).color),'rgb(255, 211, 140)','home-row guidance retains its color');
 for(const shape of ['ansi','iso','ortho','ortho_extended']){
  await p.evaluate(shape=>changeKeyboard(shape),shape);await p.waitForTimeout(30);
  assert.equal(await p.locator('.cheatsheet key:not(.rpgui-container)').count(),0,'rebuilt keys keep frames');
  assert.ok((await next()).includes(await expected()));
  await p.keyboard.type('z');await p.waitForTimeout(20);assert.match(await p.locator('.cheatsheet').getAttribute('data-game-keyboard-hint'),/Backspace/,'all shapes expose correction hint');
  await p.evaluate(()=>reset());await p.keyboard.type(await p.evaluate(()=>correctAnswer));await p.waitForTimeout(20);assert.match(await p.locator('.cheatsheet').getAttribute('data-game-keyboard-hint'),/Space/,'all shapes expose word advance hint');
  if(shape==='iso'){await p.evaluate(()=>reset());await p.keyboard.down('Enter');assert.ok(await p.locator('.cheatsheet #EnterBottom.game-key-miss').count(),'ISO Enter errors flash red');await p.keyboard.up('Enter');}
 }
 await p.evaluate(()=>{changeKeyboard('ansi');settingsStorage.setItem('keyRemapping','true');reset()});await p.waitForTimeout(30);
 const code=await expected();await p.keyboard.down(code);assert.equal(await p.locator('.cheatsheet .game-key-pressed').getAttribute('id'),code);await p.keyboard.up(code);
 assert.equal(await p.evaluate(()=>fakeInput.innerText),await p.evaluate(()=>correctAnswer[0]),'remapped key still enters the expected character');
 for(const viewport of [{width:390,height:844},{width:844,height:390}]){await p.setViewportSize(viewport);await p.waitForFunction(()=>{const r=document.querySelector('.cheatsheet').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth});const r=await p.locator('.cheatsheet').boundingBox();assert.ok(r.x>=0&&r.x+r.width<=viewport.width,'keyboard fits viewport');}
 await p.emulateMedia({reducedMotion:'reduce'});await p.waitForTimeout(30);await p.locator('#userInput').focus();await p.keyboard.down('KeyZ');assert.equal(await p.locator('.game-key-pressed').evaluate(e=>getComputedStyle(e).transform),'none');await p.keyboard.up('KeyZ');
 await p.evaluate(()=>GameMode.setEnabled(false));assert.equal(await p.locator('.cheatsheet [class*="game-key"],.cheatsheet .game-next-key').count(),0);assert.equal(await p.locator('.cheatsheet.rpgui-container').count(),0);
 assert.deepEqual(errors,[]);console.log('PASS: RPG keyboard hints, correction, feedback, remapping, shapes, responsive fit, reduced motion and restoration');
 }finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)});
