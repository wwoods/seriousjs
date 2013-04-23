
this.Translator = (function() {
  //All ops get three args - the translator, the node, and the writer
  var binary = function(e, n, w) {
    e.translate(n.left);
    w.write(" " + n.op + " ");
    e.translate(n.right);
  };
  var addArgDefault = function(e, n, w) {
    //Assuming n has an op of "id" or "memberId", and w isInArgs(), check if
    //there is a "defaultVal" argument, and add the default
    if (n.defaultVal) {
      w.afterClosure(function() {
        w.write("if(");
        w.variable(n.id);
        w.write("===undefined){");
        w.variable(n.id);
        w.write("=");
        e.translate(n.defaultVal);
        w.write("}");
      });
    }
  };
  var opTable = {
    "->": function(e, n, w, options) {
          var nearClosure = w.getClosure();
          var isClassMethod = (options.isConstructorFor
              || nearClosure.props.className);
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
            w.write("if(!(this instanceof ");
            w.write(options.isConstructorFor);
            w.write(")");
            w.write("){");
            w.write('throw new Error("not called with new operator")');

            if (false) {
              //This chunk of code allows creating objects without the "new"
              //keyword.  Interesting, but largely unproductive.  And since so
              //many of the libraries out there don't support it, supporting it
              //at a language level feels stupid.
              var r = w.tmpVar();
              w.write("=Object.create(");
              w.write(options.isConstructorFor);
              w.write(".prototype);");
              w.write(r + ".constructor.apply(" + r + ", arguments);");
              w.write("return " + r + ";");
            }

            w.write("}");
          }
          e.translate(n.body, { isReturnClosure: true });
          w.write("}");
          w.endClosure();
          if (n.doc) {
            w.write("; __inner__.__doc__ = __inner__.help = __doc__; ");
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
            var f;
            if (n.mod === ">") {
              f = "dictCheckRequired";
            }
            else if (n.mod === "<") {
              f = "dictCheckAvailable";
            }
            else if (n.mod === "=") {
              f = "dictCheckExact";
            }
            else {
              throw new Error("Unrecognized dictAssignMod: " + n.mod);
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
          if (n.allowUndefined) {
            //Used for args, map the object to an empty object if it's null
            //or undefined
            w.write("," + r + "=(" + r + "!=undefined?" + r + ":{})");
          }
          for (var i = 0, m = n.keys.length; i < m; i++) {
            w.write(",");
            var nid;
            if (n.keys[i].op === "memberId") {
              nid = w.tmpVar();
            }
            else {
              w.variable(n.keys[i].id, true);
              nid = n.keys[i].id;
            }
            w.write("=");
            w.write(r + "." + n.keys[i].id);
            if (n.keys[i].defaultVal) {
              w.write(",");
              w.variable(nid);
              w.write("=(");
              w.variable(nid);
              w.write("!==undefined?");
              w.variable(nid);
              w.write(":");
              e.translate(n.keys[i].defaultVal);
              w.write(")");
            }
            if (n.keys[i].op === "memberId") {
              var obj = w.getInstanceVariable();
              w.write("," + obj + "." + n.keys[i].id + "=" + nid);
            }
          }
          w.write("," + r);
          w.write(")");
          w.tmpVarRelease(r);
        },
     "dictAssignArgs": function(e, n, w) {
          // A dict assignment from arguments...
          if (n.id) {
            e.translate(n.id);
            n.assign.right = n.id;
          }
          else {
            var r = w.tmpVar();
            n.assign.right = { op: "id", id: r };
          }
          //Since they're args, allow null or undefined to map to an empty
          //object.
          n.assign.allowUndefined = true;
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
          w.goToNode(n);
          if (w.isInArgs()) {
            w.variable(n.id);
            addArgDefault(e, n, w);
          }
          else if (options.isAssign) {
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
     "in": function(e, n, w) {
          w.write("(");
          e.translate(n.right);
          w.write(".indexOf(");
          e.translate(n.left);
          w.write(")>=0)");
        },
     "in_not": function(e, n, w) {
          w.write("(");
          e.translate(n.right);
          w.write(".indexOf(");
          e.translate(n.left);
          w.write(")<0)");
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
            addArgDefault(e, n, w);
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
     "memberSelf": function(e, n, w) {
          w.goToNode(n);
          w.write(w.getInstanceVariable());
        },
     "number": function(e, n, w) {
          w.write(n.num);
        },
     "of": function(e, n, w) {
          w.write("(");
          e.translate(n.left);
          w.write(" in ");
          e.translate(n.right);
          w.write(")");
        },
     "of_not": function(e, n, w) {
          w.write("!(");
          e.translate(n.left);
          w.write(" in ");
          e.translate(n.right);
          w.write(")");
        },
     "or": function(e, n, w) {
          e.translate(n.left);
          w.write(" || ");
          e.translate(n.right);
        },
     "regex": function(e, n, w) {
          w.write(n.literal);
        },
     "return": function(e, n, w) {
          w.write("return ");
          if (n.result) {
            //Otherwise, blank return statement.
            e.translate(n.result);
          }
        },
     "require": function(e, n, w) {
          e.translate(n.defs);
        },
     "require_import": function(e, n, w) {
          w.variable(n.as, true);
          w.write(' = ');
          w.write('require("');
          w.write(n.from);
          w.write('")');
          if (n.forParts !== null) {
            for (var i = 0, m = n.forParts.length; i < m; i++) {
              var forPart = n.forParts[i].id;
              w.write(", ");
              w.variable(forPart, true);
              w.write(" = ");
              w.write(n.as);
              w.write(".");
              w.variable(forPart);
            }
          }
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
          var cls = w.getClosure({ isClass: true });
          if (!cls || !cls.props.className) {
            throw new Error("Could not find class name: line "
                + (n.state && n.state.line));
          }
          var c = w.getClosure({ isClassMethod: true });
          if (!c || !c.props.methodName) {
            throw new Error("Could not find method name: line "
                + (n.state && n.state.line));
          }
          w.write(cls.props.className);
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
     "unary_negate": function(e, n, w) {
          w.write("-");
          e.translate(n.right);
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
     "while": function(e, n, w) {
          w.write("while (");
          e.translate(n.expr);
          w.write(") {");
          e.translate(n.body);
          w.write("}");
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
     "!=": function(e, n, w) {
          e.translate(n.left);
          w.write(" !== ");
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
            var cc = w.getClosure({ isClass: true });
            if (cc
                && (n.left.op === 'memberId' || n.left.op === 'id')
                && n.right.op === "->"
                ) {
              rightOptions.methodName = n.left.id;
            }
            var useFakeClosure = (c === cc && n.right.op !== "->");
            if (useFakeClosure) {
              //Since assigned ids in a class block are translated, make a fake
              //closure around the translation.
              w.startClosure();
            }
            e.translate(n.right, rightOptions);
            if (useFakeClosure) {
              w.endClosure();
            }
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
