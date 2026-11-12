/* Dvorak return reaches. Physical positions determine hands, not letter order. */
(function(root){
    const left=new Set('KeyQ KeyW KeyE KeyR KeyT KeyA KeyS KeyD KeyF KeyG KeyZ KeyX KeyC KeyV KeyB'.split(' '));
    const right=new Set('KeyY KeyU KeyI KeyO KeyP KeyH KeyJ KeyK KeyL Semicolon KeyN KeyM Comma Period Slash'.split(' '));
    function handOf(letter,map){
        const code=Object.keys(map || {}).find(code=>map[code]===letter);
        return left.has(code)?'left':right.has(code)?'right':null;
    }
    function create({layout,level,hand='both',levels={},map={}}={}){
        level=Number(level);
        if(layout!=='dvorak'||!Number.isInteger(level)||level<2||level>6||!['both','left','right'].includes(hand))return {words:[],newKeys:[]};
        const familiar=[...new Set(Array.from({length:level-1},(_,i)=>levels['lvl'+(i+1)]||'').join(''))];
        const fresh=[...new Set(levels['lvl'+level]||'')].filter(key=>handOf(key,map)&&(hand==='both'||handOf(key,map)===hand));
        const targets=fresh.map(key=>({key,anchors:familiar.filter(anchor=>handOf(anchor,map)===handOf(key,map))})).filter(item=>item.anchors.length);
        const words=[];
        targets.forEach(({key,anchors},index)=>{
            for(let i=anchors.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[anchors[i],anchors[j]]=[anchors[j],anchors[i]];}
            const count=Math.floor(20/targets.length)+(index<20%targets.length?1:0);
            for(let i=0;i<count;i++){const anchor=anchors[(i+index)%anchors.length];words.push(anchor+key+anchor);}
        });
        if(hand==='both'){
            const queues={left:words.filter(word=>handOf(word[1],map)==='left'),right:words.filter(word=>handOf(word[1],map)==='right')};
            words.length=0;
            // Randomize which hand leads each pair, keeping both sides distributed
            // through the session and preserving each hand's new-key progression.
            while(queues.left.length&&queues.right.length){
                const first=Math.random()<0.5?'left':'right', second=first==='left'?'right':'left';
                words.push(queues[first].shift(),queues[second].shift());
            }
            words.push(...queues.left,...queues.right);
        }
        return {words,newKeys:targets.map(item=>item.key),hand};
    }
    root.MovementPractice=Object.freeze({create,handOf});
})(globalThis);
