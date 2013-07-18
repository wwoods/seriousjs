/**
 * Available via the MIT or new BSD license.
 * see: http://github.com/wwoods/seriousjs for details
 *
 * shim is different from just requiring any old javascript module because items
 * required with this plugin are forced to be loaded first.  Useful for e.g.
 * your main file.
 */

/*jslint */
/*global define, window, XMLHttpRequest, importScripts, Packages, java,
  ActiveXObject, process, require */

define(['sjs'], function (sjsPlugin) {
    'use strict';
    function getShimModule(name, srcPath) {
        //Returns a method that uses jquery to generate javascript text that
        //is the given stylesheet.
        console.log("Starting " + name);
        var m = '';
        m += 'define(function() {\n';
        m += '    //Create a static script tag to load via the browser.\n';
        m += '    var pa = document.getElementsByTagName("head")[0];\n';
        m += '    var ss = document.createElement("script");\n';
        m += '    ss.type = "text/javascript";\n';
        m += '    ss.src = "' + srcPath + '";\n';
        //m += '    pa.appendChild(ss);\n';
        m += '    pa.insertBefore(ss, pa.firstChild);\n';
        m += '    return ss;\n';
        m += '});\n';
        console.log("Loaded " + name + " as " + m);
        return m;
    }

    var SUFFIX = 'shim';
    var suffixRe = new RegExp("\\." + SUFFIX + "$");

    return {
        get: function () {
            return null;
        },

        normalize: function(name, normalize) {
            //Since .sjs files can have the same root name (without
            //extension) as other files in the project that might be loaded
            //with a different plugin, it's nice to re-write the name to
            //include the .sjs extension so that it's obvious which
            //version of the module this is
            if (/\.js$/.test(name)) {
                //RequireJS calls this method several times; if we hit this
                //condition, we've already normalized name, so don't do it
                //again.
                return name;
            }
            //Use standard normalization and append .js
            return normalize(name) + '.js';
        },

        write: function (pluginName, name, write) {
            if (buildMap.hasOwnProperty(name)) {
                var text = buildMap[name];
                if (suffixRe.test(name)) {
                    //Trim off .sjs for writing back out the module name,
                    //so that dependencies resolve correctly in the compiled
                    //version.  Note that this still includes the pluginName,
                    //so modules loaded with different plugins will still be
                    //distinct.
                    name = name.substring(0, name.length - 4);
                }
                write.asModule(pluginName + "!" + name, text);
            }
        },

        version: '0.0.1',

        load: function (name, parentRequire, load, config) {
            var path = parentRequire.toUrl(name);
            console.log("WABAM");

            if (config.isBuild) {
            }
            else {
                //Insert a script tag at the top of our page to get the browser
                //to load and execute it before anything else.
                var pa = document.getElementsByTagName("head")[0];
                var ss = document.createElement("script");
                ss.type = "text/javascript";
                ss.src = path;
                pa.insertBefore(ss, pa.firstChild);

                //Inform requireJs that it's loaded
                load.fromText("define(function() {});");
            }
        }
    };
});
