
var self = this;
var translator = require('./translator.js');
var writer = require('./writer.js');

this.cleanupTree = function(tree) {
  for (var n in tree) {
    var o = tree[n];
    if (typeof o !== 'object' || o === null) {
      continue;
    }
    self.cleanupTree(o);
    if (o.op === 'atom' && o.chain.length === 0) {
      tree[n] = o.atom;
    }
  }
};


this.compile = function(parser, text, options) {
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
    tree = parser.parse(text, { });
  }
  catch (e) {
    var header = 'Line ' + e.line + ', column ' + e.column;
    if (options.filename) {
      header += ' of ' + options.filename;
    }
    e.message = header + ': ' + e.message;
    throw e;
  }

  self.cleanupTree(tree);
  if (options.showScript) {
    var lines = util.inspect(tree, null, 30) + "\n\n" + script;
    if (typeof options.showScript === "function") {
      //Probably for a test method; anyway, call the function with our debug
      //text.
      options.showScript(lines);
    }
    else {
      console.log(lines);
    }
  }
  
  var writerObj = new writer.Writer();
  var translatorObj = new translator.Translator(writerObj, options);
  
  translatorObj.translate(tree);
  
  var script = writerObj.getOutput();
  return script;
};


this.compileFull = function(parser, text, options) {
};
