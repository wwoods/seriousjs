
/**
  *SeriousJS - A simple syntax for a complicated world
  */

var self = this;
var fs = require('fs');
var mmodule = require('module');
var path = require('path');
var util = require('util');
var vm = require('vm');
var sjsCompiler = require('./src/compiler/compiler.js');

//Options for all builds... used typically for testing
var permaOptions = this.permaOptions = {};

if (typeof process !== 'undefined' 
    && process.mainModule
    && process.mainModule.filename.toLowerCase().indexOf("mocha/bin") >= 0) {
  //We're in mocha
  this.permaOptions.showScriptAfterTest = true;
  var currentScriptLines = null;
  var lastTest = null;
  this.testAddCompiledScript = function(script) {
    //Ideally this would add to a buffer that only prints if the current test
    //fails, but that doesn't look straightforward.  So maybe later.
    console.log(script);
  };
}

//Plug in to require
if (require.extensions) {
  require.extensions['.sjs'] = function(module, filename) {
    var content = fs.readFileSync(filename, 'utf8');
    var script = self.compile(content, { filename: filename });
    module._compile(script, filename);
  };
}

var _parserFile = __dirname + '/src/grammar/_parser.js';
var _buildParser = function() {
  //Construct grammar
  var pegJs = require('./lib/peg-0.7.0').PEG;
  var source = fs.readFileSync(__dirname + '/src/grammar/seriousjs.pegjs', 
      'utf8');
  var osource = source;
  var re = /##include ([^\s]+)/g;
  var hasReplaced = true;
  while (hasReplaced) {
    var m;
    osource = source;
    hasReplaced = false;
    while ((m = re.exec(osource)) !== null) {
      hasReplaced = true;
      var allText = m[0];
      var fname = m[1];
      var replacement = fs.readFileSync(__dirname + '/src/grammar/' + fname, 
          'utf8');
      source = source.replace(allText, replacement);
    }
  }

  //Write out for debugging
  fs.writeFileSync(__dirname + '/src/grammar/_compiled.pegjs', source, 'utf8');

  //Build the parser and compiler
  var parserSource = pegJs.buildParser(
    source,
    { output: 'source', trace: true }
  );
  fs.writeFileSync(_parserFile, parserSource, 'utf8');
  return parserSource;
};

var _embeddedFile = __dirname + '/lib/seriousjs-embed.js';
this._buildEmbedded = function() {
  //Compile seriousjs-embed.js.
  var contents = [ '(function(root) {' ];
  var compileDir = __dirname + '/src/compiler';
  var addFile = function(name, fpath, useResult) {
    //For the parser, we use useResult since the file is a method that returns
    //the parser variable.
    var fc = fs.readFileSync(fpath, 'utf8');
    var req;
    var requireLines = /^var ([a-zA-Z0-9_]+)[^\n=]*=\s*require\(['"]([^'"]+)['"][^\n]+$/mg;
    while ((req = requireLines.exec(fc)) != null) {
      var nextPath = path.dirname(fpath) + "/" + req[2];
      addFile(req[1], nextPath);
    }
    fc = fc.replace(requireLines, "//require line removed");
    contents.push("var " + name + " = {};\n");
    if (useResult) {
      contents.push(name + " = ");
    }
    else {
      contents.push("(function(exports) {\n");
    }
    contents.push(fc);
    if (!useResult) {
      contents.push("}).call(" + name + "," + name + ");\n");
    }
    else {
      contents.push("\n");
    }
  };
  //Clue in the parser source from the built parser
  addFile("parser", _parserFile, true);
  addFile("compiler", compileDir + '/compiler.js');

  //Now, build our "compile" function.
  contents.push("\nfunction compile(text, options) {\n\
      return compiler.compile(parser, text, options);\n\
  }\nthis.seriousjs = { compile: compile };\n");

  contents.push("typeof define==='function' && define(function() { return this.seriousjs; });\n");
  contents.push("return this;\n");

  contents.push('}).call(this, this);');
  //Minify the result
  var realContent = contents.join('');
  var uglifyJs = require('uglify-js');
  realContent = uglifyJs.minify(realContent, { fromString: true }).code;
  fs.writeFileSync(_embeddedFile, realContent, 'utf8');
};

var _isNewerThan = function(mtime, target) {
  var stat = fs.statSync(target);
  if (stat.isDirectory()) {
    var listing = fs.readdirSync(target);
    for (var i = 0, m = listing.length; i < m; i++) {
      if (_isNewerThan(mtime, path.join(target, listing[i]))) {
        return true;
      }
    }
  }
  else if (stat.isFile() && path.basename(target)[0] !== '_') {
    var targetMtime = fs.statSync(target).mtime;
    if (targetMtime > mtime) {
      //Use > to avoid rebuilding when the SeriousJS package is installed.
      console.log(target + " changed; rebuilding");
      return true;
    }
  }
  return false;
};

/** Rebuild the parser */
var parserSource = null;
if (fs.existsSync(_parserFile)) {
  var mtime = fs.statSync(_parserFile).mtime;
  if (!_isNewerThan(mtime, __dirname + '/src/grammar')) {
    parserSource = fs.readFileSync(_parserFile, 'utf8');
  }
}
if (parserSource === null) {
  parserSource = _buildParser();
}

/** A method to get the embedded file, while rebuilding it if it is not up to
  * date.
  */
function _getEmbeddedFile() {
  var isOk = false;
  if (fs.existsSync(_embeddedFile)) {
    var mtime = fs.statSync(_embeddedFile).mtime;
    if (!_isNewerThan(mtime, __dirname + '/src/grammar')
        && !_isNewerThan(mtime, __dirname + '/src/compiler')
        && !_isNewerThan(mtime, __dirname + '/index.js')) {
      isOk = true;
    }
  }

  if (!isOk) {
    self._buildEmbedded();
  }

  return _embeddedFile;
}
//Exposed for tests
this._getEmbeddedFile = _getEmbeddedFile;

this.parser = eval(parserSource);
this.compile = function(text, options) {
  //Returns the legible javascript version of text.
  if (!options) {
    options = {};
  }
  if (!options.filename && permaOptions.showScriptAfterTest) {
    options.debugCallback = function(script, tree) {
      var lines = util.inspect(tree, null, 30) + "\n\n" + script;
      self.testAddCompiledScript(lines);
    };
  }
  var script = sjsCompiler.compile(self.parser, text, options);
  return script;
};


this.eval = function(text, options) {
  //Execute and run the module for NodeJS.
  if (!options) {
    options = {};
  }
  var sandbox = vm.Script.createContext(), mod, req;
  sandbox.__filename = options.filename || 'eval';
  sandbox.__dirname = path.dirname(sandbox.__filename);
  sandbox.module = mod = new mmodule(path.basename(sandbox.__filename));
  sandbox.require = req = function(path) {
    if (path === "seriousjs") {
      //Cheap hack, but it works.  If we're importing seriousjs from a module
      //compiled with seriousjs, we probably want to use the same version.
      return self;
    }
    return mmodule._load(path, mod, true);
  };
  for (var k in Object.getOwnPropertyNames(require)) {
    req[k] = require[k];
  }
  //Copy over other globals
  sandbox.console = console;
  sandbox.global = global;
  sandbox.process = process;
  sandbox.setTimeout = setTimeout;
  sandbox.clearTimeout = clearTimeout;
  sandbox.setInterval = setInterval;
  sandbox.clearInterval = clearInterval;
  req.paths = mmodule._nodeModulePaths(process.cwd())
  mod.paths = req.paths;
  mod.filename = sandbox.__filename;
  var code = this.compile(text, options);
  var r = vm.runInContext(code, sandbox, sandbox.__filename);
  if (options.isScript) {
    return r;
  }
  return sandbox;
};


this.evalFile = function(filename) {
  //Execute and run the given sjs file
  var data = fs.readFileSync(filename, 'utf8');
  return this.eval(data, { filename: filename });
};


this.setupRequireJs = function(app, express, webappPath, callback) {
  /** Set up a requireJs environment that supports SeriousJS at path.  Creates
    * an _requirejs subdirectory with all of the requirements.
    *
    * app - The express application to fill in the "/src" directory on.
    * express - The express module; kept separate because of dependency issues
    * webappPath - the target's "webapp" folder
    * callback - Called when the build is finished and it is time to run the
    *     server.  Note that this will NOT be called if the build fails, as
    *     process.exit(1) is called.
    **/

  var rjsUtil = require('./src/binUtil/requirejsUtil');
  var baseSource = path.join(__dirname, 'lib/requirejs');
  rjsUtil.setupProject(app, express, _getEmbeddedFile(), baseSource,
      webappPath, callback);
};
