(function () {
    'use strict';

    var DATA_URL = '/Static/Content/BondCars/data/cars.json';
    var MAIN_SCRIPT_URL = '/Static/Content/BondCars/bond-js/main.js';
    var TRANSITION_HOLD_RATIO = 0.3;
    var TRANSITION_UNLOCK_RATIO = 0.31;

    function setAnimation(element, frame, styles) {
        element.setAttribute('data-' + frame, styles);
    }

    function createNavigationItem(car, index) {
        var item = document.createElement('li');
        var link = document.createElement('a');
        var thumbnail = document.createElement('span');

        item.className = car.id;
        item.style.setProperty('--scene-background', car.colors.background);
        item.style.setProperty('--scene-accent', car.colors.accent);

        link.href = '#' + car.id;
        link.textContent = car.subtitle;
        thumbnail.className = 'car-thumb';

        item.appendChild(link);
        item.appendChild(thumbnail);
        return item;
    }

    function createScene(car, index, totalCars) {
        var pageNumber = index + 1;
        var startFrame = pageNumber * 1000;
        var endFrame = (pageNumber + 1) * 1000;
        var holdFrame = startFrame + Math.round((endFrame - startFrame) * TRANSITION_HOLD_RATIO);
        var unlockFrame = startFrame + Math.round((endFrame - startFrame) * TRANSITION_UNLOCK_RATIO);
        var unlockSize = Math.round((1 - TRANSITION_UNLOCK_RATIO) * 100);
        var infoStart = startFrame - 289;
        var infoEnd = startFrame + 700;
        var scene = document.createElement('li');
        var mask = document.createElement('div');
        var sceneContent = document.createElement('div');
        var date = document.createElement('span');
        var illustration = document.createElement('span');
        var info = document.createElement('div');
        var title = document.createElement('span');
        var description = document.createElement('span');
        var subtitle = document.createElement('span');

        scene.id = car.id;
        var orientation = car.orientation === 'portrait' ? 'portrait' : 'landscape';
        scene.className = 'car ' + car.id + ' photo-' + orientation + ' date-side-' + car.datePosition;
        scene.setAttribute('data-bg', car.colors.background);
        scene.setAttribute('data-color', car.colors.accent);
        scene.style.setProperty('--scene-background', car.colors.background);
        scene.style.setProperty('--scene-accent', car.colors.accent);
        scene.style.setProperty('--scene-image', 'url("' + car.image + '")');
        scene.style.zIndex = totalCars - index;

        mask.className = 'circle-mask abs-centered';
        setAnimation(mask, startFrame, 'width:100%;height:100%;');
        setAnimation(mask, holdFrame, 'width:100%;height:100%;');
        setAnimation(mask, unlockFrame, 'width:' + unlockSize + '%;height:' + unlockSize + '%;');
        setAnimation(mask, endFrame, 'width:0%;height:0%;');

        sceneContent.className = 'scene-content';

        date.className = 'date date-' + car.datePosition;
        date.textContent = car.date;

        illustration.className = 'illustration';

        info.className = 'info';

        title.className = 'name';
        title.textContent = car.title;
        setAnimation(title, infoStart, 'opacity:0;');
        setAnimation(title, startFrame, 'opacity:1;');
        setAnimation(title, holdFrame, 'opacity:1;');
        setAnimation(title, unlockFrame, 'opacity:0;');

        description.className = 'description';
        description.textContent = car.description;
        setAnimation(description, infoStart, 'opacity:0;');
        setAnimation(description, startFrame, 'opacity:1;');
        setAnimation(description, infoEnd, 'opacity:1;');
        setAnimation(description, infoEnd + 10, 'opacity:0;');

        subtitle.className = 'film-title';
        subtitle.textContent = car.subtitle;
        setAnimation(subtitle, infoStart, 'opacity:0;');
        setAnimation(subtitle, startFrame, 'opacity:1;');
        setAnimation(subtitle, holdFrame, 'opacity:1;');
        setAnimation(subtitle, unlockFrame, 'opacity:0;');

        sceneContent.appendChild(date);
        sceneContent.appendChild(illustration);
        sceneContent.appendChild(description);
        mask.appendChild(sceneContent);
        info.appendChild(title);
        info.appendChild(subtitle);
        scene.appendChild(mask);
        scene.appendChild(info);

        return scene;
    }

    function renderTimeline(cars) {
        var navigation = document.querySelector('#cars-nav ul');
        var scenes = document.querySelector('#cars-layer ul');
        var fragmentNavigation = document.createDocumentFragment();
        var fragmentScenes = document.createDocumentFragment();

        cars.forEach(function (car, index) {
            fragmentNavigation.appendChild(createNavigationItem(car, index));
            fragmentScenes.appendChild(createScene(car, index, cars.length));
        });

        navigation.appendChild(fragmentNavigation);
        scenes.appendChild(fragmentScenes);

        var finalFrame = cars.length * 1000 + 800;
        document.querySelector('#cars-nav').setAttribute('data-' + finalFrame, 'opacity:0;');
    }

    function prepareResponsiveTitle() {
        var frontCar = document.querySelector('.front-car');
        if (!frontCar || window.innerWidth >= 960) return;

        frontCar.setAttribute('data-250', 'width:140px;height:140px;margin-left:-70px;margin-top:-70px;');
        frontCar.setAttribute('data-800', 'width:1400px;height:1400px;margin-left:-700px;margin-top:-700px;');
    }

    function loadTimelineRuntime() {
        var script = document.createElement('script');
        script.src = MAIN_SCRIPT_URL;
        script.onerror = function () {
            showLoadError('The timeline runtime could not be loaded.');
        };
        document.body.appendChild(script);
    }

    function showLoadError(message) {
        var error = document.querySelector('#timeline-error');
        error.textContent = message;
        error.hidden = false;
    }

    fetch(DATA_URL)
        .then(function (response) {
            if (!response.ok) {
                throw new Error('Timeline data request failed with status ' + response.status + '.');
            }
            return response.json();
        })
        .then(function (cars) {
            if (!Array.isArray(cars) || cars.length === 0) {
                throw new Error('Timeline data must be a non-empty array.');
            }

            renderTimeline(cars);
            prepareResponsiveTitle();
            loadTimelineRuntime();
        })
        .catch(function (error) {
            showLoadError(error.message);
            throw error;
        });
}());
