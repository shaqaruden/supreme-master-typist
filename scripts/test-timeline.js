/* Current-test events. Independent of redraws and the legacy accuracy counters. */
function createTestTimeline(now = () => performance.now()) {
    let events, started, stopped, wordNumber;
    function reset() {
        events = [];
        started = null;
        stopped = null;
        wordNumber = 1;
    }
    function elapsed() {
        return started === null ? 0 : Math.max(0, now() - started);
    }
    function input(before, after, word) {
        if (stopped !== null || before === after) return;
        let start = 0;
        while (start < before.length && start < after.length && before[start] === after[start]) start++;
        let oldEnd = before.length, newEnd = after.length;
        while (oldEnd > start && newEnd > start && before[oldEnd - 1] === after[newEnd - 1]) {
            oldEnd--;
            newEnd--;
        }
        if (newEnd === start) return; // deletion, including backspace
        if (started === null) started = now();
        const time = elapsed();
        for (let i = start; i < newEnd; i++) {
            const typed = after[i] === '\u00a0' ? ' ' : after[i];
            const expected = word[i] || '';
            if (typed !== expected) events.push({type: 'error', time, word, wordNumber, position: i + 1, expected, typed});
        }
    }
    function complete(word) {
        if (stopped !== null || started === null) return;
        events.push({type: 'word', time: elapsed(), word, wordNumber: wordNumber++});
    }
    function finish() {
        if (stopped === null) stopped = elapsed();
        return {events: events.map(event => ({...event})), duration: stopped};
    }
    reset();
    return {reset, input, complete, finish};
}

const testTimeline = createTestTimeline();

function renderTestTimeline(data) {
    const panel = document.querySelector('#testTimeline');
    const plot = document.querySelector('#timelinePlot');
    const details = document.querySelector('#timelineDetails');
    const errorCount = data.events.filter(event => event.type === 'error').length;
    const wordCount = data.events.length - errorCount;
    document.querySelector('#timelineSummary').textContent =
        `${wordCount} words · ${errorCount} mistakes · ${(data.duration / 1000).toFixed(1)} seconds`;
    details.textContent = 'Hover, focus or select a marker to see its details.';
    plot.replaceChildren();
    const width = Math.max(640, Math.min(12000, data.events.length * 28));
    const duration = Math.max(1000, data.duration);
    const left = 90, right = width - 24;
    const x = time => left + (time / duration) * (right - left);
    const positions = {word:[], error:[]};
    const layout = data.events.map(event => {
        const tracks = positions[event.type];
        let track = tracks.findIndex(last => x(event.time) - last >= 28);
        if (track === -1) track = tracks.length;
        tracks[track] = x(event.time);
        return {event, track};
    });
    const wordY = 36;
    const errorY = wordY + Math.max(1, positions.word.length) * 28 + 20;
    const axisY = errorY + Math.max(1, positions.error.length) * 28 + 12;
    const height = axisY + 55;
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    plot.style.height = `${height}px`;
    svg.setAttribute('aria-hidden', 'true');
    function element(tag, attrs, text) {
        const node = document.createElementNS(svgNS, tag);
        Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
        if (text !== undefined) node.textContent = text;
        svg.append(node);
    }
    [wordY, errorY].forEach((y, i) => {
        element('line', {x1:left, x2:right, y1:y, y2:y, class:'timelineLane'});
        element('text', {x:8, y:y + 5}, i ? 'Mistakes' : 'Words');
    });
    for (let i = 0; i <= 5; i++) {
        const time = duration * i / 5;
        element('line', {x1:x(time), x2:x(time), y1:axisY, y2:axisY + 6, class:'timelineLane'});
        element('text', {x:x(time), y:axisY + 25, 'text-anchor':'middle'}, `${(time / 1000).toFixed(1)}s`);
    }
    element('text', {x:(left + right) / 2, y:axisY + 49, 'text-anchor':'middle'}, 'Time since first character');
    plot.style.width = `${width}px`;
    plot.append(svg);
    let selected;
    function character(value) {
        return value === '' ? 'end of word' : value === ' ' ? 'Space' : `“${value}”`;
    }
    layout.forEach(({event, track}) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `timelineEvent ${event.type}`;
        button.textContent = event.type === 'error' ? '×' : '●';
        const label = `${(event.time / 1000).toFixed(2)}s · Word ${event.wordNumber}: “${event.word}”` +
            (event.type === 'error' ? ` · Letter ${event.position} · Expected ${character(event.expected)}, typed ${character(event.typed)}` : ' · Completed');
        button.setAttribute('aria-label', label);
        button.setAttribute('aria-pressed', 'false');
        button.title = label;
        // Extra tracks keep simultaneous errors individually tappable.
        button.style.left = `${x(event.time)}px`;
        button.style.top = `${(event.type === 'error' ? errorY : wordY) + track * 28}px`;
        function show() {
            if (selected) selected.setAttribute('aria-pressed', 'false');
            selected = button;
            button.setAttribute('aria-pressed', 'true');
            details.textContent = label;
        }
        button.addEventListener('mouseenter', show);
        button.addEventListener('focus', show);
        button.addEventListener('click', show);
        plot.append(button);
    });
    panel.hidden = false;
}
