const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const p=await b.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:4173');
 await p.evaluate(()=>{setJSON('customLayoutMap',layoutMaps.dvorak);setJSON('customLevelDictionary',levelDictionaries.dvorak);});
 for(const [layout,keyboard] of [['dvorak','iso'],['colemak','ortho'],['colemakdh','ortho_extended'],['custom','ansi']]){
  await p.evaluate(([layout,keyboard])=>{changeLayout(layout);changeKeyboard(keyboard);testTimeline.input('','x',correctAnswer);endGame();},[layout,keyboard]);
  await p.getByRole('tab',{name:'Heatmap',exact:true}).click();assert.ok(await p.locator('#heatmapPanel [data-character]').count()>15);
  assert.ok((await p.locator('#heatmapPanel h3').first().innerText()).includes(layout));await p.locator('#practiceMistakes').click();assert.equal(await p.evaluate(()=>scoreMax),20);
  await p.evaluate(()=>switchLevel(2));assert.equal(await p.evaluate(()=>!!trainingDrill),false,'programmatic level changes also exit drill');
 }
 assert.deepEqual(errors,[]);console.log('PASS: Dvorak/ISO, Colemak/ortho, DH/extended and custom heatmaps, drills and level changes');
 }finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1)});
