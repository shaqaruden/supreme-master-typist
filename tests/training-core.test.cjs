const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function core() {
    assert.ok(fs.existsSync('scripts/training-core.js'), 'training rules module exists');
    const context = vm.createContext({});
    vm.runInContext(fs.readFileSync('scripts/training-core.js', 'utf8'), context);
    return context.TrainingCore;
}
const normal = {layout:'colemak',keyboard:'ansi',level:3,mode:'words',limit:30,onlyLower:true,punctuation:'',requireBackspaceCorrection:false,keyRemapping:false,customFingerprint:'',drill:false,practice:'',practiceHand:''};
function session(overrides = {}) {
    return {id:'one',date:'2026-11-11T12:00:00.000Z',duration:30000,words:10,attempts:160,correctAttempts:150,wpm:60,accuracy:93.75,settings:{...normal},...overrides};
}
function memory(initial = {}) {
    const data = new Map(Object.entries(initial));
    return {getItem:key => data.has(key) ? data.get(key) : null,setItem:(key,value) => data.set(key,String(value)),removeItem:key => data.delete(key),data};
}
const plain = value => JSON.parse(JSON.stringify(value));

test('comparison groups isolate every preference, limit, custom identity and drill while layout ranks cross levels', () => {
    const c = core();
    assert.equal(c.comparisonKey(normal), c.comparisonKey({...normal,irrelevant:'x'}));
    for (const [key,value] of Object.entries({layout:'dvorak',keyboard:'iso',level:4,mode:'time',limit:60,onlyLower:false,punctuation:'.',requireBackspaceCorrection:true,keyRemapping:true,customFingerprint:'custom-a',drill:true})) {
        assert.notEqual(c.comparisonKey(normal),c.comparisonKey({...normal,[key]:value}),key);
    }
    assert.equal(c.layoutKey(normal),c.layoutKey({...normal,level:7,keyboard:'iso',drill:true}));
    assert.notEqual(c.layoutKey(normal),c.layoutKey({...normal,customFingerprint:'changed'}));
    assert.notEqual(c.comparisonKey({...normal,layout:'a|b',keyboard:'c'}),c.comparisonKey({...normal,layout:'a',keyboard:'b|c'}));
});

test('rank eligibility enforces time, completed words and regular tests at exact boundaries', () => {
    const c = core();
    for (const change of [{duration:29999},{words:9},{settings:{...normal,drill:true}}]) {
        const rank = c.rankFor(session({wpm:200,accuracy:100,...change}));
        assert.equal(rank.name,'Unranked');
        assert.equal(rank.index,-1);
        assert.equal(rank.next.name,'Apprentice');
    }
    assert.equal(c.rankFor(session({wpm:0,accuracy:0})).name,'Apprentice');
    assert.equal(c.rankFor(session({wpm:120,accuracy:98,settings:{...normal,level:7}})).next,null);
});

test('rank tiers require both speed and accuracy without rounding a near miss upward', () => {
    const c = core();
    for (const [wpm,accuracy,name,previous] of [[30,90,'Typist','Apprentice'],[50,93,'Adept','Typist'],[70,95,'Expert','Adept'],[90,97,'Master','Expert'],[120,98,'Supreme Master','Master']]) {
        const rank = c.rankFor(session({wpm,accuracy,settings:{...normal,level:7}}));
        assert.equal(rank.name,name);
        assert.equal(rank.wpm,wpm);
        assert.equal(rank.accuracy,accuracy);
        assert.equal(c.rankFor(session({wpm:wpm-0.001,accuracy,settings:{...normal,level:7}})).name,previous);
        assert.equal(c.rankFor(session({wpm,accuracy:accuracy-0.001,settings:{...normal,level:7}})).name,previous);
    }
    assert.equal(c.rankFor(session({wpm:NaN,accuracy:Infinity})).name,'Apprentice');
});

test('earned rank preserves highest tier only within the current layout identity', () => {
    const c = core();
    const saved = [session({id:'a',wpm:90,accuracy:97,settings:{...normal,level:1}}),session({id:'b',wpm:130,accuracy:100,settings:{...normal,layout:'dvorak'}}),session({id:'c',wpm:140,accuracy:100,settings:{...normal,drill:true}}),session({id:'d',wpm:150,accuracy:100,settings:{...normal,customFingerprint:'other'}})];
    assert.equal(c.earnedRank(saved,normal).name,'Apprentice');
    saved.push(session({id:'advanced',wpm:90,accuracy:97,settings:{...normal,level:5}}));
    assert.equal(c.earnedRank(saved,{...normal,level:1}).name,'Master');
    assert.equal(c.earnedRank([],normal).name,'Unranked');
    assert.equal(c.earnedRank(saved,{...normal,level:8}).next.name,'Supreme Master');
});

test('personal bests distinguish first result, strict improvements, ties and incomparable sessions', () => {
    const c = core();
    const current = session({id:'now',wpm:60,accuracy:94});
    const first = c.personalBests([],current);
    assert.deepEqual(plain(first),{first:true,speed:{previous:null,best:60,isBest:true},accuracy:{previous:null,best:94,isBest:true}});
    const saved = [session({id:'a',wpm:55,accuracy:98}),session({id:'b',wpm:100,accuracy:100,settings:{...normal,limit:60}}),current];
    const best = c.personalBests(saved,current);
    assert.deepEqual(plain(best),{first:false,speed:{previous:55,best:60,isBest:true},accuracy:{previous:98,best:98,isBest:false}});
    assert.equal(c.personalBests([session({wpm:60})],current).speed.isBest,false);
});

test('storage saves only finite summaries and known settings without raw text or event content', () => {
    const c = core(), storage = memory(), store = c.createStore(storage);
    const result = session({events:[{word:'private'}],text:'secret',letters:[{character:'x'}],confusions:[{typed:'q'}],speed:[{time:1}],wpm:Infinity,accuracy:NaN,duration:-1,attempts:10,correctAttempts:7,settings:{...normal,raw:'private'}});
    const saved = store.save(result);
    assert.equal(saved.length,1);
    assert.equal(saved[0].mistakes,3);
    assert.equal(saved[0].wpm,0);
    assert.equal(saved[0].accuracy,0);
    assert.equal(saved[0].duration,0);
    assert.deepEqual(plain(saved[0].settings),normal);
    for (const forbidden of ['events','text','letters','confusions','speed','secret','private']) assert.ok(!storage.getItem('smt.history.v1').includes('"'+forbidden+'"'),forbidden);
    const envelope = JSON.parse(storage.getItem('smt.history.v1'));
    assert.equal(envelope.version,1);
    assert.equal(c.createStore(storage).load()[0].id,'one');
    assert.deepEqual(plain(store.status()),{available:true,reason:null});
});

test('history deduplicates finishes, retains latest 500 and does not expose mutable store state', () => {
    const store = core().createStore(memory());
    store.save(session());
    store.save(session({wpm:200}));
    assert.equal(store.load().length,1);
    assert.equal(store.load()[0].wpm,60);
    for (let i=0;i<501;i++) store.save(session({id:'session-'+i}));
    const history = store.load();
    assert.equal(history.length,500);
    assert.equal(history[0].id,'session-1');
    assert.equal(history[499].id,'session-500');
    history[0].settings.layout='tampered';
    history.pop();
    assert.equal(store.load().length,500);
    assert.equal(store.load()[0].settings.layout,'colemak');
});

test('invalid history and future versions recover without throwing and explain the cause', () => {
    const c = core();
    for (const [raw,reason] of [['{broken','corrupt'],['{"version":2,"sessions":[]}','unsupported'],['{"version":1,"sessions":{}}','corrupt']]) {
        const store = c.createStore(memory({'smt.history.v1':raw}));
        assert.deepEqual(plain(store.load()),[]);
        assert.equal(store.status().reason,reason);
        assert.equal(store.save(session()).length,1);
        assert.equal(store.status().reason,null);
    }
});

test('loading revalidates and scrubs imported summaries, drops invalid entries and duplicates', () => {
    const dirty = session({events:[{word:'private'}],settings:{...normal,text:'secret'}});
    const storage = memory({'smt.history.v1':JSON.stringify({version:1,sessions:[null,{},dirty,dirty,session({id:'two'})]})});
    const records = core().createStore(storage).load();
    assert.equal(records.length,2);
    assert.equal(records[0].events,undefined);
    assert.equal(records[0].settings.text,undefined);
});

test('blocked reads and quota writes retain usable memory and expose unavailable status', () => {
    const c = core();
    for (const storage of [undefined,{getItem(){throw Error('blocked');},setItem(){throw Error('blocked');},removeItem(){throw Error('blocked');}}, {getItem(){return null;},setItem(){throw Error('quota');},removeItem(){throw Error('blocked');}}]) {
        const store = c.createStore(storage);
        assert.deepEqual(plain(store.load()),[]);
        assert.equal(store.save(session()).length,1);
        assert.equal(store.status().available,false);
        assert.equal(store.status().reason,'unavailable');
        assert.equal(store.load().length,1);
        assert.equal(store.clear(),false);
        assert.equal(store.load().length,0);
    }
});

test('clearing history leaves keyboard and theme preferences untouched', () => {
    const storage = memory({theme:'dark',keyboard:'ansi'}), store = core().createStore(storage);
    store.save(session());
    assert.equal(store.clear(),true);
    assert.equal(storage.getItem('smt.history.v1'),null);
    assert.equal(storage.getItem('theme'),'dark');
    assert.equal(storage.getItem('keyboard'),'ansi');
    assert.deepEqual(plain(store.load()),[]);
});

test('letter drills target repeated expected errors using suitable dictionary words and exactly 20 words', () => {
    const c = core();
    const result = c.selectDrill({events:[{type:'word',word:'cat'},{type:'error',expected:'a',typed:'x',word:'cat'},{type:'error',expected:'a',typed:'z',word:'cat'}],dictionary:['cat','dog','bat','Cab','a!'],allowed:'abcdefghijklmnopqrstuvwxyz',onlyLower:true,punctuation:''});
    assert.equal(result.words.length,20);
    assert.ok(result.words.every(word => word==='cat' || word==='bat'));
    assert.match(result.reason,/a/);
});

test('space and end-of-word errors practise associated failed words instead of unrelated dictionary words', () => {
    const c = core();
    for (const error of [{expected:'a',typed:' ',word:'cat'},{expected:'',typed:'x',word:'cat'},{expected:' ',typed:'x',word:'cat'}]) {
        const result = c.selectDrill({events:[{type:'error',...error}],dictionary:['bat'],allowed:'abct',onlyLower:true,punctuation:''});
        assert.equal(result.words.length,20);
        assert.ok(result.words.every(word => word==='cat'));
        assert.match(result.reason,/word|space/i);
    }
});

test('sentence drills split the failed sentence into allowed individual words', () => {
    const result = core().selectDrill({events:[{type:'error',expected:'a',typed:'x',word:'A cat sat.'}],dictionary:['bat'],allowed:'acst',onlyLower:true,punctuation:'',fullSentence:true});
    assert.equal(result.words.length,20);
    assert.ok(result.words.every(word => ['a','cat','sat'].includes(word)));
    assert.ok(result.words.includes('cat'));
    assert.match(result.reason,/sentence|word/i);
});

test('drills respect allowed alphabet, case and punctuation with explicit letter fallback', () => {
    const c = core();
    const fallback = c.selectDrill({events:[{type:'error',expected:'z',typed:'x',word:'zoo'}],dictionary:['zoo','CAT','c!'],allowed:'cat',onlyLower:true,punctuation:''});
    assert.equal(fallback.words.length,20);
    assert.ok(fallback.words.every(word => /^[cat]+$/.test(word)));
    assert.match(fallback.reason,/letter|combination/i);
    const punctuation = c.selectDrill({events:[{type:'error',expected:"'",typed:'x',word:"can't"}],dictionary:["can't",'cant'],allowed:'cant',onlyLower:true,punctuation:"'"});
    assert.ok(punctuation.words.every(word => word==="can't"));
    const uppercase = c.selectDrill({events:[{type:'error',expected:'C',typed:'x',word:'Cat'}],dictionary:['Cat','cat'],allowed:'cat',onlyLower:false,punctuation:''});
    assert.ok(uppercase.words.every(word => word==='Cat'));
    assert.deepEqual(plain(c.selectDrill({events:[],dictionary:['cat'],allowed:'',onlyLower:true,punctuation:''}).words),[]);
});

test('malformed imported dates cannot break history loading and numeric epoch dates remain valid', () => {
    const storage = memory({'smt.history.v1':JSON.stringify({version:1,sessions:[session({date:{valueOf:null,toString:null}}),session({id:'epoch',date:0})]})});
    const records = core().createStore(storage).load();
    assert.equal(records.length,2);
    assert.ok(Number.isFinite(Date.parse(records[0].date)));
    assert.equal(records[1].date,'1970-01-01T00:00:00.000Z');
});

test('invalid completions leave history intact and stored counts remain finite and internally bounded', () => {
    const store = core().createStore(memory());
    store.save(session({attempts:2.9,correctAttempts:10,accuracy:120}));
    for (const invalid of [null,{},session({id:''}),session({settings:null})]) assert.equal(store.save(invalid).length,1);
    const saved = store.load()[0];
    assert.equal(saved.attempts,2);
    assert.equal(saved.correctAttempts,2);
    assert.equal(saved.mistakes,0);
    assert.equal(saved.accuracy,100);
});

// Difficulty is assessed on each test; the earned rank remains unified per layout.
test('rank tiers require the approved minimum learning level in the same qualifying test', () => {
    const c=core();
    for(const [level,name] of [[1,'Apprentice'],[2,'Typist'],[3,'Adept'],[4,'Expert'],[5,'Master'],[6,'Master'],[7,'Supreme Master'],[8,'Supreme Master'],['sentences','Supreme Master']]) {
        assert.equal(c.rankFor(session({wpm:200,accuracy:100,settings:{...normal,layout:'dvorak',level}})).name,name,String(level));
    }
    const saved=[session({id:'fast',wpm:200,accuracy:100,settings:{...normal,level:1}}),session({id:'harder',wpm:29,accuracy:100,settings:{...normal,level:3}})];
    assert.equal(c.earnedRank(saved,normal).name,'Apprentice','does not combine speed from an easy test with level from a slower test');
    saved.push(session({id:'earned',wpm:55,accuracy:94,settings:{...normal,level:3}}));
    assert.equal(c.earnedRank(saved,{...normal,level:1}).name,'Adept','one earned rank survives switching back to an earlier level');
});

test('movement results stay separate from mistake drills and cannot award a rank',()=>{
 const c=core();const movement={...normal,layout:'dvorak',level:6,drill:true,practice:'movement',practiceHand:'both'};
 assert.notEqual(c.comparisonKey(movement),c.comparisonKey({...movement,practice:''}));
 assert.notEqual(c.comparisonKey(movement),c.comparisonKey({...movement,practiceHand:'left'}));
 assert.notEqual(c.comparisonKey(movement),c.comparisonKey({...movement,drill:false,practice:''}));
 assert.equal(c.rankFor(session({duration:60000,words:20,wpm:200,accuracy:100,settings:movement})).index,-1);
});
