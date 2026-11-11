/* New JS functions are added here. Modifications are made in original files. */

// changeLayout(value) changeKeyboard(value)
// Change Selected in Selector
function changeSelected(target, parent) {
    if (parent === 'layout') {
        changeLayout(target.getAttribute('data-value'));
    } else if (parent === 'keyboard') {
        changeKeyboard(target.getAttribute('data-value'));
    }
}

// Update selector text and local value
function updateSelectors() {
    let lVal = layout.getAttribute('data-value'),
        kVal = keyboard.getAttribute('data-value');
    
    layout.querySelector('span').innerText = document.querySelector(`li[data-value=${lVal}]`).innerText;
    keyboard.querySelector('span').innerText = document.querySelector(`li[data-value=${kVal}]`).innerText;
    ['layout','keyboard'].forEach(id=>{
        const group=document.querySelector('#'+id), button=group.querySelector('btn');
        button.setAttribute('aria-label',(id==='layout'?'Layout: ':'Keyboard: ')+group.querySelector('span').innerText);
        group.querySelectorAll('list li').forEach(option=>{
            option.setAttribute('role','option');option.tabIndex=-1;
            option.setAttribute('aria-selected',String(option.dataset.value===group.dataset.value));
        });
    });
}
updateSelectors();

// Close all lists first
function closeSelectors() {
    let lists = document.querySelectorAll('#selectors list');

    for (let x = 0; x < lists.length; x++) {
        if (!lists[x].classList.contains('close')) {
            lists[x].classList.add('close');
            lists[x].parentElement.querySelector('btn').setAttribute('aria-expanded','false');
            setTimeout(function() {
                lists[x].classList.add('hide');
            }, 100);
        }
    }
}

// Allow drop down of selectors
function toggleSelectors(key) {
    let list = document.querySelector(`#${key} list`);

    if (list.classList.contains('close')) {
        closeSelectors();
        list.classList.remove('hide');
        list.parentElement.querySelector('btn').setAttribute('aria-expanded','true');
        setTimeout(function() {
            list.classList.remove('close');
        }, 10);
    } else {
        list.classList.add('close');
        list.parentElement.querySelector('btn').setAttribute('aria-expanded','false');
        setTimeout(function() {
            list.classList.add('hide');
        }, 100);
    }
}

// Listen to mousedown on selectors
document.addEventListener('mousedown', function(event) {
    if (event.button !== 0) {return;}

    let target = event.target,
        selArray = ['layout','keyboard'];
    
    for (let x = 0; x < selArray.length; x++) {
        if (document.getElementById(selArray[x]) === target || document.getElementById(selArray[x]).contains(target)) {
            window.selectorDown = selArray[x];
        }
    }
});

// Listen to mouseup on selectors and trigger click if target matches mousedown event
document.addEventListener('mouseup', function(event) {
    if (event.button !== 0) {return;}

    let target = event.target,
        selArray = ['layout','keyboard'];

    for (let x = 0; x < selArray.length; x++) {
        if (window.selectorDown === selArray[x] && document.getElementById(selArray[x]).contains(target)) {
            toggleSelectors(selArray[x]);
            if (target.tagName.match(/^li$/i)) {
                changeSelected(target, selArray[x]);
            }
            return;
        }
    }

    // Also closes dropdowns if clicked elsewhere
    closeSelectors();
});

// Clicking the backdrop is the same as clicking discard in the keyboard edit dialogue
document.querySelector('#sub backdrop').addEventListener('click', function() {
    discardButton.click();
});

// Simulate proper hover for the Custom Enter Key
document.addEventListener('mouseover', function(event) {
    if (settingsStorage.currentKeyboard !== 'iso') {return;}

    let enterKeys = document.querySelectorAll('#customEnterTop, #customEnterBottom');
    
    if (event.target.id.match(/^customEnter/)) {
        enterKeys[0].classList.add('pseudoHover');
        enterKeys[1].classList.add('pseudoHover');
    } else {
        enterKeys[0].classList.remove('pseudoHover');
        enterKeys[1].classList.remove('pseudoHover');
    }
});

// Moving around in the menu
document.addEventListener('click', function(event) {
    let target = event.target,
        faPref = document.querySelector('.menu-nav .fa-preferences'),
        faTheme = document.querySelector('.menu-nav .fa-theme'),
        faClose = document.querySelector('.menu-nav .fa-close'),
        mbody = document.querySelector('menubar mbody');

    if (target == faPref || target == faPref.parentNode) {
        mbody.classList.remove('accentuate');
        mbody.classList.add('configure');
        faTheme.parentNode.classList.remove('active');
        faPref.parentNode.classList.add('active');
    }
    if (target == faTheme || target == faTheme.parentNode) {
        mbody.classList.remove('configure');
        mbody.classList.add('accentuate');
        faPref.parentNode.classList.remove('active');
        faTheme.parentNode.classList.add('active');
    }
    if (target == faClose || target == faClose.parentNode) {
        closeMenu();
    }
});

// Setting word or time limit
document.addEventListener('click', function(event) {
    let target = event.target,
        limitLi = document.querySelector('li.limit');

    if (target === limitLi || limitLi.contains(target)) {
        limitLi.querySelector('input:not(.dispose)').focus();
    }
});

// Keyboard Mapping Toggle State
document.addEventListener('click', function(event) {
    let target = event.target,
        keymapping = document.getElementById('keymapping');
    
    if (target === keymapping || keymapping.contains(target)) {
        if (settingsStorage.getItem('keyRemapping') === 'true') {
            settingsStorage.setItem('keyRemapping', false);
            keymapping.setAttribute('data-value','off');
        } else {
            settingsStorage.setItem('keyRemapping', true);
            keymapping.setAttribute('data-value','on');
        }
        // Clear input field when toggled
        // Disabling and enabling the observer ensures that no click sound is made
        fakeObserver.disconnect();
        input.value = '';
        fakeInput.innerText = '';
        fakeObserver.observe(fakeInput, {childList: true});
        reset();
    }
});

// Function that saves custom layout to localstorage
function storeCustomLayout() {
    setJSON('customLevelDictionary', levelDictionaries['custom']);
    setJSON('customLayoutMap', layoutMaps['custom']);
}

// Automatically restore custom layout if available in localstorage
(function() {
    if (!settingsStorage.customLevelDictionary || !settingsStorage.customLayoutMap) {
        return;
    }

    levelDictionaries['custom'] = getJSON('customLevelDictionary');
    layoutMaps['custom'] = getJSON('customLayoutMap');
})();

// Reload page when clicked on Colemak Camp logo
document.addEventListener('click', function(e) {
    let logo = document.querySelector('header left');

    if (e.target == logo || logo.contains(e.target)) {
        window.location.reload(true);
    }
});
// Keyboard support for the existing selector controls; mouse handling stays above.
document.addEventListener('keydown',function(event){
    const button=event.target.closest?.('#selectors btn');
    if(button && ['Enter',' ','ArrowDown','ArrowUp'].includes(event.key)){
        event.preventDefault();
        const id=button.parentElement.id;
        if(id==='keymapping'){if(event.key==='Enter'||event.key===' ')button.click();return;}
        const list=button.parentElement.querySelector('list');
        const opening=list.classList.contains('close');
        if(opening || event.key==='Enter' || event.key===' ')toggleSelectors(id);
        if(opening)list.classList.remove('close');
        if(opening || event.key.startsWith('Arrow')){
            const selected=list.querySelector('[aria-selected="true"]') || list.querySelector('li');selected?.focus();
        }
        return;
    }
    const option=event.target.closest?.('#selectors list li');
    if(option){
        const group=option.closest('#layout,#keyboard'),options=[...group.querySelectorAll('list li')];
        let index=options.indexOf(option);
        if(event.key==='ArrowDown')index=(index+1)%options.length;
        else if(event.key==='ArrowUp')index=(index+options.length-1)%options.length;
        else if(event.key==='Home')index=0;
        else if(event.key==='End')index=options.length-1;
        else if(event.key==='Enter'||event.key===' '){event.preventDefault();changeSelected(option,group.id);closeSelectors();group.querySelector('btn').focus();return;}
        else if(event.key==='Escape'){event.preventDefault();closeSelectors();group.querySelector('btn').focus();return;}
        else if(event.key==='Tab'){closeSelectors();return;}
        else return;
        event.preventDefault();options[index].focus();
    }else if(event.key==='Escape')closeSelectors();
});
