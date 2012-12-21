
this.Translator = (function() {
  //All ops get three args - the translator, the node, and the writer
  var binary = function(e, n, w) {
    e.translate(n.left);
    w.write(" " + n.op + " ");
    e.translate(n.right);
  };
  var opTable = {
    "->": function(e, n, w, options) {
          var isClassMethod = (options.isConstructorFor 
              || options.isClassMethod);
          var c = w.startClosure({ 
              isClassMethod: isClassMethod,
              methodName: options.methodName
              });
          if (n.doc) {
            w.write("(function() {var __doc__ = ");
            w.newline();
            e.translate(n.doc);
            w.write(";    var __inner__ = ");
          }
          if (options.isConstructorFor) {
              w.write("function ");
              w.write(options.isConstructorFor);
              w.write("(");
          }
          else {
            w.write("function(");
          }
          w.startArgs();
          e.translate(n.parms, { separator: ',' });
          w.endArgs();
          w.write(") {");
          w.write(c);
          if (options.isConstructorFor) {
            //Check if we're a function invocation or not
            w.write("if(this.constructor!==");
            w.write(options.isConstructorFor);
            w.write("){");
            var r = w.tmpVar();
            w.write("=Object.create(");
            w.write(options.isConstructorFor);
            w.write(".prototype);");
            w.write(r + ".constructor.apply(" + r + ", arguments);");
            w.write("return " + r + ";}");
          }
          e.translate(n.body, { isReturnClosure: true });
          w.write("}");
          w.endClosure();
          if (n.doc) {
            w.write("; __inner__.__doc__ = __doc__; ");
            w.write("return __inner__; })()");
          }
        },
     "and": function(e, n, w) {
          e.translate(n.left);
          w.write(" && ");
          e.translate(n.right);
        },
     "arrayMember": function(e, n, w) {
          w.write("[");
          e.translate(n.expr);
          w.write("]");
        },
     "atom": function(e, n, w) {
          e.translate(n.unary);
          e.translate(n.atom);
          e.translate(n.chain, { separator: '' });
        },
     "call": function(e, n, w) {
          w.write('(');
          e.translate(n.args, { separator: ',' });
          w.write(')');
        },
     "class": function(e, n, w) {
          e.translate(n.name, { isAssign: true });
          w.write(" = ");
          var c = w.startClosure({ className: n.name.id });
          w.write("(function(");
          w.startArgs();
          w.variable("_super", true);
          w.endArgs();
          w.write(") {");
          w.write(c);
          if (n.parent) {
            w.usesFeature("extends");
            w.write("__extends(");
            e.translate(n.name);
            w.write(", _super);");
          }
          e.translate(n.body);
          if (!c.props.classConstructor) {
            var fakeConstructor = {
              op: 'keyValue',
              key: {
                  op: 'id',
                  id: 'constructor'
                  },
              value: {
                  op: '->',
                  parms: [],
                  body: []
                  },
            };
            if (n.parent) {
              fakeConstructor.value.body.push({ op: "super" });
            }
            w.write(";");
            e.translate(fakeConstructor);
          }
          w.write(";return ");
          e.translate(n.name);
          w.endClosure();
          w.write("})(");
          if (n.parent) {
            e.translate(n.parent);
          }
          else {
            w.write("Object");
          }
          w.write(")");
        },
     "dict": function(e, n, w) {
          if (n.elements.length > 0) {
            w.goToNode(n.elements[0]);
          }
          if (w.getClosure().props.className) {
            //Assigning member methods
            e.translate(n.elements, { separator: ';' });
          }
          else {
            //Normal dict work
            w.write("{");
            e.translate(n.elements, { separator: ',' });
            w.write("}");
          }
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
     "forList": function(e, n, w) {
          var r = w.tmpVar(true);
          w.write("=");
          e.translate(n.expr);
          w.write(";for(");
          var iter = w.tmpVar(true);
          w.write("=0,");
          var iterLen = w.tmpVar(true);
          w.write("=");
          w.variable(r);
          w.write(".length;");
          w.variable(iter);
          w.write("<");
          w.variable(iterLen);
          w.write(";");
          w.variable(iter);
          w.write("++){");
          e.translate(n.ids[0], { isAssign: true });
          w.write("=");
          w.variable(r);
          w.write("[");
          w.variable(iter);
          w.write("];");
          e.translate(n.body);
          w.write("}");
          w.tmpVarRelease(iter);
          w.tmpVarRelease(iterLen);
          w.tmpVarRelease(r);
        },
     "id": function(e, n, w, options) {
          if (options.isAssign) {
            var c = w.getClosure();
            if (c === w.getClosure({ isClass: true })) {
              w.write(c.props.className + '.prototype.');
              w.variable(n.id);
            }
            else {
              w.variable(n.id, true);
            }
          }
          else {
            w.variable(n.id);
          }
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
     "instanceof": function(e, n, w) {
          w.write("(");
          e.translate(n.left);
          w.write(" instanceof ");
          e.translate(n.right);
          w.write(")");
        },
     "keyValue": function(e, n, w) {
          var c = w.getClosure();
          if (c.props.className) {
            //Prototype assignment
            e.translate({ op: "=", left: n.key, right: n.value });
          }
          else {
            //Normal dict member
            e.translate(n.key);
            w.write(": ");
            e.translate(n.value);
          }
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
     "memberClass": function(e, n, w) {
          var c = w.getClosure({ isClass: true });
          w.write(c.props.className);
        },
     "memberId": function(e, n, w) {
          w.goToNode(n);
          if (w.isInArgs()) {
            w.variable(n.id);
            w.afterClosure(function() {
              w.write("this." + n.id + " = " + n.id + ";");
            });
            return;
          }
          var c = w.getClosure({ isClassMethod: true });
          if (c) {
            var v = w.getInstanceVariable();
            w.write(v + ".");
            w.write(n.id);
            return;
          }
          c = w.getClosure({ isClass: true });
          if (c) {
            w.write(c.props.className + ".");
            w.write(n.id);
            return;
          }
          throw new Error("Unexpected member identifier: line " + n.line);
        },
     "number": function(e, n, w) {
          w.write(n.num);
        },
     "or": function(e, n, w) {
          e.translate(n.left);
          w.write(" || ");
          e.translate(n.right);
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
          c = c
              .replace(/"/g, '\\"')
              .replace(/\n/g, '\\n\\\n');
          w.write(c);
          w.write('"');
        },
     "super": function(e, n, w) {
          var c = w.getClosure({ isClassMethod: true });
          if (!c || !c.props.methodName) {
            throw new Error("Could not find method name: line "
                + (n.state && n.state.line));
          }
          w.write("return ");
          w.write(w.getInstanceVariable());
          w.write(".__super__.");
          w.write(c.props.methodName);
          w.write(".apply(this, arguments);");
        },
     "ternary": function(e, n, w) {
          w.write("(");
          e.translate(n.if);
          w.write(" ? ");
          e.translate(n.then);
          w.write(" : ");
          e.translate(n.else);
          w.write(")");
        },
     "try": function(e, n, w) {
          w.write("try {");
          e.translate(n.stmt);
          w.write("}");
          w.goToNode(n.catchId);
          w.write("catch (");
          e.translate(n.catchId);
          w.write(") {");
          e.translate(n.catchCode);
          w.write("}");
        },
     "unary_new": function(e, n, w) {
          w.write("new ");
          e.translate(n.right);
        },
     "unary_not": function(e, n, w) {
          w.write("!(");
          e.translate(n.right);
          w.write(")");
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
          //Also used for keyValue when assigning to class attribute
          var c = w.getClosure();
          if (
              c.props.className
              && n.left.op === 'id' 
              && n.left.id === 'constructor'
              && n.right.op === '->'
              ) {
            c.props.classConstructor = n.right;
            e.translate(n.right, { isConstructorFor: c.props.className,
                methodName: n.left.id });
          }
          else { 
            e.translate(n.left, { isAssign: true });
            w.write(" = ");
            var rightOptions = {};
            var c = w.getClosure({ isClass: true });
            if (c
                && (n.left.op === 'memberId' || n.left.op === 'id')
                && n.right.op === "->"
                ) {
              rightOptions.methodName = n.left.id;
            }
            e.translate(n.right, rightOptions);
          }
        },
     "+=": binary,
     "-=": binary,
     "*=": binary,
     "/=": binary,
  };
  
  var badOpsForReturn = {
    forList: true,
    if: true,
    return: true,
    try: true, 
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
          if (!(node[i].op in badOpsForReturn)) {
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
