
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
          if (n.doc) {
            w.write("(function() {var __doc__ = ");
            w.newline();
            e.translate(n.doc);
            w.write(";    var __inner__ = ");
          }
          w.write("function(");
          w.startArgs();
          e.translate(n.parms, { separator: ',' });
          w.endArgs();
          w.write(") {");
          w.write(c);
          e.translate(n.body, { isReturnClosure: true });
          w.write("}");
          w.endClosure();
          if (n.doc) {
            w.write("; __inner__.__doc__ = __doc__; ");
            w.write("return __inner__; })()");
          }
        },
     "arrayMember": function(e, n, w) {
          w.write("[");
          e.translate(n.expr);
          w.write("]");
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
     "dict": function(e, n, w) {
          if (n.elements.length > 0) {
            w.goToNode(n.elements[0]);
          }
          w.write("{");
          e.translate(n.elements, { separator: ',' });
          w.write("}");
        },
     "dictAssign": function(e, n, w) {
          //n has keys, mod, and right.
          w.write("(");
          var r = w.tmpVar(true);
          w.write("=");
          if (n.mod) {
            var f = "dictCheckExact";
            if (n.mod === "<") {
              f = "dictCheckRequired";
            }
            w.usesFeature(f);
            w.write("__" + f + "({");
            for (var i = 0, m = n.keys.length; i < m; i++) {
              if (i !== 0) {
                w.write(",");
              }
              w.write(n.keys[i].id + ':1');
            }
            w.write("},");
            e.translate(n.right);
            w.write(")");
          }
          else {
            e.translate(n.right);
          }
          for (var i = 0, m = n.keys.length; i < m; i++) {
            w.write(",");
            w.variable(n.keys[i].id, true);
            w.write("=");
            w.write(r + "." + n.keys[i].id);
          }
          w.write("," + r);
          w.write(")");
          w.tmpVarRelease(r);
        },
     "dictAssignArgs": function(e, n, w) {
          // A dict assignment from arguments...
          var r = w.tmpVar();
          n.assign.right = { op: "id", id: r };
          w.afterClosure(function() {
            e.translate(n.assign);
          });
        },
     "exports": function(e, n, w) {
          for (var i = 0, m = n.exports.length; i < m; i++) {
            w.export(n.exports[i].id);
          }
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
            w.goToNode(n.else);
            w.write("else {");
            w.indent();
            e.translate(n.else);
            w.deindent();
            w.write("}");
          }
        },
     "keyValue": function(e, n, w) {
          e.translate(n.key);
          w.write(": ");
          e.translate(n.value);
        },
     "list": function(e, n, w) {
          w.write("[");
          e.translate(n.elements, { separator: ',' });
          w.write("]");
        },
     "member": function(e, n, w) {
          w.write(".");
          e.translate(n.id);
        },
     "number": function(e, n, w) {
          w.write(n.num);
        },
     "return": function(e, n, w) {
          w.write("return ");
          e.translate(n.result);
        },
     "require": function(e, n, w) {
          e.translate(n.defs);
        },
     "require_import": function(e, n, w) {
          w.variable(n.as, true);
          w.write(' = require("');
          w.write(n.from);
          w.write('")');
        },
     "string": function(e, n, w) {
          w.write('"');
          var c = n.chars;
          //Backslash replacements done in string methods in utilMethods.js
          c = c.replace(/"/g, '\\"')
              .replace(/\n/g, '\\n\\\n');
          w.write(c);
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

  function Translator(writer, options) {
    this.writer = writer;
    this.options = options;
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
    
    var w = self.writer;
    
    if (Array.isArray(node)) {
      for (var i = 0, m = node.length; i < m; i++) {
        if (i === m - 1 && options.isReturnClosure) {
          if (node[i].op !== 'return') {
            w.goToNode(node[i]);
            w.write("return ");
          }
        }
        self.translate(node[i], options);
        if (i < m - 1) {
          w.write(separator);
        }
      }
    }
    else if (typeof node === "object" && node.tree) {
      var treeOptions = { isModule: true };
      self.translate(node.tree, treeOptions);
    }
    else if (typeof node === "object") {
      w.goToNode(node);
      var op = opTable[node['op']];
      if (op === undefined) {
        throw "Unrecognized op: " + node['op'];
      }
      op(self, node, w, options);
    }
    else if (typeof node === "number") {
      w.write(node);
    }
  };
  
  return Translator;
})();
