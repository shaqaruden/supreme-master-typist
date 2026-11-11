/* Legacy preferences remain usable when browser persistence is unavailable. */
const settingsStorage = (() => {
    const memory = new Map(), removed = new Set();
    let storage;
    try { storage = window.localStorage; } catch (_) {}
    const methods = {
        getItem(key) {
            key=String(key);
            if(removed.has(key))return null;
            if(memory.has(key))return memory.get(key);
            try{return storage ? storage.getItem(key) : null;}catch(_){return null;}
        },
        setItem(key,value) {
            key=String(key);value=String(value);
            removed.delete(key);memory.set(key,value);
            try{if(storage)storage.setItem(key,value);}catch(_){}
        },
        removeItem(key) {
            key=String(key);memory.delete(key);removed.add(key);
            try{if(storage)storage.removeItem(key);}catch(_){}
        }
    };
    return new Proxy(methods,{
        get(target,key){return key in target ? target[key] : typeof key==='string' ? target.getItem(key) : undefined;},
        set(target,key,value){target.setItem(key,value);return true;}
    });
})();
