const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function setup() {
    assert.ok(fs.existsSync('scripts/test-timeline.js'), 'timeline recorder exists');
    const context = vm.createContext({performance: {now: () => 0}});
    vm.runInContext(fs.readFileSync('scripts/test-timeline.js', 'utf8'), context);
    let now = 100;
    return {recorder: vm.runInContext('createTestTimeline', context)(() => now), tick: t => now = t};
}
test('records elapsed error details and completed words, preserving corrected mistakes', () => {
    const {recorder:r, tick} = setup();
    r.input('', 'c', 'cat'); tick(350); r.input('c', 'cx', 'cat');
    r.input('cx', 'c', 'cat'); tick(600); r.input('c', 'ca', 'cat');
    r.input('ca', 'cat', 'cat'); r.complete('cat');
    const data = r.finish();
    assert.equal(data.events.length, 2);
    assert.equal(data.events[0].type, 'error');
    assert.equal(data.events[0].time, 250);
    assert.equal(data.events[0].expected, 'a');
    assert.equal(data.events[0].typed, 'x');
    assert.equal(data.events[0].position, 2);
    assert.equal(data.events[1].type, 'word');
    assert.equal(data.events[1].time, 500);
});
test('ignores deletions and unchanged input and freezes after finish until reset', () => {
    const {recorder:r, tick} = setup();
    r.input('', 'x', 'cat'); r.input('x', '', 'cat'); r.input('', '', 'cat');
    tick(1100); r.finish(); r.input('', 'z', 'cat'); r.complete('cat');
    assert.equal(r.finish().events.length, 1);
    assert.equal(r.finish().duration, 1000);
    r.reset(); tick(2000); r.input('', 'c', 'cat'); r.complete('cat');
    assert.equal(r.finish().events.length, 1);
    assert.equal(r.finish().events[0].time, 0);
    assert.equal(r.finish().events[0].wordNumber, 1);
});
test('records each newly inserted wrong character including replacements and extra letters', () => {
    const {recorder:r} = setup();
    r.input('', 'cxz', 'cat'); r.input('cxz', 'cbz', 'cat');
    r.input('cbz', 'cbz!', 'cat');
    const events = r.finish().events;
    assert.equal(events.length, 4);
    assert.equal(events[3].expected, '');
    assert.equal(events[3].typed, '!');
});
test('empty test has a finite duration', () => {
    const {recorder:r} = setup();
    assert.equal(r.finish().duration, 0);
    assert.equal(r.finish().events.length, 0);
});
