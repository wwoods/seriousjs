
//NOTE: This config must be duplicated in app.build.js...
requirejs.config({
    baseUrl: "./src",
    shim: {
        /* If you wanted to shim anything, just include it on your web page.
           Way less hassle than using RequireJS. */
    },
    paths: {
        "sjs": "_requirejs/sjs"
    }
});

require(["sjs!main"], function() {
    //Just load up main now that we've configured paths
});
