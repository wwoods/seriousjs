({
    appDir: "../",
    //Even though we're not in a src folder, and this param is named baseUrl,
    //the url will still be requested as /src
    baseUrl: "./",
    //We tell node to output to a directory other than the last build, in case
    //it fails
    dir: "../../webapp.build.new",
    //Comment out the optimize line if you want
    //the code minified by UglifyJS (or set to "uglify")
    optimize: "none",
    optimizeCss: 'standard',

    keepBuildDir: true,

    shim: {
        /* read loader.js about this */
    },

    paths: {
        "css": "_requirejs/css",
        "sjs": "_requirejs/sjs"
    },

    modules: [
        {
            name: "_requirejs/loader"
        }
    ],

    stubModules: [ "_requirejs/seriousjs-embed", "css", "sjs" ]
})
