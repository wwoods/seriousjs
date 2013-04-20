(function() {

function setup() {
    var sjsSide = $('.interpreter .seriousjs');
    var jsSide = $('.interpreter .javascript');
    var lastVal = "";
    var showErrorTimer = null;
    sjsSide.bind('keyup', function(e) {
        compileScript();
        if (e.which === 13 && (e.ctrlKey || e.metaKey)) {
            runScript();
        }
    });

    function compileScript() {
        showErrorTimer && clearTimeout(showErrorTimer);
        var newVal = sjsSide.val();
        if (newVal !== lastVal) {
            lastVal = newVal;
            try {
                jsSide.val(seriousjs.compile(lastVal));
            }
            catch (e) {
                var text = "Error: " + e + "\n\n" + e.stack;
                showErrorTimer = setTimeout(
                    function() { jsSide.val(text); },
                    1000
                );
            }
        }
    }

    function runScript() {
        try {
            jsSide.val(seriousjs.compile(lastVal));
            console.clear();
            eval(jsSide.val());
        }
        catch (e) {
            //Just wait for the window to update
        }
    }

    var console = {
        _dom: $('<div class="results"></div>')
                .appendTo(jsSide.parent())
                .bind("click", function() { console._dom.hide(); })
                .hide(),
        clear: function() {
            //Clear and show console
            console._dom.empty().append(
                    '<div class="results-header">Console Output</div>');
            console._dom.show();
        },
        log: function(msg) {
            console._add("> " + msg);
        },
        _add: function(obj) {
            if (!(obj instanceof $)) {
                obj = $('<span></span>').html(obj);
            }
            console._dom.append($('<div></div>').append(obj));
            console._dom.show();
        }
    };

    $('.interpreter .runJs').bind('click', runScript);
    //Figure out the first step, too
    compileScript();
}

$(function() {
    setup();
});

})();