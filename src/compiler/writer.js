
var ASYNC_COUNT = "c";
var ASYNC_RETURN_VALUE = "v";
var ASYNC_RESULT_CALLBACK = "r";
var ASYNC_THIS = "s";
var ASYNC_TRIGGERED = "t";

var allFeatures = {
  async: ""
      + "__asyncCheck=function(obj,error){"
      + " if(obj." + ASYNC_TRIGGERED + "){return}"
      + " obj." + ASYNC_COUNT + "--;"
      + " if(error){"
      + "  __asyncTrigger(obj,error);"
      + " }"
      + " else if(obj." + ASYNC_COUNT + "===0){"
      + "  __asyncTrigger(obj,null,obj." + ASYNC_RETURN_VALUE + ");"
      + " }"
      + "},"
      + "__asyncTrigger=function(obj,error,result){"
      //Guard for ASYNC_TRIGGERED being false is in asyncCheck.
      + " obj." + ASYNC_TRIGGERED + "=true;"
      + " obj." + ASYNC_RESULT_CALLBACK + " && obj." + ASYNC_RESULT_CALLBACK
      +       ".call("
      +     "obj." + ASYNC_THIS + ",error,result"
      + " );"
      + "}",
  dictCheckAvailable: ""
      + "__dictCheckAvailable=function(spec,dict){"
      + " for(var k in dict){"
      + "  if(!(k in spec)) {"
      + "   throw new Error('Unexpected key: ' + k);"
      + "  }"
      + " }"
      + " return dict;"
      + "}",
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
    this._asyncCheckVar = null;

    if (this.props.isAsync) {
      //This means we also have asyncParent if we have a parent scope to
      //get variable names from.
      var varParent = this.resolveAsyncRoot();
      this._asyncDataVar = varParent.newTemp(true, true);
    }
  }
  
  Closure.prototype.getNamedInstanceVariable = function() {
    this.props.usesNamedThis = true;
    return "__this";
  };
  
  Closure.prototype.newTemp = function(isLocalVar, forceNewVar) {
    //isLocalVar is normally set by the Writer, but if we're allocating our own,
    //we need it.
    //forceNewVar is useful for async, if we're late-binding a variable that
    //needs to never have another value.
    var c = 0;
    for (var k in this.tmpVars) {
      c += 1;
      if (this.tmpVars[k] === 0 && (!forceNewVar || !(k in this.vars))) {
        this.tmpVars[k] = 1;
        return k;
      }
    }
    var id = '__t' + c;
    this.tmpVars[id] = 1;
    if (isLocalVar) {
      this.vars[id] = 1;
    }
    return id;
  };

  Closure.prototype.releaseTemp = function(id) {
    this.tmpVars[id] = 0;
  };

  Closure.prototype.resolveAsyncRoot = function() {
    var root = this.props.asyncParent;
    if (!root) {
      return this;
    }
    while (root.props.asyncParent) {
      root = root.props.asyncParent;
    }
    return root;
  };

  Closure.prototype.setAsyncCallback = function(callbackName) {
    this.asyncCallback = callbackName;
  };

  Closure.prototype._getAsyncCallback = function() {
    if (!this.asyncCallback) {
      throw new Error("Never set asyncCallback!");
    }
    return this.asyncCallback;
  };

  Closure.prototype.getAsyncCheckAsVar = function() {
    //Cache out a function wrapper of our async check.  Used internally, not
    //designed to be used for the last call since it has no access to a result.
    if (!this._asyncCheckVar) {
      this._asyncCheckVar = this.resolveAsyncRoot().newTemp(true, true);
    }
    return this._asyncCheckVar;
  };

  Closure.prototype.getAsyncDataVar = function() {
    return this._asyncDataVar;
  };

  Closure.prototype.asyncAddCall = function(writer) {
    //There's another async request for us, so increment our counter.
    writer.write(this._asyncDataVar + "." + ASYNC_COUNT + "++");
  };

  Closure.prototype.asyncCheck = function(writer, errorVar) {
    writer.write("__asyncCheck(");
    writer.write(this.getAsyncDataVar());
    if (errorVar) {
      writer.write(",");
      writer.write(errorVar);
    }
    writer.write(")");
  };

  Closure.prototype.asyncCloseTry = function(writer) {
    //Add the tail to a try statement.
    writer.write("}catch(e){");
    //Add 1 to count since we'll also trigger in the finally block!
    this.asyncAddCall(writer);
    writer.write(";");
    this.asyncCheck(writer, "e");
    writer.write("}finally{");
    this.asyncCheck(writer);
    writer.write("}");
  };

  Closure.prototype.asyncResult = function(writer, e, resultNode) {
    //Write the meta code for calling our result callback
    writer.write("return ");
    if (resultNode) {
      writer.write(this._asyncDataVar);
      writer.write(".");
      writer.write(ASYNC_RETURN_VALUE);
      writer.write("=");
      e.translate(resultNode);
    }
  };
  
  Closure.prototype.toString = function() {
    var r = '';
    var emitted = {};
    if (this.props.usesNamedThis) {
      this.vars['__this'] = true;
    }
    checkVar = function() {
      if (r === '') {
        r += 'var ';
      }
      else {
        r += ',';
      }
    }
    for (var v in this.vars) {
      if (v in this.funcArgs) {
        continue;
      }
      checkVar();
      r += v;
    }
    for (var v in this.features) {
      checkVar();
      r += allFeatures[v];
    }
    if (this.props.usesNamedThis) {
      checkVar();
      r += '__this=this';
    }
    if (this.props.isAsync) {
      checkVar();
      r += this._asyncDataVar + "={";
      //Start with 1 count for our thread
      r += ASYNC_COUNT + ":1";
      r += "," + ASYNC_THIS + ":\"" + this._asyncDataVar + "\"";
      r += "," + ASYNC_RESULT_CALLBACK + ":" + this._getAsyncCallback();
      r += "}";
      if (this._asyncCheckVar !== null) {
        checkVar();
        r += this._asyncCheckVar + "=function(error){";
        r += "__asyncCheck(" + this._asyncDataVar + ",error)";
        r += "}";
      }
    }
    if (r !== '') {
      r += ';';
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
      var r = this.getClosure({ isRealClosure: true });
      if (r === null) {
        //return module level, since it can define variables too.
        r = this._closures[0];
      }
      return r;
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
    if (spec.isRealClosure) {
      //class or function; things that actually delimit variable scope.
      if (!(c.props.className || c.props.isFunction)) {
        return false;
      }
    }
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
    if (spec.isFunction) {
      if (!c.props.isFunction) {
        return false;
      }
    }
    if (spec.isAsync) {
      if (!c.props.isAsync) {
        return false;
      }
    }
    if (spec.isAwait) {
      if (!c.props.isAwait) {
        return false;
      }
    }
    return true;
  };
  
  Writer.prototype.startClosure = function(props) {
    //Returns the created Closure object; hasn't pushed it to output yet
    var c = new Closure(props);
    this._closures.push(c);
    if (!props.noIndent) {
      this._indent += 1;
    }
    return c;
  };
  
  Writer.prototype.endClosure = function() {
    var c = this._closures.pop();
    if (!c.noIndent) {
      this._indent -= 1;
    }
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
  
  Writer.prototype.tmpVar = function(isAssign, noWrite) {
    var c = this.getClosure();
    var id = c.newTemp();
    this.variable(id, isAssign, noWrite);
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
  
  Writer.prototype.variable = function(id, isAssign, noWrite) {
    var c = this.getClosure();
    if (isAssign) {
      if (!this._isInArgs) {
        c.vars[id] = true;
      }
      else {
        c.funcArgs[id] = true;
      }
      if (
          !noWrite
          && c.props.isModule
          && (
            c.exports === null && id[0] !== '_'
            || c.exports !== null && id in c.exports)
          ) {
        this.write('this.' + id + '=');
      }
    }
    if (!noWrite) {
      this.write(id);
    }
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
      if (typeof w === 'string') {
        //There may have been newlines in the output, so be sure to push
        //our line number out.
        this._line += (w.split(/\n/g).length - 1);
      }
    }
  }
  
  return Writer;
})();
