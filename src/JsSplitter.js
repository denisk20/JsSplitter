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
        splitterWidth : 3,
        vSplitterColor : "#000000",
        hSplitterColor : "#000000"
        

    };
    JsSplitter.splitArea = function(/**Div*/ base, vShift, hShift, one, two, three, four) {

        for(var i = 3; i < arguments.length; i++) {
            var tile = arguments[i];

            //todo
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
            one.style.width = (vShift - 0.5) + "%";
            one.style.height = (hShift - 0.5) + "%";
            base.appendChild(one);
            
            var vSplitter = document.createElement("div");
            vSplitter.style.position = "absolute";
            vSplitter.style.top = "0";
            //todo
            vSplitter.style.left = (vShift - 0.5) + "%";
            vSplitter.style.height = "100%";
            //todo
            vSplitter.style.width = "1%";
            vSplitter.style.backgroundColor = this.vSplitterColor;
            base.appendChild(vSplitter);
            
            two.style.position = "absolute";
            two.style.right = "0";
            two.style.top = "0";
            two.style.width = (100 - vShift - 0.5) + "%";
            two.style.height = (hShift - 0.5) + "%";
            base.appendChild(two);

            var hSplitter = document.createElement("div");
            hSplitter.style.position = "absolute";
            hSplitter.style.left = "0";
            hSplitter.style.top = (hShift - 0.5) + "%";
            hSplitter.style.width = "100%";
            hSplitter.style.height = "1%";
            hSplitter.style.backgroundColor = this.hSplitterColor;
            base.appendChild(hSplitter);

            four.style.position = "absolute";
            four.style.left = "0";
            four.style.bottom = "0";
            four.style.width = (vShift - 0.5) + "%";
            four.style.height = (100 - hShift - 0.5) + "%";
            base.appendChild(four);
            

            three.style.position = "absolute";
            three.style.right = "0";
            three.style.bottom = "0";
            three.style.width = (100 - vShift - 0.5) + "%";
            three.style.height = (100 - hShift - 0.5) + "%";
            base.appendChild(three);
        }
    };

})();



