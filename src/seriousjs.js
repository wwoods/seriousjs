var self = this;
var pegJs = require('../lib/peg-0.7.0').PEG;
var fs = require('fs');
var module = require('module');
var path = require('path');
var util = require('util');
var vm = require('vm');
var sjsCompiler = require('./compiler/compiler.js');

//Options for all builds... used typically for testing and showScript = true.
var permaOptions = this.permaOptions = {};

if (typeof process !== 'undefined' 
    && process.mainModule.filename.toLowerCase().indexOf("mocha/bin") >= 0) {
  //We're in mocha
  this.permaOptions.showScriptForNonFiles = true;
}

//Plug in to require
if (require.extensions) {
  require.extensions['.sjs'] = function(module, filename) {
    var content = fs.readFileSync(filename, 'utf8');
    var script = self.compile(content, { filename: filename });
    module._compile(script, filename);
  };
}

var _parserFile = __dirname + '/grammar/_parser.js';
var _buildParser = function() {
  //Construct grammar
  var source = fs.readFileSync(__dirname + '/grammar/seriousjs.pegjs', 'utf8');
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
      var replacement = fs.readFileSync(__dirname + '/grammar/' + fname, 
          'utf8');
      source = source.replace(allText, replacement);
    }
  }

  //Write out for debugging
  fs.writeFileSync(__dirname + '/grammar/_compiled.pegjs', source, 'utf8')

  //Build the parser and compiler
  var parserSource = pegJs.buildParser(
    source,
    { output: 'source', trace: true }
  );
  fs.writeFileSync(_parserFile, parserSource, 'utf8');
  return parserSource;
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
    if (targetMtime >= mtime) {
      console.log(target + " changed; rebuilding");
      return true;
    }
  }
  return false;
};

var parserSource = null;
if (fs.existsSync(_parserFile)) {
  var mtime = fs.statSync(_parserFile).mtime;
  if (!_isNewerThan(mtime, __dirname + '/grammar')) {
    parserSource = fs.readFileSync(_parserFile, 'utf8');
  }
}
if (parserSource === null) {
  parserSource = _buildParser();
}

this.parser = eval(parserSource);
this.compile = function(text, options) {
  //Returns the legible javascript version of text.
  var tree;
  if (!options) {
    options = {};
  }

  //All text must end in a newline; however, this is a grammar limitation, and
  //we won't inflict it on users.
  if (text.charAt(text.length - 1) !== '\n') {
    text += '\n';
  }

  try {
    tree = self.parser.parse(text, { });
  }
  catch (e) {
    var header = 'Line ' + e.line + ', column ' + e.column;
    if (options.filename) {
      header += ' of ' + options.filename;
    }
    e.message = header + ': ' + e.message;
    throw e;
  }

  script = sjsCompiler.compile(tree, options);
  if (options.showScript 
      || (!options.filename && permaOptions.showScriptForNonFiles)) {
    console.log(util.inspect(tree, null, 30));
    console.log(script);
  }

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
  sandbox.module = mod = new module(options.modulename || 'eval');
  sandbox.require = req = function(path) { return module._load(path, mod, true); };
  for (var k in Object.getOwnPropertyNames(require)) {
    req[k] = require[k];
  }
  req.paths = module._nodeModulePaths(process.cwd())
  mod.filename = sandbox.__filename;
  var code = this.compile(text, options);
  var r = vm.runInContext(code, sandbox);
  if (options.isScript) {
    return r;
  }
  return sandbox;
};


this.evalFile = function(filename) {
  //Execute and run the given sjs file
  data = fs.readFileSync(filename, 'utf8');
  return this.eval(data, { filename: filename });
};

