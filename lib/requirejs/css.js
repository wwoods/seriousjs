/**
 CSS loader for require.js.  Based on the coffee-script loader.
 
 MIT license
 
 Version history:
   0.0.1 - Basic CSS inlining.  Does not support url() yet
 */

/*jslint */
define(['sjs'], function (sjs) {
    'use strict';
    function getSsModule(name, cssText) {
        //Returns a method that uses jquery to generate javascript text that
        //is the given stylesheet.
        var cssTextNew = cssText.replace(/([\\"'])/g, "\\$1")
            .replace(/\n/g, '\\n\\\n')
            ;
        var m = '';
        m += 'define(function() {\n';
        m += '    var cssText = "' + cssTextNew + '";\n';
        m += '    //Create a dynamic stylesheet with the given css text.\n';
        m += '    //Returns the new stylesheet.\n';
        m += '    //Thanks to http://www.webdeveloper.com/forum/archive/index.php/t-130717.html\n'
        m += '    var pa = document.getElementsByTagName("head")[0];\n'
        m += '    var ss = document.createElement("style");\n'
        m += '    ss.type = "text/css";\n'
        m += '    if (ss.styleSheet) ss.styleSheet.cssText = cssText; //IE\n';
        m += '    else ss.appendChild(document.createTextNode(cssText));\n';
        m += '    pa.appendChild(ss);\n';
        m += '    return ss;\n';
        m += '});\n';
        return m;
    }

    //We need to keep track of built modules to write them out to the optimized
    //output
    var buildMap = {};

    //We need to keep track of the order that CSS files are requested to be
    //sure that we preserve their ordering in the <head> section of the page
    var loadList = [];
    function loadListProcess() {
        //Take the top off of the loadList, and process it
        while (loadList.length > 0 && loadList[0].isDone) {
            var entry = loadList.shift();
            entry.load();
        }
    }

    return {
        version: '0.0.1',

        write: function(pluginName, name, write) {
            if (buildMap.hasOwnProperty(name)) {
                var text = buildMap[name];
                if (/\.css$/.test(name)) {
                    //Trim off .css for writing back out the module name,
                    //so that dependencies resolve correctly
                    name = name.substring(0, name.length - 4);
                }
                write.asModule(pluginName + "!" + name, text);
            }
        },

        normalize: function(name, normalize) {
            //Since css files can have the same name as their corresponding
            //source files, we need to re-assign modules a different name so
            //that they are treated as different modules from the scripted
            //versions
            if (/\.css$/.test(name)) {
                //Already processed
                return name;
            }
            //Use standard normalization, but append .css
            return normalize(name) + '.css';
        },

        load: function(name, parentRequire, load, config) {
            var path = parentRequire.toUrl(name);

            //If we're not in a build, we need to preserve CSS file order,
            //since it matters.  So, we keep our handler together
            var myData = {};
            if (!config.isBuild) {
                myData.name = name;
                myData.isDone = false;
                loadList.push(myData);
            }

            //RequireJS optimizes CSS files prior to JS build, so we 
            //automatically will package the optimized result without
            //any more effort.
            sjs.fetchText(path, function(text) {
                var module = getSsModule(name, text);
                if (config.isBuild) {
                    buildMap[name] = module;
                }

                //Requirejs 2.1.0 doesn't need a name specification in
                //load.fromText, just pass our module since the context
                //is already OK.
                if (config.isBuild) {
                    //Optimizer loads stuff synchronously anyway, so it's OK 
                    //to not regard the order that we retrieved our css files
                    //here
                    load.fromText(module);
                }
                else {
                    //Mark our request as done, and then process any done
                    //requests that are at the top of the queue.
                    myData.load = function() {
                        load.fromText(module);
                    };
                    myData.isDone = true;
                    loadListProcess();
                }
            });
        }
    };
});

