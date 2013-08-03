(function() {

var realConsole = console;

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

    var compileTimer = null;
    function compileScript(immediateError) {
        clearTimeout(compileTimer);
        if (immediateError) {
            _compileScript(true);
        }
        else {
            compileTimer = setTimeout(function() { _compileScript(); }, 200);
        }
    }

    function _compileScript(immediateError) {
        var newVal = sjsSide.val();
        if (newVal !== lastVal) {
            lastVal = newVal;
            showErrorTimer && clearTimeout(showErrorTimer);

            try {
                jsSide.val(seriousjs.compile(lastVal).js);
            }
            catch (e) {
                var text = "Error: " + e + "\n\n" + e.stack;
                if (immediateError) {
                    jsSide.val(text);
                }
                else {
                    showErrorTimer = setTimeout(
                        function() { jsSide.val(text); },
                        100
                    );
                }
            }
        }
    }

    function runScript() {
        try {
            compileScript(true);
            console.clear();
            eval(jsSide.val());
        }
        catch (e) {
            //Just wait for the window to update
            console.error(e);
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
        error: function(e) {
            var errorDom = $('<div class="results-error"></div>')
            errorDom.append(e.stack);
            console._add(errorDom);
            realConsole.error(e);
        },
        log: function(msg) {
            console._add("> " + msg);
            realConsole.log(msg);
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