
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


this.compile = function(tree, options) {
  self.cleanupTree(tree);
  
  var writerObj = new writer.Writer();
  var translatorObj = new translator.Translator(writerObj, options);
  
  translatorObj.translate(tree);
  
  var script = writerObj.getOutput();
  return script;
};
