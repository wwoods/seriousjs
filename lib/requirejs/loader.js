
//NOTE: This config must be duplicated in app.build.js...
requirejs.config({
    baseUrl: "./src",
    shim: {
        /* If you wanted to shim anything, just include it on your web page.
           Way less hassle than using RequireJS. */
    },
    paths: {
        "css": "_requirejs/css",
        "sjs": "_requirejs/sjs"
    },
    //Some apps take longer to load, use a reasonable amount of time.
    waitSeconds: 120
});

require(["sjs!app"], function() {
    //Just load up our app now that we've configured paths
});
