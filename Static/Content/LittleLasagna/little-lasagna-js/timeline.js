(function () {
    'use strict';

    var DATA_URL = 'Static/Content/LittleLasagna/data/little-lasagna-timeline.json';
    var LETTER_URL = 'Static/Content/LittleLasagna/data/letter.json';
    var PAGE_HEIGHT = 1000;
    var HOLD_RATIO = 0.3;
    var UNLOCK_RATIO = 0.31;
    // From this scroll ratio on, the transition finishes by itself instead of following the scroll.
    var COMPLETE_RATIO = 0.9;
    var COMPLETE_OFFSET = Math.round((1 - COMPLETE_RATIO) * PAGE_HEIGHT);
    var COMPLETE_EASING_MS = 90;
    var state = {
        entries: [],
        letter: null,
        pageCount: 0,
        scenes: [],
        navItems: [],
        currentPage: -1,
        stageSize: 0,
        frameRequested: false,
        lastFrameTime: 0,
        frameDelta: 16,
        animating: false,
        hasTitle: document.body.dataset.routeMode === 'integrated'
    };

    var elements = {
        bodyWrap: document.querySelector('#body-wrap'),
        stage: document.querySelector('#timeline-layer'),
        stageList: document.querySelector('#timeline-layer ul'),
        nav: document.querySelector('#timeline-nav'),
        navList: document.querySelector('#timeline-nav ul'),
        titleWrap: document.querySelector('.front-page-wrap'),
        titleStage: document.querySelector('.title-transition-stage'),
        titleMask: document.querySelector('.title-circle-mask'),
        titleHeading: document.querySelector('.custom-title-heading'),
        titleDescription: document.querySelector('.custom-title-description'),
        footer: document.querySelector('.app-footer'),
        error: document.querySelector('#timeline-error')
    };

    function clamp(value, minimum, maximum) {
        return Math.min(Math.max(value, minimum), maximum);
    }

    function transitionProgress(progress) {
        var value = clamp(progress, 0, 1);
        if (value <= HOLD_RATIO) return 0;
        if (value < UNLOCK_RATIO) {
            return (value - HOLD_RATIO) / (UNLOCK_RATIO - HOLD_RATIO) * UNLOCK_RATIO;
        }
        return value;
    }

    function titleOpacity(progress) {
        if (progress <= HOLD_RATIO) return 1;
        if (progress >= UNLOCK_RATIO) return 0;
        return 1 - ((progress - HOLD_RATIO) / (UNLOCK_RATIO - HOLD_RATIO));
    }

    function descriptionOpacity(progress) {
        if (progress < 0 || progress >= 0.71) return 0;
        if (progress <= 0.7) return 1;
        return 1 - ((progress - 0.7) / 0.01);
    }

    function createNavigationItem(colors, label, index) {
        var item = document.createElement('li');
        var button = document.createElement('button');
        var dot = document.createElement('span');

        item.style.setProperty('--scene-background', colors.background);
        item.style.setProperty('--scene-accent', colors.accent);
        button.type = 'button';
        button.dataset.page = String(index + 1);
        button.setAttribute('aria-label', label);
        dot.className = 'nav-dot';
        button.appendChild(dot);
        item.appendChild(button);
        return item;
    }

    function createScene(entry, index) {
        var scene = document.createElement('li');
        var mask = document.createElement('div');
        var content = document.createElement('div');
        var date = document.createElement('span');
        var illustration = document.createElement('div');
        var description = document.createElement('p');
        var info = document.createElement('div');
        var title = document.createElement('h2');
        var subtitle = document.createElement('p');
        var orientation = entry.orientation === 'portrait' || entry.orientation === 'square' ? entry.orientation : 'landscape';

        scene.id = entry.id;
        scene.className = 'timeline-scene photo-' + orientation + ' date-side-' + entry.datePosition;
        scene.style.zIndex = String(state.pageCount - index);
        scene.style.setProperty('--scene-background', entry.colors.background);
        scene.style.setProperty('--scene-accent', entry.colors.accent);

        mask.className = 'circle-mask';
        content.className = 'scene-content';
        date.className = 'date date-' + entry.datePosition;
        date.textContent = entry.date.replace(/,\s*/, '\n');
        illustration.className = 'illustration';
        illustration.style.backgroundImage = 'url("' + entry.image + '")';
        illustration.setAttribute('role', 'img');
        illustration.setAttribute('aria-label', entry.title);
        description.className = 'description';
        description.textContent = entry.description;
        info.className = 'info';
        title.className = 'name';
        title.textContent = entry.title;
        subtitle.className = 'film-title';
        subtitle.textContent = entry.subtitle;

        content.appendChild(date);
        content.appendChild(illustration);
        content.appendChild(description);
        mask.appendChild(content);
        info.appendChild(title);
        info.appendChild(subtitle);
        scene.appendChild(mask);
        scene.appendChild(info);
        return scene;
    }

    function appendText(parent, tagName, className, text) {
        if (!text) return;
        var element = document.createElement(tagName);
        element.className = className;
        element.textContent = text;
        parent.appendChild(element);
    }

    function createLetterScene(letter, index) {
        var scene = document.createElement('li');
        var mask = document.createElement('div');
        var content = document.createElement('div');
        var card = document.createElement('article');
        var art = document.createElement('img');

        scene.id = letter.id;
        scene.className = 'timeline-scene letter-scene';
        scene.style.zIndex = String(state.pageCount - index);
        scene.style.setProperty('--scene-background', letter.colors.background);
        scene.style.setProperty('--scene-accent', letter.colors.accent);

        mask.className = 'circle-mask';
        content.className = 'letter-content';
        card.className = 'letter-card';
        appendText(card, 'p', 'letter-greeting', letter.greeting);
        (letter.paragraphs || []).forEach(function (paragraph) {
            appendText(card, 'p', 'letter-paragraph', paragraph);
        });
        appendText(card, 'p', 'letter-closing', letter.closing);
        appendText(card, 'p', 'letter-signature', letter.signature);

        content.appendChild(card);
        if (letter.image) {
            art.className = 'letter-art';
            art.src = letter.image;
            art.alt = letter.imageAlt || '';
            content.appendChild(art);
        }
        mask.appendChild(content);
        scene.appendChild(mask);
        return scene;
    }

    function renderTimeline() {
        var navFragment = document.createDocumentFragment();
        var sceneFragment = document.createDocumentFragment();

        state.entries.forEach(function (entry, index) {
            navFragment.appendChild(createNavigationItem(entry.colors, entry.subtitle + ': ' + entry.title, index));
            sceneFragment.appendChild(createScene(entry, index));
        });
        if (state.letter) {
            var letterIndex = state.entries.length;
            navFragment.appendChild(createNavigationItem(state.letter.colors, state.letter.navLabel || 'Letter', letterIndex));
            sceneFragment.appendChild(createLetterScene(state.letter, letterIndex));
        }

        elements.navList.appendChild(navFragment);
        elements.stageList.appendChild(sceneFragment);
        state.scenes = Array.prototype.slice.call(elements.stageList.children);
        state.navItems = Array.prototype.slice.call(elements.navList.children);
    }

    function resizeStages() {
        var viewportWidth = window.innerWidth;
        var viewportHeight = window.innerHeight;
        var size = Math.ceil((viewportWidth > viewportHeight ? viewportWidth : viewportHeight) * 1.5);
        var left = Math.ceil((size - viewportWidth) / -2);
        var top = Math.ceil((size - viewportHeight) / -2);

        state.stageSize = size;
        [elements.stage, elements.titleStage].forEach(function (stage) {
            if (!stage) return;
            stage.style.width = size + 'px';
            stage.style.height = size + 'px';
            stage.style.left = left + 'px';
            stage.style.top = top + 'px';
        });
        requestRender();
    }

    function setMaskSize(mask, progress) {
        var autoComplete = progress >= COMPLETE_RATIO;
        var target = autoComplete ? 1 : transitionProgress(progress);
        var shown = target;

        // Crossing the auto-complete line (either way) eases the circle instead of jumping.
        if (mask.shownProgress === undefined) {
            mask.animating = false;
        } else if (mask.autoComplete !== autoComplete) {
            mask.animating = true;
        }
        mask.autoComplete = autoComplete;

        if (mask.animating) {
            var step = 1 - Math.exp(-state.frameDelta / COMPLETE_EASING_MS);
            shown = mask.shownProgress + (target - mask.shownProgress) * step;
            if (Math.abs(target - shown) < 0.002) {
                shown = target;
                mask.animating = false;
            } else {
                state.animating = true;
            }
        }
        mask.shownProgress = shown;

        var radius = (state.stageSize / 2) * (1 - shown);
        var circle = 'circle(' + radius.toFixed(1) + 'px at 50% 50%)';
        mask.style.webkitClipPath = circle;
        mask.style.clipPath = circle;
    }

    function sceneStart(index) {
        return (index + (state.hasTitle ? 1 : 0)) * PAGE_HEIGHT;
    }

    function pageScrollPosition(page) {
        if (page === 0 && state.hasTitle) return 0;
        return sceneStart(page - 1);
    }

    function pageFromScroll(scrollPosition) {
        // A page counts as reached once the transition into it auto-completes.
        scrollPosition += COMPLETE_OFFSET;
        if (state.hasTitle && scrollPosition < PAGE_HEIGHT) return 0;
        var offset = state.hasTitle ? 1 : 0;
        return clamp(Math.floor(scrollPosition / PAGE_HEIGHT) - offset + 1, 1, state.pageCount);
    }

    function updateUrl(page) {
        var nextUrl = window.location.pathname + window.location.search;
        if (page > 0) nextUrl += '#' + encodeURIComponent(state.scenes[page - 1].id);
        if (window.location.pathname + window.location.search + window.location.hash !== nextUrl) {
            window.history.replaceState({}, document.title, nextUrl);
        }
    }

    function updateCurrentPage(page) {
        if (page === state.currentPage) return;
        state.currentPage = page;
        elements.footer.classList.toggle('app-footer--visible', page > 0);
        elements.footer.classList.toggle('app-footer--dark', page > 0 && state.scenes[page - 1].classList.contains('letter-scene'));
        state.navItems.forEach(function (item, index) {
            item.classList.toggle('current', index === page - 1);
        });
        updateUrl(page);
    }

    function renderTitle(scrollPosition) {
        if (!state.hasTitle) return;
        var progress = clamp(scrollPosition / PAGE_HEIGHT, 0, 1);
        setMaskSize(elements.titleMask, progress);
        elements.titleWrap.style.zIndex = progress >= 1 ? '-1' : '99';
        elements.titleWrap.style.pointerEvents = progress >= 1 ? 'none' : 'auto';
        var opacity = titleOpacity(progress);
        elements.titleHeading.style.opacity = String(opacity);
        elements.titleDescription.style.opacity = String(opacity);
    }

    function renderScenes(scrollPosition, page) {
        var currentIndex = page === 0 ? 0 : page - 1;
        var lastIndex = state.scenes.length - 1;
        var previousMask = state.hasTitle ? elements.titleMask : null;

        state.scenes.forEach(function (scene, index) {
            var mask = scene.querySelector('.circle-mask');
            var previousComplete = !!previousMask && previousMask.shownProgress >= 1;
            previousMask = mask;

            // Keep the previous scene rendered too so its photo stays decoded when scrolling back up.
            var visible = index >= currentIndex - 1 && index <= currentIndex + 1;
            scene.style.display = visible ? 'block' : 'none';
            if (!visible) {
                mask.shownProgress = undefined;
                return;
            }

            var localProgress = (scrollPosition - sceneStart(index)) / PAGE_HEIGHT;
            // The final page has nothing beneath it, so it never shrinks away.
            setMaskSize(mask, index === lastIndex ? 0 : localProgress);

            var title = scene.querySelector('.name');
            if (!title) return;
            // Before its own page starts, a scene shows its text only once the circle above it has closed.
            var incomingOpacity = previousComplete ? 1 : 0;
            var infoOpacity = localProgress < 0 ? incomingOpacity : titleOpacity(localProgress);
            title.style.opacity = String(infoOpacity);
            scene.querySelector('.film-title').style.opacity = String(infoOpacity);
            scene.querySelector('.description').style.opacity = String(localProgress < 0 ? incomingOpacity : descriptionOpacity(localProgress));
        });
    }

    function render(timestamp) {
        state.frameRequested = false;
        state.frameDelta = state.lastFrameTime ? clamp(timestamp - state.lastFrameTime, 0, 50) : 16;
        state.lastFrameTime = timestamp;
        state.animating = false;

        var scrollPosition = window.scrollY || window.pageYOffset;
        var page = pageFromScroll(scrollPosition);
        renderTitle(scrollPosition);
        renderScenes(scrollPosition, page);
        updateCurrentPage(page);

        // Keep drawing while an auto-completing circle is still easing, even if scrolling stopped.
        if (state.animating) {
            requestRender();
        } else {
            state.lastFrameTime = 0;
        }
    }

    function requestRender() {
        if (state.frameRequested) return;
        state.frameRequested = true;
        window.requestAnimationFrame(render);
    }

    function navigateToPage(page, smooth) {
        var target = clamp(page, state.hasTitle ? 0 : 1, state.pageCount);
        window.scrollTo({
            top: pageScrollPosition(target),
            behavior: smooth ? 'smooth' : 'auto'
        });
    }

    function requestedPageFromHash() {
        var id = decodeURIComponent(window.location.hash.slice(1));
        var index = state.scenes.findIndex(function (scene) {
            return scene.id === id;
        });
        if (index === -1) return state.hasTitle ? 0 : 1;
        return index + 1;
    }

    function bindEvents() {
        window.addEventListener('scroll', requestRender, { passive: true });
        window.addEventListener('resize', resizeStages);
        window.addEventListener('hashchange', function () {
            navigateToPage(requestedPageFromHash(), true);
        });
        elements.nav.addEventListener('click', function (event) {
            var button = event.target.closest('button[data-page]');
            if (!button) return;
            navigateToPage(parseInt(button.dataset.page, 10), true);
        });
        document.addEventListener('keydown', function (event) {
            if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
            var page = pageFromScroll(window.scrollY || window.pageYOffset);
            navigateToPage(page + (event.key === 'ArrowRight' ? 1 : -1), true);
        });
    }

    function showError(error) {
        elements.error.hidden = false;
        elements.error.textContent = error.message || 'The timeline could not be loaded.';
    }

    function fetchJson(url, label) {
        return fetch(url).then(function (response) {
            if (!response.ok) throw new Error(label + ' request failed with status ' + response.status + '.');
            return response.json();
        });
    }

    Promise.all([
        fetchJson(DATA_URL, 'Timeline data'),
        fetchJson(LETTER_URL, 'Letter').catch(function () { return null; })
    ])
        .then(function (results) {
            var entries = results[0];
            if (!Array.isArray(entries) || entries.length === 0) {
                throw new Error('Timeline data must be a non-empty array.');
            }
            state.entries = entries;
            state.letter = results[1];
            state.pageCount = entries.length + (state.letter ? 1 : 0);
            renderTimeline();
            // End the scroll exactly on the final page so it can't be scrolled past.
            document.body.style.height = 'calc(' + sceneStart(state.pageCount - 1) + 'px + 100vh)';
            bindEvents();
            resizeStages();
            navigateToPage(requestedPageFromHash(), false);
            requestRender();
        })
        .catch(showError);
}());
