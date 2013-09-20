
/**
  *SeriousJS - A simple syntax for a complicated world
  */

var self = this;
var fs = require('fs');
var mmodule = require('module');
var path = require('path');
var sourceMap = require('source-map');
var sourceMapSupport = require('source-map-support');
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

//Hack for sourceMapSupport... put a copy of prepareStackTrace on the module
//since there is some serious voodoo involved between the version of Error in
//sourceMapSupport and the version used in our virtual machines.
var oldErrorPrepare = Error.prepareStackTrace;
sourceMapSupport.install({
    retrieveSourceMap: function(source) {
      var map = sjsCompiler.cachedSourceMaps[source];
      if (map) {
        var url = source;
        if (url === "eval") {
          url = "/" + url;
        }
        return { url: url, map: map };
      }
      return null;
    }
});
sourceMapSupport.prepareStackTrace = Error.prepareStackTrace;
Error.prepareStackTrace = oldErrorPrepare;

//Plug in to require
if (require.extensions) {
  require.extensions['.sjs'] = function(module, filename) {
    var content = fs.readFileSync(filename, 'utf8');
    var compiled = self.compile(content, { filename: filename });
    module.paths.push(path.join(__dirname, '..'));
    //Ensure the module is using our require statement
    module.require = _getSjsRequire(module);
    module._compile(compiled.js, filename);
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

var _getSjsRequire = function(mod) {
  //Get a require() function for the given module.  Also used in sjsRepl.sjs.
  var req = function(path) {
    if (path === "seriousjs") {
      //Cheap hack, but it works.  If we're importing seriousjs from a module
      //compiled with seriousjs, we probably want to use the same version.
      return self;
    }
    else if (path === "source-map-support") {
      //We inject this module into our compiled code, so we should not require
      //client applications to also have it installed.  Just use our version.
      return sourceMapSupport;
    }
    return mmodule._load(path, mod, true);
  };
  for (var k in Object.getOwnPropertyNames(require)) {
    req[k] = require[k];
  }
  req.paths = mod.paths;
  return req;
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
//Exposed for tests and requireJs file manipulations
this._getEmbeddedFile = _getEmbeddedFile;

var _parserSandbox = vm.Script.createContext();
this.parser = vm.runInContext(parserSource, _parserSandbox, _parserFile);
this.compile = function(text, options) {
  //Returns the legible javascript version of text.
  var realOpts = { sourceMap: sourceMap };
  if (options) {
    for (var k in options) {
      realOpts[k] = options[k];
    }
  }
  options = realOpts;
  if (!options.filename && permaOptions.showScriptAfterTest) {
    options.debugTreeCallback = function(tree) {
      self.testAddCompiledScript(util.inspect(tree, null, 30));
    };
    options.debugCallback = function(script) {
      self.testAddCompiledScript(script);
    };
  }
  var result;
  try {
    result = sjsCompiler.compile(self.parser, text, options);
  }
  catch (e) {
    if (options.filename && e.message.indexOf(options.filename) < 0) {
      e.message = options.filename + ": " + e.message;
    }
    throw e;
  }
  return result;
};


this.eval = function(text, options) {
  //Execute and run the module for NodeJS.
  if (!options) {
    options = {};
  }
  var sandbox, mod, req;
  var initSandbox = true;
  if (options.sandbox) {
    sandbox = options.sandbox;
    if (sandbox.hasOwnProperty('require')) {
      //Already initialized sandbox
      initSandbox = false;
    }
  }
  else {
    sandbox = vm.Script.createContext();
  }
  if (initSandbox) {
    sandbox.__filename = options.filename || 'eval';
    sandbox.__dirname = path.dirname(sandbox.__filename);
    sandbox.module = mod = new mmodule(path.basename(sandbox.__filename));
    mod.paths = mmodule._nodeModulePaths(process.cwd());
    sandbox.require = _getSjsRequire(mod);
    //Copy over other globals
    sandbox.console = console;
    sandbox.global = global;
    sandbox.process = process;
    sandbox.setTimeout = setTimeout;
    sandbox.clearTimeout = clearTimeout;
    sandbox.setInterval = setInterval;
    sandbox.clearInterval = clearInterval;
    mod.filename = sandbox.__filename;
  }
  var code = this.compile(text, options);
  var r = vm.runInContext(code.js, sandbox, sandbox.__filename);
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


this.requireJs = function() { return require('./src/binUtil/requireJsUtil'); };
