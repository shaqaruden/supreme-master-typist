/* Current-test measurements. Independent of redraws and legacy counters. */
let testTimelineId = 0;
function createTestTimeline(now = () => performance.now()) {
    let events, started, stopped, wordNumber, attempts, correctAttempts;
    let letters, confusions, correctTimes, result;
    const normalize = value => value.replace(/\u00a0/g, ' ');
    function reset() {
        events = [];
        started = null;
        stopped = null;
        wordNumber = 1;
        attempts = correctAttempts = 0;
        letters = new Map();
        confusions = new Map();
        correctTimes = [];
        result = null;
    }
    function elapsed() {
        return started === null ? 0 : Math.max(0, now() - started);
    }
    function input(before, after, word) {
        if (stopped !== null) return;
        before = normalize(before);
        after = normalize(after);
        word = normalize(word);
        if (before === after) return;
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
            const typed = after[i];
            const expected = word[i] || '';
            attempts++;
            if (!letters.has(expected)) letters.set(expected, {character:expected, attempts:0, errors:0});
            const letter = letters.get(expected);
            letter.attempts++;
            if (typed === expected) {
                correctAttempts++;
                correctTimes.push(time);
            } else {
                letter.errors++;
                const key = JSON.stringify([expected, typed]);
                if (!confusions.has(key)) confusions.set(key, {expected, typed, count:0});
                confusions.get(key).count++;
                events.push({type:'error', time, word, wordNumber, position:i + 1, expected, typed});
            }
        }
    }
    function complete(word) {
        if (stopped !== null || started === null) return;
        events.push({type:'word', time:elapsed(), word:normalize(word), wordNumber:wordNumber++});
    }
    function speedSamples(duration) {
        const count = Math.min(599, Math.ceil(duration / 1000));
        const step = count < 599 ? 1000 : duration / count;
        const points = [];
        let first = 0, last = 0;
        for (let i = 0; i <= count; i++) {
            const time = i === count ? duration : i * step;
            while (last < correctTimes.length && correctTimes[last] <= time) last++;
            while (first < last && correctTimes[first] < time - 5000) first++;
            const window = Math.min(5000, time);
            points.push({time, wpm:window > 0 ? (last - first) * 12000 / window : 0});
        }
        return points;
    }
    function finish() {
        if (result) return result;
        stopped = elapsed();
        const freezeEntries = entries => Object.freeze(entries.map(entry => Object.freeze({...entry})));
        result = Object.freeze({
            id:`test-${Date.now().toString(36)}-${(++testTimelineId).toString(36)}-${Math.random().toString(36).slice(2)}`,
            events:freezeEntries(events), duration:stopped,
            attempts, correctAttempts, words:wordNumber - 1,
            wpm:stopped > 0 ? correctAttempts * 12000 / stopped : 0,
            accuracy:attempts > 0 ? correctAttempts * 100 / attempts : 0,
            letters:freezeEntries([...letters.values()]),
            confusions:freezeEntries([...confusions.values()]),
            speed:freezeEntries(speedSamples(stopped))
        });
        return result;
    }
    reset();
    return {reset, input, complete, finish};
}

const testTimeline = createTestTimeline();

function renderTestTimeline(data) {
    const panel = document.querySelector('#testTimeline');
    const plot = document.querySelector('#timelinePlot');
    const details = document.querySelector('#timelineDetails');
    const speed = data.speed || [];
    const peak = speed.reduce((value, point) => Math.max(value, point.wpm), 0);
    const endSpeed = speed.length ? speed[speed.length - 1].wpm : 0;
    const errorCount = data.events.filter(event => event.type === 'error').length;
    const wordCount = data.events.length - errorCount;
    document.querySelector('#timelineSummary').textContent =
        `${wordCount} words · ${errorCount} mistakes · ${(data.duration / 1000).toFixed(1)} seconds · Peak ${peak.toFixed(1)} WPM · End ${endSpeed.toFixed(1)} WPM (trailing 5 seconds)`;
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
    const speedTop = 20, speedBottom = 84;
    const wordY = 120;
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
    const maxSpeed = Math.max(20, Math.ceil(peak / 20) * 20);
    const speedY = wpm => speedBottom - wpm / maxSpeed * (speedBottom - speedTop);
    element('text', {x:8, y:speedTop + 4}, 'WPM');
    [0, maxSpeed].forEach(wpm => {
        const y = speedY(wpm);
        element('line', {x1:left, x2:right, y1:y, y2:y, class:'timelineLane'});
        element('text', {x:left - 8, y:y + 4, 'text-anchor':'end'}, String(wpm));
    });
    element('polyline', {
        points:speed.map(point => `${x(point.time)},${speedY(point.wpm)}`).join(' '),
        class:'timelineSpeed speedLine', fill:'none', stroke:'currentColor', 'stroke-width':2,
        'stroke-linejoin':'round'
    });
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
