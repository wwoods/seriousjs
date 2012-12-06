
var self = this;
var util = require('util');
var Translator = require('./translator.js').Translator
var Writer = require('./writer.js').Writer;

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


this.compile = function(tree) {
  self.cleanupTree(tree);
  console.log(util.inspect(tree, false, 30));
  
  var writer = new Writer();
  var translator = new Translator(writer);
  
  translator.translate(tree);
  
  var script = writer.getOutput();
  
  console.log("SCRIPT:");
  console.log(script);
  
  return script;
};
