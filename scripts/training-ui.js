/* Results, targeted practice and local progress. All measurements come from the recorder. */
let trainingSessionFinished = false;
let trainingSessionSettings = null;
let trainingStartedAt = null;
let trainingDrill = null;
let trainingNormal = null;
let trainingResult = null;
let trainingOpener = null;
let trainingRankOpener = null;
let trainingHistory;
try { trainingHistory = TrainingCore.createStore(localStorage); }
catch { trainingHistory = TrainingCore.createStore({getItem(){throw Error('Storage unavailable');},setItem(){throw Error('Storage unavailable');},removeItem(){throw Error('Storage unavailable');}}); }

function trainingNode(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
}
function trainingCharacter(value) { return value === '' ? 'End of word' : value === ' ' ? 'Space' : value; }
function trainingSettings() {
    return {
        layout:currentLayout, keyboard:currentKeyboard, level:fullSentenceMode ? 'sentences' : Number(currentLevel),
        mode:timeLimitMode ? 'time' : 'words', limit:trainingDrill ? 20 : Number(timeLimitMode ? timeMax : wordMax),
        onlyLower, punctuation, requireBackspaceCorrection,
        keyRemapping:settingsStorage.getItem('keyRemapping') === 'true',
        customFingerprint:currentLayout === 'custom' ? JSON.stringify({map:keyboardMap,levels:levelDictionaries.custom}) : '',
        drill:!!trainingDrill
    };
}
function trainingReset() {
    GameMode.reset();
    trainingSessionFinished = false;
    trainingStartedAt = null;
    trainingSessionSettings = null;
    const actions = document.querySelector('#resultActions');
    if (actions) actions.hidden = true;
    const progress = document.querySelector('#openProgress');
    if (progress) { progress.disabled = false; progress.title = 'View saved progress in this browser'; }
    const banner = document.querySelector('#drillBanner');
    if (banner) banner.hidden = !trainingDrill;
    if (trainingDrill) {
        trainingDrill.index = 0;
        trainingDrill.words = trainingDrill.words.slice(1).concat(trainingDrill.words[0]);
        timeLimitMode = false;
        scoreMax = 20;
        fullSentenceMode = false;
    }
    scoreText.style.display = timeLimitMode ? 'none' : 'flex';
}
function trainingStarted() {
    if (trainingSessionFinished) return;
    if (trainingStartedAt === null) {
        trainingStartedAt = performance.now();
        trainingSessionSettings = trainingSettings();
    }
    gameON = true;
    GameMode.feedback(fakeInput.innerText === correctAnswer ? 'word' : fakeInput.innerText === correctAnswer.slice(0,fakeInput.innerText.length) ? 'hit' : 'miss');
    const progress = document.querySelector('#openProgress');
    progress.disabled = true;
    progress.title = 'Finish or reset this test to view Progress';
}
function trainingLine(maxWords) {
    if (!trainingDrill) return null;
    let line = [], length = 0;
    while (line.length < Math.max(0,maxWords) && length < lineLength) {
        const word = trainingDrill.words[trainingDrill.index++ % trainingDrill.words.length];
        line.push(word);
        length += word.length + 1;
    }
    return line.join(' ');
}
function trainingExitDrill(resetNow = true) {
    if (!trainingDrill) return;
    trainingDrill = null;
    timeLimitMode = trainingNormal.timeLimitMode;
    scoreMax = trainingNormal.scoreMax;
    fullSentenceMode = trainingNormal.fullSentenceMode;
    trainingNormal = null;
    if (resetNow) reset();
}
function trainingStartDrill() {
    if (!trainingResult || !trainingResult.events.some(event=>event.type === 'error')) return;
    const endLevel = currentLayout === 'custom' ? Math.min(6,Number(currentLevel)) : Number(currentLevel);
    const allowed = Array.from({length:endLevel},(_,i)=>levelDictionaries[currentLayout]['lvl'+(i+1)] || '').join('') + punctuation;
    const drill = TrainingCore.selectDrill({events:trainingResult.events,dictionary:wordLists['lvl'+currentLevel],allowed,onlyLower,punctuation,fullSentence:fullSentenceMode});
    if (!drill.words.length) {
        document.querySelector('#storageNotice').textContent = drill.reason;
        return;
    }
    if (!trainingDrill) trainingNormal = {timeLimitMode,scoreMax,fullSentenceMode};
    trainingDrill = {...drill,index:0};
    document.querySelector('#drillReason').textContent = `Targeted drill · 20 words. ${drill.reason}`;
    reset();
}
function trainingSelectTab(name, focus = false) {
    document.querySelectorAll('[data-analysis-tab]').forEach(button=>{
        const active = button.dataset.analysisTab === name;
        button.setAttribute('aria-selected',String(active));
        button.tabIndex = active ? 0 : -1;
        document.querySelector('#'+button.getAttribute('aria-controls')).hidden = !active;
        if (active && focus) button.focus();
    });
}
function trainingTable(headers, rows) {
    const table = trainingNode('table');
    const head = trainingNode('thead'), tr = trainingNode('tr');
    headers.forEach(label=>{const th=trainingNode('th',label);th.scope='col';tr.append(th);});
    head.append(tr);table.append(head);
    const body = trainingNode('tbody');
    rows.forEach(values=>{const row=trainingNode('tr');values.forEach(value=>row.append(trainingNode('td',String(value))));body.append(row);});
    table.append(body);return table;
}
function trainingRenderMistakes(result) {
    const panel = document.querySelector('#mistakesPanel');panel.replaceChildren();
    const letters = result.letters.filter(item=>item.errors).sort((a,b)=>b.errors-a.errors || a.character.localeCompare(b.character));
    if (!letters.length) {panel.append(trainingNode('h3','A clean test.'),trainingNode('p','No mistakes to practise. Try a longer test or the next level.'));return;}
    panel.append(trainingNode('h3','Letters to work on'),trainingNode('p','Errors stay in this summary after you correct them. Rates count attempts at the expected letter.'));
    panel.append(trainingTable(['Expected','Mistakes','Attempts','Error rate'],letters.map(item=>[trainingCharacter(item.character),item.errors,item.attempts,(item.errors*100/item.attempts).toFixed(1)+'%'])));
    panel.append(trainingNode('h3','Common mix-ups'));
    const pairs=[...result.confusions].sort((a,b)=>b.count-a.count);
    panel.append(trainingTable(['Expected','You typed','Times'],pairs.map(pair=>[trainingCharacter(pair.expected),trainingCharacter(pair.typed),pair.count])));
}
function trainingRenderHeatmap(result) {
    const panel = document.querySelector('#heatmapPanel');panel.replaceChildren();
    panel.append(trainingNode('h3',`${currentLayout} · ${currentKeyboard} keyboard`),trainingNode('p','Expected-key error rates. Select a key for counts. Unused keys have no fill; green means no errors; stronger red means more errors.'));
    const keyboard = trainingNode('div',undefined,'heatKeyboard');
    const template = document.createElement('template');
    template.innerHTML = ({ansi:ansiDivs,iso:isoDivs,ortho:orthoDivs,ortho_extended:orthoExtDivs})[currentKeyboard] || ansiDivs;
    const detail = trainingNode('p','Select a key to inspect its accuracy.','heatDetails');detail.setAttribute('aria-live','polite');
    template.content.querySelectorAll('row').forEach(sourceRow=>{
        const row=trainingNode('div',undefined,'heatRow');
        sourceRow.querySelectorAll('key').forEach(source=>{
            const code=source.id;
            const character=keyboardMap[code];
            const button=trainingNode('button',typeof character==='string'?character.toUpperCase():'·','heatKey');button.type='button';
            if (typeof character !== 'string') {button.disabled=true;row.append(button);return;}
            const values=result.letters.filter(item=>item.character.toLowerCase()===character.toLowerCase());
            const attempts=values.reduce((n,item)=>n+item.attempts,0), errors=values.reduce((n,item)=>n+item.errors,0);
            const rate=attempts?errors/attempts:0;
            const label=`${character}: ${errors} errors / ${attempts} attempts${attempts?` · ${(rate*100).toFixed(1)}% error rate`:' · Not used'}`;
            button.dataset.character=character;
            button.title=label;button.setAttribute('aria-label',label);
            if(attempts) {button.classList.add(errors?'hasErrors':'perfect');button.style.setProperty('--heat-strength',`${Math.round(20+rate*65)}%`);}
            button.addEventListener('click',()=>detail.textContent=label);button.addEventListener('focus',()=>detail.textContent=label);
            row.append(button);
        });keyboard.append(row);
    });
    panel.append(keyboard,detail,trainingNode('h3','All attempted characters'));
    panel.append(trainingTable(['Character','Attempts','Mistakes','Error rate'],result.letters.map(item=>[trainingCharacter(item.character),item.attempts,item.errors,(100*item.errors/item.attempts).toFixed(1)+'%'])));
}
function trainingRankLevel(tier) { return tier.minLevel >= 7 ? 'All Words or Full Sentences' : `Level ${tier.minLevel} or above`; }
function trainingRankText(rank) {
    const next=rank.next;
    return next ? `Next: ${next.name} · ${trainingRankLevel(next)}${next.index===0?' · Complete a qualifying test':` · ${next.wpm} WPM and ${next.accuracy}% accuracy`}` : 'Highest tier achieved.';
}
function trainingComplete(result) {
    trainingResult = result;
    GameMode.complete(result);
    const settings=trainingSessionSettings || trainingSettings();
    const session={...result,settings,date:new Date().toISOString(),mistakes:result.attempts-result.correctAttempts};
    const previous=trainingHistory.load();
    const best=TrainingCore.personalBests(previous,session);
    const sessions=trainingHistory.save(session);
    const rank=TrainingCore.earnedRank(sessions,settings);
    document.querySelector('#rankBadge').textContent=rank.name;
    document.querySelector('#rankBadge').title=`${trainingRankText(rank)}. Ranks require a normal test lasting 30 seconds with at least 10 completed words.`;
    const speedLabel=best.first?'First result':best.speed.isBest?'New speed best':`Previous speed best: ${best.speed.previous.toFixed(1)} WPM`;
    document.querySelector('#recordSummary').textContent=`${speedLabel} · Best ${best.speed.best.toFixed(1)} WPM · Accuracy best ${best.accuracy.best.toFixed(1)}%`;
    const status=trainingHistory.status();
    document.querySelector('#storageNotice').textContent=status.available?'Saved in this browser.':`Progress is available for this visit, but browser storage is ${status.reason}.`;
    document.querySelector('#resultActions').hidden=false;
    document.querySelector('#practiceMistakes').disabled=!result.events.some(event=>event.type==='error');
    document.querySelector('#openProgress').disabled=false;
    document.querySelector('#openProgress').title='View saved progress in this browser';
    trainingRenderMistakes(result);trainingRenderHeatmap(result);trainingSelectTab('timeline');
}
function trainingGroupLabel(settings) {
    return `${settings.drill?'Drill · ':''}${settings.level==='sentences'?'Sentences':'Level '+settings.level} · ${settings.mode==='time'?settings.limit+'s':settings.limit+' words'} · ${settings.keyboard}${settings.keyRemapping?' · mapped':''}${settings.onlyLower?'':' · capitals'}${settings.punctuation?' · punctuation':''}${settings.requireBackspaceCorrection?' · backspace':' · retry'}${settings.customFingerprint?' · custom '+trainingFingerprint(settings.customFingerprint):''}`;
}
function trainingFingerprint(text) {let n=2166136261;for(const char of text)n=Math.imul(n^char.charCodeAt(0),16777619);return (n>>>0).toString(16);}
function trainingTrend(rows, field, label, color, fixedMax) {
    const ns='http://www.w3.org/2000/svg', svg=document.createElementNS(ns,'svg');
    svg.setAttribute('viewBox','0 0 620 150');svg.setAttribute('role','img');svg.setAttribute('aria-label',`${label}: ${rows.map(row=>row[field].toFixed(1)).join(', ')}`);svg.classList.add('progressTrend');
    const max=fixedMax || Math.max(10,...rows.map(row=>row[field]));
    function add(tag,attrs,text){const e=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));if(text)e.textContent=text;svg.append(e);return e;}
    [0,.5,1].forEach(f=>{const y=120-f*90;add('line',{x1:45,x2:600,y1:y,y2:y,class:'trendGrid'});add('text',{x:38,y:y+4,'text-anchor':'end'},(max*f).toFixed(0));});
    add('text',{x:45,y:16},label);
    const points=rows.map((row,i)=>[45+(rows.length===1?.5:i/(rows.length-1))*555,120-row[field]/max*90]);
    add('polyline',{points:points.map(p=>p.join(',')).join(' '),fill:'none',stroke:color,'stroke-width':2.5});
    points.forEach((p,i)=>{const dot=add('circle',{cx:p[0],cy:p[1],r:3,fill:color});const title=document.createElementNS(ns,'title');title.textContent=`${new Date(rows[i].date).toLocaleString()}: ${rows[i][field].toFixed(1)}`;dot.append(title);});
    add('text',{x:45,y:145},'Older');add('text',{x:600,y:145,'text-anchor':'end'},'Recent tests');return svg;
}
function trainingRenderProgress(preserve = false) {
    const sessions=trainingHistory.load();
    const settings=trainingSettings();
    const layoutSelect=document.querySelector('#progressLayout'),groupSelect=document.querySelector('#progressGroup');
    const oldLayout=preserve?layoutSelect.value:settings.layout;
    const layouts=[...new Set([settings.layout,...sessions.map(row=>row.settings.layout)])];
    layoutSelect.replaceChildren(...layouts.map(layout=>{const option=trainingNode('option',layout);option.value=layout;return option;}));
    layoutSelect.value=layouts.includes(oldLayout)?oldLayout:settings.layout;
    const layoutRows=sessions.filter(row=>row.settings.layout===layoutSelect.value);
    const groups=new Map();layoutRows.forEach(row=>groups.set(TrainingCore.comparisonKey(row.settings),row.settings));
    if(layoutSelect.value===settings.layout)groups.set(TrainingCore.comparisonKey(settings),settings);
    const oldGroup=preserve?groupSelect.value:TrainingCore.comparisonKey(settings);
    const all=trainingNode('option','All test settings');all.value='*';
    groupSelect.replaceChildren(all,...[...groups].map(([key,value])=>{const option=trainingNode('option',trainingGroupLabel(value));option.value=key;return option;}));
    groupSelect.value=groups.has(oldGroup)?oldGroup:'*';
    trainingProgressRows();
}
function trainingProgressRows() {
    const layoutValue=document.querySelector('#progressLayout').value,group=document.querySelector('#progressGroup').value;
    const sessions=trainingHistory.load();
    const rows=sessions.filter(row=>row.settings.layout===layoutValue && (group==='*'||TrainingCore.comparisonKey(row.settings)===group));
    const content=document.querySelector('#progressContent');content.replaceChildren();
    const selectedSettings=group!=='*' && rows.length ? rows[0].settings : {...trainingSettings(),layout:layoutValue,customFingerprint:layoutValue==='custom' ? (rows.at(-1)?.settings.customFingerprint || '') : ''};
    const rank=TrainingCore.earnedRank(sessions,selectedSettings);
    const rankHeading=trainingNode('h3');
    const rankButton=trainingNode('button',rank.name,'rankBadge');
    rankButton.type='button';rankButton.setAttribute('aria-haspopup','dialog');rankButton.setAttribute('aria-controls','rankDialog');
    rankButton.title='View all ranks and your position';
    rankButton.addEventListener('click',()=>trainingOpenRanks(rankButton,selectedSettings));
    rankHeading.append(rankButton,document.createTextNode(' · '+layoutValue));
    content.append(rankHeading,trainingNode('p',trainingRankText(rank)));
    content.append(trainingNode('p','Ranks require standard tests lasting at least 30 seconds with 10 completed words. Both speed and accuracy thresholds must be met. Targeted drills never award ranks.','muted'));
    if(!rows.length){content.append(trainingNode('h3','No completed tests for these settings yet.'),trainingNode('p','Finish a test to begin your progress history. Everything is stored in this browser.'));return;}
    content.append(trainingNode('p',`${rows.length} saved tests · Best ${Math.max(...rows.map(row=>row.wpm)).toFixed(1)} WPM · Best accuracy ${Math.max(...rows.map(row=>row.accuracy)).toFixed(1)}%${group==='*'?' · Mixed settings; choose a group for comparable results.':''}`));
    const recent=rows.slice(-30);
    content.append(trainingTrend(recent,'wpm','Speed · WPM','var(--accent-half)'),trainingTrend(recent,'accuracy','Accuracy · %','var(--green)',100));
    content.append(trainingNode('h3','Recent tests'));
    content.append(trainingTable(['Date','Test','WPM','Accuracy','Words','Time'],rows.slice(-20).reverse().map(row=>[new Date(row.date).toLocaleString(),trainingGroupLabel(row.settings),row.wpm.toFixed(1),row.accuracy.toFixed(1)+'%',row.words,(row.duration/1000).toFixed(1)+'s'])));
}
function trainingOpenProgress(button) {
    if(gameON && !trainingSessionFinished)return;
    trainingOpener=button;trainingRenderProgress();document.querySelector('#progressDialog').showModal();
}
function trainingOpenRanks(opener, settings = trainingSessionSettings || trainingSettings()) {
    const rank=TrainingCore.earnedRank(trainingHistory.load(),settings);
    trainingRankOpener=opener;
    document.querySelector('#rankPosition').textContent=`Your rank for ${settings.layout}: ${rank.name}. ${trainingRankText(rank)}`;
    const list=document.querySelector('#rankList');list.replaceChildren();
    const steps=[{name:'Unranked',index:-1},...TrainingCore.ranks()];
    steps.forEach(tier=>{
        const item=trainingNode('li',undefined,'rankStep');
        const label=trainingNode('div',undefined,'rankStepHeading');
        label.append(trainingNode('strong',tier.name));
        if(tier.index===rank.index){item.setAttribute('aria-current','step');label.append(trainingNode('span','You are here','rankStepStatus'));}
        else if(tier.index>=0&&tier.index<rank.index)label.append(trainingNode('span','Achieved','rankStepStatus'));
        else if(tier.index>rank.index)label.append(trainingNode('span','Not yet earned','rankStepStatus'));
        item.append(label,trainingNode('p',tier.index<0?'Complete your first qualifying test.':tier.index===0?`${trainingRankLevel(tier)} · Complete a qualifying test at any speed and accuracy.`:`${trainingRankLevel(tier)} · ${tier.wpm} WPM and ${tier.accuracy}% accuracy`));
        list.append(item);
    });
    document.querySelector('#rankDialog').showModal();
}
function initTrainingUI() {
    document.querySelector('#rankBadge').addEventListener('click',event=>trainingOpenRanks(event.currentTarget));
    document.querySelector('#closeRanks').addEventListener('click',()=>document.querySelector('#rankDialog').close());
    document.querySelector('#rankDialog').addEventListener('close',()=>trainingRankOpener?.focus());
    document.querySelector('#openProgress').addEventListener('click',e=>trainingOpenProgress(e.currentTarget));
    document.querySelector('#resultsProgress').addEventListener('click',e=>trainingOpenProgress(e.currentTarget));
    document.querySelector('#closeProgress').addEventListener('click',()=>document.querySelector('#progressDialog').close());
    document.querySelector('#progressDialog').addEventListener('close',()=>trainingOpener?.focus());
    document.querySelector('#progressLayout').addEventListener('change',()=>trainingRenderProgress(true));
    document.querySelector('#progressGroup').addEventListener('change',trainingProgressRows);
    document.querySelector('#clearHistory').addEventListener('click',()=>{
        if(!confirm('Clear saved typing history and personal bests in this browser? Keyboard and theme preferences will be kept.'))return;
        trainingHistory.clear();trainingRenderProgress(true);
    });
    document.querySelector('#practiceMistakes').addEventListener('click',trainingStartDrill);
    document.querySelector('#exitDrill').addEventListener('click',()=>trainingExitDrill());
    const tabs=[...document.querySelectorAll('[data-analysis-tab]')];
    tabs.forEach((button,i)=>{
        button.addEventListener('click',()=>trainingSelectTab(button.dataset.analysisTab));
        button.addEventListener('keydown',event=>{
            let index=event.key==='ArrowRight'?(i+1)%tabs.length:event.key==='ArrowLeft'?(i+tabs.length-1)%tabs.length:event.key==='Home'?0:event.key==='End'?tabs.length-1:null;
            if(index!==null){event.preventDefault();trainingSelectTab(tabs[index].dataset.analysisTab,true);}
        });
    });
    document.addEventListener('click',event=>{
        if(trainingDrill && event.target.closest('.nav li,#layout li,#keyboard li,#keymapping,.preferences li'))trainingExitDrill();
    },true);
    document.addEventListener('change',event=>{
        if(trainingDrill && event.target.matches('.wordLimitModeInput,.timeLimitModeInput')){
            const value=event.target.value;trainingExitDrill(false);event.target.value=value;queueMicrotask(()=>reset());
        }
    },true);
}
document.addEventListener('DOMContentLoaded',initTrainingUI);
