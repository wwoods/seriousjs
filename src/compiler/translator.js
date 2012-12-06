
this.Translator = (function() {
  //All ops get three args - the translator, the node, and the writer
  var binary = function(e, n, w) {
    e.translate(n.left);
    w.write(" " + n.op + " ");
    e.translate(n.right);
  };
  var opTable = {
    "->": function(e, n, w) {
          var c = w.startClosure();
          w.write("function(");
          w.startArgs();
          e.translate(n.parms, { separator: ',' });
          w.endArgs();
          w.write(") {");
          w.write(c);
          e.translate(n.body, { isReturnClosure: true });
          w.write("}");
          w.endClosure();
        },
     "atom": function(e, n, w) {
          e.translate(n.atom);
          e.translate(n.chain, { separator: '' });
        },
     "call": function(e, n, w) {
          w.write('(');
          e.translate(n.args, { separator: ',' });
          w.write(')');
        },
     "id": function(e, n, w, options) {
          w.variable(n.id, options.isAssign);
        },
     "if": function(e, n, w) {
          w.write("if (");
          e.translate(n.condition);
          w.write(") {");
          w.indent();
          e.translate(n.then);
          w.deindent();
          w.write("}");
          if (n.else) {
            w.write(" else {");
            w.indent();
            e.translate(n.else);
            w.deindent();
            w.write("}");
          }
        },
     "member": function(e, n, w) {
          w.write(".");
          e.translate(n.id);
        },
     "return": function(e, n, w) {
          w.write("return ");
          e.translate(n.result);
        },
     "string": function(e, n, w) {
          w.write('"');
          w.write(n.chars.replace(/"/g, '\\"'));
          w.write('"');
        },
     "()": function(e, n, w) {
          w.write("(");
          e.translate(n.expr);
          w.write(")");
        },
     "+": binary,
     "-": binary,
     "*": binary,
     "/": binary,
     "<=": binary,
     ">=": binary,
     ">": binary,
     "<": binary,
     "==": function(e, n, w) {
          e.translate(n.left);
          w.write(" === ");
          e.translate(n.right);
        },
     "=": function(e, n, w) {
          e.translate(n.left, { isAssign: true });
          w.write(" = ");
          e.translate(n.right);
        },
     "+=": binary,
     "-=": binary,
     "*=": binary,
     "/=": binary,
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
    if (options.separator != null) {
      separator = options.separator;
    }
    
    if (Array.isArray(node)) {
      for (var i = 0, m = node.length; i < m; i++) {
        if (i === m - 1 && options.isReturnClosure) {
          if (node[i].op !== 'return') {
            self.writer.goToLine(node[i].line);
            self.writer.write("return ");
          }
        }
        self.translate(node[i], options);
        if (i < m - 1) {
          self.writer.write(separator);
        }
      }
    }
    else if (typeof node === "object" && node.tree) {
      self.translate(node.tree, { isModule: true });
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
      op(self, node, self.writer, options);
    }
    else if (typeof node === "number") {
      self.writer.write(node);
    }
  };
  
  return Translator;
})();
