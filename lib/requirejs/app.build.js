({
    appDir: "../",
    baseUrl: "./",
    //We tell node to output to a directory other than the last build, in case
    //it fails
    dir: "../../build.webapp.new",
    //Comment out the optimize line if you want
    //the code minified by UglifyJS (or set to "uglify")
    optimize: "uglify",
    uglify: {
        mangle: true,
        toplevel: true,
        unsafe: true
    },
    optimizeCss: 'standard',

    keepBuildDir: true,

    shim: {
        /* read loader.js about this */
    },

    paths: {
        "css": "_requirejs/css",
        "sjs": "_requirejs/sjs",
        "shared": "../shared/"
    },

    modules: [
        {
            name: "_requirejs/loader"
        }
    ],

    stubModules: [ "_requirejs/seriousjs-embed", "css", "sjs" ]
})
