(function() {

function setup() {
    var sjsSide = $('.interpreter .seriousjs');
    var jsSide = $('.interpreter .javascript');
    var lastVal = sjsSide.val();
    var showErrorTimer = null;
    sjsSide.bind('keyup', function(e) {
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
    });
}

$(function() {
    setup();
});

})();