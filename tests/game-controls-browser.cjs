const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const p=await b.newPage({viewport:{width:1280,height:900}});const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:4173');await p.locator('#gameModeToggle').click();
 for(const id of ['layout','keyboard','keymapping'])assert.equal(await p.locator(`#${id} btn`).evaluate(e=>e.classList.contains('rpgui-button')),true,`${id} uses RPGUI button skin`);
 await p.locator('#layout btn').click();await p.locator('#layout li[data-value=dvorak]').click();assert.equal(await p.evaluate(()=>currentLayout),'dvorak');
 await p.locator('#keyboard btn').focus();await p.keyboard.press('Enter');await p.waitForFunction(()=>!document.querySelector('#keyboard list').classList.contains('close'));
 await p.keyboard.press('ArrowDown');await p.keyboard.press('Enter');assert.equal(await p.evaluate(()=>currentKeyboard),'iso');
 const mapping=p.locator('#keymapping btn');await mapping.focus();await p.keyboard.press('Space');assert.equal(await mapping.getAttribute('aria-pressed'),'true');
 assert.equal(await p.locator('.game-mapping-state').innerText(),'On');assert.equal(await p.locator('#keymapping toggle').isVisible(),false,'rounded mapping switch is replaced in Game Mode');
 await mapping.click();assert.equal(await mapping.getAttribute('aria-pressed'),'false');
 for(const viewport of [{width:390,height:844},{width:844,height:390}]){
  await p.setViewportSize(viewport);await p.waitForFunction(()=>document.querySelector('#openProgress').getBoundingClientRect().right<=innerWidth);
  for(const selector of ['#layout btn','#keyboard btn','#keymapping btn','#openProgress']){const r=await p.locator(selector).boundingBox();assert.ok(r.x>=0&&r.x+r.width<=viewport.width&&r.y>=0&&r.y+r.height<=viewport.height,selector+' fits viewport');}
  await p.locator('#layout btn').click();assert.equal(await p.locator('#layout li[data-value=dvorak]').isVisible(),true);await p.keyboard.press('Escape');
 }
 await p.locator('#gameModeToggle').click();assert.equal(await p.locator('#keymapping toggle').isVisible(),true,'normal mapping control returns');
 assert.equal(await p.locator('#layout btn').evaluate(e=>e.classList.contains('rpgui-button')),false);
 assert.deepEqual(errors,[]);console.log('PASS: RPGUI header controls, native options, keyboard selection/toggle, mapping state, responsive fit and normal-mode restoration');
 }finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1)});
