
this.Translator = (function() {
  //All ops get three args - the translator, the node, and the writer
  var opTable = {
    "->": function(e, n, w) {
          var c = w.startClosure();
          w.write("function(");
          w.startArgs();
          e.translate(n.parms);
          w.endArgs();
          w.write(") {");
          w.write(c);
          e.translate(n.body, { isReturnClosure: true });
          w.write("}");
          w.endClosure();
        },
     "id": function(e, n, w) {
          w.variable(n.id);
        },
     "+": function(e, n, w) {
          e.translate(n.left);
          w.write("+");
          e.translate(n.right);
        },
  };

  function Translator(writer) {
    this.writer = writer;
  }
  
  Translator.prototype.translate = function(node, options) {
    if (!options) {
      options = {};
    }
  
    var self = this;
    var separator = ';';
    if (options.separator) {
      separator = options.separator;
    }
    
    if (Array.isArray(node)) {
      for (var i = 0, m = node.length; i < m; i++) {
        if (i === m - 1 && options.isReturnClosure) {
          if (node[i].op !== 'return') {
            self.writer.write("return ");
          }
        }
        self.translate(node[i]);
        if (i < m - 1) {
          self.writer.write(separator);
        }
      }
    }
    else if (typeof node === "object" && node.tree) {
      self.translate(node.tree);
    }
    else if (typeof node === "object") {
      if (node.line) {
        self.writer.goToLine(node.line);
      }
      else if (node.state) {
        self.writer.goToLine(node.state.line);
      }
    
      var op = opTable[node['op']];
      if (op === undefined) {
        throw "Unrecognized op: " + node['op'];
      }
      op(self, node, self.writer);
    }
    else if (typeof node === "number") {
      self.writer.write(node);
    }
  };
  
  return Translator;
})();
