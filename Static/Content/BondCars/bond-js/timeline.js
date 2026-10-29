(function () {
    'use strict';

    var DATA_URL = '/Static/Content/BondCars/data/cars.json';
    var PAGE_HEIGHT = 1000;
    var HOLD_RATIO = 0.3;
    var UNLOCK_RATIO = 0.31;
    var state = {
        cars: [],
        scenes: [],
        navItems: [],
        currentPage: -1,
        stageSize: 0,
        frameRequested: false,
        hasTitle: document.body.dataset.routeMode === 'integrated'
    };

    var elements = {
        bodyWrap: document.querySelector('#body-wrap'),
        stage: document.querySelector('#cars-layer'),
        stageList: document.querySelector('#cars-layer ul'),
        nav: document.querySelector('#cars-nav'),
        navList: document.querySelector('#cars-nav ul'),
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

    function createNavigationItem(car, index) {
        var item = document.createElement('li');
        var button = document.createElement('button');
        var dot = document.createElement('span');

        item.style.setProperty('--scene-background', car.colors.background);
        item.style.setProperty('--scene-accent', car.colors.accent);
        button.type = 'button';
        button.dataset.page = String(index + 1);
        button.setAttribute('aria-label', car.subtitle + ': ' + car.title);
        dot.className = 'nav-dot';
        button.appendChild(dot);
        item.appendChild(button);
        return item;
    }

    function createScene(car, index) {
        var scene = document.createElement('li');
        var mask = document.createElement('div');
        var content = document.createElement('div');
        var date = document.createElement('span');
        var illustration = document.createElement('div');
        var description = document.createElement('p');
        var info = document.createElement('div');
        var title = document.createElement('h2');
        var subtitle = document.createElement('p');
        var orientation = car.orientation === 'portrait' ? 'portrait' : 'landscape';

        scene.id = car.id;
        scene.className = 'car photo-' + orientation + ' date-side-' + car.datePosition;
        scene.style.zIndex = String(state.cars.length - index);
        scene.style.setProperty('--scene-background', car.colors.background);
        scene.style.setProperty('--scene-accent', car.colors.accent);

        mask.className = 'circle-mask';
        content.className = 'scene-content';
        date.className = 'date date-' + car.datePosition;
        date.textContent = car.date;
        illustration.className = 'illustration';
        illustration.style.backgroundImage = 'url("' + car.image + '")';
        illustration.setAttribute('role', 'img');
        illustration.setAttribute('aria-label', car.title);
        description.className = 'description';
        description.textContent = car.description;
        info.className = 'info';
        title.className = 'name';
        title.textContent = car.title;
        subtitle.className = 'film-title';
        subtitle.textContent = car.subtitle;

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

    function renderTimeline() {
        var navFragment = document.createDocumentFragment();
        var sceneFragment = document.createDocumentFragment();

        state.cars.forEach(function (car, index) {
            navFragment.appendChild(createNavigationItem(car, index));
            sceneFragment.appendChild(createScene(car, index));
        });

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
        var size = state.stageSize * (1 - transitionProgress(progress));
        mask.style.width = size + 'px';
        mask.style.height = size + 'px';
    }

    function sceneStart(index) {
        return (index + (state.hasTitle ? 1 : 0)) * PAGE_HEIGHT;
    }

    function pageScrollPosition(page) {
        if (page === 0 && state.hasTitle) return 0;
        return sceneStart(page - 1);
    }

    function pageFromScroll(scrollPosition) {
        if (state.hasTitle && scrollPosition < PAGE_HEIGHT) return 0;
        var offset = state.hasTitle ? 1 : 0;
        return clamp(Math.floor(scrollPosition / PAGE_HEIGHT) - offset + 1, 1, state.cars.length);
    }

    function updateUrl(page) {
        var nextUrl = window.location.pathname;
        if (page > 0) nextUrl += '#c' + page;
        if (window.location.pathname + window.location.hash !== nextUrl) {
            window.history.replaceState({}, document.title, nextUrl);
        }
    }

    function updateCurrentPage(page) {
        if (page === state.currentPage) return;
        state.currentPage = page;
        elements.footer.classList.toggle('app-footer--visible', page > 0);
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

        state.scenes.forEach(function (scene, index) {
            var visible = index === currentIndex || index === currentIndex + 1;
            scene.style.display = visible ? 'block' : 'none';
            if (!visible) return;

            var localProgress = (scrollPosition - sceneStart(index)) / PAGE_HEIGHT;
            setMaskSize(scene.querySelector('.circle-mask'), localProgress);
            var infoOpacity = localProgress < 0 ? 0 : titleOpacity(localProgress);
            scene.querySelector('.name').style.opacity = String(infoOpacity);
            scene.querySelector('.film-title').style.opacity = String(infoOpacity);
            scene.querySelector('.description').style.opacity = String(descriptionOpacity(localProgress));
        });
    }

    function render() {
        state.frameRequested = false;
        var scrollPosition = window.scrollY || window.pageYOffset;
        var page = pageFromScroll(scrollPosition);
        renderTitle(scrollPosition);
        renderScenes(scrollPosition, page);
        updateCurrentPage(page);
    }

    function requestRender() {
        if (state.frameRequested) return;
        state.frameRequested = true;
        window.requestAnimationFrame(render);
    }

    function navigateToPage(page, smooth) {
        var target = clamp(page, state.hasTitle ? 0 : 1, state.cars.length);
        window.scrollTo({
            top: pageScrollPosition(target),
            behavior: smooth ? 'smooth' : 'auto'
        });
    }

    function requestedPageFromHash() {
        var match = window.location.hash.match(/^#c(\d+)$/);
        if (!match) return state.hasTitle ? 0 : 1;
        return clamp(parseInt(match[1], 10), 1, state.cars.length);
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

    fetch(DATA_URL)
        .then(function (response) {
            if (!response.ok) throw new Error('Timeline data request failed with status ' + response.status + '.');
            return response.json();
        })
        .then(function (cars) {
            if (!Array.isArray(cars) || cars.length === 0) {
                throw new Error('Timeline data must be a non-empty array.');
            }
            state.cars = cars;
            renderTimeline();
            document.body.style.height = ((cars.length + (state.hasTitle ? 2 : 1)) * PAGE_HEIGHT) + 'px';
            bindEvents();
            resizeStages();
            navigateToPage(requestedPageFromHash(), false);
            requestRender();
        })
        .catch(showError);
}());
