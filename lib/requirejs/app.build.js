({
    appDir: "./",
    //Even though we're not in a src folder, and this param is named baseUrl,
    //the url will still be requested as /src
    baseUrl: "./",
    //We tell node to output to a directory other than the last build, in case
    //it fails
    dir: "../build.new",
    //Comment out the optimize line if you want
    //the code minified by UglifyJS (or set to "uglify")
    optimize: "none",
    optimizeCss: 'standard',

    keepBuildDir: true,

    //onBuildWrite: function(moduleName, path, contents) {
    //    //Ensure that we replace cs! dependencies with plain dependencies.
    //    return contents.replace(/"cs!/g, '"');
    //},

    shim: {
        'jquery': {
            deps: [],
            exports: '$'
        },
        'jquery.ui': {
        	deps: ['jquery','css!jquery.ui.theme/jquery-ui-custom'],
        	exports: '$.ui'
        }
    },

    paths: {
        "jquery": "../../jsProject/lib/jquery-1.8.2.min",
        "jquery.ui": "../../jsProject/lib/plugins/jquery.ui/jquery-ui-1.9.1.min",
        "lib": "../../jsProject/lib",
        "cs": "../../jsProject/lib/cs",
        "css": "../../jsProject/lib/css",
        "coffee-script": "../../jsProject/lib/coffee-script",
    },

    modules: [
        {
            name: "loader"
        }
    ],

    stubModules: [ "coffee-script", "cs", "css" ]
})
