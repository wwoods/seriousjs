var self = this;
var pegJs = require('./peg-0.7.0.js');
var fs = require('fs');

//Plug in to require
if (require.extensions) {
  require.extensions['.sjs'] = function(module, filename) {
    var content = fs.readFileSync(filename, 'utf8');
    return self.compile(content);
  };
}

//Construct grammar
var source = fs.readFileSync(__dirname + '/grammar/seriousjs.pegjs', 'utf8');
var re = /##([^\s]+)/g;
var m;
while ((m = re.exec(source)) !== null) {
  var allText = m[0];
  var fname = m[1];
  var replacement = fs.readFileSync(__dirname + '/grammar/' + fname, 'utf8');
  source = source.replace(allText, replacement);
} 

//Write out for debugging
fs.writeFileSync(__dirname + '/grammar/_compiled.pegjs', source, 'utf8')

//Build the parser and compiler
this.parser = pegJs.buildParser(source, { trackLineAndColumn: true });
this.compile = function(text) {
  //Returns the legible javascript version of text.
  var result;
  try {
    result = self.parser.parse(text);
  }
  catch (e) {
    e.message = 'Line ' + e.line + ', column ' + e.column + ': ' + e.message;
    throw e;
  }
};

this.eval = function(text) {
  var code = this.compile(text);
  eval(code);
};
