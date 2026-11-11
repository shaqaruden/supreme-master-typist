/* An independent visual layer: no changes to test state or saved theme choices. */
const GameMode = (() => {
    const scenes = Object.freeze({courtyard:Object.freeze({image:'app/game-courtyard.webp',position:'center 54%'})});
    const root=document.documentElement;
    const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
    let enabled=settingsStorage.getItem('smt.gameMode')==='true';
    let feedbackTimer, celebrationTimer, announcementTimer, animation;
    let lastCompletion=null;
    const decorated=new Map();
    const observer=new MutationObserver(()=>decorate());
    const keyboardObserver=new MutationObserver(()=>{decorate();updateKeyboardHint();});
    let pressedKey, keyTimer, observedInput='';
    const mappingObserver=new MutationObserver(()=>updateMappingState());
    function updateMappingState() {
        const control=document.querySelector('#keymapping');
        const button=control?.querySelector('btn');
        if(!button)return;
        const on=control.getAttribute('data-value')==='on';
        button.setAttribute('aria-pressed',String(on));
        button.querySelector('.game-mapping-state').textContent=on?'On':'Off';
    }
    const frames=[
        ['.cheatsheet','framed-golden-2'],['#gameModeToggle','framed-golden-2'],['.typingArea','framed-golden'],['#testTimeline','framed'],['#progressDialog,#rankDialog,#sub card','framed-golden-2'],
        ['#drillBanner','framed-grey'],['#gameAnnouncement','framed-golden'],['.cheatsheet key,.rankStep,sidebar .nav li span','framed-grey']
    ];
    function decorate() {
        for(const [node,classes] of decorated){
            if(!enabled || !node.isConnected){node.classList.remove(...classes);decorated.delete(node);}
        }
        if(!enabled)return;
        function add(node,classes){
            if(decorated.has(node))return;
            const added=classes.filter(name=>!node.classList.contains(name));
            node.classList.add(...added);decorated.set(node,added);
        }
        frames.forEach(([selector,frame])=>document.querySelectorAll(selector).forEach(node=>add(node,['rpgui-container',frame])));
        document.querySelectorAll('.trainingButton,#resetButton,#gameModeToggle,#selectors btn,#testTimeline [role="tab"],.rankBadge').forEach(node=>add(node,['rpgui-button']));
    }
    function observeDecorations() {
        observer.disconnect();decorate();
        if(enabled)document.querySelectorAll('#testTimeline,#progressContent,#rankList').forEach(node=>observer.observe(node,{childList:true,subtree:true}));
    }
    function keyboardKey(code) {
        if(code==='Enter')code=document.querySelector('.cheatsheet #EnterBottom')?'EnterBottom':code;
        return [...document.querySelectorAll('.cheatsheet key')].find(key=>key.id===code);
    }
    function characterKey(character) {
        const map=keyboardMap;
        const code=Object.keys(map).find(code=>typeof map[code]==='string' && map[code]===character) ||
            Object.keys(map.shiftLayer || {}).find(code=>map.shiftLayer[code]===character);
        return code ? keyboardKey(code) : null;
    }
    function clearKeyboardFeedback() {
        clearTimeout(keyTimer);
        document.querySelectorAll('.cheatsheet .game-key-pressed,.cheatsheet .game-key-miss').forEach(key=>key.classList.remove('game-key-pressed','game-key-miss'));
        pressedKey=null;
        document.querySelector('.cheatsheet')?.removeAttribute('data-game-keyboard-error');
    }
    function flashKeyboardError(key) {
        key?.classList.add('game-key-miss');
        document.querySelector('.cheatsheet')?.setAttribute('data-game-keyboard-error','true');
        clearTimeout(keyTimer);keyTimer=setTimeout(clearKeyboardFeedback,220);
    }
    function spaceKey() {
        // Only the ANSI/ISO templates identify a spacebar by its width/position.
        if(!document.querySelector('.cheatsheetContainer:is(.ansi,.iso)'))return null;
        return document.querySelector('.cheatsheet row:nth-child(5) key:nth-child(4)');
    }
    function updateKeyboardHint() {
        document.querySelectorAll('.cheatsheet .game-next-key').forEach(key=>key.classList.remove('game-next-key'));
        document.querySelector('.cheatsheet')?.removeAttribute('data-game-keyboard-hint');
        if(!document.querySelector('.cheatsheet') || !enabled || typeof correctAnswer==='undefined' || typeof trainingSessionFinished==='undefined' || trainingSessionFinished)return;
        const value=fakeInput.innerText;
        const sheet=document.querySelector('.cheatsheet');
        if(value.length>observedInput.length && !correctAnswer.startsWith(value)){
            const typed=value.slice(-1).replace('\u00a0',' ');
            flashKeyboardError(typed===' '?spaceKey():characterKey(typed));
        }
        observedInput=value;
        let key, hint;
        if(!correctAnswer.startsWith(value)){key=keyboardKey('BackSpace');hint='Correct: Backspace';}
        else if(value.length===correctAnswer.length){
            key=spaceKey();hint='Next: Space / Enter';
        }else {key=characterKey(correctAnswer[value.length]);hint='Next: '+correctAnswer[value.length];}
        sheet.dataset.gameKeyboardHint=hint;
        key?.classList.add('game-next-key');
    }
    function keyboardDown(event) {
        if(!enabled || trainingSessionFinished || event.ctrlKey || event.metaKey || event.altKey || ['Tab','Escape'].includes(event.key))return;
        clearKeyboardFeedback();
        const remapping=settingsStorage.getItem('keyRemapping')==='true';
        const character=remapping ? (event.shiftKey ? keyboardMap.shiftLayer?.[event.code] : keyboardMap[event.code]) : event.key;
        pressedKey=event.key==='Backspace' ? keyboardKey('BackSpace') : event.key==='Shift' ? keyboardKey(event.code==='ShiftRight'?'RightShift':'LeftShift') :
            event.key==='Enter' ? keyboardKey('Enter') : remapping ? keyboardKey(event.code) : characterKey(character);
        if(event.key===' ')pressedKey=spaceKey();
        pressedKey?.classList.add('game-key-pressed');
        if((event.key===' ' || event.key==='Enter') ? fakeInput.innerText!==correctAnswer : typeof character==='string' && character.length===1 && character!==correctAnswer[fakeInput.innerText.length])flashKeyboardError(pressedKey);
        clearTimeout(keyTimer);keyTimer=setTimeout(clearKeyboardFeedback,220);
    }
    function observeKeyboard() {
        keyboardObserver.disconnect();
        if(!enabled)document.querySelector('.cheatsheet')?.removeAttribute('data-game-keyboard-hint');
        if(enabled)document.querySelectorAll('.cheatsheet,#fakeInput,.typingArea .prompt').forEach(node=>keyboardObserver.observe(node,{childList:true,subtree:true}));
        updateKeyboardHint();
    }
    function updateButton() {
        const button=document.querySelector('#gameModeToggle');
        if(!button)return;
        button.setAttribute('aria-pressed',String(enabled));
        button.title=enabled?'Turn off Game Mode':'Turn on medieval Game Mode';
        button.querySelector('.game-toggle-state').textContent=enabled?'On':'Off';
    }
    function reset() {
        clearTimeout(feedbackTimer);clearTimeout(celebrationTimer);clearTimeout(announcementTimer);
        animation?.cancel();animation=null;
        clearKeyboardFeedback();observedInput='';
        delete root.dataset.gameFeedback;delete root.dataset.gameCelebrating;
        const announcement=document.querySelector('#gameAnnouncement');
        if(announcement){announcement.textContent='';announcement.hidden=true;}
    }
    function apply() {
        const requested=settingsStorage.getItem('smt.gameScene');
        const id=Object.prototype.hasOwnProperty.call(scenes,requested)?requested:'courtyard';
        const scene=scenes[id];
        root.dataset.gameMode=String(enabled);
        root.dataset.gameScene=id;
        root.style.setProperty('--game-background',`url("${new URL(scene.image,document.baseURI).href}")`);
        root.style.setProperty('--game-background-position',scene.position);
        updateButton();observeDecorations();observeKeyboard();window.GameDropdowns?.sync();
    }
    function setEnabled(value) {
        reset();enabled=value===true;
        settingsStorage.setItem('smt.gameMode',String(enabled));apply();
    }
    function feedback(kind) {
        if(!enabled || reducedMotion.matches)return;
        clearTimeout(feedbackTimer);
        root.dataset.gameFeedback=kind;
        feedbackTimer=setTimeout(()=>delete root.dataset.gameFeedback,200);
    }
    function complete(result) {
        if(!enabled || result.id===lastCompletion)return;
        lastCompletion=result.id;
        clearTimeout(celebrationTimer);clearTimeout(announcementTimer);
        const announcement=document.querySelector('#gameAnnouncement');
        announcement.textContent=result.attempts && result.accuracy===100?'Flawless trial complete!':'Trial complete!';
        announcement.hidden=false;
        if(!reducedMotion.matches){
            root.dataset.gameCelebrating='true';
            animation=document.querySelector('#testTimeline').animate([{opacity:.7,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:280,easing:'steps(5,end)'});
            celebrationTimer=setTimeout(()=>delete root.dataset.gameCelebrating,550);
        }
        announcementTimer=setTimeout(()=>{announcement.hidden=true;announcement.textContent='';},1600);
    }
    apply();
    document.addEventListener('DOMContentLoaded',()=>{
        updateButton();observeDecorations();updateMappingState();observeKeyboard();
        input.addEventListener('keydown',keyboardDown,true);
        input.addEventListener('keyup',()=>{pressedKey?.classList.remove('game-key-pressed');pressedKey=null;});
        input.addEventListener('blur',clearKeyboardFeedback);
        window.addEventListener('blur',clearKeyboardFeedback);
        mappingObserver.observe(document.querySelector('#keymapping'),{attributes:true,attributeFilter:['data-value']});
        document.querySelector('#gameModeToggle').addEventListener('click',()=>{
            const resume=gameON;
            setEnabled(!enabled);
            if(resume)input.focus();
        });
    });
    reducedMotion.addEventListener('change',()=>{if(reducedMotion.matches)reset();});
    return Object.freeze({isEnabled:()=>enabled,setEnabled,feedback,complete,reset,scenes});
})();
