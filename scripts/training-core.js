/* Pure training rules and summary-only local history. No DOM or runtime dependencies. */
(function (root) {
    'use strict';
    const HISTORY_KEY = 'smt.history.v1';
    const tiers = [
        {name:'Apprentice', wpm:0, accuracy:0, minLevel:1},
        {name:'Typist', wpm:30, accuracy:90, minLevel:2},
        {name:'Adept', wpm:50, accuracy:93, minLevel:3},
        {name:'Expert', wpm:70, accuracy:95, minLevel:4},
        {name:'Master', wpm:90, accuracy:97, minLevel:5},
        {name:'Supreme Master', wpm:120, accuracy:98, minLevel:7}
    ];
    const number = value => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0;
    const text = value => typeof value === 'string' ? value : '';
    function settingsOf(settings = {}) {
        return {
            layout:text(settings.layout), keyboard:text(settings.keyboard),
            level:typeof settings.level === 'number' ? number(settings.level) : text(settings.level),
            mode:settings.mode === 'time' ? 'time' : 'words', limit:number(settings.limit),
            onlyLower:settings.onlyLower !== false, punctuation:text(settings.punctuation),
            requireBackspaceCorrection:settings.requireBackspaceCorrection === true,
            keyRemapping:settings.keyRemapping === true, customFingerprint:text(settings.customFingerprint),
            drill:settings.drill === true
        };
    }
    function comparisonKey(settings) {
        const s = settingsOf(settings);
        return JSON.stringify([s.layout,s.keyboard,String(s.level),s.mode,s.limit,s.onlyLower,s.punctuation,
            s.requireBackspaceCorrection,s.keyRemapping,s.customFingerprint,s.drill]);
    }
    function layoutKey(settings) {
        const s = settingsOf(settings);
        return JSON.stringify([s.layout,s.customFingerprint]);
    }
    function rank(index) {
        const target = i => ({...tiers[i],index:i});
        return {
            ...(index < 0 ? {name:'Unranked',index:-1,wpm:0,accuracy:0} : target(index)),
            next:index + 1 < tiers.length ? target(index + 1) : null
        };
    }
    function rankFor(session = {}) {
        const level=(session.settings || {}).level === 'sentences' ? 8 : Number((session.settings || {}).level);
        if (!Number.isInteger(level) || level < 1 || level > 8) return rank(-1);
        if (number(session.duration) < 30000 || number(session.words) < 10 || (session.settings || {}).drill) return rank(-1);
        let index = 0;
        tiers.forEach((tier, i) => {
            if (level >= tier.minLevel && number(session.wpm) >= tier.wpm && number(session.accuracy) >= tier.accuracy) index = i;
        });
        return rank(index);
    }
    function earnedRank(sessions, settings) {
        let index = -1;
        (Array.isArray(sessions) ? sessions : []).forEach(session => {
            if (session && layoutKey(session.settings) === layoutKey(settings)) index = Math.max(index, rankFor(session).index);
        });
        return rank(index);
    }
    /* Each metric contains previous/best numeric values and a strict-improvement flag.
       First results have previous:null and isBest:true; duplicate IDs are excluded. */
    function personalBests(sessions, session) {
        const previous = (Array.isArray(sessions) ? sessions : []).filter(saved => saved &&
            (!session.id || saved.id !== session.id) && comparisonKey(saved.settings) === comparisonKey(session.settings));
        function metric(key) {
            const value = number(session[key]);
            const best = previous.length ? Math.max(...previous.map(saved => number(saved[key]))) : null;
            return {previous:best,best:Math.max(value,best === null ? 0 : best),isBest:best === null || value > best};
        }
        return {first:previous.length === 0,speed:metric('wpm'),accuracy:metric('accuracy')};
    }
    function summary(session) {
        if (!session || !text(session.id) || !session.settings || typeof session.settings !== 'object') return null;
        const attempts = Math.floor(number(session.attempts));
        const correctAttempts = Math.min(attempts,Math.floor(number(session.correctAttempts)));
        const dateValue = typeof session.date === 'string' || typeof session.date === 'number' ? session.date : Date.now();
        const date = new Date(dateValue);
        return {
            id:session.id, date:Number.isFinite(date.getTime()) ? date.toISOString() : new Date().toISOString(),
            duration:number(session.duration),words:Math.floor(number(session.words)),attempts,correctAttempts,
            wpm:number(session.wpm),accuracy:Math.min(100,number(session.accuracy)),mistakes:attempts-correctAttempts,
            settings:settingsOf(session.settings)
        };
    }
    function createStore(storage) {
        let initialized = false, records = [], state = {available:true,reason:null};
        const clone = () => records.map(record => ({...record,settings:{...record.settings}}));
        function unavailable() { state = {available:false,reason:'unavailable'}; }
        function initialize() {
            if (initialized) return;
            initialized = true;
            let raw;
            try { raw = storage.getItem(HISTORY_KEY); } catch (_) { unavailable(); return; }
            if (!raw) return;
            let envelope;
            try { envelope = JSON.parse(raw); } catch (_) { state.reason = 'corrupt'; return; }
            if (!envelope || typeof envelope !== 'object') { state.reason = 'corrupt'; return; }
            if (envelope.version !== 1) { state.reason = 'unsupported'; return; }
            if (!Array.isArray(envelope.sessions)) { state.reason = 'corrupt'; return; }
            const seen = new Set();
            records = envelope.sessions.map(summary).filter(record => {
                if (!record || seen.has(record.id)) return false;
                seen.add(record.id);
                return true;
            }).slice(-500);
        }
        function load() { initialize(); return clone(); }
        function save(session) {
            initialize();
            const record = summary(session);
            if (!record || records.some(saved => saved.id === record.id)) return clone();
            records.push(record);
            records = records.slice(-500);
            try {
                storage.setItem(HISTORY_KEY,JSON.stringify({version:1,sessions:records}));
                state = {available:true,reason:null};
            } catch (_) { unavailable(); }
            return clone();
        }
        function clear() {
            initialized = true;
            records = [];
            try {
                storage.removeItem(HISTORY_KEY);
                state = {available:true,reason:null};
                return true;
            } catch (_) { unavailable(); return false; }
        }
        function status() { initialize(); return {...state}; }
        return {load,save,clear,status};
    }
    function selectDrill({events = [],dictionary = [],allowed = '',onlyLower = true,punctuation = '',fullSentence = false} = {}) {
        const punctuationSet = new Set(typeof punctuation === 'string' ? punctuation : []);
        let characters = Array.from(allowed).filter(character => typeof character === 'string' && !/\s/.test(character));
        if (!onlyLower) characters = characters.flatMap(character => [character,character.toUpperCase()]);
        characters = [...new Set([...characters,...punctuationSet])].filter(character =>
            (!onlyLower || character === character.toLowerCase()) && (/^[\p{L}\p{N}]$/u.test(character) || punctuationSet.has(character)));
        const alphabet = new Set(characters);
        const suitable = word => typeof word === 'string' && word.length > 0 && Array.from(word).every(character => alphabet.has(character));
        const errors = (Array.isArray(events) ? events : []).filter(event => event && event.type === 'error');
        const counts = new Map();
        errors.forEach(event => {
            if (alphabet.has(event.expected)) counts.set(event.expected,(counts.get(event.expected) || 0)+1);
        });
        const targets = [...counts].sort((a,b) => b[1]-a[1]).slice(0,3).map(entry => entry[0]);
        const wordErrors = errors.filter(event => fullSentence || event.expected === '' || event.expected === ' ' || event.typed === ' ');
        let words = [], reason;
        if (wordErrors.length) {
            wordErrors.forEach(event => {
                if (typeof event.word !== 'string') return;
                event.word.split(/\s+/).forEach(token => {
                    if (fullSentence) {
                        if (onlyLower) token = token.toLowerCase();
                        // Sentence boundary punctuation need not become a drill requirement.
                        while (token && !alphabet.has(token[0])) token = token.slice(1);
                        while (token && !alphabet.has(token[token.length-1])) token = token.slice(0,-1);
                    }
                    if (suitable(token)) words.push(token);
                });
            });
            reason = fullSentence ? 'Practise individual words from the failed sentence.' : 'Practise failed words and space boundaries.';
        }
        if (!words.length) {
            words = (Array.isArray(dictionary) ? dictionary : []).filter(word => suitable(word) &&
                (!targets.length || targets.some(character => word.includes(character))));
            reason = targets.length ? `Practise troublesome characters: ${targets.join(', ')}.` : 'Practise words from the current allowed alphabet.';
        }
        if (!words.length) {
            const letters = targets.length ? targets : characters.filter(character => /^[\p{L}\p{N}]$/u.test(character));
            const pool = letters.length ? letters : characters;
            if (!pool.length) return {words:[],reason:'No allowed characters are available for a drill.'};
            words = pool.map((_,index) => Array.from({length:3},(unused,offset) => pool[(index+offset)%pool.length]).join(''));
            reason = 'No matching words are available; practise short allowed letter combinations.';
        }
        words = [...new Set(words)];
        return {words:Array.from({length:20},(_,index) => words[index%words.length]),reason};
    }
    function ranks() { return tiers.map((tier,index)=>({...tier,index})); }
    root.TrainingCore = Object.freeze({ranks,comparisonKey,layoutKey,rankFor,earnedRank,personalBests,selectDrill,createStore});
})(globalThis);
