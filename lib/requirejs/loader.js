
//NOTE: This config must be duplicated in app.build.js...
requirejs.config({
    baseUrl: "./src",
    shim: {
        /* If you wanted to shim anything, just include it on your web page.
           Way less hassle than using RequireJS.  Or, use the shim! plugin. */
    },
    paths: {
        "css": "_requirejs/css",
        "shim": "_requirejs/shim",
        "sjs": "_requirejs/sjs"
    },
    //Some apps take longer to load, use a reasonable amount of time.
    waitSeconds: 120
});

require(["sjs!main"], function() {
    //Just load up main now that we've configured paths
});
