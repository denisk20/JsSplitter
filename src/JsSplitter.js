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
    JsSplitter.splitArea = function(/**Div*/ base, vShift, hShift, one, two, three, four) {
        this.base = base;
        this.vShift = vShift;
        this.hShift = hShift;
        for(var i = 3; i < arguments.length; i++) {
            var tile = arguments[i];

            if (tile && tile.parentNode && tile.parentNode.children) {
                tile.parentNode.removeChild(tile);
            }
        }
        //    ___
        //   |_|_|
        //  |_|_|                                                          
        if(one && two && three && four) {
            one.style.position = "absolute";
            one.style.left = "0";
            one.style.top = "0";
            base.appendChild(one);
            var vSplitter = document.createElement("div");

            vSplitter.style.position = "absolute";
            vSplitter.style.top = "0";
            vSplitter.style.height = "100%";
            vSplitter.style.width = this.splitterWidth + "px";
            vSplitter.style.backgroundColor = this.vSplitterColor;
            base.appendChild(vSplitter);
            two.style.position = "absolute";

            two.style.right = "0";
            two.style.top = "0";
            base.appendChild(two);
            var hSplitter = document.createElement("div");

            hSplitter.style.position = "absolute";
            hSplitter.style.left = "0";
            hSplitter.style.width = "100%";
            hSplitter.style.height = this.splitterWidth + "px";
            hSplitter.style.backgroundColor = this.hSplitterColor;
            base.appendChild(hSplitter);
            four.style.position = "absolute";

            four.style.left = "0";
            four.style.bottom = "0";
            base.appendChild(four);

            three.style.position = "absolute";


            three.style.right = "0";
            three.style.bottom = "0";
            base.appendChild(three);

            this.one = one;
            this.two = two;
            this.three = three;
            this.four = four;
            this.vSplitter = vSplitter;
            this.hSplitter = hSplitter;

            this.resize();
        }
    };
    JsSplitter.resize = function() {
        var baseWidth = this.base.clientWidth;
        var baseHeight = this.base.clientHeight;

        this.one.style.width = (baseWidth * this.vShift - this.splitterWidth/2) + "px";
        this.one.style.height = (baseHeight * this.hShift - this.splitterWidth/2) + "px";
        this.vSplitter.style.left = (baseWidth * this.vShift - this.splitterWidth/2) + "px";
        this.two.style.width = (baseWidth * (1 - this.vShift)- this.splitterWidth/2) + "px";
        this.two.style.height = (baseHeight * this.hShift - this.splitterWidth/2) + "px";
        this.hSplitter.style.top = (baseHeight * this.hShift - this.splitterWidth/2) + "px";
        this.four.style.width = (baseWidth * this.vShift - this.splitterWidth/2) + "px";
        this.four.style.height = (baseHeight * (1 - this.hShift) - this.splitterWidth/2) + "px";
        this.three.style.width = (baseWidth * (1 - this.vShift) - this.splitterWidth/2) + "px";
        this.three.style.height = (baseHeight * (1 - this.hShift) - this.splitterWidth/2) + "px";

    };
})();



