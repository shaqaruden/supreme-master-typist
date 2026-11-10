const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
(async () => {
    const browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless:true, args:['--no-sandbox']});
    const page = await browser.newPage({viewport:{width:1280,height:900}});
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    async function fresh(settings = {}) {
        await page.goto('http://127.0.0.1:4173');
        await page.evaluate(settings => {
            localStorage.clear();
            Object.entries({wordMax:10, scoreMax:10, ...settings}).forEach(([k,v])=>localStorage.setItem(k,v));
        }, settings);
        await page.reload();
        await page.locator('#userInput').focus();
    }
    async function typeWord() {
        const word = await page.evaluate(() => correctAnswer);
        await page.keyboard.type(word, {delay:8});
        if (await page.locator('#testTimeline').isHidden()) await page.keyboard.press('Space');
        return word;
    }
    await fresh();
    assert.equal(await page.locator('#testTimeline').isVisible(), false);
    const first = await page.evaluate(()=>correctAnswer);
    const wrong = first[0] === 'x' ? 'z':'x';
    await page.keyboard.type(wrong);
    await page.keyboard.press('Backspace');
    const words=[];
    for(let i=0;i<10;i++) words.push(await typeWord());
    await page.waitForFunction(()=>!document.querySelector('#testTimeline').hidden);
    assert.equal(await page.locator('.timelineEvent.error').count(),1);
    assert.equal(await page.locator('.timelineEvent.word').count(),10);
    const marker=page.locator('.timelineEvent.error');
    await marker.focus();
    assert.match(await page.locator('#timelineDetails').innerText(), /Expected/);
    assert.ok((await page.locator('#timelineDetails').innerText()).includes(first));
    await marker.click();
    assert.equal(await marker.getAttribute('aria-pressed'),'true');
    await page.screenshot({path:path.join(os.tmpdir(), 'colemakcamp-timeline-desktop.png'),fullPage:true});
    await page.setViewportSize({width:390,height:844});
    await page.waitForFunction(()=>{const r=document.querySelector('#resetButton').getBoundingClientRect();return r.x + r.width <= innerWidth;}, null, {timeout:2000});
    const resetRect = await page.locator('#resetButton').boundingBox();
    assert.ok(resetRect.x + resetRect.width <= 390, 'Reset stays visible after resizing a completed test');
    await page.screenshot({path:path.join(os.tmpdir(), 'colemakcamp-timeline-mobile.png'),fullPage:true});
    assert.ok(await page.locator('.timelineScroll').evaluate(el=>el.scrollWidth>el.clientWidth));
    await page.locator('#resetButton').click();
    assert.equal(await page.locator('#testTimeline').isVisible(),false);
    await page.keyboard.type('x');
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(()=>testTimeline.finish().events.length),0);
    await fresh({timeLimitMode:true,timeMax:1});
    await page.keyboard.type('!');
    await page.waitForFunction(()=>!document.querySelector('#testTimeline').hidden);
    assert.equal(await page.locator('.timelineEvent.error').count(),1);
    assert.equal(await page.locator('.timelineEvent.word').count(),0);
    await fresh({keyRemapping:true});
    await page.evaluate(()=>{correctAnswer='a';});
    await page.keyboard.press('KeyA');
    await page.keyboard.press('Space');
    assert.equal(await page.evaluate(()=>testTimeline.finish().events.filter(e=>e.type==='word').length),1);
    await fresh();
    await page.evaluate(()=>{
        correctAnswer='cat';
        input.dispatchEvent(new KeyboardEvent('keydown',{key:'Unidentified',bubbles:true}));
        input.value='cx'; input.dispatchEvent(new InputEvent('input',{bubbles:true}));
    });
    await page.evaluate(()=>{
        input.value='c'; input.dispatchEvent(new InputEvent('input',{bubbles:true}));
    });
    assert.equal(await page.evaluate(()=>testTimeline.finish().events.filter(e=>e.type==='error').length),1);
    await page.evaluate(()=>{
        testTimeline.reset();
        testTimeline.input('', 'xxxxxx', 'abcdef');
        renderTestTimeline(testTimeline.finish());
    });
    const boxes = await page.locator('.timelineEvent.error').evaluateAll(nodes=>nodes.map(node=>{
        const r=node.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};
    }));
    for(let i=0;i<boxes.length;i++) for(let j=i+1;j<boxes.length;j++) {
        const a=boxes[i],b=boxes[j];
        assert.ok(Math.abs(a.x-b.x)>=24 || Math.abs(a.y-b.y)>=24, 'dense events have separate hit targets');
    }
    assert.deepEqual(errors,[]);
    console.log('PASS: desktop completion, error details, keyboard selection, narrow layout, reset, timed partial word, remapping, mobile edits, dense event hit targets, no page errors');
    await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
