const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const p=await b.newPage({viewport:{width:1280,height:900}});const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:4173');
 assert.equal(await p.locator('#layout select').count(),1,'Layout is a native dropdown');assert.equal(await p.locator('#keyboard select').count(),1,'Keyboard is a native dropdown');
 await p.locator('#gameModeToggle').click();await p.locator('#layout select').selectOption('dvorak');assert.equal(await p.evaluate(()=>currentLayout),'dvorak');
 await p.locator('#keyboard select').focus();await p.keyboard.press('ArrowDown');await p.keyboard.press('Tab');assert.equal(await p.evaluate(()=>currentKeyboard),'iso','native keyboard selection works');
 assert.equal(await p.locator('#keyboard select').inputValue(),'iso');
 await p.evaluate(()=>changeLayout('qwerty'));assert.equal(await p.locator('#layout select').inputValue(),'qwerty','programmatic changes sync dropdown');
 await p.locator('#layout select').selectOption('custom');assert.equal(await p.evaluate(()=>currentLayout),'custom');await p.locator('.discardButton').click();await p.waitForFunction(()=>document.querySelector('#sub').classList.contains('dispose'));
 await p.locator('#layout select').selectOption('dvorak');
 const mapping=p.locator('#keymapping btn');await mapping.focus();await p.keyboard.press('Space');assert.equal(await mapping.getAttribute('aria-pressed'),'true');assert.equal(await p.locator('.game-mapping-state').innerText(),'On');await mapping.click();
 for(const viewport of [{width:390,height:844},{width:844,height:390}]){
  await p.setViewportSize(viewport);await p.waitForFunction(()=>document.querySelector('#openProgress').getBoundingClientRect().right<=innerWidth);
  for(const selector of ['#layout select','#keyboard select','#keymapping btn','#openProgress']){const r=await p.locator(selector).boundingBox();assert.ok(r.x>=0&&r.x+r.width<=viewport.width&&r.y>=0&&r.y+r.height<=viewport.height,selector+' fits viewport');}
 }
 await p.reload();assert.equal(await p.locator('#layout select').inputValue(),'dvorak');assert.equal(await p.locator('#keyboard select').inputValue(),'iso','selection persists');
 await p.locator('#gameModeToggle').click();assert.equal(await p.locator('#keymapping toggle').isVisible(),true);
 assert.equal(await p.locator('#layout').evaluate(e=>e.classList.contains('rpgui-container')),false);await p.locator('#layout select').selectOption('colemak');assert.equal(await p.evaluate(()=>currentLayout),'colemak','normal-mode dropdown works');
 assert.deepEqual(errors,[]);console.log('PASS: native layout/keyboard dropdowns, keyboard navigation, custom/programmatic changes, persistence, mapping and responsive/normal modes');
 }finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1)});
