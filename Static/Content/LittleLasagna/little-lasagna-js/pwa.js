(function () {
    'use strict';

    var DISMISS_KEY = 'install-hint-dismissed';
    var standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function () {
            navigator.serviceWorker.register('sw.js').catch(function () {});
        });
    }

    if (standalone || !window.matchMedia('(pointer: coarse)').matches) return;

    function dismissed() {
        try {
            return window.localStorage.getItem(DISMISS_KEY) === '1';
        } catch (error) {
            return false;
        }
    }

    function remember() {
        try {
            window.localStorage.setItem(DISMISS_KEY, '1');
        } catch (error) {}
    }

    function showHint(content, onAction) {
        if (dismissed() || document.querySelector('.install-hint')) return;
        var hint = document.createElement('aside');
        hint.className = 'install-hint';
        hint.setAttribute('role', 'dialog');
        hint.setAttribute('aria-label', 'Add to home screen');

        var icon = document.createElement('img');
        icon.className = 'install-hint-icon';
        icon.src = 'Static/Content/LittleLasagna/icons/icon-192.png';
        icon.alt = '';

        var text = document.createElement('p');
        text.className = 'install-hint-text';
        text.innerHTML = content;

        var close = document.createElement('button');
        close.className = 'install-hint-close';
        close.type = 'button';
        close.setAttribute('aria-label', 'Dismiss');
        close.textContent = '\u00d7';
        close.addEventListener('click', function () {
            remember();
            hint.remove();
        });

        hint.appendChild(icon);
        hint.appendChild(text);
        if (onAction) {
            var action = document.createElement('button');
            action.className = 'install-hint-action';
            action.type = 'button';
            action.textContent = 'Install';
            action.addEventListener('click', function () {
                hint.remove();
                onAction();
            });
            hint.appendChild(action);
        }
        hint.appendChild(close);
        document.body.appendChild(hint);
    }

    // Android browsers fire this when the site can be installed; show our own button instead of waiting for theirs.
    window.addEventListener('beforeinstallprompt', function (event) {
        event.preventDefault();
        showHint('<strong>Get the app</strong>Add it to your home screen', function () {
            event.prompt();
            event.userChoice.then(function (choice) {
                if (choice.outcome === 'dismissed') remember();
            });
        });
    });

    window.addEventListener('appinstalled', remember);

    // iOS has no install prompt, so explain the Share menu steps instead.
    var ua = window.navigator.userAgent;
    var isIos = /iPhone|iPad|iPod/.test(ua) || (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
    if (isIos) {
        var shareIcon = '<svg class="install-hint-share" viewBox="0 0 24 24" aria-label="Share"><path d="M12 3v12M8 7l4-4 4 4M6 11H5v10h14V11h-1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        window.setTimeout(function () {
            showHint('<strong>Get the app</strong>Tap ' + shareIcon + ' then \u201cAdd to Home Screen\u201d');
        }, 1500);
    }
})();
