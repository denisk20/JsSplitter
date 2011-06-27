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

        for(var i = 0; i < this.towardsElements.length; i++) {
            var tElement = this.towardsElements[i];
            new StyleManipulator(this.cssElementPropertyName, tElement).set(newTowardsAmount + "px")
        }
        for(var j = 0; j < this.oppositeElements.length; j++) {
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
                this.towardsElements = [this.area.one, this.area.four];
                this.oppositeElements = [this.area.three, this.area.two];
                this.splitter = this.area.vSplitter;
                this.saveState = this.saveStateAfterHDragging;
                this.shiftTheSplitter = this.shiftVSplitter;
                break;
            case JsSplitter.V:
                this.getDelta = this.getVDelta;
                this.cssElementPropertyName = "height";
                this.cssSplitterPropertyName = "top";
                this.towardsElements = [this.area.one, this.area.two];
                this.oppositeElements = [this.area.three, this.area.four];
                this.splitter = this.area.hSplitter;
                this.saveState = this.saveStateAfterVDragging;
                this.shiftTheSplitter = this.shiftHSplitter;
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

        this.init();
    };
    JsSplitter.SplittedArea.prototype.init = function() {
        for (var i = 3; i < arguments.length; i++) {
            var tile = arguments[i];

            if (tile && tile.parentNode && tile.parentNode.children) {
                tile.parentNode.removeChild(tile);
            }
        }

        //    ___
        //   |_|_|
        //  |_|_|
        if (this.one && this.two && this.three && this.four) {
            this.one.style.position = "absolute";
            this.one.style.left = "0";
            this.one.style.top = "0";

            this.two.style.position = "absolute";
            this.two.style.right = "0";
            this.two.style.top = "0";

            this.four.style.position = "absolute";
            this.four.style.left = "0";
            this.four.style.bottom = "0";

            this.three.style.position = "absolute";
            this.three.style.right = "0";
            this.three.style.bottom = "0";

            var vSplitter = document.createElement("div");
            vSplitter.style.position = "absolute";
            vSplitter.style.top = "0";
            vSplitter.style.height = "100%";
            vSplitter.style.width = JsSplitter.splitterWidth + "px";
            vSplitter.style.backgroundColor = JsSplitter.vSplitterColor;

            var hSplitter = document.createElement("div");
            hSplitter.style.position = "absolute";
            hSplitter.style.left = "0";
            hSplitter.style.width = "100%";
            hSplitter.style.height = JsSplitter.splitterWidth + "px";
            hSplitter.style.backgroundColor = JsSplitter.hSplitterColor;

            var that = this;

            EventUtil.addHandler(hSplitter, "mousedown", function(event) {
                event = EventUtil.getEvent(event);
                that.dragger.currentY = event.clientY;
                JsSplitter.enableVDrag();
                JsSplitter.draggableArea = that;
                //in firefox, we have to prevent default action (dragging) for elements
                if (event.preventDefault) event.preventDefault();
            });
            EventUtil.addHandler(vSplitter, "mousedown", function(event) {
                event = EventUtil.getEvent(event);
                that.dragger.currentX = event.clientX;
                JsSplitter.enableHDrag();
                JsSplitter.draggableArea = that;
                //in firefox, we have to prevent default action (dragging) for elements
                if (event.preventDefault) event.preventDefault();
            });
            this.vSplitter = vSplitter;
            this.hSplitter = hSplitter;

            this.base.appendChild(this.one);
            this.base.appendChild(vSplitter);
            this.base.appendChild(this.two);
            this.base.appendChild(hSplitter);
            this.base.appendChild(this.four);
            this.base.appendChild(this.three);

        }
    };
    JsSplitter.SplittedArea.prototype.draw = function() {
        var baseWidth = this.base.clientWidth;

        var baseHeight = this.base.clientHeight;
        this.one.style.width = (baseWidth * this.vSplitterShift - JsSplitter.splitterWidth / 2) + "px";
        this.one.style.height = (baseHeight * this.hSplitterShift - JsSplitter.splitterWidth / 2) + "px";
        this.vSplitter.style.left = (baseWidth * this.vSplitterShift - JsSplitter.splitterWidth / 2) + "px";
        this.two.style.width = (baseWidth * (1 - this.vSplitterShift) - JsSplitter.splitterWidth / 2) + "px";
        this.two.style.height = (baseHeight * this.hSplitterShift - JsSplitter.splitterWidth / 2) + "px";
        this.hSplitter.style.top = (baseHeight * this.hSplitterShift - JsSplitter.splitterWidth / 2) + "px";
        this.four.style.width = (baseWidth * this.vSplitterShift - JsSplitter.splitterWidth / 2) + "px";
        this.four.style.height = (baseHeight * (1 - this.hSplitterShift) - JsSplitter.splitterWidth / 2) + "px";
        this.three.style.width = (baseWidth * (1 - this.vSplitterShift) - JsSplitter.splitterWidth / 2) + "px";

        this.three.style.height = (baseHeight * (1 - this.hSplitterShift) - JsSplitter.splitterWidth / 2) + "px";
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
    JsSplitter.SplittedArea.prototype.build = function() {
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
        this.draw();
    };

    JsSplitter.SplittedArea.NW = 1;
    JsSplitter.SplittedArea.NE = 2;
    JsSplitter.SplittedArea.SE = 3;
    JsSplitter.SplittedArea.SW = 4;

    JsSplitter.H = 1;
    JsSplitter.V = 2;
})();



