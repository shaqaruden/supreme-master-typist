const {chromium} = require('playwright');
const assert = require('node:assert/strict');
(async () => {
    const browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',args:['--no-sandbox']});
    try {
        for (const viewport of [{width:1280,height:720},{width:1280,height:480},{width:844,height:390},{width:390,height:664},{width:390,height:844}]) {
            const page = await browser.newPage({viewport});
            await page.goto('http://127.0.0.1:4173');
            await page.evaluate(() => {
                testTimeline.input('', 'x'.repeat(50), correctAnswer);
                correct = 100; errors = 50; gameON = true; seconds = 30;
                endGame();
            });
            for (const selector of ['#resetButton','#accuracyText','#wpmText','#scoreAndClock']) {
                const rect = await page.locator(selector).boundingBox();
                assert.ok(rect && rect.y >= 0 && rect.y + rect.height <= viewport.height && rect.x >= 0 && rect.x + rect.width <= viewport.width,
                    `${selector} stays fully visible at ${viewport.width}×${viewport.height}: ${JSON.stringify(rect)}`);
            }
            assert.match(await page.locator('#accuracyText').innerText(), /Accuracy:/);
            assert.match(await page.locator('#wpmText').innerText(), /WPM:/);
            const graph = await page.locator('.timelineScroll').boundingBox();
            assert.ok(graph && graph.height >= 70, 'graph retains usable space');
            await page.locator('.timelineScroll').evaluate(el => {el.scrollTop = el.scrollHeight;});
            const reset = await page.locator('#resetButton').boundingBox();
            assert.ok(reset.y >= 0 && reset.y + reset.height < viewport.height, 'Reset remains visible while graph scrolls');
            await page.evaluate(() => {
                testTimeline.reset();
                testTimeline.input('', 'c', 'cat');
                testTimeline.complete('cat');
                renderTestTimeline(testTimeline.finish());
            });
            await page.waitForFunction(()=>{const el=document.querySelector('#timelinePlot');return Math.abs(el.offsetHeight - parseFloat(el.style.height)) <= 1;});
            const emptySpace = await page.locator('.timelineScroll').evaluate(el =>
                el.clientHeight - document.querySelector('#timelinePlot').offsetHeight);
            assert.ok(emptySpace <= 8, `compact chart does not stretch into unused space: ${emptySpace}px`);
            await page.locator('#resetButton').click();
            assert.equal(await page.locator('#testTimeline').isVisible(), false);
            assert.equal(await page.locator('.cheatsheetContainer').isVisible(),true);
            await page.close();
        }
        console.log('PASS: stats and Reset remain visible with dense timelines at desktop, short, landscape and mobile sizes');
    } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
