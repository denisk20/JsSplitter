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

    window.JsSplitter = {
        splitterWidth : 8, //px
        vSplitterColor : "#000000",
        hSplitterColor : "#000000",
        hLimit: 10, //px
        vLimit: 10,  //px

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

        var towardsAmountStr = new StyleManipulator(this.cssElementPropertyName, this.towardsElements[0]).get();
        var towardsAmount = parseFloat(towardsAmountStr.substring(0, towardsAmountStr.length - 2));
        var newTowardsAmount = towardsAmount - delta;
        if (newTowardsAmount < minLimit) {
            return;
        }

        var oppositeAmountStr = new StyleManipulator(this.cssElementPropertyName, this.oppositeElements[0]).get();
        var oppositeAmount = parseFloat(oppositeAmountStr.substring(0, oppositeAmountStr.length - 2));
        var newOppositeAmount = oppositeAmount + delta;
        if (newOppositeAmount < minLimit) {
            return;
        }

        for (var i = 0; i < this.towardsElements.length; i++) {
            var tElement = this.towardsElements[i];
            new StyleManipulator(this.cssElementPropertyName, tElement).set(newTowardsAmount + "px")
        }
        for (var j = 0; j < this.oppositeElements.length; j++) {
            var oElement = this.oppositeElements[j];
            new StyleManipulator(this.cssElementPropertyName, oElement).set(newOppositeAmount + "px")
        }

        var splitterStyleManipulator = new StyleManipulator(this.cssSplitterPropertyName, this.splitter);
        var splitterPositionStr = splitterStyleManipulator.get();

        var splitterPosition = parseFloat(splitterPositionStr.substring(0, splitterPositionStr.length - 2));
        var newSplitterPosition = splitterPosition - delta;

        splitterStyleManipulator.set(newSplitterPosition + "px");

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
        var newSplitterShift = this.area.hSplitterShift - (delta / this.area.base.clientHeight);
        //todo should this belong to  JsSplitter.SplittedArea?
        this.area.hSplitterShift = newSplitterShift;
    };

    JsSplitter.Dragger.prototype.shiftVSplitter = function(delta) {
        var newSplitterShift = this.area.vSplitterShift - (delta / this.area.base.clientWidth);
        //todo should this belong to  JsSplitter.SplittedArea?
        this.area.vSplitterShift = newSplitterShift;
    };

    JsSplitter.SplittedArea = function(/**Div*/ base, vSplitterShift, hSplitterShift, one, two, three, four) {
        this.base = base;
        this.one = one;
        this.two = two;
        this.three = three;
        this.four = four;
        this.vSplitterShift = vSplitterShift;
        this.hSplitterShift = hSplitterShift;
        this._children = [];

        this.dragger = new JsSplitter.Dragger(this);

        for (var i = 3; i < arguments.length; i++) {
            var tile = arguments[i];

            if (tile && tile.parentNode && tile.parentNode.children) {
                tile.parentNode.removeChild(tile);
            }
        }

        this.init();
    };

    JsSplitter.SplittedArea.SplitterEventUtils = {
        addHSplitterHandler: function(area, hSplitter) {
            EventUtil.addHandler(hSplitter, "mousedown", function(event) {
                event = EventUtil.getEvent(event);
                area.dragger.currentY = event.clientY;
                JsSplitter.enableVDrag();
                JsSplitter.draggableArea = area;
                //in firefox, we have to prevent default action (dragging) for elements
                if (event.preventDefault) event.preventDefault();
            });
        },

        addVSplitterHandler: function(area, vSplitter) {
            EventUtil.addHandler(vSplitter, "mousedown", function(event) {
                event = EventUtil.getEvent(event);
                area.dragger.currentX = event.clientX;
                JsSplitter.enableHDrag();
                JsSplitter.draggableArea = area;
                //in firefox, we have to prevent default action (dragging) for elements
                if (event.preventDefault) event.preventDefault();
            });
        }
    };
    JsSplitter.SplittedArea.OrdinalSplitterBuilder = {
        buildHSplitter: function(area) {
            var hSplitter = document.createElement("div");
            hSplitter.style.position = "absolute";
            hSplitter.style.left = "0";
            hSplitter.style.width = "100%";
            hSplitter.style.height = JsSplitter.splitterWidth + "px";
            hSplitter.style.backgroundColor = JsSplitter.hSplitterColor;
            JsSplitter.SplittedArea.SplitterEventUtils.addHSplitterHandler(area, hSplitter);
            return hSplitter;
        },
        buildVSplitter: function(area) {
            var vSplitter = document.createElement("div");
            vSplitter.style.position = "absolute";
            vSplitter.style.top = "0";
            vSplitter.style.height = "100%";
            vSplitter.style.width = JsSplitter.splitterWidth + "px";
            vSplitter.style.backgroundColor = JsSplitter.vSplitterColor;
            JsSplitter.SplittedArea.SplitterEventUtils.addVSplitterHandler(area, vSplitter);
            return vSplitter;
        }
    };
    JsSplitter.SplittedArea.TowardedSplitterBuilder = {
        buildHSplitter: function(area) {
            var hSplitter = document.createElement("div");
            hSplitter.style.position = "absolute";
            hSplitter.style.left = "0";
            hSplitter.style.height = JsSplitter.splitterWidth + "px";
            hSplitter.style.backgroundColor = JsSplitter.hSplitterColor;
            JsSplitter.SplittedArea.SplitterEventUtils.addHSplitterHandler(area, hSplitter);
            return hSplitter;
        },
        buildVSplitter: function(area) {
            var vSplitter = document.createElement("div");
            vSplitter.style.position = "absolute";
            vSplitter.style.top = "0";
            vSplitter.style.width = JsSplitter.splitterWidth + "px";
            vSplitter.style.backgroundColor = JsSplitter.vSplitterColor;
            JsSplitter.SplittedArea.SplitterEventUtils.addVSplitterHandler(area, vSplitter);
            return vSplitter;
        }
    };
    JsSplitter.SplittedArea.OppositeSplitterBuilder = {
        buildHSplitter: function(area) {
            var hSplitter = document.createElement("div");
            hSplitter.style.position = "absolute";
            hSplitter.style.right = "0";
            hSplitter.style.height = JsSplitter.splitterWidth + "px";
            hSplitter.style.backgroundColor = JsSplitter.hSplitterColor;
            JsSplitter.SplittedArea.SplitterEventUtils.addHSplitterHandler(area, hSplitter);
            return hSplitter;
        },
        buildVSplitter: function(area) {
            var vSplitter = document.createElement("div");
            vSplitter.style.position = "absolute";
            vSplitter.style.bottom = "0";
            vSplitter.style.width = JsSplitter.splitterWidth + "px";
            vSplitter.style.backgroundColor = JsSplitter.vSplitterColor;
            JsSplitter.SplittedArea.SplitterEventUtils.addVSplitterHandler(area, vSplitter);
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
    JsSplitter.SplittedArea.prototype.init = function() {
        var oneBuilder;
        var twoBuilder;
        var threeBuilder;
        var fourBuilder;
        var hSplitterBuilder;
        var vSplitterBuilder;
        if (this.one && this.two && this.three && this.four) {
            oneBuilder = JsSplitter.SplittedArea.OrdinalSectorBuilder;
            twoBuilder = JsSplitter.SplittedArea.OrdinalSectorBuilder;
            threeBuilder = JsSplitter.SplittedArea.OrdinalSectorBuilder;
            fourBuilder = JsSplitter.SplittedArea.OrdinalSectorBuilder;

            hSplitterBuilder = JsSplitter.SplittedArea.OrdinalSplitterBuilder;
            vSplitterBuilder = JsSplitter.SplittedArea.OrdinalSplitterBuilder;

            //todo these functions should be prototypes
            this.dragger.setHDraggableElements = function() {
                this.towardsElements = [this.area.one, this.area.four];
                this.oppositeElements = [this.area.three, this.area.two];
            };
            this.dragger.setVDraggableElements = function() {
                this.towardsElements = [this.area.one, this.area.two];
                this.oppositeElements = [this.area.three, this.area.four];
            };

            this.drawOne = function() {
                this.one.style.width = (this.base.clientWidth * this.vSplitterShift - JsSplitter.splitterWidth / 2) + "px";
                this.one.style.height = (this.base.clientHeight * this.hSplitterShift - JsSplitter.splitterWidth / 2) + "px";
            };
            this.drawTwo = function() {
                this.two.style.width = (this.base.clientWidth * (1 - this.vSplitterShift) - JsSplitter.splitterWidth / 2) + "px";
                this.two.style.height = (this.base.clientHeight * this.hSplitterShift - JsSplitter.splitterWidth / 2) + "px";
            };
            this.drawFour = function(){
                this.four.style.width = (this.base.clientWidth * this.vSplitterShift - JsSplitter.splitterWidth / 2) + "px";
                this.four.style.height = (this.base.clientHeight * (1 - this.hSplitterShift) - JsSplitter.splitterWidth / 2) + "px";
            };
            this.drawThree = function() {
                this.three.style.width = (this.base.clientWidth * (1 - this.vSplitterShift) - JsSplitter.splitterWidth / 2) + "px";
                this.three.style.height = (this.base.clientHeight * (1 - this.hSplitterShift) - JsSplitter.splitterWidth / 2) + "px";
            };

            this.drawVSplitter = function() {
                this.vSplitter.style.left = (this.base.clientWidth * this.vSplitterShift - JsSplitter.splitterWidth / 2) + "px";
            };
            this.drawHSplitter = function() {
                this.hSplitter.style.top = (this.base.clientHeight * this.hSplitterShift - JsSplitter.splitterWidth / 2) + "px";
            };

        } else if (this.one && ! this.two && this.three && this.four) {
            oneBuilder = JsSplitter.SplittedArea.TallSectorBuilder;
            twoBuilder = JsSplitter.SplittedArea.EmptySectorBuilder;
            threeBuilder = JsSplitter.SplittedArea.OrdinalSectorBuilder;
            fourBuilder = JsSplitter.SplittedArea.OrdinalSectorBuilder;

            hSplitterBuilder = JsSplitter.SplittedArea.OrdinalSplitterBuilder;
            vSplitterBuilder = JsSplitter.SplittedArea.OppositeSplitterBuilder;

            this.dragger.setHDraggableElements = function() {
                this.towardsElements = [this.area.four];
                this.oppositeElements = [this.area.three];
            };
            this.dragger.setVDraggableElements = function() {
                this.towardsElements = [this.area.one];
                this.oppositeElements = [this.area.three, this.area.four];
            };

            this.drawOne = function() {
                this.one.style.width = "100%";
                this.one.style.height = (this.base.clientHeight * this.hSplitterShift - JsSplitter.splitterWidth / 2) + "px";
            };
            this.drawTwo = function() {
            };
            this.drawFour = function(){
                this.four.style.width = (this.base.clientWidth * this.vSplitterShift - JsSplitter.splitterWidth / 2) + "px";
                this.four.style.height = (this.base.clientHeight * (1 - this.hSplitterShift) - JsSplitter.splitterWidth / 2) + "px";
            };
            this.drawThree = function() {
                this.three.style.width = (this.base.clientWidth * (1 - this.vSplitterShift) - JsSplitter.splitterWidth / 2) + "px";
                this.three.style.height = (this.base.clientHeight * (1 - this.hSplitterShift) - JsSplitter.splitterWidth / 2) + "px";
            };

            this.drawVSplitter = function() {
                this.vSplitter.style.left = (this.base.clientWidth * this.vSplitterShift - JsSplitter.splitterWidth / 2) + "px";
                this.vSplitter.style.height = (this.base.clientHeight * (1 - this.hSplitterShift) - JsSplitter.splitterWidth / 2) + "px";
            };
            this.drawHSplitter = function() {
                this.hSplitter.style.top = (this.base.clientHeight * this.hSplitterShift - JsSplitter.splitterWidth / 2) + "px";
            };
        }
        oneBuilder.buildOne(this.one);
        twoBuilder.buildTwo(this.two);
        threeBuilder.buildThree(this.three);
        fourBuilder.buildFour(this.four);

        var hSplitter = hSplitterBuilder.buildHSplitter(this);
        var vSplitter = vSplitterBuilder.buildVSplitter(this);

        this.vSplitter = vSplitter;
        this.hSplitter = hSplitter;

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
        if (vSplitter) {
            this.base.appendChild(vSplitter);
        }
        if (hSplitter) {
            this.base.appendChild(hSplitter);
        }

    };
    JsSplitter.SplittedArea.prototype.draw = function() {
        this.drawOne();
        this.drawTwo();
        this.drawThree();
        this.drawFour();
        this.drawVSplitter();
        this.drawHSplitter();
        for (var i = 0; i < this._children.length; i++) {
            this._children[i].draw();
        }
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

    function StyleManipulator(property, element) {
        this.property = property;
        this.element = element;
    }

    StyleManipulator.prototype.set = function(value) {
        this.element.style[this.property] = value;
    };

    StyleManipulator.prototype.get = function() {
        return this.element.style[this.property];
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
                JsSplitter.draggableArea.dragger.drag(event, JsSplitter.vLimit);
                JsSplitter.draggableArea.draw();
            }
            if (JsSplitter.HDRAG) {
                event = EventUtil.getEvent(event);
                JsSplitter.draggableArea.dragger.switchDragMode(JsSplitter.H);
                JsSplitter.draggableArea.dragger.drag(event, JsSplitter.hLimit);
                JsSplitter.draggableArea.draw();
            }
        });
        EventUtil.addHandler(this.base, "mouseup", function() {
            JsSplitter.disableVDrag();
            JsSplitter.disableHDrag();
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

    JsSplitter.SplittedArea.NW = 1;
    JsSplitter.SplittedArea.NE = 2;
    JsSplitter.SplittedArea.SE = 3;
    JsSplitter.SplittedArea.SW = 4;

    JsSplitter.H = 1;
    JsSplitter.V = 2;
})();



