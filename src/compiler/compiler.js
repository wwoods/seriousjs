
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

  var requires = [];
  if (options.amdModule) {
    //Pull statements out of tree.tree
    for (var i = 0, m = tree.tree.length; i < m; i++) {
      var n = tree.tree[i];
      if (n.op === "require") {
        requires.push(n);
        tree.tree.splice(i, 1);
        i -= 1;
        m -= 1;
      }
    }
  }

  var writerObj = new writer.Writer();
  var translatorObj = new translator.Translator(writerObj, options);
  translatorObj.translate(tree);
  var script = writerObj.getOutput();

  if (options.amdModule) {
    script = self._makeScriptAmd(requires, script);
  }

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
  return script;
};


this._makeScriptAmd = function(requires, script, options) {
  /** Bootstrap a script with the given requires to AMD format.  Note that we
    really shouldn't insert any newlines before script, since that would screw
    up our mapping.
    */
  var output = [ "define([" ];
  var varNames = [];
  for (var i = 0, m = requires.length; i < m; i++) {
    var reqChain = requires[i].defs;
    for (var j = 0, k = reqChain.length; j < k; j++) {
      if (varNames.length > 0) {
        output.push(",");
      }
      var fromPart = reqChain[j].from;
      if (fromPart.indexOf('!') < 0) {
        //Assume sjs loader for convenience.
        fromPart = "sjs!" + fromPart;
      }
      else if (fromPart.indexOf("js!") === 0) {
        fromPart = fromPart.slice(3);
      }
      output.push("'" + fromPart + "'");
      varNames.push(reqChain[j].as);
    }
  }
  output.push("],function(");
  output.push(varNames.join(","));
  output.push(") {var exports = {};(function(exports){");
  output.push(script);
  output.push("\n}).call(exports, exports);return exports});");
  return output.join("");
};
