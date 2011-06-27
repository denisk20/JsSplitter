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
        hLimit: 30, //px
        vLimit: 50,  //px

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
                element["on" + type] = hanlder;
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

    JsSplitter.SplittedArea = function(/**Div*/ base, vSplitterShift, hSplitterShift, one, two, three, four) {
        this.base = base;
        this.one = one;
        this.two = two;
        this.three = three;
        this.four = four;
        this.vSplitterShift = vSplitterShift;
        this.hSplitterShift = hSplitterShift;
        this._children = [];


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
                that.currentY = event.clientY;
                JsSplitter.enableVDrag();
                JsSplitter.draggableArea = that;
                //in firefox, we have to prevent default action (dragging) for elements
                if (event.preventDefault) event.preventDefault();
            });
            EventUtil.addHandler(vSplitter, "mousedown", function(event) {
                event = EventUtil.getEvent(event);
                that.currentX = event.clientX;
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

    JsSplitter.SplittedArea.prototype.verticalDragging = function(event, minVLimit) {
        var delta = this.currentY - event.clientY;

        var upperHeightStr = this.one.style.height;
        var upperElementsHeight = parseFloat(upperHeightStr.substring(0, upperHeightStr.length - 2));
        var newUpperHeight = upperElementsHeight - delta;
        if (newUpperHeight < minVLimit) {
            return;
        }

        var bottomHeightStr = this.three.style.height;
        var bottomElementsHeight = parseFloat(bottomHeightStr.substring(0, bottomHeightStr.length - 2));
        var newBottomHeight = bottomElementsHeight + delta;
        if (newBottomHeight < minVLimit) {
            return;
        }

        this.one.style.height = newUpperHeight + "px";
        this.two.style.height = newUpperHeight + "px";
        this.three.style.height = newBottomHeight + "px";
        this.four.style.height = newBottomHeight + "px";

        var splitterPositionStr = this.hSplitter.style.top;
        var splitterPosition = parseFloat(splitterPositionStr.substring(0, splitterPositionStr.length - 2));
        var newSplitterPosition = splitterPosition - delta;

        this.hSplitter.style.top = newSplitterPosition + "px";

        this.currentY = event.clientY;

        var newHSplitterShift = this.hSplitterShift - (delta / this.base.clientHeight);
        this.hSplitterShift = newHSplitterShift;
        this.draw();
    };

    JsSplitter.SplittedArea.prototype.horizontalDragging = function(event, minHLimit) {
        var delta = this.currentX - event.clientX;

        var leftWidthStr = this.one.style.width;
        var leftElementsWidth = parseFloat(leftWidthStr.substring(0, leftWidthStr.length - 2));
        var newLeftWidth = leftElementsWidth - delta;
        if (newLeftWidth < minHLimit) {
            return;
        }

        var rightWidthStr = this.two.style.width;
        var rightElementsWidth = parseFloat(rightWidthStr.substring(0, rightWidthStr.length - 2));
        var newRightWidth = rightElementsWidth + delta;
        if (newRightWidth < minHLimit) {
            return;
        }

        this.one.style.width = newLeftWidth + "px";
        this.two.style.width = newRightWidth + "px";
        this.three.style.width = newRightWidth + "px";
        this.four.style.width = newLeftWidth + "px";

        var splitterPositionStr = this.vSplitter.style.left;
        var splitterPosition = parseFloat(splitterPositionStr.substring(0, splitterPositionStr.length - 2));
        var newSplitterPosition = splitterPosition - delta;

        this.vSplitter.style.left = newSplitterPosition + "px";

        this.currentX = event.clientX;

        var newVSplitterShift = this.vSplitterShift - (delta / this.base.clientWidth);
        this.vSplitterShift = newVSplitterShift;
        this.draw();
    };

    /**
     * This method must be called once after all splitting areas, are initialized
     * and nested into each other
     */
    JsSplitter.SplittedArea.prototype.build = function() {
        EventUtil.addHandler(this.base, "mousemove", function(event) {
            if (JsSplitter.VDRAG) {
                event = EventUtil.getEvent(event);
                JsSplitter.draggableArea.verticalDragging(event, JsSplitter.vLimit);
            }
            if (JsSplitter.HDRAG) {
                event = EventUtil.getEvent(event);
                JsSplitter.draggableArea.horizontalDragging(event, JsSplitter.hLimit);
            }
        });
        EventUtil.addHandler(this.base, "mouseup", function(event) {
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
})();



