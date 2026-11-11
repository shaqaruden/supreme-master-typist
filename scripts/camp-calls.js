/* Native header dropdowns share the existing layout/keyboard change handlers. */
function updateSelectors() {
    document.querySelector('#layoutSelect').value = layout.getAttribute('data-value');
    document.querySelector('#keyboardSelect').value = keyboard.getAttribute('data-value');
    window.GameDropdowns?.sync();
}
updateSelectors();
document.querySelector('#layoutSelect').addEventListener('change',event=>changeLayout(event.target.value));
document.querySelector('#keyboardSelect').addEventListener('change',event=>changeKeyboard(event.target.value));

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
// The mapping control remains a toggle; native selects handle their own keys.
document.querySelector('#keymapping btn').addEventListener('keydown',event=>{
    if(event.key==='Enter'||event.key===' '){event.preventDefault();event.currentTarget.click();}
});
