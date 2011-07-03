/**
 * @author denisk
 */
(function () {
    window._ = function(id) {
        var result = document.getElementById(id);
        if (! result) {
            result = document.getElementsByClassName(id)[0];
        }
        if (! result) {
            throw "Nothing found for " + id;
        }

        return result;
    };
    //global defaults
    window.JsSplitter = {
        splitterWidth : 8, //px
        vSplitterColor : "#000000",
        hSplitterColor : "#000000",
        hLimit: 10, //px
        vLimit: 10,  //px
        animationPlaying: false,

        disableVDrag: function () {
//                    console.log("disabling drag")
            this.VDRAG = false;
        },
        enableVDrag: function() {
            this.VDRAG = true;
        },

        disableHDrag: function () {
//                    console.log("disabling drag")
            this.HDRAG = false;
        },
        enableHDrag: function() {
            this.HDRAG = true;
        },

        log: function(event) {
            console.log(event.type + " on " + event.target.className);
        }
    };

    window.EventUtil = {
        addHandler: function(element, type, handler) {
            if (element.addEventListener) {
                element.addEventListener(type, handler, false);
            } else if (element.attachEvent) {
                element.attachEvent("on" + type, handler);
            } else {
                element["on" + type] = handler;
            }
        },

        removeHandler: function(element, type, handler) {
            if (element.removeEventListener) {
                element.removeEventListener(type, handler, type);
            } else if (element.detachEvent) {
                element.detachEvent("on" + type, handler);
            } else {
                element["on" + type] = null;
            }
        },

        getEvent: function(event) {
            return event ? event : window.event;
        },

        stopPropagation: function(event) {
            if (event.stopPropagation) {
                event.stopPropagation();
            } else {
                event.cancelBubble = true;
            }

        }
    };
    JsSplitter.Dragger = function(/**JsSplitter.SplittedArea*/ area) {
        this.area = area;
    };
    JsSplitter.Dragger.prototype.drag = function(event, minLimit) {
        var delta = this.getDelta(event);

        var towardsAmountStr = this.getStyleProperty(this.towardsElements[0], this.cssElementPropertyName);
        var towardsAmount = parseFloat(towardsAmountStr.substring(0, towardsAmountStr.length - 2));
        var newTowardsAmount = towardsAmount - delta;
        if (newTowardsAmount < minLimit) {
            return;
        }

        var oppositeAmountStr = this.getStyleProperty(this.oppositeElements[0], this.cssElementPropertyName);
        var oppositeAmount = parseFloat(oppositeAmountStr.substring(0, oppositeAmountStr.length - 2));
        var newOppositeAmount = oppositeAmount + delta;
        if (newOppositeAmount < minLimit) {
            return;
        }

        for (var i = 0; i < this.towardsElements.length; i++) {
            var tElement = this.towardsElements[i];
            this.setStyleProperty(tElement, this.cssElementPropertyName, newTowardsAmount + "px");
        }
        for (var j = 0; j < this.oppositeElements.length; j++) {
            var oElement = this.oppositeElements[j];
            this.setStyleProperty(oElement, this.cssElementPropertyName, newOppositeAmount + "px")
        }

        var splitterPositionStr = this.getStyleProperty(this.splitter, this.cssSplitterPropertyName);

        var splitterPosition = parseFloat(splitterPositionStr.substring(0, splitterPositionStr.length - 2));
        var newSplitterPosition = splitterPosition - delta;

        this.setStyleProperty(this.splitter, this.cssSplitterPropertyName, newSplitterPosition + "px");

        this.saveState(event);
        this.shiftTheSplitter(delta);
    };

    JsSplitter.Dragger.prototype.switchDragMode = function(mode) {
        switch (mode) {
            case JsSplitter.H:
                this.getDelta = this.getHDelta;
                this.cssElementPropertyName = "width";
                this.cssSplitterPropertyName = "left";
                this.splitter = this.area.vSplitter;
                this.saveState = this.saveStateAfterHDragging;
                this.shiftTheSplitter = this.shiftVSplitter;
                this.setHDraggableElements();
                break;
            case JsSplitter.V:
                this.getDelta = this.getVDelta;
                this.cssElementPropertyName = "height";
                this.cssSplitterPropertyName = "top";
                this.splitter = this.area.hSplitter;
                this.saveState = this.saveStateAfterVDragging;
                this.shiftTheSplitter = this.shiftHSplitter;
                this.setVDraggableElements();
                break;
        }
    };

    JsSplitter.Dragger.prototype.getVDelta = function(event) {
        return this.currentY - event.clientY;
    };

    JsSplitter.Dragger.prototype.getHDelta = function(event) {
        return this.currentX - event.clientX;
    };
    JsSplitter.Dragger.prototype.saveStateAfterHDragging = function(event) {
        this.currentX = event.clientX
    };

    JsSplitter.Dragger.prototype.saveStateAfterVDragging = function(event) {
        this.currentY = event.clientY
    };

    JsSplitter.Dragger.prototype.shiftHSplitter = function(delta) {
        var newSplitterShift = this.hSplitterShift - (delta / this.area.base.clientHeight);
        this.hSplitterShift = newSplitterShift;
    };

    JsSplitter.Dragger.prototype.shiftVSplitter = function(delta) {
        var newSplitterShift = this.vSplitterShift - (delta / this.area.base.clientWidth);
        this.vSplitterShift = newSplitterShift;
    };

    JsSplitter.SplittedArea = function(options, /**DOM*/ base, /**DOM*/one, /**DOM*/two, /**DOM*/three, /**DOM*/four) {
        this.base = base;
        this.one = one;
        this.two = two;
        this.three = three;
        this.four = four;
        this.initialVSplitterShift = options.w;
        this.initialHSplitterShift = options.h;
        if (options.splitterWidth) {
            this.splitterWidth = options.splitterWidth;
        } else {
            this.splitterWidth = JsSplitter.splitterWidth;
        }
        if (options.vSplitterColor) {
            this.vSplitterColor = options.vSplitterColor;
        } else {
            this.vSplitterColor = JsSplitter.vSplitterColor;
        }
        if (options.hSplitterColor) {
            this.hSplitterColor = options.hSplitterColor;
        } else {
            this.hSplitterColor = JsSplitter.hSplitterColor;
        }
        this._children = [];

        for (var i = 2; i < arguments.length; i++) {
            var tile = arguments[i];

            if (tile && tile.parentNode && tile.parentNode.children) {
                tile.parentNode.removeChild(tile);
            }
        }

        this.init();
    };

    JsSplitter.SplittedArea.SplitterUtils = {
        prepareHSplitter: function(area, hSplitter) {
            hSplitter.style.cursor = "n-resize";
            this._addHHandler(area, hSplitter);
            this._addHCanvas(area, hSplitter);
        },

        prepareVSplitter: function(area, vSplitter) {
            vSplitter.style.cursor = "w-resize";
            this._addVHandler(area, vSplitter);
            this._addVCanvas(area, vSplitter);
        },

        _addHHandler: function(area, hSplitter) {
            EventUtil.addHandler(hSplitter, "mousedown", function(event) {
                if (! JsSplitter.animationPlaying) {
                    event = EventUtil.getEvent(event);
                    area.dragger.currentY = event.clientY;
                    JsSplitter.enableVDrag();
                    JsSplitter.draggableArea = area;
                    //in firefox, we have to prevent default action (dragging) for elements
                    if (event.preventDefault) event.preventDefault();
                }
            });
        },
        _addVHandler: function(area, vSplitter) {
            EventUtil.addHandler(vSplitter, "mousedown", function(event) {
                if (! JsSplitter.animationPlaying) {
                    event = EventUtil.getEvent(event);
                    area.dragger.currentX = event.clientX;
                    JsSplitter.enableHDrag();
                    JsSplitter.draggableArea = area;
                    //in firefox, we have to prevent default action (dragging) for elements
                    if (event.preventDefault) event.preventDefault();
                }
            });
        },
        _addHCanvas: function(area, hSplitter) {
            if (hSplitter) {
                var buttons = document.createElement("div");
                buttons.style.position = "absolute";
                buttons.style.left = "10%";
                //todo from properties
                buttons.style.width = "30px";
                buttons.style.height = "100%";

                var towardsButton = document.createElement("canvas");
                var oppositeButton = document.createElement("canvas");

                towardsButton.style.width = "50%";
                towardsButton.style.height = "100%";
                towardsButton.style.position = "absolute";
                towardsButton.style.left = 0;
                towardsButton.style.backgroundColor = "red";
                towardsButton.name = "towards";
                oppositeButton.style.width = "50%";
                oppositeButton.style.height = "100%";
                oppositeButton.style.position = "absolute";
                oppositeButton.style.right = 0;
                oppositeButton.name = "opposite";
                //todo from properties
                oppositeButton.style.backgroundColor = "orange";

                towardsButton.style.cursor = "Pointer";
                oppositeButton.style.cursor = "Pointer";
                buttons.appendChild(towardsButton);
                buttons.appendChild(oppositeButton);
                hSplitter.appendChild(buttons);
                EventUtil.addHandler(towardsButton, "click", function() {
                    if (! JsSplitter.animationPlaying) {
                        JsSplitter.animationPlaying = true;
                        area.dragger.switchDragMode(JsSplitter.V);
                        var startHeight = area.dragger.towardsElements[0].clientHeight;
                        area.dragger.currentY = startHeight;
                        var currentHeight = startHeight - 1;
                        var interval = setInterval(function() {
                            if (currentHeight <= JsSplitter.vLimit) {
                                clearInterval(interval);
                                JsSplitter.animationPlaying = false;
                                return;
                            }
                            var event = {clientY: currentHeight};

                            area.dragger.drag(event, JsSplitter.vLimit);
                            area.draw();
                            //todo from properties
                            currentHeight = currentHeight - 5;
                        }, 10);
                    }
                });
                EventUtil.addHandler(oppositeButton, "click", function() {
                    if (! JsSplitter.animationPlaying) {
                        JsSplitter.animationPlaying = true;
                        area.dragger.switchDragMode(JsSplitter.V);
                        var startHeight = area.dragger.towardsElements[0].clientHeight;
                        area.dragger.currentY = startHeight;
                        var currentHeight = startHeight + 1;
                        var interval = setInterval(function() {
                            if (currentHeight >= area.base.clientHeight - JsSplitter.vLimit) {
                                clearInterval(interval);
                                JsSplitter.animationPlaying = false;
                                return;
                            }
                            var event = {clientY: currentHeight};

                            area.dragger.drag(event, JsSplitter.vLimit);
                            area.draw();
                            //todo from properties
                            currentHeight = currentHeight + 5;
                        }, 10);
                    }
                });
            }
        },
        _addVCanvas: function(area, vSplitter) {
            if (vSplitter) {
                var buttons = document.createElement("div");
                buttons.style.position = "absolute";
                buttons.style.top = "10%";
                buttons.style.width = "100%";
                //todo from properties
                buttons.style.height = "30px";

                var towardsButton = document.createElement("canvas");
                var oppositeButton = document.createElement("canvas");

                towardsButton.style.width = "100%";
                towardsButton.style.height = "50%";
                towardsButton.style.position = "absolute";
                towardsButton.style.top = 0;
                //todo from properties
                towardsButton.style.backgroundColor = "red";
                towardsButton.name = "towards";
                oppositeButton.style.width = "100%";
                oppositeButton.style.height = "50%";
                oppositeButton.style.position = "absolute";
                oppositeButton.style.bottom = 0;
                //todo from properties
                oppositeButton.style.backgroundColor = "orange";
                oppositeButton.name = "opposite";

                towardsButton.style.cursor = "Pointer";
                oppositeButton.style.cursor = "Pointer";

                buttons.appendChild(towardsButton);
                buttons.appendChild(oppositeButton);

                vSplitter.appendChild(buttons);
                EventUtil.addHandler(towardsButton, "click", function() {
                    if (! JsSplitter.animationPlaying) {
                        JsSplitter.animationPlaying = true;
                        area.dragger.switchDragMode(JsSplitter.H);
                        var startWidth = area.dragger.towardsElements[0].clientWidth;
                        area.dragger.currentX = startWidth;
                        var currentWidth = startWidth - 1;
                        var interval = setInterval(function() {
                            if (currentWidth <= JsSplitter.vLimit) {
                                JsSplitter.animationPlaying = false;
                                clearInterval(interval);
                                return;
                            }
                            var event = {clientX: currentWidth};

                            area.dragger.drag(event, JsSplitter.vLimit);
                            area.draw();
                            //todo from properties
                            currentWidth -= 5;
                        }, 10);
                    }
                });
                EventUtil.addHandler(oppositeButton, "click", function() {
                    if (! JsSplitter.animationPlaying) {
                        JsSplitter.animationPlaying = true;
                        area.dragger.switchDragMode(JsSplitter.H);
                        var startWidth = area.dragger.towardsElements[0].clientWidth;
                        area.dragger.currentX = startWidth;
                        var currentWidth = startWidth + 1;
                        var interval = setInterval(function() {
                            if (currentWidth >= area.base.clientWidth - JsSplitter.vLimit) {
                                JsSplitter.animationPlaying = false;
                                clearInterval(interval);
                                return;
                            }
                            var event = {clientX: currentWidth};

                            area.dragger.drag(event, JsSplitter.vLimit);
                            area.draw();
                            //todo from properties
                            currentWidth += 5;
                        }, 10);
                    }
                });
            }
        }
    };
    JsSplitter.SplittedArea.OrdinalSplitterBuilder = {
        buildHSplitter: function(area) {
            var hSplitter = document.createElement("div");
            hSplitter.style.position = "absolute";
            hSplitter.style.left = "0";
            hSplitter.style.width = "100%";
            hSplitter.style.height = area.splitterWidth + "px";
            hSplitter.style.backgroundColor = area.hSplitterColor;
            JsSplitter.SplittedArea.SplitterUtils.prepareHSplitter(area, hSplitter);
            return hSplitter;
        },
        buildVSplitter: function(area) {
            var vSplitter = document.createElement("div");
            vSplitter.style.position = "absolute";
            vSplitter.style.top = "0";
            vSplitter.style.height = "100%";
            vSplitter.style.width = area.splitterWidth + "px";
            vSplitter.style.backgroundColor = area.vSplitterColor;
            JsSplitter.SplittedArea.SplitterUtils.prepareVSplitter(area, vSplitter);
            return vSplitter;
        }
    };
    JsSplitter.SplittedArea.TowardedSplitterBuilder = {
        buildHSplitter: function(area) {
            var hSplitter = document.createElement("div");
            hSplitter.style.position = "absolute";
            hSplitter.style.left = "0";
            hSplitter.style.height = area.splitterWidth + "px";
            hSplitter.style.backgroundColor = area.hSplitterColor;
            JsSplitter.SplittedArea.SplitterUtils.prepareHSplitter(area, hSplitter);
            return hSplitter;
        },
        buildVSplitter: function(area) {
            var vSplitter = document.createElement("div");
            vSplitter.style.position = "absolute";
            vSplitter.style.top = "0";
            vSplitter.style.width = area.splitterWidth + "px";
            vSplitter.style.backgroundColor = area.vSplitterColor;
            JsSplitter.SplittedArea.SplitterUtils.prepareVSplitter(area, vSplitter);
            return vSplitter;
        }
    };
    JsSplitter.SplittedArea.OppositeSplitterBuilder = {
        buildHSplitter: function(area) {
            var hSplitter = document.createElement("div");
            hSplitter.style.position = "absolute";
            hSplitter.style.right = "0";
            hSplitter.style.height = area.splitterWidth + "px";
            hSplitter.style.backgroundColor = area.hSplitterColor;
            JsSplitter.SplittedArea.SplitterUtils.prepareHSplitter(area, hSplitter);
            return hSplitter;
        },
        buildVSplitter: function(area) {
            var vSplitter = document.createElement("div");
            vSplitter.style.position = "absolute";
            vSplitter.style.bottom = "0";
            vSplitter.style.width = area.splitterWidth + "px";
            vSplitter.style.backgroundColor = area.vSplitterColor;
            JsSplitter.SplittedArea.SplitterUtils.prepareVSplitter(area, vSplitter);
            return vSplitter;
        }
    };
    JsSplitter.SplittedArea.EmptySplitterBuilder = {
        buildHSplitter: function() {
        },
        buildVSplitter: function() {
        }
    };

    JsSplitter.SplittedArea.OrdinalSectorBuilder = {
        buildOne: function(element) {
            if (element) {
                element.style.position = "absolute";
                element.style.left = "0";
                element.style.top = "0";
            }
        },

        buildTwo: function(element) {
            if (element) {
                element.style.position = "absolute";
                element.style.right = "0";
                element.style.top = "0";
            }
        },

        buildThree: function(element) {
            if (element) {
                element.style.position = "absolute";
                element.style.right = "0";
                element.style.bottom = "0";
            }
        },

        buildFour: function(element) {
            if (element) {
                element.style.position = "absolute";
                element.style.left = "0";
                element.style.bottom = "0";
            }
        }
    };
    JsSplitter.SplittedArea.TallSectorBuilder = {
        buildOne: function(element) {
            if (element) {
                JsSplitter.SplittedArea.OrdinalSectorBuilder.buildOne(element);
                element.style.width = "100%";
            }
        },

        buildTwo: function(element) {
            if (element) {
                JsSplitter.SplittedArea.OrdinalSectorBuilder.buildTwo(element);
                element.style.height = "100%";
            }
        },

        buildThree: function(element) {
            if (element) {
                JsSplitter.SplittedArea.OrdinalSectorBuilder.buildThree(element);
                element.style.width = "100%";
            }
        },

        buildFour: function(element) {
            if (element) {
                JsSplitter.SplittedArea.OrdinalSectorBuilder.buildFour(element);
                element.style.height = "100%";
            }
        }
    };
    JsSplitter.SplittedArea.EmptySectorBuilder = {
        buildOne: function() {
        },

        buildTwo: function() {
        },

        buildThree: function() {
        },

        buildFour: function() {
        }
    };
    JsSplitter.SplittedArea.OrdinalSectorRenderer = {
        drawOne: function(area) {
            area.one.style.width = (area.base.clientWidth * area.dragger.vSplitterShift - area.splitterWidth / 2) + "px";
            area.one.style.height = (area.base.clientHeight * area.dragger.hSplitterShift - area.splitterWidth / 2) + "px";
        },
        drawTwo: function(area) {
            area.two.style.width = (area.base.clientWidth * (1 - area.dragger.vSplitterShift) - area.splitterWidth / 2) + "px";
            area.two.style.height = (area.base.clientHeight * area.dragger.hSplitterShift - area.splitterWidth / 2) + "px";
        },
        drawThree: function(area) {
            area.three.style.width = (area.base.clientWidth * (1 - area.dragger.vSplitterShift) - area.splitterWidth / 2) + "px";
            area.three.style.height = (area.base.clientHeight * (1 - area.dragger.hSplitterShift) - area.splitterWidth / 2) + "px";
        },
        drawFour: function(area) {
            area.four.style.width = (area.base.clientWidth * area.dragger.vSplitterShift - area.splitterWidth / 2) + "px";
            area.four.style.height = (area.base.clientHeight * (1 - area.dragger.hSplitterShift) - area.splitterWidth / 2) + "px";
        }
    };
    JsSplitter.SplittedArea.TallSectorRenderer = {
        drawOne: function(area) {
            area.one.style.width = "100%";
            area.one.style.height = (area.base.clientHeight * area.dragger.hSplitterShift - area.splitterWidth / 2) + "px";
        },
        drawTwo: function(area) {
            area.two.style.width = (area.base.clientWidth * (1 - area.dragger.vSplitterShift) - area.splitterWidth / 2) + "px";
            area.two.style.height = "100%";
        },
        drawThree: function(area) {
            area.three.style.width = "100%";
            area.three.style.height = (area.base.clientHeight * (1 - area.dragger.hSplitterShift) - area.splitterWidth / 2) + "px";
        },
        drawFour: function(area) {
            area.four.style.width = (area.base.clientWidth * area.dragger.vSplitterShift - area.splitterWidth / 2) + "px";
            area.four.style.height = "100%";
        }
    };
    JsSplitter.SplittedArea.EmptySectorRenderer = {
        drawOne: function() {
        },
        drawTwo: function() {
        },
        drawThree: function() {
        },
        drawFour: function() {
        }
    };

    JsSplitter.SplittedArea.BaseSplitterRenderer = {
        drawBaseHSplitter: function(area) {
            area.hSplitter.style.top = (area.base.clientHeight * area.dragger.hSplitterShift - area.splitterWidth / 2) + "px";
        },

        drawBaseVSplitter: function(area) {
            area.vSplitter.style.left = (area.base.clientWidth * area.dragger.vSplitterShift - area.splitterWidth / 2) + "px";
        }
    };

    JsSplitter.SplittedArea.OrdinalSplitterRenderer = {
        drawHSplitter: function(area) {
            JsSplitter.SplittedArea.BaseSplitterRenderer.drawBaseHSplitter(area);
        },

        drawVSplitter: function(area) {
            JsSplitter.SplittedArea.BaseSplitterRenderer.drawBaseVSplitter(area);
        }
    };

    JsSplitter.SplittedArea.TowardedSplitterRenderer = {
        drawHSplitter: function(area) {
            JsSplitter.SplittedArea.BaseSplitterRenderer.drawBaseHSplitter(area);
            area.hSplitter.style.width = (area.base.clientWidth * area.dragger.vSplitterShift - area.splitterWidth / 2) + "px";
        },

        drawVSplitter: function(area) {
            JsSplitter.SplittedArea.BaseSplitterRenderer.drawBaseVSplitter(area);
            area.vSplitter.style.height = (area.base.clientHeight * area.dragger.hSplitterShift - area.splitterWidth / 2) + "px";
        }
    };

    JsSplitter.SplittedArea.OpposedSplitterRenderer = {
        drawHSplitter: function(area) {
            JsSplitter.SplittedArea.BaseSplitterRenderer.drawBaseHSplitter(area);
            area.hSplitter.style.width = (area.base.clientWidth * (1 - area.dragger.vSplitterShift) - area.splitterWidth / 2) + "px";
        },

        drawVSplitter: function(area) {
            JsSplitter.SplittedArea.BaseSplitterRenderer.drawBaseVSplitter(area);
            area.vSplitter.style.height = (area.base.clientHeight * (1 - area.dragger.hSplitterShift) - area.splitterWidth / 2) + "px";
        }
    };

    JsSplitter.SplittedArea.EmptySplitterRenderer = {
        drawHSplitter: function() {
        },

        drawVSplitter: function() {
        }
    };
    JsSplitter.SplittedArea.GenericFactory = {
        build: function (options, factory) {
            var result;
            if (options.one && options.two && options.three && options.four) {
                result = factory.fourAreas();
            } else if(options.one && ! options.two && options.three && options.four) {
                result = factory.bigTop();
            } else if(options.one && options.two && ! options.three && options.four) {
                result = factory.bigRight();
            } else if(options.one && ! options.two && options.three && ! options.four) {
                result = factory.horizontalSplit();
            }
        //todo add the rest of cases
            return result;
        }
    };
    JsSplitter.SplittedArea.SectorBuildersFactory = {
        fourAreas: function() {
            return {
                oneBuilder: JsSplitter.SplittedArea.OrdinalSectorBuilder,
                twoBuilder: JsSplitter.SplittedArea.OrdinalSectorBuilder,
                threeBuilder: JsSplitter.SplittedArea.OrdinalSectorBuilder,
                fourBuilder: JsSplitter.SplittedArea.OrdinalSectorBuilder
            }
        },
        bigTop: function() {
            return {
                oneBuilder: JsSplitter.SplittedArea.TallSectorBuilder,
                twoBuilder: JsSplitter.SplittedArea.EmptySectorBuilder,
                threeBuilder: JsSplitter.SplittedArea.OrdinalSectorBuilder,
                fourBuilder: JsSplitter.SplittedArea.OrdinalSectorBuilder
            }
        },
        bigRight: function() {
            return {
                oneBuilder: JsSplitter.SplittedArea.OrdinalSectorBuilder,
                twoBuilder: JsSplitter.SplittedArea.TallSectorBuilder,
                threeBuilder: JsSplitter.SplittedArea.EmptySectorBuilder,
                fourBuilder: JsSplitter.SplittedArea.OrdinalSectorBuilder
            }
        },
        horizontalSplit: function() {
            return {
                oneBuilder: JsSplitter.SplittedArea.TallSectorBuilder,
                twoBuilder: JsSplitter.SplittedArea.EmptySectorBuilder,
                threeBuilder: JsSplitter.SplittedArea.TallSectorBuilder,
                fourBuilder: JsSplitter.SplittedArea.EmptySectorBuilder
            }
        }
        //todo add the rest of cases
    };
    JsSplitter.SplittedArea.SplitterBuildersFactory = {
        fourAreas: function() {
            return {
                hSplitterBuilder: JsSplitter.SplittedArea.OrdinalSplitterBuilder,
                vSplitterBuilder: JsSplitter.SplittedArea.OrdinalSplitterBuilder
            }
        },
        bigTop: function() {
            return {
                hSplitterBuilder: JsSplitter.SplittedArea.OrdinalSplitterBuilder,
                vSplitterBuilder: JsSplitter.SplittedArea.OppositeSplitterBuilder
            }
        },
        bigRight: function() {
            return {
                hSplitterBuilder: JsSplitter.SplittedArea.TowardedSplitterBuilder,
                vSplitterBuilder: JsSplitter.SplittedArea.OrdinalSplitterBuilder
            }
        },
        horizontalSplit: function() {
            return {
                hSplitterBuilder: JsSplitter.SplittedArea.OrdinalSplitterBuilder,
                vSplitterBuilder: JsSplitter.SplittedArea.EmptySplitterBuilder
            }
        }
        //todo add the rest of cases
    };
    JsSplitter.SplittedArea.DraggerFactory = {
        _buildDragger: function(){
            var dragger = new JsSplitter.Dragger();
            return dragger;
        },
        fourAreas: function() {
            var dragger = this._buildDragger();
            dragger.setHDraggableElements = function() {
                this.towardsElements = [this.area.one, this.area.four];
                this.oppositeElements = [this.area.three, this.area.two];
            };
            dragger.setVDraggableElements = function() {
                this.towardsElements = [this.area.one, this.area.two];
                this.oppositeElements = [this.area.three, this.area.four];
            };
            return dragger;
        },
        bigTop: function() {
            var dragger = this._buildDragger();
            dragger.setHDraggableElements = function() {
                this.towardsElements = [this.area.four];
                this.oppositeElements = [this.area.three];
            };
            dragger.setVDraggableElements = function() {
                this.towardsElements = [this.area.one];
                this.oppositeElements = [this.area.three, this.area.four];
            };
            return dragger;
        },
        bigRight: function() {
            var dragger = this._buildDragger();
            dragger.setHDraggableElements = function() {
                this.towardsElements = [this.area.one, this.area.four];
                this.oppositeElements = [this.area.two];
            };
            dragger.setVDraggableElements = function() {
                this.towardsElements = [this.area.one];
                this.oppositeElements = [this.area.four];
            };
            return dragger;
        },
        horizontalSplit: function() {
            var dragger = this._buildDragger();
            dragger.setHDraggableElements = function() {
                this.towardsElements = [];
                this.oppositeElements = [];
            };
            dragger.setVDraggableElements = function() {
                this.towardsElements = [this.area.one];
                this.oppositeElements = [this.area.three];
            };
            return dragger;
        }
        //todo add the rest of cases
    };
    JsSplitter.SplittedArea.SectorRendererFactory = {
        fourAreas: function() {
            return {
                oneRenderer: JsSplitter.SplittedArea.OrdinalSectorRenderer,
                twoRenderer: JsSplitter.SplittedArea.OrdinalSectorRenderer,
                threeRenderer: JsSplitter.SplittedArea.OrdinalSectorRenderer,
                fourRenderer: JsSplitter.SplittedArea.OrdinalSectorRenderer
            }
        },
        bigTop: function() {
            return {
                oneRenderer: JsSplitter.SplittedArea.TallSectorRenderer,
                twoRenderer: JsSplitter.SplittedArea.EmptySectorRenderer,
                threeRenderer: JsSplitter.SplittedArea.OrdinalSectorRenderer,
                fourRenderer: JsSplitter.SplittedArea.OrdinalSectorRenderer
            }
        },
        bigRight: function() {
            return {
                oneRenderer: JsSplitter.SplittedArea.OrdinalSectorRenderer,
                twoRenderer: JsSplitter.SplittedArea.TallSectorRenderer,
                threeRenderer: JsSplitter.SplittedArea.EmptySectorRenderer,
                fourRenderer: JsSplitter.SplittedArea.OrdinalSectorRenderer
            }
        },
        horizontalSplit: function() {
            return {
                oneRenderer: JsSplitter.SplittedArea.TallSectorRenderer,
                twoRenderer: JsSplitter.SplittedArea.EmptySectorRenderer,
                threeRenderer: JsSplitter.SplittedArea.TallSectorRenderer,
                fourRenderer: JsSplitter.SplittedArea.EmptySectorRenderer
            }
        }
        //todo add the rest of cases
    };
    JsSplitter.SplittedArea.SplitterRendererFactory = {
        fourAreas: function() {
            return {
                hSplitterRenderer: JsSplitter.SplittedArea.OrdinalSplitterRenderer,
                vSplitterRenderer: JsSplitter.SplittedArea.OrdinalSplitterRenderer
            }
        },
        bigTop: function() {
            return {
                hSplitterRenderer: JsSplitter.SplittedArea.OrdinalSplitterRenderer,
                vSplitterRenderer: JsSplitter.SplittedArea.OpposedSplitterRenderer
            }
        },
        bigRight: function() {
            return {
                hSplitterRenderer: JsSplitter.SplittedArea.TowardedSplitterRenderer,
                vSplitterRenderer: JsSplitter.SplittedArea.OrdinalSplitterRenderer
            }
        },
        horizontalSplit: function() {
            return {
                hSplitterRenderer: JsSplitter.SplittedArea.OrdinalSplitterRenderer,
                vSplitterRenderer: JsSplitter.SplittedArea.EmptySplitterRenderer
            }
        }
        //todo add the rest of cases
    };
    JsSplitter.SplittedArea.prototype.init = function() {
        var sectors = {
            one: this.one,
            two: this.two,
            three: this.three,
            four: this.four
        };
        var sectorBuilders = JsSplitter.SplittedArea.GenericFactory.build(
            sectors,
            JsSplitter.SplittedArea.SectorBuildersFactory
        );
        var splitterBuilders = JsSplitter.SplittedArea.GenericFactory.build(
            sectors,
            JsSplitter.SplittedArea.SplitterBuildersFactory
        );
        var dragger = JsSplitter.SplittedArea.GenericFactory.build(
            sectors,
            JsSplitter.SplittedArea.DraggerFactory
        );
        dragger.area = this;
        dragger.hSplitterShift = this.initialHSplitterShift;
        dragger.vSplitterShift = this.initialVSplitterShift;
        this.dragger = dragger;

        var sectorRenderers = JsSplitter.SplittedArea.GenericFactory.build(
            sectors,
            JsSplitter.SplittedArea.SectorRendererFactory
        );
        this.drawOne = sectorRenderers.oneRenderer.drawOne;
        this.drawTwo = sectorRenderers.twoRenderer.drawTwo;
        this.drawThree = sectorRenderers.threeRenderer.drawThree;
        this.drawFour = sectorRenderers.fourRenderer.drawFour;

        var splitterRenderers = JsSplitter.SplittedArea.GenericFactory.build(
            sectors,
            JsSplitter.SplittedArea.SplitterRendererFactory
        );
        this.drawHSplitter = splitterRenderers.hSplitterRenderer.drawHSplitter;
        this.drawVSplitter = splitterRenderers.vSplitterRenderer.drawVSplitter;

        sectorBuilders.oneBuilder.buildOne(this.one);
        sectorBuilders.twoBuilder.buildTwo(this.two);
        sectorBuilders.threeBuilder.buildThree(this.three);
        sectorBuilders.fourBuilder.buildFour(this.four);

        this.hSplitter = splitterBuilders.hSplitterBuilder.buildHSplitter(this);
        this.vSplitter = splitterBuilders.vSplitterBuilder.buildVSplitter(this);

        if (this.one) {
            this.base.appendChild(this.one);
        }
        if (this.two) {
            this.base.appendChild(this.two);
        }
        if (this.three) {
            this.base.appendChild(this.three);
        }
        if (this.four) {
            this.base.appendChild(this.four);
        }
        if (this.hSplitter) {
            this.base.appendChild(this.hSplitter);
        }
        if (this.vSplitter) {
            this.base.appendChild(this.vSplitter);
        }

    };
    JsSplitter.SplittedArea.prototype.draw = function() {
        this.disableChildren();
        this.disableSplitters();

        this.drawSectors();

        this.drawSplitters();

        this.enableSplitters();
    };
    JsSplitter.SplittedArea.prototype.addSubArea = function(sector, /**JsSplitter.SplittedArea*/ childArea) {
        var parent;
        switch (sector) {
            case JsSplitter.SplittedArea.NW:
                parent = this.one;
                break;
            case JsSplitter.SplittedArea.NE:
                parent = this.two;
                break;
            case JsSplitter.SplittedArea.SE:
                parent = this.three;
                break;
            case JsSplitter.SplittedArea.SW:
                parent = this.four;
                break;
        }
        parent.appendChild(childArea.base);
        this._children.push(childArea);
    };

    JsSplitter.Dragger.prototype.setStyleProperty = function(element, property, value) {
        element.style[property] = value;
    };

    JsSplitter.Dragger.prototype.getStyleProperty = function(element, property) {
        return element.style[property];
    };


    /**
     * This method must be called once after all splitting areas, are initialized
     * and nested into each other
     */
    JsSplitter.SplittedArea.prototype.attachBaseListeners = function() {
        EventUtil.addHandler(this.base, "mousemove", function(event) {
            if (JsSplitter.VDRAG) {
                event = EventUtil.getEvent(event);
                JsSplitter.draggableArea.dragger.switchDragMode(JsSplitter.V);
                //todo from properties
                JsSplitter.draggableArea.dragger.drag(event, JsSplitter.vLimit);
                JsSplitter.draggableArea.draw();
            }
            if (JsSplitter.HDRAG) {
                event = EventUtil.getEvent(event);
                JsSplitter.draggableArea.dragger.switchDragMode(JsSplitter.H);
                //todo from properties
                JsSplitter.draggableArea.dragger.drag(event, JsSplitter.hLimit);
                JsSplitter.draggableArea.draw();
            }
        });
        var that = this;
        EventUtil.addHandler(this.base, "mouseup", function() {
            JsSplitter.disableVDrag();
            JsSplitter.disableHDrag();
            if (that.mouseUpHook) {
                that.mouseUpHook();
            }
        });
        EventUtil.addHandler(this.base, "mouseout", function(event) {
            event = EventUtil.getEvent(event);
            var from = event.relatedTarget || event.toElement;
            if (!from || from.nodeName == "HTML") {
                JsSplitter.disableVDrag();
                JsSplitter.disableHDrag();
            }
        });
    };
    JsSplitter.SplittedArea.ArrowRenderer = {
        _initState: function(canvas) {
            this.width = canvas.clientWidth;
            this.height = canvas.clientHeight;
            this.context = canvas.getContext("2d");
            //todo from Properties
            this.context.strokeStyle = "green";
            this.context.lineWidth = 2;
        },
        drawNorth: function(/**canvas*/ canvas) {
            if (canvas.getContext) {
                this._initState(canvas);
                this.context.moveTo(0, this.height);
                this.context.lineTo(this.width / 2, 0);
                this.context.lineTo(this.width, this.height);
                this.context.stroke();
            }
        },
        drawSouth: function(/**canvas*/ canvas) {
            if (canvas.getContext) {
                this._initState(canvas);
                this.context.moveTo(0, 0);
                this.context.lineTo(this.width / 2, this.height);
                this.context.lineTo(this.width, 0);
                this.context.stroke();
            }
        },
        drawWest: function(/**canvas*/ canvas) {
            if (canvas.getContext) {
                this._initState(canvas);
                this.context.moveTo(this.width, 0);
                this.context.lineTo(0, this.height/2);
                this.context.lineTo(this.width, this.height);
                this.context.stroke();
            }
        },
        drawEast: function(/**canvas*/ canvas) {
            if (canvas.getContext) {
                this._initState(canvas);
                this.context.moveTo(0, 0);
                this.context.lineTo(this.width, this.height / 2);
                this.context.lineTo(0, this.height);
                this.context.stroke();
            }
        }
    };
    JsSplitter.SplittedArea.prototype.paintArrows = function() {
        var northButton;
        var southButton;
        var westButton;
        var eastButton;
        var hButtons = this.hSplitter.children[0];
        var vButtons = this.vSplitter.children[0];
        var hSplitterButtons = hButtons.children;
        var vSplitterButtons = vButtons.children;
        for(var i = 0; i < hSplitterButtons.length; i++) {
            if(hSplitterButtons[i].name == "towards"){
                northButton = hSplitterButtons[i];
            } else if(hSplitterButtons[i].name == "opposite") {
                southButton = hSplitterButtons[i];
            }
        }
        for(var i = 0; i < vSplitterButtons.length; i++) {
            if(vSplitterButtons[i].name == "towards"){
                westButton = vSplitterButtons[i];
            } else if(vSplitterButtons[i].name == "opposite") {
                eastButton = vSplitterButtons[i];
            }
        }
        //we must set width and height properties, and we should
        //do it here, because we're not aware of hButtons.clientWidth
        //and hButtons.clientHeight before we draw the sectors
        northButton.width = hButtons.clientWidth/2;
        northButton.height = hButtons.clientHeight;
        southButton.width = hButtons.clientWidth/2;
        southButton.height = hButtons.clientHeight;
        westButton.width = vButtons.clientWidth;
        westButton.height = vButtons.clientHeight/2;
        eastButton.width = vButtons.clientWidth;
        eastButton.height = vButtons.clientHeight/2;

        JsSplitter.SplittedArea.ArrowRenderer.drawNorth(northButton);
        JsSplitter.SplittedArea.ArrowRenderer.drawSouth(southButton);
        JsSplitter.SplittedArea.ArrowRenderer.drawWest(westButton);
        JsSplitter.SplittedArea.ArrowRenderer.drawEast(eastButton);
    };
    JsSplitter.SplittedArea.prototype.paint = function() {
        this.paintArrows();
        for (var i = 0; i < this._children.length; i++) {
            this._children[i].paint();
        }
    };
    JsSplitter.SplittedArea.prototype.disable = function() {
        this.base.style.display = "none";
        for (var i = 0; i < this._children.length; i++) {
            this._children[i].disable();
        }
    };
    JsSplitter.SplittedArea.prototype.enable = function() {
        this.base.style.display = "block";
        for (var i = 0; i < this._children.length; i++) {
            this._children[i].enable();
        }
    };
    JsSplitter.SplittedArea.prototype.disableChildren = function() {
        for (var i = 0; i < this._children.length; i++) {
            this._children[i].disable();
        }
    };
    JsSplitter.SplittedArea.prototype.enableChildren = function() {
        for (var i = 0; i < this._children.length; i++) {
            this._children[i].enable();
        }
    };
    JsSplitter.SplittedArea.prototype.disableSplitters = function() {
        if (this.hSplitter) {
            this.hSplitter.style.display = "none";
        }
        if (this.vSplitter) {
            this.vSplitter.style.display = "none";
        }
        for (var i = 0; i < this._children.length; i++) {
            this._children[i].disableSplitters();
        }
    };
    JsSplitter.SplittedArea.prototype.enableSplitters = function() {
        if (this.hSplitter) {
            this.hSplitter.style.display = "block";
        }
        if (this.vSplitter) {
            this.vSplitter.style.display = "block";
        }
        for (var i = 0; i < this._children.length; i++) {
            this._children[i].enableSplitters();
        }
    };
    JsSplitter.SplittedArea.prototype.drawSectors = function() {
        this.drawOne(this);
        this.drawTwo(this);
        this.drawThree(this);
        this.drawFour(this);

        for (var i = 0; i < this._children.length; i++) {
            //enable child's base so it's clientWidth and clientHeight get calculated
            this._children[i].base.style.display = "block";
            this._children[i].drawSectors();
        }
    };
    JsSplitter.SplittedArea.prototype.drawSplitters = function() {
        this.drawHSplitter(this);
        this.drawVSplitter(this);

        for (var i = 0; i < this._children.length; i++) {
            this._children[i].drawSplitters();
        }
    };

    JsSplitter.SplittedArea.prototype.build = function() {
        this.attachBaseListeners();
        this.draw();
        //by that time all shapes are ready. We can rely on clientWidth and clientHeight to do some canvas paintings
        this.paint();
    };

    JsSplitter.SplittedArea.NW = 1;
    JsSplitter.SplittedArea.NE = 2;
    JsSplitter.SplittedArea.SE = 3;
    JsSplitter.SplittedArea.SW = 4;

    JsSplitter.H = 1;
    JsSplitter.V = 2;

    JsSplitter.T = 1;
    JsSplitter.O = 2;
})();
