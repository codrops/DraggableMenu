/**
* demo.js
* http://www.codrops.com
*
* Licensed under the MIT license.
* http://www.opensource.org/licenses/mit-license.php
* 
* Copyright 2019, Codrops
* http://www.codrops.com
*/
{
    // Helper functions
    const MathUtils = {
        lineEq: (y2, y1, x2, x1, currentVal) => {
            // y = mx + b 
            var m = (y2 - y1) / (x2 - x1), b = y1 - m * x1;
            return m * currentVal + b;
        },
        lerp: (a, b, n) => (1 - n) * a + n * b,
        getRandomFloat: (min, max) => (Math.random() * (max - min) + min).toFixed(2)
    };

    // Gets the mouse position
    const getMousePos = (e) => {
        let posx = 0;
        let posy = 0;
        if (!e) e = window.event;
        if (e.pageX || e.pageY) {
            posx = e.pageX;
            posy = e.pageY;
        }
        else if (e.clientX || e.clientY)    {
            posx = e.clientX + body.scrollLeft + document.documentElement.scrollLeft;
            posy = e.clientY + body.scrollTop + document.documentElement.scrollTop;
        }
        return { x : posx, y : posy }
    };

    // https://pawelgrzybek.com/page-scroll-in-vanilla-javascript/
    function scrollIt(destination, duration = 200, easing = 'linear', callback) {
        const easings = {
            linear(t) {
                return t;
            },
            easeOutQuad(t) {
                return t * (2 - t);
            },
        };
      
        const start = window.pageYOffset;
        const startTime = 'now' in window.performance ? performance.now() : new Date().getTime();

        const documentHeight = Math.max(document.body.scrollHeight, document.body.offsetHeight, document.documentElement.clientHeight, document.documentElement.scrollHeight, document.documentElement.offsetHeight);
        const windowHeight = window.innerHeight || document.documentElement.clientHeight || document.getElementsByTagName('body')[0].clientHeight;
        const destinationOffset = typeof destination === 'number' ? destination : destination.offsetTop;
        const destinationOffsetToScroll = Math.round(documentHeight - destinationOffset < windowHeight ? documentHeight - windowHeight : destinationOffset);
      
        if ('requestAnimationFrame' in window === false) {
            window.scroll(0, destinationOffsetToScroll);
            if (callback) {
                callback();
            }
            return;
        }
      
        function scroll() {
            const now = 'now' in window.performance ? performance.now() : new Date().getTime();
            const time = Math.min(1, ((now - startTime) / duration));
            const timeFunction = easings[easing](time);
            window.scroll(0, Math.abs(Math.ceil((timeFunction * (destinationOffsetToScroll - start)) + start)));
            if (window.pageYOffset === destinationOffsetToScroll) {
                if (callback) {
                    callback();
                }
                return;
            }

            requestAnimationFrame(scroll);
        }
      
        scroll();
    }

    // Calculate the viewport size
    let winsize;
    const calcWinsize = () => winsize = {width: window.innerWidth, height: window.innerHeight};
    calcWinsize();
    window.addEventListener('resize', calcWinsize);

    // Track the mouse position
    let mousepos = {x: winsize.width/2, y: winsize.height/2};
    window.addEventListener('mousemove', ev => mousepos = getMousePos(ev));

    // Custom cursor
    class Cursor {
        constructor(el) {
            this.DOM = {el: el};
            this.DOM.circle = this.DOM.el.querySelector('.cursor__inner--circle');
            this.DOM.arrows = {
                right: this.DOM.el.querySelector('.cursor__side--right'),
                left: this.DOM.el.querySelector('.cursor__side--left')
            };
            this.bounds = this.DOM.circle.getBoundingClientRect();

            this.renderedStyles = {
                tx: {previous: 0, current: 0, amt: 0.2},
                ty: {previous: 0, current: 0, amt: 0.2},
                scale: {previous: 1, current: 1, amt: 0.2}
            };
            requestAnimationFrame(() => this.render());
        }
        render() {
            this.renderedStyles['tx'].current = mousepos.x - this.bounds.width/2;
            this.renderedStyles['ty'].current = mousepos.y - this.bounds.height/2;

            for (const key in this.renderedStyles ) {
                this.renderedStyles[key].previous = MathUtils.lerp(this.renderedStyles[key].previous, this.renderedStyles[key].current, this.renderedStyles[key].amt);
            }
                        
            this.DOM.circle.style.transform = `translateX(${(this.renderedStyles['tx'].previous)}px) translateY(${this.renderedStyles['ty'].previous}px) scale(${this.renderedStyles['scale'].previous})`;
            requestAnimationFrame(() => this.render());
        }
        enter() {
            this.renderedStyles['scale'].current = 1.9;
        }
        leave() {
            this.renderedStyles['scale'].current = 1;
        }
        click() {
            this.renderedStyles['scale'].previous = 0.4;
        }
        showArrows() {
            TweenMax.to(Object.values(this.DOM.arrows), ANIMATION_SETTINGS.cursor.duration, {
                ease: ANIMATION_SETTINGS.cursor.ease,
                startAt: {x: i => i ? 10 : -10 },
                opacity: 1,
                x: 0
            });
        }
        hideArrows() {
            TweenMax.to(Object.values(this.DOM.arrows), ANIMATION_SETTINGS.cursor.duration, {
                ease: ANIMATION_SETTINGS.cursor.ease,
                x: i => i ? 10 : -10,
                opacity: 0
            });
        }
    }

    // Images Grid
    class ImageGrid {
        constructor(el) {
            this.DOM = {el: el};
            this.DOM.imageWrap = [...this.DOM.el.querySelectorAll('.grid__item-wrap')];
            this.itemsTotal = this.DOM.imageWrap.length;
            this.DOM.images = [...this.DOM.el.querySelectorAll('.grid__item')];
            // Spread the grid items
            this.spread();
        }
        // Spreads the grid items by randomly positioning them and scaling them down
        spread(animate = false) {
            return new Promise((resolve, reject) => {
                let animateCount = 0;
                const gridHeight = this.DOM.el.scrollHeight;
                const gridTop = this.DOM.el.offsetTop;
                this.DOM.imageWrap.forEach((item) => {
                    const rect = item.getBoundingClientRect();
                    
                    // Item´s center point
                    const center = {x: rect.left+rect.width/2, y: rect.top+rect.height/2};
                    // Calculate the item´s quadrant in the viewport
                    const quadrant = center.x >= winsize.width/2 ?
                                        center.y <= gridHeight/2 + gridTop ? 1 : 4 :
                                        center.y <= gridHeight/2 + gridTop ? 2 : 3;
                    
                    // Now calculate how much to translate the item
                    // The positions will be random but only in the area of the item´s quadrant
                    // Also, consider a margin so the item does not stay completely out of the viewport or its quadrant
                    const margins = {x: winsize.width*.02, y: winsize.height*.04}
                    const tx = quadrant === 1 || quadrant === 4 ? 
                            MathUtils.getRandomFloat(-1*center.x + winsize.width/2 + margins.x*4, winsize.width - center.x - margins.x) :
                            MathUtils.getRandomFloat(-1*center.x + margins.x, winsize.width/2 - center.x - margins.x*4);
                    const ty = quadrant === 1 || quadrant === 2 ?
                            MathUtils.getRandomFloat(-1*center.y + margins.y, winsize.height/2 - center.y - margins.y*4) :
                            MathUtils.getRandomFloat(-1*center.y + winsize.height/2 + margins.y*4, winsize.height - center.y - margins.y);

                    // Save the current translation
                    item.dataset.ctx = tx;
                    item.dataset.cty = ty;

                    if ( animate ) {
                        TweenMax.to(item, ANIMATION_SETTINGS.grid.duration, {
                            ease: ANIMATION_SETTINGS.grid.ease,
                            x: tx,
                            y: ty,
                            scale: 0.35,
                            onComplete: () => {
                                ++animateCount;
                                if ( animateCount === this.itemsTotal ) {
                                    resolve();
                                }
                            }
                        });
                    }
                    else {
                        TweenMax.set(item, {
                            x: tx,
                            y: ty,
                            scale: 0.35
                        });
                        resolve();
                    }
                });
            });
        }
        // Resets the items to the original position (forming again the original grid)
        collapse() {
            return new Promise((resolve, reject) => {
                TweenMax.to(this.DOM.imageWrap, ANIMATION_SETTINGS.grid.duration, {
                    ease: ANIMATION_SETTINGS.grid.ease,
                    x: 0,
                    y: 0,
                    scale: 1.01,
                    onComplete: resolve
                });
            });
        }
        showImages() {
            TweenMax.set(this.DOM.images, {opacity: 1});
        }
    }

    // A menu item
    class MenuItem {
        constructor(el, imageGrid) {
            // The main wrapper
            this.DOM = {el: el};
            // The inner link (.menu__item-link)
            this.DOM.link = this.DOM.el.querySelector('.menu__item-link');
            // The explore link
            this.DOM.explore = this.DOM.el.querySelector('.menu__item-explore');
            // We will need the size and position for the calculations needed to drag/translate the menu
            this.rect = this.DOM.el.getBoundingClientRect();
            // The images grid for this menu item
            this.imageGrid = imageGrid;
            // As we drag, the letters will switch from only stroke to filled and vice versa
            // We need to split the letters into spans and create the necessary structure (we will have two spans per letter, one for the stroke version and one for the filled)
            charming(this.DOM.link, {classPrefix: false});
            const linkInner = [...this.DOM.link.querySelectorAll('span')];
            linkInner.forEach((span) => {
                const stroke = span.cloneNode(true);
                span.classList.add('letter__inner','letter__inner--filled');
                stroke.classList.add('letter__inner','letter__inner--stroke');
                this.DOM.link.insertBefore(stroke, span.nextSibling);
                const letter = document.createElement('span');
                letter.classList = 'letter';
                letter.appendChild(span);
                letter.appendChild(stroke);
                this.DOM.link.appendChild(letter);
            });
            this.letters = [...this.DOM.link.querySelectorAll('.letter__inner')];
            // Need to recalculate size and position on window resize
            window.addEventListener('resize', () => this.rect = this.DOM.el.getBoundingClientRect());
        }
        setCurrent() {
            this.DOM.el.classList.add('menu__item--current');
            return this;
        }
        unsetCurrent() {
            this.DOM.el.classList.remove('menu__item--current');
        }
        isCurrent() {
            return this.DOM.el.classList.contains('menu__item--current');
        }
        // Show/Hide the explore link 
        showExplore() {
            return this.toggleExplorer('show');
        }
        hideExplore() {
            return this.toggleExplorer('hide');
        }
        toggleExplorer(action = 'show') {
            return new Promise((resolve, reject) => {
                TweenMax.to(this.DOM.explore, ANIMATION_SETTINGS.explore.duration, {
                    ease: ANIMATION_SETTINGS.explore.ease,
                    startAt: action === 'hide' ? null : {scale: 0.5},
                    opacity: action === 'hide' ? 0 : 1,
                    scale: action === 'hide' ? 0.8 : 1,
                    onComplete: resolve
                });
            });
        }
        // Show/Hide the letters
        show() {
            return this.toggle('show');
        }
        hide() {
            return this.toggle('hide');
        }
        toggle(action = 'show') {
            return new Promise((resolve, reject) => {
                const tx = action === 'hide' ? this.isCurrent() ? '-200%' : '100%' : this.isCurrent() ? '-100%' : '0%';
                TweenMax.to(this.letters, ANIMATION_SETTINGS.allMenuLettersToggle.duration, {
                    ease: ANIMATION_SETTINGS.allMenuLettersToggle.ease,
                    x: tx,
                    onComplete: resolve
                });
            });
        }
    }

    // The menu
    class Menu {
        constructor(el) {
            // The menu wrap (.menu-wrap)
            this.DOM = {el: el};
            // The menu element
            this.DOM.menu = this.DOM.el.querySelector('.menu');
            // The draggable container
            this.DOM.draggable = this.DOM.el.querySelector('.menu-draggable');
            // Content wrap
            this.DOM.pagePreview = document.querySelector('.page--preview');
            // The ctrl that closes the grid view and shows back the menu
            this.DOM.backToMenuCtrl = this.DOM.pagePreview.querySelector('.gridback');
            
            // The image grids (one per menu item)
            this.imageGrids = [];
            [...this.DOM.pagePreview.querySelectorAll('.grid')].forEach(item => this.imageGrids.push(new ImageGrid(item)));
            // MenuItem instances
            this.menuItems = [];
            [...this.DOM.menu.querySelectorAll('.menu__item')].forEach((item, position) => this.menuItems.push(new MenuItem(item, this.imageGrids[position])));
            // Total number of menu items
            this.menuItemsTotal = this.menuItems.length;
            // Index of the current menuItem
            this.current = 0;
            // Set the first menu item to current and show its explore link
            this.menuItems[this.current].setCurrent().showExplore();
            // Show the first grid items
            this.menuItems[this.current].imageGrid.showImages();
            // Initialize the Draggabilly (on the x axis)
            this.draggie = new Draggabilly(this.DOM.draggable, { axis: 'x' });
            // The current amount (in pixels) that was dragged
            this.dragPosition = 0;
            // Minimum amount to drag in order to navigate to the next/previous menu item
            this.minDrag = winsize.width*.04;
            // Set the menu initial position
            this.layout();
            // The following are the values that need to be updated inside the render (rAF) function: 
            // - the menu translation value 
            // - the letters/spans (stroke and filled) translation values
            // - and the grid images opacity and transform values
            // The "current" and the "previous" hold the values to interpolate ("current" being the one we want to get to) and the "amt" is the amount to interpolate
            this.renderedStyles = {
                menuTranslation: {previous: this.dragPosition + this.initTx, current: this.dragPosition + this.initTx, amt: 0.1},
                letterTranslation: {previous: 0, current: 0, amt: 0.1},
                imgOpacity: {previous: 1, current: 1, amt: 0.1},
                imgScaleX: {previous: 1, current: 1, amt: 0.06},
                imgScaleY: {previous: 1, current: 1, amt: 0.06},
                imgTranslation: {previous: 0, current: 0, amt: 0.1}
            };
            // Start the rAF loop to render the menu and letters positions
            this.renderId = requestAnimationFrame(() => this.render());
            // Initialize/Bind some events
            this.initEvents();
        }
        layout() {
            // Set the menu position/translation so that the first menu item is the current one thus positioned at the center
            // We need to save these values for later calculations when translating the menu
            this.initTx = this.currentPosition = winsize.width/2 - this.menuItems[this.current].rect.width/2;
            TweenMax.set(this.DOM.menu, {x: this.initTx});
        }
        // Window resize
        resize() {
            this.minDrag = winsize.width*.04;
            // Update position
            this.currentPosition = winsize.width/2 - this.menuItems[this.current].DOM.el.offsetLeft - this.menuItems[this.current].rect.width/2;
            this.renderedStyles.menuTranslation.current = this.renderedStyles.menuTranslation.previous = this.currentPosition;
        }
        isDragging() {
            // dragDirection is only set when we drag the menu, so this can be used to checked if we are currently dragging
            return this.dragDirection != undefined && this.dragDirection != '';
        }
        render() {
            this.renderId = undefined;

            // Apply the lerp function to the updated values
            for (const key in this.renderedStyles ) {
                this.renderedStyles[key].previous = MathUtils.lerp(this.renderedStyles[key].previous, this.renderedStyles[key].current, this.renderedStyles[key].amt);
            }
            
            // Translate the menu
            TweenMax.set(this.DOM.menu, {x: this.renderedStyles.menuTranslation.previous});

            // Switch the filled spans with stroke ones and vice versa
            // Also update the grid images
            if ( this.isDragging() && this.currentItem && this.upcomingItem ) {
                let tx = this.renderedStyles.letterTranslation.previous;
                TweenMax.set(this.currentItem.letters, {x: this.dragDirection === 'left' ? -1*tx-100 + '%' : tx-100 + '%'});
                TweenMax.set(this.upcomingItem.letters, {x: this.dragDirection === 'left' ? tx + '%' : -1*tx + '%'});

                TweenMax.set(this.currentItem.imageGrid.DOM.images, {
                    transformOrigin: this.dragDirection === 'left' ? '100% 50%' : '0% 50%',
                    opacity: this.renderedStyles.imgOpacity.previous,
                    scaleX: this.renderedStyles.imgScaleX.previous,
                    scaleY: this.renderedStyles.imgScaleY.previous,
                    x: this.dragDirection === 'left' ? -1*this.renderedStyles.imgTranslation.previous + '%' : this.renderedStyles.imgTranslation.previous + '%'
                });
                TweenMax.set(this.upcomingItem.imageGrid.DOM.images, {
                    transformOrigin: this.dragDirection === 'left' ? '0% 50%' : '100% 50%',
                    opacity: Math.abs(1-this.renderedStyles.imgOpacity.previous),
                    scaleX: 3-this.renderedStyles.imgScaleX.previous,
                    scaleY: 1.8-this.renderedStyles.imgScaleY.previous,
                    x: this.dragDirection === 'left' ? 150 - this.renderedStyles.imgTranslation.previous + '%' : -1*(150 - this.renderedStyles.imgTranslation.previous) + '%'
                });
            }

            if ( !this.renderId ) {
                this.renderId = requestAnimationFrame(() => this.render());
            }
        }
        initEvents() {
            this.onPointerDown = () => {
                // Scale up the cursor
                cursor.renderedStyles['scale'].current = 1.5;
                // And show the "drag mode" arrows
                cursor.showArrows();
            };

            this.onDragStart = () => {
                if ( this.isAnimating ) return;
                // Reset the drag direction value
                this.dragDirection = '';
            };

            // Save the previous moveVector obj that Draggability provides for every drag move
            // We need this to track the current direction of dragging in order to compare it later with the initial intended direction
            // Like so we know if the menu should navigate to the next/previous item or if the navigation needs to be cancelled
            this.cachedVectorMovement = {x:0,y:0};
            this.onDragMove = (event, pointer, moveVector) => {
                // Update the mouse position
                mousepos = getMousePos(event);

                // Return if theres an active animation
                if ( this.isAnimating ) return;
                
                // Track the current direction of the drag
                if ( moveVector.x != this.cachedVectorMovement.x ) {
                    this.currentDirection = moveVector.x > this.cachedVectorMovement.x ? 'right' : 'left';
                    this.cachedVectorMovement = moveVector;
                }

                if ( this.dragDirection === '' ) {
                    // Hide the explorer link
                    this.menuItems[this.current].hideExplore();

                    // The initial intended direction
                    this.dragDirection = moveVector.x > 0 ? 'right' : 'left';
                    
                    // We need to calculate the amount to move the menu as we drag from one point of the screen to another.
                    // If we are switching between two menu items then this value is the distance from the center of the current menu item to the center of the next or previous menuItem (depending on the dragging direction)
                    // otherwise it will be the same as this.minDrag so that when we stop dragging the navigation gets cancelled

                    // Boundary cases
                    if ( this.dragDirection === 'right' && this.current === 0 || this.dragDirection === 'left' && this.current === this.menuItemsTotal - 1 ) {
                        this.amountToMove = this.minDrag;
                    }
                    // else move to the next/previous menuItem
                    else {
                        this.upcomingIdx = this.dragDirection === 'left' ? this.current+1 : this.current-1;
                        this.currentItem = this.menuItems[this.current];
                        this.upcomingItem = this.menuItems[this.upcomingIdx];
                        this.amountToMove = Math.abs((this.currentItem.rect.left + this.currentItem.rect.width/2) - (this.upcomingItem.rect.left + this.upcomingItem.rect.width/2));
                    }
                }
                // Update the dragPosition:
                // We need to map the draggable movement ([0,winsize.width]) to the menu movement ([0,amountToMove])
                this.dragPosition = MathUtils.lineEq(this.amountToMove, 0, winsize.width, 0, this.draggie.position.x);
                // Finally update both the menu translation, letters translation and grid images (rAF render function)
                this.renderedStyles.menuTranslation.current = this.dragPosition + this.currentPosition;
                this.renderedStyles.letterTranslation.current = MathUtils.lineEq(100, 0, winsize.width, 0, this.dragDirection === 'left' ? Math.min(this.draggie.position.x, 0) : Math.max(this.draggie.position.x, 0));
                this.renderedStyles.imgOpacity.current = MathUtils.lineEq(0, 1, winsize.width, 0, this.dragDirection === 'left' ? Math.abs(Math.min(this.draggie.position.x, 0)) : Math.abs(Math.max(this.draggie.position.x, 0)));
                this.renderedStyles.imgScaleX.current = MathUtils.lineEq(2, 1, winsize.width, 0, this.dragDirection === 'left' ? Math.abs(Math.min(this.draggie.position.x, 0)) : Math.abs(Math.max(this.draggie.position.x, 0)));
                this.renderedStyles.imgScaleY.current = MathUtils.lineEq(0.8, 1, winsize.width, 0, this.dragDirection === 'left' ? Math.abs(Math.min(this.draggie.position.x, 0)) : Math.abs(Math.max(this.draggie.position.x, 0)));
                this.renderedStyles.imgTranslation.current = MathUtils.lineEq(150, 0, winsize.width, 0, this.dragDirection === 'left' ? Math.abs(Math.min(this.draggie.position.x, 0)) : Math.abs(Math.max(this.draggie.position.x, 0)));
            };

            this.onPointerUp = () => {
                // Scale down the cursor (reset)
                cursor.renderedStyles['scale'].current = 1;
                // And hide the "drag mode" arrows
                cursor.hideArrows();
            };

            this.onDragEnd = () => {
                if ( !this.isAnimating ) {
                    this.isAnimating = true;

                    // Cancel the render function (rAF) 
                    if ( this.renderId ) {
                        window.cancelAnimationFrame(this.renderId);
                        this.renderId = undefined;
                    }

                    // Cancel the navigation:
                    // Either it didn´t drag enough (<= minDrag) or the drag direction changed to the opposite one, meaning the user stepped back from navigating
                    if ( Math.abs(this.dragPosition) <= this.minDrag || this.dragDirection !== this.currentDirection ) {
                        // Show the explore link
                        this.menuItems[this.current].showExplore();

                        // Reset the rAF updated values
                        this.renderedStyles.menuTranslation.current = this.renderedStyles.menuTranslation.previous = this.currentPosition;
                        this.renderedStyles.letterTranslation.current = this.renderedStyles.letterTranslation.previous = 0;
                        this.renderedStyles.imgOpacity.current = this.renderedStyles.imgOpacity.previous = 1;
                        this.renderedStyles.imgScaleX.current = this.renderedStyles.imgScaleX.previous = 1;
                        this.renderedStyles.imgScaleY.current = this.renderedStyles.imgScaleY.previous = 1;
                        this.renderedStyles.imgTranslation.current = this.renderedStyles.imgTranslation.previous = 0;

                        const tl = new TimelineMax({
                            onComplete: () => {
                                // Restart the rAF loop
                                this.renderId = requestAnimationFrame(() => this.render());
                                // Reset values..
                                this.currentItem = undefined;
                                this.upcomingItem = undefined;
                                // Able to drag and animate again
                                this.isAnimating = false;
                            }
                        })
                        // Animate the menu back to the previous position
                        .to(this.DOM.menu, ANIMATION_SETTINGS.menu.duration, {
                            ease: ANIMATION_SETTINGS.menu.ease,
                            x: this.currentPosition
                        }, 0);

                        // Reset the letters translations and grid images
                        if ( this.currentItem && this.upcomingItem ) {
                            tl
                            .to(this.currentItem.letters, ANIMATION_SETTINGS.letters.duration, {
                                ease: ANIMATION_SETTINGS.letters.ease,
                                x: '-100%'
                            }, 0)
                            .to(this.upcomingItem.letters, ANIMATION_SETTINGS.letters.duration, {
                                ease: ANIMATION_SETTINGS.letters.ease,
                                x: '0%'
                            }, 0)
                            .to(this.currentItem.imageGrid.DOM.images, ANIMATION_SETTINGS.images.duration, {
                                ease: ANIMATION_SETTINGS.images.ease,
                                opacity: 1,
                                scaleX: 1,
                                scaleY: 1,
                                x: '0%'
                            }, 0)
                            .to(this.upcomingItem.imageGrid.DOM.images, ANIMATION_SETTINGS.images.duration, {
                                ease: ANIMATION_SETTINGS.images.ease,
                                opacity: 0,
                                scaleX: 2,
                                scaleY: 0.8,
                                x: this.dragDirection === 'left' ? '150%' : '-150%'
                            }, 0);
                        }
                    }
                    // Move to the next/previous menu item
                    else {
                        // Show the explore link
                        this.menuItems[this.upcomingIdx].showExplore();

                        // Set the updated menu translation value
                        this.currentPosition 
                                = this.renderedStyles.menuTranslation.current = this.renderedStyles.menuTranslation.previous 
                                = this.dragDirection === 'left' ? 
                                    this.currentPosition - this.amountToMove : 
                                    this.currentPosition + this.amountToMove;
                        
                        // Reset letters translation value
                        this.renderedStyles.letterTranslation.current = this.renderedStyles.letterTranslation.previous = 0;

                        // Reset grid images values
                        this.renderedStyles.imgOpacity.current = this.renderedStyles.imgOpacity.previous = 1;
                        this.renderedStyles.imgScaleX.current = this.renderedStyles.imgScaleX.previous = 1;
                        this.renderedStyles.imgScaleY.current = this.renderedStyles.imgScaleY.previous = 1;
                        this.renderedStyles.imgTranslation.current = this.renderedStyles.imgTranslation.previous = 0;

                        const tl = new TimelineMax({
                            onComplete: () => {
                                // Restart the rAF loop
                                this.renderId = requestAnimationFrame(() => this.render());
                                // Update the menu item current state
                                this.currentItem.unsetCurrent();
                                this.upcomingItem.setCurrent();
                                // Update the current item index value
                                this.current = this.upcomingIdx;
                                // Reset values.. 
                                this.currentItem = undefined;
                                this.upcomingItem = undefined;
                                // Able to drag and animate again
                                this.isAnimating = false;
                            }
                        })
                        // Animate the menu translation
                        .to(this.DOM.menu, ANIMATION_SETTINGS.menu.duration, {
                            ease: ANIMATION_SETTINGS.menu.ease,
                            x: this.currentPosition
                        }, 0)
                        // Animate the letters (current item gets stroke letters while the previous current item gets filled, thus the translation needs to be set differently for the current and upcoming item)
                        .to(this.currentItem.letters, ANIMATION_SETTINGS.letters.duration, {
                            ease: ANIMATION_SETTINGS.letters.ease,
                            x: '0%'
                        }, 0)
                        .to(this.upcomingItem.letters, ANIMATION_SETTINGS.letters.duration, {
                            ease: ANIMATION_SETTINGS.letters.ease,
                            x: '-100%'
                        }, 0)
                        // And animate the grid images
                        .to(this.currentItem.imageGrid.DOM.images, ANIMATION_SETTINGS.images.duration, {
                            ease: ANIMATION_SETTINGS.images.ease,
                            opacity: 0,
                            scaleX: 2,
                            scaleY: 0.8,
                            x: this.dragDirection === 'left' ? '-150%' : '150%'
                        }, 0)
                        .to(this.upcomingItem.imageGrid.DOM.images, ANIMATION_SETTINGS.images.duration, {
                            ease: ANIMATION_SETTINGS.images.ease,
                            opacity: 1,
                            scaleX: 1,
                            scaleY: 1,
                            x: '0%'
                        }, 0);
                    }
                }

                // Reset the drag position value
                this.dragPosition = 0;
                this.draggie.setPosition(this.dragPosition, this.draggie.position.y);

                // Reset the drag direction value
                this.dragDirection = '';
            };

            // Draggabily events
            this.draggie.on('pointerDown', this.onPointerDown);
            this.draggie.on('dragStart', this.onDragStart);
            this.draggie.on('dragMove', this.onDragMove);
            this.draggie.on('pointerUp', this.onPointerUp);
            this.draggie.on('dragEnd', this.onDragEnd);
            
            // Clicking the explore opens up the grid for the current menu item
            for ( let menuItem of this.menuItems ) {
                menuItem.DOM.explore.addEventListener('click', () => this.showContent());
            }

            // Back to menu from grid view
            this.DOM.backToMenuCtrl.addEventListener('click', () => this.hideContent());

            // Resize window: update menu position
            window.addEventListener('resize', () => this.resize());
        }
        showBackCtrl() {
            return this.toggleBackCtrl('show');
        }
        hideBackCtrl() {
            return this.toggleBackCtrl('hide');
        }
        toggleBackCtrl(action = 'show') {
            return new Promise((resolve, reject) => {
                TweenMax.to(this.DOM.backToMenuCtrl, ANIMATION_SETTINGS.backCtrl.duration, {
                    ease: ANIMATION_SETTINGS.backCtrl.ease,
                    startAt: action === 'hide' ? null : {x: '100%'},
                    opacity: action === 'hide' ? 0 : 1,
                    x: action === 'hide' ? '-100%' : '0%',
                    onComplete: resolve
                });
            });
        }
        showContent() {
            if ( this.isAnimating ) return;
            this.isAnimating = true;

            // Cancel the render function (rAF) 
            if ( this.renderId ) {
                window.cancelAnimationFrame(this.renderId);
                this.renderId = undefined;
            }

            // Remove this class so we see a scrollable area now
            this.DOM.pagePreview.classList.remove('page--preview');

            let promises = [];
            // Reset the transforms of the grid items forming again the original grid
            promises.push(this.menuItems[this.current].imageGrid.collapse());
            // Hide the explore link
            promises.push(this.menuItems[this.current].hideExplore());
            // Slide menu items letters out
            for (let item of this.menuItems) {
                promises.push(item.hide());
            }
            // Show back control
            promises.push(this.showBackCtrl());
            
            Promise.all(promises).then(() => this.isAnimating = false);
        }
        hideContent() {
            if ( this.isAnimating ) return;
            this.isAnimating = true;

            // First scroll to the top
            scrollIt(0, 300, 'easeOutQuad', () => {
                // Add this class to disable scrolling
                this.DOM.pagePreview.classList.add('page--preview');
                
                // Restart the rAF loop
                this.renderId = requestAnimationFrame(() => this.render());

                let promises = [];
                // Spread the grid items forming again the original grid
                promises.push(this.menuItems[this.current].imageGrid.spread(true));
                // Show the explore link
                promises.push(this.menuItems[this.current].showExplore());
                // Slide menu items letters in
                for (let item of this.menuItems) {
                    promises.push(item.show());
                }
                // Hide back control
                promises.push(this.hideBackCtrl());
                
                Promise.all(promises).then(() => {
                    this.isAnimating = false;
                });
            });
        }
    }

    const ANIMATION_SETTINGS = {
        // Animation settings (after the drag ends, the menu, letters and images need to be positioned or reset)
        menu: {duration: 0.8, ease: Cubic.easeOut},
        letters: {duration: 0.8, ease: Cubic.easeOut},
        images: {duration: 1, ease: Quint.easeOut},
        // Grid
        grid: {duration: 0.8, ease: Expo.easeOut},
        // Hiding the letters to show the images grid
        allMenuLettersToggle: {duration: 0.8, ease: Expo.easeOut},
        // Explore link
        explore: {duration: 0.6, ease: Expo.easeOut},
        // backToMenuCtrl
        backCtrl: {duration: 0.6, ease: Expo.easeOut},
        // Cursor arrows
        cursor: {duration: 1, ease: Expo.easeOut},
    };
    
    // Custom mouse cursor
    const cursor = new Cursor(document.querySelector('.cursor'));

    /***********************************/
    /****** Custom cursor related ******/

    // Activate the enter/leave/click methods of the custom cursor when hovering in/out on every <a> and the back to menu ctrl
    [...document.querySelectorAll('a'), document.querySelector('button')].forEach((link) => {
        link.addEventListener('mouseenter', () => cursor.enter());
        link.addEventListener('mouseleave', () => cursor.leave());
    });

    /***********************************/
    /********** Preload stuff **********/

    // Preload images
    const preloadImages = () => {
        return new Promise((resolve, reject) => {
            imagesLoaded(document.querySelectorAll('.grid__item'), {background: true}, resolve);
        });
    };
    
    // Preload fonts
    const preloadFonts = () => {
        return new Promise((resolve, reject) => {
            WebFont.load({
                typekit: {
                    id: 'crf4rue'
                },
                active: resolve
            });
        });
    };

    Promise.all([
        preloadImages(),
        preloadFonts()  
    ]).then(() => {
        // the Menu
        const menu = new Menu(document.querySelector('.menu-wrap'));
        document.body.classList.remove('loading');
    });
}