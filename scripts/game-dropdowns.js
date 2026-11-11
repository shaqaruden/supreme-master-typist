/* Accessible header/list adapter for RPGUI's dropdown CSS and sprites.
   The existing native selects remain the sole source of selection values. */
window.GameDropdowns = (() => {
    const controls=[];
    let active=null, typeahead='', typedAt=0;
    function close(restoreFocus=false) {
        if(!active)return;
        const control=active;active=null;
        control.list.hidden=true;control.button.setAttribute('aria-expanded','false');
        if(restoreFocus)control.button.focus();
    }
    function position(control) {
        const rect=control.button.getBoundingClientRect(), margin=6;
        const width=Math.min(Math.max(rect.width,190),innerWidth-margin*2);
        const below=innerHeight-rect.bottom-margin, above=rect.top-margin;
        const upward=below<100 && above>below;
        const height=Math.max(0,Math.min(360,upward?above:below));
        Object.assign(control.list.style,{
            width:width+'px',maxHeight:height+'px',
            left:Math.max(margin,Math.min(rect.left,innerWidth-width-margin))+'px',
            top:upward?'auto':rect.bottom+'px',bottom:upward?(innerHeight-rect.top)+'px':'auto'
        });
    }
    function focusOption(control,index) {
        const options=control.items;index=(index+options.length)%options.length;
        options.forEach((item,i)=>item.tabIndex=i===index?0:-1);
        const item=options[index];item.focus({preventScroll:true});
        const top=item.offsetTop, bottom=top+item.offsetHeight;
        if(top<control.list.scrollTop)control.list.scrollTop=top;
        else if(bottom>control.list.scrollTop+control.list.clientHeight)control.list.scrollTop=bottom-control.list.clientHeight;
    }
    function open(control) {
        close();active=control;typeahead='';
        control.list.hidden=false;control.button.setAttribute('aria-expanded','true');position(control);
        focusOption(control,Math.max(0,control.select.selectedIndex));
    }
    function choose(control,index) {
        const value=control.select.options[index].value;
        close(true);
        if(control.select.value!==value){
            control.select.value=value;control.select.dispatchEvent(new Event('change',{bubbles:true}));
        }
        sync();
    }
    function sync() {
        close();const enabled=GameMode.isEnabled();
        controls.forEach(control=>{
            control.select.hidden=enabled;control.button.hidden=!enabled;
            control.label.htmlFor=enabled?control.button.id:control.select.id;
            const text=control.select.selectedOptions[0]?.textContent || '';
            control.value.textContent=text;
            control.button.setAttribute('aria-label',control.select.getAttribute('aria-label')+': '+text);
            control.items.forEach((item,i)=>item.setAttribute('aria-selected',String(i===control.select.selectedIndex)));
        });
    }
    for(const select of document.querySelectorAll('.headerDropdown select')){
        const button=document.createElement('button');button.type='button';button.id=select.id+'-rpgui-head';
        button.className='rpgui-dropdown-imp rpgui-dropdown-imp-header rpguiDropdownHeader';
        button.setAttribute('aria-haspopup','listbox');button.setAttribute('aria-expanded','false');
        const arrow=document.createElement('span');arrow.className='dropdownArrow';arrow.textContent='▼';arrow.setAttribute('aria-hidden','true');
        const value=document.createElement('span');value.className='dropdownValue';button.append(arrow,value);
        const list=document.createElement('ul');list.id=select.id+'-rpgui-list';list.className='rpgui-dropdown-imp rpguiDropdownList';list.hidden=true;
        list.setAttribute('role','listbox');list.setAttribute('aria-label',select.getAttribute('aria-label'));button.setAttribute('aria-controls',list.id);
        select.after(button);document.body.append(list);
        const control={select,button,list,value,label:select.parentElement.querySelector('label'),items:[]};controls.push(control);
        [...select.options].forEach((option,index)=>{
            const item=document.createElement('li');item.textContent=option.textContent;item.dataset.value=option.value;
            item.setAttribute('role','option');item.tabIndex=-1;list.append(item);control.items.push(item);
            item.addEventListener('click',()=>choose(control,index));
        });
        button.addEventListener('click',()=>active===control?close():open(control));
        button.addEventListener('keydown',event=>{
            if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){
                event.preventDefault();open(control);
                if(event.key==='Home'||event.key==='End')focusOption(control,event.key==='Home'?0:control.items.length-1);
            }
        });
        list.addEventListener('keydown',event=>{
            const index=control.items.indexOf(document.activeElement);
            if(event.key==='Escape'){event.preventDefault();close(true);}
            else if(event.key==='Tab'){
                // Return to the trigger before the browser advances to the next control.
                close(true);
            }else if(event.key==='Enter'||event.key===' '){event.preventDefault();choose(control,index);}
            else if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){
                event.preventDefault();focusOption(control,event.key==='Home'?0:event.key==='End'?control.items.length-1:index+(event.key==='ArrowDown'?1:-1));
            }else if(event.key.length===1 && !event.ctrlKey && !event.metaKey && !event.altKey){
                event.preventDefault();const now=performance.now();typeahead=now-typedAt>700?event.key:typeahead+event.key;typedAt=now;
                const found=control.items.findIndex(item=>item.textContent.toLowerCase().startsWith(typeahead.toLowerCase()));
                if(found>=0)focusOption(control,found);
            }
        });
    }
    document.addEventListener('pointerdown',event=>{
        if(active && !active.button.contains(event.target) && !active.list.contains(event.target))close();
    });
    document.addEventListener('focusin',event=>{if(active && !active.button.contains(event.target) && !active.list.contains(event.target))close();});
    window.addEventListener('resize',()=>{if(active)position(active);});
    document.addEventListener('scroll',event=>{if(active && !active.list.contains(event.target))position(active);},true);
    sync();return Object.freeze({sync});
})();
