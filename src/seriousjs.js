var self = this;
var pegJs = require('../lib/peg-0.7.0').PEG;
var fs = require('fs');
var util = require('util');
var sjsUtil = require('./util');

//Plug in to require
if (require.extensions) {
  require.extensions['.sjs'] = function(module, filename) {
    var content = fs.readFileSync(filename, 'utf8');
    return self.compile(content, filename);
  };
}

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
    console.log("Replacing " + allText);
    var replacement = fs.readFileSync(__dirname + '/grammar/' + fname, 'utf8');
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
fs.writeFileSync(__dirname + '/grammar/_parser.js', parserSource, 'utf8');
this.parser = eval(parserSource);
this.compile = function(text, filename) {
  //Returns the legible javascript version of text.
  var tree;
  
  //All text must end in a newline; however, this is a grammar limitation, and
  //we won't inflict it on users.
  if (text.charAt(text.length - 1) !== '\n') {
    text += '\n';
  }
  
  try {
    tree = self.parser.parse(text);
  }
  catch (e) {
    var header = 'Line ' + e.line + ', column ' + e.column;
    if (filename) {
      header += ' of ' + filename;
    }
    e.message = header + ': ' + e.message;
    throw e;
  }
  
  sjsUtil.cleanupTree(tree);
  console.log(util.inspect(tree, false, 30));
  return "console.log('COMPILED');";
};
