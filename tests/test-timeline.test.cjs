const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function setup(document) {
    assert.ok(fs.existsSync('scripts/test-timeline.js'), 'timeline recorder exists');
    const context = vm.createContext({performance: {now: () => 0}, document});
    vm.runInContext(fs.readFileSync('scripts/test-timeline.js', 'utf8'), context);
    let now = 100;
    return {recorder: vm.runInContext('createTestTimeline', context)(() => now), tick: t => now = t, render:vm.runInContext('renderTestTimeline', context)};
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

test('counts only inserted and replaced characters and derives one set of exact metrics', () => {
    const {recorder:r, tick} = setup();
    r.input('', 'cxt', 'cat');
    r.input('cxt', 'cat', 'cat'); // replace only x; unchanged suffix is not retried
    r.input('cat', 'ct', 'cat'); // deletion is not an attempt
    r.input('ct', 'cat', 'cat');
    r.input('cat', 'cat!', 'cat');
    r.input('cat!', 'cat!', 'cat');
    r.complete('cat');
    tick(60100);
    const data = r.finish();
    assert.equal(data.attempts, 6);
    assert.equal(data.correctAttempts, 4);
    assert.equal(data.words, 1);
    assert.equal(data.wpm, 0.8);
    assert.equal(data.accuracy, 100 * 4 / 6);
    assert.deepEqual(JSON.parse(JSON.stringify(data.letters)), [
        {character:'c', attempts:1, errors:0},
        {character:'a', attempts:3, errors:1},
        {character:'t', attempts:1, errors:0},
        {character:'', attempts:1, errors:1}
    ]);
    assert.deepEqual(JSON.parse(JSON.stringify(data.confusions)), [
        {expected:'a', typed:'x', count:1}, {expected:'', typed:'!', count:1}
    ]);
});

test('normalizes displayed nonbreaking spaces before counting changed characters', () => {
    const {recorder:r, tick} = setup();
    r.input('', 'a\u00a0b', 'a b');
    r.input('a\u00a0b', 'a b', 'a b');
    r.input('', ' ', '\u00a0');
    tick(1100);
    const data = r.finish();
    assert.equal(data.attempts, 4);
    assert.equal(data.correctAttempts, 4);
    assert.equal(data.accuracy, 100);
    assert.equal(data.wpm, 48);
    assert.equal(data.events.length, 0);
    assert.equal(data.letters.find(letter => letter.character === ' ').attempts, 2);
});

test('zero elapsed and empty results contain finite zero speed and independent session ids', () => {
    const {recorder:r} = setup();
    const empty = r.finish();
    for (const key of ['duration', 'attempts', 'correctAttempts', 'words', 'wpm', 'accuracy']) {
        assert.equal(empty[key], 0, key);
    }
    assert.deepEqual(JSON.parse(JSON.stringify(empty.speed)), [{time:0, wpm:0}]);
    assert.ok(typeof empty.id === 'string' && empty.id.length > 0);
    r.reset();
    r.input('', 'a', 'a');
    const instant = r.finish();
    assert.notEqual(instant.id, empty.id);
    assert.equal(instant.wpm, 0);
    assert.equal(instant.accuracy, 100);
});

test('finish returns the same deeply immutable result until reset', () => {
    const {recorder:r, tick} = setup();
    r.input('', 'x', 'a');
    r.complete('a');
    tick(1100);
    const data = r.finish();
    tick(10100);
    r.input('', 'a', 'a');
    r.complete('a');
    assert.equal(r.finish(), data);
    assert.equal(data.attempts, 1);
    assert.equal(data.words, 1);
    assert.equal(data.duration, 1000);
    assert.ok(Object.isFrozen(data));
    for (const key of ['events', 'letters', 'confusions', 'speed']) {
        assert.ok(Object.isFrozen(data[key]), key);
        assert.ok(data[key].every(Object.isFrozen), `${key} entries`);
    }
    assert.throws(() => data.events.push({type:'word'}), {name:'TypeError'});
});

test('speed uses available elapsed time then a trailing five-second window including an idle end', () => {
    const {recorder:r, tick} = setup();
    r.input('', 'abcde', 'abcde');
    tick(1100); r.input('', 'fghij', 'fghij');
    tick(6600);
    const data = r.finish();
    const sample = time => data.speed.find(point => point.time === time).wpm;
    assert.equal(sample(0), 0);
    assert.equal(sample(1000), 120);
    assert.equal(sample(2000), 60);
    assert.equal(sample(6000), 12);
    assert.deepEqual(JSON.parse(JSON.stringify(data.speed.at(-1))), {time:6500, wpm:0});
    assert.equal(data.wpm, 120000 / 6500);
});

test('long tests retain at most 600 ordered speed points including the idle end', () => {
    const {recorder:r, tick} = setup();
    r.input('', 'abcde', 'abcde');
    tick(3600600);
    const data = r.finish();
    assert.ok(data.speed.length <= 600);
    assert.equal(data.speed[0].time, 0);
    assert.deepEqual(JSON.parse(JSON.stringify(data.speed.at(-1))), {time:3600500, wpm:0});
    assert.ok(data.speed.every((point, i) => Number.isFinite(point.wpm) && (!i || point.time > data.speed[i - 1].time)));
});


// The recorder has no browser dependency. This small DOM boundary captures the real
// renderer output without introducing a browser/runtime dependency to the unit suite.
function chartDocument() {
    function node(tag) {
        return {
            tag, children:[], attributes:{}, style:{}, listeners:{}, textContent:'', hidden:true,
            append(child) { this.children.push(child); },
            replaceChildren() { this.children = []; },
            setAttribute(key, value) { this.attributes[key] = String(value); },
            addEventListener(key, listener) { this.listeners[key] = listener; }
        };
    }
    const nodes = Object.fromEntries(['testTimeline','timelinePlot','timelineDetails','timelineSummary'].map(id => [`#${id}`, node('div')]));
    return {nodes, querySelector:selector => nodes[selector], createElement:node, createElementNS:(_ns, tag) => node(tag)};
}

test('renders a labelled speed line above selectable event lanes with numeric summaries', () => {
    const document = chartDocument();
    const {recorder:r, tick, render} = setup(document);
    r.input('', 'ax', 'ab');
    tick(1100); r.complete('ab');
    const data = r.finish();
    render(data);
    const plot = document.nodes['#timelinePlot'];
    const svg = plot.children.find(child => child.tag === 'svg');
    const line = svg.children.find(child => (child.attributes.class || '').split(' ').includes('timelineSpeed'));
    assert.ok(line && line.attributes.class.split(' ').includes('speedLine'), 'speed series exposes its integration selector');
    assert.ok(line, 'speed series is rendered');
    const points = line.attributes.points.split(' ').map(point => point.split(',').map(Number));
    assert.equal(points.length, 2);
    assert.ok(points.every(point => point.every(Number.isFinite)));
    const labels = svg.children.filter(child => child.tag === 'text').map(child => child.textContent);
    assert.ok(labels.includes('WPM'));
    assert.ok(labels.includes('0'));
    assert.ok(labels.includes('Time since first character'));
    assert.match(document.nodes['#timelineSummary'].textContent, /Peak 12.0 WPM.*End 12.0 WPM/);
    const error = plot.children.find(child => child.className === 'timelineEvent error');
    const word = plot.children.find(child => child.className === 'timelineEvent word');
    assert.ok(points.every(point => point[1] < parseFloat(word.style.top)));
    assert.ok(parseFloat(error.style.top) > parseFloat(word.style.top));
    error.listeners.focus();
    assert.equal(error.attributes['aria-pressed'], 'true');
    assert.match(document.nodes['#timelineDetails'].textContent, /Expected “b”, typed “x”/);
    assert.equal(document.nodes['#testTimeline'].hidden, false);
});
