
var allFeatures = {
  dictCheckExact: ""
      + "__dictCheckExact=function(spec,dict){"
      + " var a=0,b=0;"
      + " for(var k in dict) {"
      + "  if(!(k in spec)) {"
      + "   throw new Error('Unexpected key: ' + k);"
      + "  }"
      + "  a+=1;"
      + " }"
      + " for(var k in spec) {"
      + "  b+=1;"
      + " }"
      + " if (a !== b) {"
      + "  for(var k in spec) {"
      + "   if(!(k in dict)) {"
      + "    throw new Error('Missing key: ' + k);" 
      + "   }"
      + "  }"
      + " }"
      + " return dict;"
      + "}",
  dictCheckRequired: "__dictCheckRequired=function(spec,dict){"
      + " for(var k in spec) {"
      + "  if(!(k in dict)) {"
      + "   throw new Error('Missing key: ' + k);"
      + "  }"
      + " }"
      + "return dict;"
      + "}",
  extends: ""
      + "__extends = function(child, parent) {"
      + " for(var key in parent) {"
      + "  if(__hasProp.call(parent,key)){"
      + "   child[key] = parent[key];"
      + "  }"
      + " }"
      + " function ctor() {"
      + "  this.constructor = child;"
      + " }"
      + " ctor.prototype = parent.prototype;"
      + " child.prototype = new ctor();"
      + " child.__super__ = parent.prototype;"
      + " return child;"
      + "}", 
  hasProp: "__hasProp = {}.hasOwnProperty"
  };
  
var featureDependencies = {
  extends: [ "hasProp" ],
  };
  
function featureDump(feature, topClosure) {
  //Dump the features necessary to support feature into topClosure
  topClosure.features[feature] = true;
  var deps = featureDependencies[feature];
  if (deps !== undefined) {
    for (var i = 0, m = deps.length; i < m; i++) {
      featureDump(deps[i], topClosure);
    }
  }
}

var Closure;
this.Closure = Closure = (function() {
  function Closure(props) {
    this.vars = {};
    this.funcArgs = {};
    this.tmpVars = {};
    this.exports = null;
    this.features = {};
    this.afterStart = [];
    this.props = props || {};
  }
  
  Closure.prototype.getNamedInstanceVariable = function() {
    this.props.usesNamedThis = true;
    return "__this";
  };
  
  Closure.prototype.newTemp = function() {
    var c = 0;
    for (var k in this.tmpVars) {
      c += 1;
      if (this.tmpVars[k] === 0) {
        this.tmpVars[k] = 1;
        return k;
      }
    }
    var id = '__t' + c;
    this.tmpVars[id] = 1;
    return id;
  };
  
  Closure.prototype.toString = function() {
    var r = '';
    var emitted = {};
    if (this.props.usesNamedThis) {
      this.vars['__this'] = true;
    }
    for (var v in this.vars) {
      if (v in this.funcArgs) {
        continue;
      }
      if (r === '') {
        r += 'var ';
      }
      else {
        r += ',';
      }
      r += v;
    }
    for (var v in this.features) {
      if (r === '') {
        r += 'var ';
      }
      else {
        r += ',';
      }
      r += allFeatures[v];
    }
    if (r !== '') {
      r += ';';
    }
    if (this.props.usesNamedThis) {
      r += '__this=this;';
    }
    return r;
  };
  
  return Closure;
})();

this.Writer = (function() {
  function Writer() {
    this._indent = -1; //incremented to 0 at startClosure
    this._output = [];
    this._closures = [];
    this._line = 1;
    this._isInArgs = false;
    this._redirects = [];
    
    var c = this.startClosure({ isModule: true });
    this._output.push(c);
  }
  
  Writer.prototype.getOutput = function() {
    var output = [];
    try {
      for (var i = 0, m = this._output.length; i < m; i++) {
        output.push(this._output[i].toString());
      }
    }
    catch (e) {
      console.log("Before error: " + output.join(""));
      throw e;
    }
    return output.join("");
  };
  
  Writer.prototype.addClosureNode = function(e, n) {
    getClosure().onEntryNodes.push([ e, n ]);
  };
  
  Writer.prototype.indent = function() {
    this._indent += 1;
  };
  
  Writer.prototype.deindent = function() {
    this._indent -= 1;
  };
  
  Writer.prototype.export = function(v) {
    var c = this._closures[this._closures.length - 1];
    if (c.exports === null) {
      c.exports = {};
    }
    c.exports[v] = true; 
  };
  
  Writer.prototype.startContinuation = function() {
    this._indent += 2;
  };
  
  Writer.prototype.endContinuation = function() {
    this._indent -= 2;
  };
  
  Writer.prototype.getClosure = function(spec) {
    if (!spec) {
      return this._closures[this._closures.length - 1];
    }
    
    for (var i = this._closures.length - 1; i >= 0; --i) {
      var c = this._closures[i];
      if (this._closureMatch(c, spec)) {
        return c;
      }
    }
    return null;
  };
  
  Writer.prototype._closureMatch = function(c, spec) {
    if (spec.isClass) {
      if (!c.props.className) {
        return false;
      }
    }
    if (spec.isClassMethod) {
      if (!c.props.isClassMethod) {
        return false;
      }
    }
    return true;
  };
  
  Writer.prototype.startClosure = function(props) {
    //Returns the created Closure object; hasn't pushed it to output yet
    var c = new Closure(props);
    this._closures.push(c);
    this._indent += 1;
    return c;
  };
  
  Writer.prototype.endClosure = function() {
    this._closures.pop();
    this._indent -= 1;
  };
  
  Writer.prototype.afterClosure = function(fn) {
    this.getClosure().afterStart.push(fn);
  };
  
  Writer.prototype.startArgs = function() {
    this._isInArgs = true;
    this._indent += 1;
  };
  
  Writer.prototype.endArgs = function() {
    this._indent -= 1;
    this._isInArgs = false;
  };
  
  Writer.prototype.isInArgs = function() {
    return this._isInArgs;
  };
  
  Writer.prototype.goToLine = function(l) {
    while (this._line < l) {
      this.newline();
    }
  };
  
  Writer.prototype.goToNode = function(node) {
    //Go to a specific node's position information
    if (node.state) {
      this._indent = node.state.indent;
    }
    
    if (node.line) {
      this.goToLine(node.line);
    }
    else if (node.state) {
      this.goToLine(node.state.line);
    }
  };
  
  Writer.prototype.getInstanceVariable = function() {
    var topC = this.getClosure();
    var methodC = this.getClosure({ isClassMethod: true });
    if (methodC === topC) {
      return "this";
    }
    else {
      return methodC.getNamedInstanceVariable();
    }
  };
  
  Writer.prototype.tmpVar = function(isAssign) {
    var c = this.getClosure();
    var id = c.newTemp();
    this.variable(id, isAssign);
    return id;
  };
  
  Writer.prototype.tmpVarRelease = function(id) {
    var c = this.getClosure();
    c.tmpVars[id] = 0;
  };
  
  Writer.prototype.usesFeature = function(f) {
    var c = this._closures[0];
    featureDump(f, c);
  };
  
  Writer.prototype.variable = function(id, isAssign) {
    var c = this.getClosure();
    if (isAssign) {
      if (!this._isInArgs) {
        c.vars[id] = true;
      }
      else {
        c.funcArgs[id] = true;
      }
      if (
          c.props.isModule
          && (
            c.exports === null && id[0] !== '_'
            || c.exports !== null && id in c.exports)
          ) {
        this.write('this.' + id + '=');
      }
    }
    this.write(id);
  };
  
  Writer.prototype._getIndent = function() {
    var r = '';
    for (var i = 0; i < this._indent; i++) {
      r += '  ';
    }
    return r;
  };
  
  Writer.prototype.newline = function() {
    this.write('\n' + this._getIndent());
    this._line += 1;
  };
  
  Writer.prototype.write = function(w) {
    if (w instanceof Closure) {
      this._output.push(w);
      for (var i = 0, m = w.afterStart.length; i < m; i++) {
        w.afterStart[i]();
      } 
      this._output.push(';');
    }
    else {
      this._output.push(w);
    }
  }
  
  return Writer;
})();