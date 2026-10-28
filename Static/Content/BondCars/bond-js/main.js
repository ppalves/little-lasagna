
var DragReveal, app;

$(function(){    
    var hash = window.location.hash;

    if(hash){
        hash = hash.substring(2);
    }

    // Sometimes we force no-js mode for fallback version
	if ($('html').hasClass('no-js')) return;

    NoJsMode = function(){
        $('html').removeClass('js').addClass('no-js no-js-mode');
        $('body').css('height', 'auto');
        $('#body-wrap').css('height', 'auto');

        $('.car').each(function(){ 
            $(this).on('click', function(){
                var y = $(this).offset().top;
                $('html, body').stop().animate({ 'scrollTop': y}, 600, 'swing');
            });
        });
    };

    DragReveal = function(el){
        var obj = this;
        obj.el = $(el);

        this.maskDiv = obj.el.find('.photo-mask');
        this.maskWidth = obj.maskDiv.width();
        this.dragger = $(".dragger", obj.el);
        this.draggerOrigin = obj.dragger.attr('data-x');

        this.init = function(){
            obj.dragger.draggable({ 
                axis: "x", 
                containment: "parent",
                drag: obj.onDrag,
                stop: obj.onDrop
            });
        };
        this.onDrag = function(event, ui) {
            var newWidth = ui.position.left + 67;
            obj.maskDiv.width(newWidth);
        };
        this.onDrop = function(event, ui) {
            obj.maskDiv.animate({'width': obj.maskWidth}, 200 );
            obj.dragger.animate({'left': obj.draggerOrigin}, 500, "easeOutBack");
        };
        this.init();
    };

    CarNav = function(el){
        var obj = this;
        obj.el = $(el);

        this.prevCurr = 1;   // use this to calculate distance between cars when switching
		this.active = [];

        this.init = function(){
            var routeMode = $('body').attr('data-route-mode');

            obj.onResize(null);
            $(window).on('scroll', obj.snapPointListener);
            $('li', obj.el).on('click', obj.onNavClick);

            if (routeMode === 'generic' || (routeMode === 'integrated' && hash)) {
                var initialPage = parseInt(hash, 10) || 1;
                initialPage = Math.max(1, Math.min(initialPage, app.numOfCars));
                obj.switchCar(initialPage);
                var initialScroll = app.getScrollPosFromCurrent(initialPage);
                $(window).scrollTop(initialScroll);
                app.prevScroll = initialScroll;
            } else if (routeMode === 'integrated') {
                app.currPage = 0;
                obj.prevCurr = 0;
                obj.setActiveCar(1);
                obj.setActiveNavItem(0);
                app.prevScroll = 0;
            } else if(hash){
                obj.onNavClick(null, hash);
            }
        };
        this.onResize = function(wh){
            var ul = obj.el.find('ul');
			var offset = (wh - ul.height() ) / 2;
			ul.css('top', offset);
        };
        this.onNavClick = function(e, n, speed){
            var n = n || $(e.target).closest('li').index()+1; 
            if (e)  e.preventDefault();

            obj.switchCar(n);
            obj.changePageTransition(n, speed);
        };
		this.snapPointListener = function(){
            var yPos = $(window).scrollTop();
			var n = Math.floor(yPos / app.PAGEHEIGHT);
            var routeMode = $('body').attr('data-route-mode');

            if (routeMode === 'integrated' && n === 0) {
                if (app.currPage !== 0) {
                    obj.prevCurr = app.currPage;
                    app.currPage = 0;
                    obj.setActiveCar(1);
                    obj.setActiveNavItem(0);
                    if (history.replaceState) history.replaceState({}, document.title, window.location.pathname);
                }
                return;
            }

            n = Math.min(n, app.numOfCars);
            if (n == app.currPage) return;

            obj.switchCar(n);
        };
		
		this.switchCar = function(n){
            n = parseInt(n, 10);
            if (n < 1 || n > app.numOfCars) return;

            obj.prevCurr = app.currPage;
            app.currPage = n;
			obj.setActiveNavItem(n);
            obj.setActiveCar(n);
            var car = $('li', obj.el).eq(n-1).find('a').attr('href');
            var forUrl = car.substring(1);
            var stateObj = {};
            if(history.pushState){
                var routeMode = $('body').attr('data-route-mode');
                if (routeMode === 'generic') {
                    history.replaceState(stateObj, forUrl, 'cars.html#' + forUrl);
                } else if (routeMode === 'integrated') {
                    history.replaceState(stateObj, forUrl, window.location.pathname + '#' + forUrl);
                } else {
                    history.pushState(stateObj, forUrl, forUrl+'.html');
                }
            }
		};
		this.goPrevious = function(){
			if (app.currPage == 1) {
                if ($('body').attr('data-route-mode') === 'integrated') {
                    $('html, body').stop().animate({ 'scrollTop': 0 }, 400, 'linear');
                }
                return;
            }
			app.currPage--;
			obj.onNavClick(null, app.currPage);
		};
		this.goNext = function(){     
			if (app.currPage == app.numOfCars) return;
			app.currPage++;
			obj.onNavClick(null, app.currPage);
		};
        
		this.setActiveCar = function(n){
		    app.aCars.removeClass('active adjacent');
		    app.aCars.eq(n-1).addClass('active');
		    app.aCars.eq(n).addClass('adjacent');
			if (n-2 >= 0) app.aCars.eq(n-2).addClass('adjacent');
		};
        this.setActiveNavItem = function(n){
            $('li', obj.el).removeClass('current').eq(n-1).addClass('current');
        };
        this.changePageTransition = function(n, sp){
            var yPos = app.getScrollPosFromCurrent(n),
                dirDown = (n > app.currPage) ? true : false,
                distance = Math.abs(obj.prevCurr - n),
                speed = (distance/4) * 2000,
				carEase = (distance < 4) ? 'linear' : 'swing';

            speed = (speed < 400) ? 400 : speed;    // min speed 
            if (sp) speed = sp;
            $('html, body').stop().animate({ 'scrollTop': yPos}, speed, carEase);
        };
        this.init();
    }

    app = {
        PAGEHEIGHT:     1000,	// never change this, not unless you want to re-write ALL of your data-animations in your HTML 
		NOJSMODE:       false,
            
        numOfCars:      0,
        currPage:       0,
        prevScroll:     -100,
        aCars:          new Array(),

        bodyWrap:       $('#body-wrap'),
        carsLayer:      $('#cars-layer'),
        titleStage:     $('.title-transition-stage'),
        carsNav:        [],

        init: function(){

			app.preloadImages();

            app.aCars = $('.car', app.carsLayer);
            app.numOfCars = app.aCars.length;

            skrollr.init({
                forceHeight: false,
                render: function(){}
            });

            var bodyHeight = (app.numOfCars * app.PAGEHEIGHT) + (app.PAGEHEIGHT*2);
            $('body').height(bodyHeight);

            app.carsNav = new CarNav('#cars-nav');
            $('.photo-mask-wrap').each(function(){ new DragReveal(this); });

            $('#front-page').find('a, .front-car').on('click', function(){
                app.carsNav.onNavClick(null, 1, 1600);
                return false;
            });

            $(document)
                .on('keydown', app.onKeypress);
            $(window)
                .on('scroll', app.onScroll)
                .on('load', app.onLoad)
                .on('resize', app.onResize);
            app.onResize();

            if ($('body').attr('data-route-mode') === 'generic' ||
                $('body').attr('data-route-mode') === 'integrated') {
                $(window).on('hashchange.timeline', app.onHashChange);
            }
        },
        onScroll: function(){         
            var yPos = $(window).scrollTop();
            if (app.prevScroll < 0 && !$('body').attr('data-route-mode')) {
                setTimeout(function(){ $(window).scrollTop(1); }, 600);
            }
            app.prevScroll = yPos;
            //$('#scrollY').html(yPos);
        },
        onLoad: function(){},
        onHashChange: function(){
            var match = window.location.hash.match(/^#c(\d+)$/);
            if (!match) {
                if ($('body').attr('data-route-mode') === 'integrated') {
                    $('html, body').stop().animate({ 'scrollTop': 0 }, 400);
                }
                return;
            }

            var page = parseInt(match[1], 10);
            if (app.carsNav && page !== app.currPage) {
                app.carsNav.onNavClick(null, page, 400);
            }
        },
        onResize: function(){
            // set bodyWrap height
            app.bodyWrap.height($(window).height());

            // aspect ratio?
            var ww = $(window).width();
            var wh = $(window).height();
            var isLandscape = (ww > wh);

            // cars layer - force square using longest side
            var sq = (isLandscape) ? Math.ceil(ww * 1.5) : Math.ceil(wh * 1.5);
            var leftOffset = Math.ceil(((sq - ww ) / 2)*-1);
            var topOffset = Math.ceil(((sq - wh ) / 2)*-1);
            app.carsLayer.width(sq).height(sq).css({
                'left': leftOffset,
                'top': topOffset
            });
            app.titleStage.width(sq).height(sq).css({
                'left': leftOffset,
                'top': topOffset
            });
            
            // resize the nav
            app.carsNav.onResize(wh);
        },
		onKeypress: function(e){
            switch(e.keyCode){
                case 37:    app.carsNav.goPrevious(); break;
                case 39:    app.carsNav.goNext(); break;
                default:
            }
        },
        getScrollPosFromCurrent: function(n){
            return ((n-1) * app.PAGEHEIGHT) + app.PAGEHEIGHT;
        },
        getCurrentFromScrollPos: function(){
            return Math.floor($(window).scrollTop() / 1000);
        },
        preloadImages: function () {
            $('.illustration, .date', app.carsLayer).each(function () {
                var paths = $(this).css('backgroundImage').match(/https?:[^"]+/i);

                if (paths && paths.length > 0 ) {
                    var img = new Image();
                    img.src = paths[0];
                    //img.onload = function(){ console.log(path + ' loaded!'); };
                }
            });
        },
        isLandscape: function(){
            var ww = $(window).width();
            var wh = $(window).height();
            return (ww > wh);
        }
    };  
    app.init();
});