(function () {
    window._ = function(id) {
        var result = document.getElementById(id);
        if(! result) {
            result = document.getElementsByClassName(id)[0];
        }
        if(! result) {
            throw "Nothing found for " + id;
        }

        return result;
    };

    window.JsSplitter = {
        splitterWidth : 8,
        vSplitterColor : "#000000",
        hSplitterColor : "#000000"
        

    };
    JsSplitter.SplittedArea = function(/**Div*/ base, vShift, hShift, one, two, three, four) {
        this.base = base;
        this.one = one;
        this.two = two;
        this.three = three;
        this.four = four;
        this.vShift = vShift;
        this.hShift = hShift;

        for(var i = 3; i < arguments.length; i++) {
            var tile = arguments[i];

            if (tile && tile.parentNode && tile.parentNode.children) {
                tile.parentNode.removeChild(tile);
            }
        }

        this.draw =  function() {
            var baseWidth = this.base.clientWidth;
            var baseHeight = this.base.clientHeight;

            this.one.style.width = (baseWidth * this.vShift - JsSplitter.splitterWidth/2) + "px";
            this.one.style.height = (baseHeight * this.hShift - JsSplitter.splitterWidth/2) + "px";
            this.vSplitter.style.left = (baseWidth * this.vShift - JsSplitter.splitterWidth/2) + "px";
            this.two.style.width = (baseWidth * (1 - this.vShift)- JsSplitter.splitterWidth/2) + "px";
            this.two.style.height = (baseHeight * this.hShift - JsSplitter.splitterWidth/2) + "px";
            this.hSplitter.style.top = (baseHeight * this.hShift - JsSplitter.splitterWidth/2) + "px";
            this.four.style.width = (baseWidth * this.vShift - JsSplitter.splitterWidth/2) + "px";
            this.four.style.height = (baseHeight * (1 - this.hShift) - JsSplitter.splitterWidth/2) + "px";
            this.three.style.width = (baseWidth * (1 - this.vShift) - JsSplitter.splitterWidth/2) + "px";
            this.three.style.height = (baseHeight * (1 - this.hShift) - JsSplitter.splitterWidth/2) + "px";

            for(var i = 0; i < this._children.length; i++) {
                 this._children[i].draw();
            }
        };
        this._children = [];
        this.addSubArea = function(sector, /**JsSplitter.SplittedArea*/ childArea){
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
        this.init = function() {
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


                this.vSplitter = vSplitter;
                this.hSplitter = hSplitter;

                this.base.appendChild(this.one);
                this.base.appendChild(vSplitter);
                this.base.appendChild(this.two);
                this.base.appendChild(hSplitter);
                this.base.appendChild(this.four);
                this.base.appendChild(this.three);

            }
        }

        this.init();
    };
    JsSplitter.SplittedArea.NW = 1;
    JsSplitter.SplittedArea.NE = 2;
    JsSplitter.SplittedArea.SE = 3;
    JsSplitter.SplittedArea.SW = 4;
})();



