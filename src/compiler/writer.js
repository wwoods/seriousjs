
var ASYNC = {
    BUFFER: "        ",
    COUNT: "c",
    NOERROR: "n",
    RETURN_VALUE: "v",
    RESULT_CALLBACK: "r",
    SELF_NAME: "s",
    THIS: "t",
    TRIGGERED: "f",
    LOOP_STATE: "m",

    // 0 is normal
    LOOP_STATE_CONTINUE: 1,
    LOOP_STATE_BREAK: 2,

    //Stuff that's not stored in the struct
    FUNCTION_CALL_STATE: "__acs",
    FUNCTION_ISASYNC: "__ais",
    FUNCTION_EXTERN: "__aex",
    debug: false
};

var allFeatures = {
  async: ""
      /** thrown means we caught something rather than getting an error from a
          callback. */
      + "__asyncCheck=function(obj,error,thrown){"
      + (ASYNC.debug ? " console.log(obj.s + ' check - ' + obj.c);" : "")
      /** If we've been triggered before, then this is NOT a primary error.  If
          it was thrown, it was thrown from another handler, and we should
          re-throw it.  If it wasn't, it's a secondary error. */
      + " if(obj." + ASYNC.TRIGGERED + "){"
      + "  if (!error) { return; }"
      + "  if (thrown) { throw error; }"
      + "  __sjs_seriousjs.onAsyncSecondaryError(error);"
      + "  return"
      + " }"
      + " obj." + ASYNC.COUNT + "--;"
      + " if(error){"
      + "  __asyncTrigger(obj,error);"
      + " }"
      + " else if(obj." + ASYNC.COUNT + "===0){"
      + "  __asyncTrigger(obj,null,obj." + ASYNC.RETURN_VALUE + ");"
      + " }"
      + "},"
      + "__asyncCheckAsync=function(func){"
      + " if (!func." + ASYNC.FUNCTION_ISASYNC + ") {"
      + "  throw new Error('"
      +       "Runtime: called non-async function with async or await "
      +       "keywords.  If you meant this, use the extern keyword after "
      +       "async or await')"
      + " }"
      + " func." + ASYNC.FUNCTION_CALL_STATE + "=1;"
      + "},"
      + "__asyncCheckCall=function(func){"
      + " if (func." + ASYNC.FUNCTION_CALL_STATE + "!==1){"
      + "  delete func." + ASYNC.FUNCTION_CALL_STATE + ";"
      + "  throw new Error('"
      +   "Runtime: cannot call async method without async or await "
      +   "keywords unless extern is specified')"
      + " }"
      + " delete func." + ASYNC.FUNCTION_CALL_STATE
      + "},"
      + "__asyncTrigger=function(obj,error,result){"
      //Guard for ASYNC.TRIGGERED being false is in asyncCheck.
      + " obj." + ASYNC.TRIGGERED + "=true;"
      + (ASYNC.debug ? " console.log(obj.s + ' trigger - ' + (error ? '(error) ' + error : result));" : "")
      //Async blocks with no error callback or the callback doesn't handle
      //errors
      + " if(obj." + ASYNC.NOERROR + "||!obj." + ASYNC.RESULT_CALLBACK + "){"
      + (ASYNC.debug ? " console.log(obj.s + ' - noError or noCallback');" : "")
      + "  if(error){"
      //This async block has no error handling, or doesn't have a callback.  So,
      //this is an unhandled error.  We have no one to give it to either way.
      //Note that we should NOT call the result callback if there is an error,
      //since noerror behavior is to just "drop" the thread.
      + "   __sjs_seriousjs.onAsyncUnhandledError(error)"
      + "  }"
      + "  else if (obj." + ASYNC.RESULT_CALLBACK + ") {"
      + "   obj." + ASYNC.RESULT_CALLBACK + ".call(obj." + ASYNC.THIS + ",result);"
      + "  }"
      + " }"
      + " else {"
      + "  obj." + ASYNC.RESULT_CALLBACK + " && obj." + ASYNC.RESULT_CALLBACK
      +       ".call("
      +      "obj." + ASYNC.THIS + ",error,result"
      + "  );"
      + " }"
      + "}",
  dictCheckAvailable: ""
      + "__dictCheckAvailable=function(spec,dict){"
      + " if(dict == null) {"
      + "  throw new Error('Not a dict: ' + dict);"
      + " }"
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
      + " if(dict == null) {"
      + "  throw new Error('Not a dict: ' + dict);"
      + " }"
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
      //Note here - spec value of 1 means no default.  0 means it has a default,
      //and thus it WILL be exact.
      + "   if(!(k in dict) && spec[k] === 1) {"
      + "    throw new Error('Missing key: ' + k);"
      + "   }"
      + "  }"
      + " }"
      + " return dict;"
      + "}",
  dictCheckRequired: "__dictCheckRequired=function(spec,dict){"
      + " if(dict == null) {"
      + "  throw new Error('Not a dict: ' + dict);"
      + " }"
      + " for(var k in spec) {"
      + "  if(!(k in dict)) {"
      + "   throw new Error('Missing key: ' + k);"
      + "  }"
      + " }"
      + "return dict;"
      + "}",
  extends: ""
      //We need our class, when constructed, to inherit from our class itself,
      //which further inherits from parent.  This allows us to naturally refer
      //to child.x as a class var, which still has access from our instances.
      //The only way to do this seems to be writing __proto__.
      //Object.setPrototypeOf does not yet appear provided by nodejs.
      + "__extends = function(child, parent) {"
      //+ " function ctorDummy() {this.constructor = function(){};}"
      //+ " ctorDummy.prototype = parent.prototype;"
      /*
      + " var pp = parent.prototype;"
      + " if (typeof Object.setPrototypeOf === 'function') {"
      + "  Object.setPrototypeOf(child, pp);"
      + " }"
      + " else {"
      + "  child.__proto__ = pp;"
      + " }"
      + " child.prototype = child;"
      + " child.__super__ = pp;"
      */
      /*
      + " var pp = parent.prototype;"
      + " var cp = {};"
      + " if (typeof Object.setPrototypeOf === 'function') {"
      + "  Object.setPrototypeOf(child, pp);"
      + "  Object.setPrototypeOf(cp, child);"
      + " }"
      + " else {"
      + "  child.__proto__ = pp;"
      + "  cp.__proto__ = child;"
      + " }"
      + " child.prototype = cp;"
      + " child.__super__ = pp;"
      //Regretfully, functions are objects with properties defined from the
      //start.  The only thing we DO want carried over with a non-undefined
      //value is name.  cp will be accessed as child.prototype or new
      //child().__proto__.
      + " var fnProps = Object.getOwnPropertyNames(child);"
      //Getter and setter that adheres to traditional inheritance... except it
      //misses the mark for setting Class.length = 8.  Class.prototype.length
      //would work, but not Class.length

      + " function getGetter(prop) {"
      + "  var innerProp = '__' + prop;"
      + "  return function() {"
      + "   if (this.hasOwnProperty(innerProp)) return this[innerProp];"
      + "   return pp[prop];"
      + "  }"
      + " }"
      + " for (var i = 0, m = fnProps.length; i < m; i++) {"
      + "  if (fnProps[i] === 'name') continue;"
      + "  Object.defineProperty(cp, fnProps[i], { writable: true, "
      +     "configurable: true });"
      + " }"
      */
      + " var pp = parent.prototype;"
      + " function ctor() { this.constructor = child; }"
      + " ctor.prototype = pp;"
      + " child.prototype = new ctor();"
      + " child.__super__ = pp;"
      + " return child;"
      + "}",
  hasProp: "__hasProp = {}.hasOwnProperty",
  setImmediate: ""
      + "setImmediate=(typeof setImmediate == 'undefined'?"
      +   "function(f){return setTimeout(f, 0);}:setImmediate),"
      + "clearImmediate=(typeof clearImmediate == 'undefined'?"
      +   "clearTimeout:clearImmediate)",
  uses: ""
      + "__extendsUse = function(obj, mixin) {"
      + " var props, key, d;"
      + " if(mixin.prototype){"
      + "  mixin = mixin.prototype;"
      + " }"
      //Since we can't get non-enumerable properties through "in", we have
      //to walk the inheritance chain and use getOwnPropertyNames, using
      //getOwnPropertyDescriptor to distinguish between properties and
      //attributes
      + " while (mixin !== null) {"
      + "  props = Object.getOwnPropertyNames(mixin);"
      + "  for(var i = 0, m = props.length; i < m; i++) {"
      + "   key = props[i];"
      //In order to get our desired priority resolution order, don't overwrite
      //properties.
      + "   if (obj.prototype.hasOwnProperty(key)) {"
      + "    continue;"
      + "   }"
      + "   d = Object.getOwnPropertyDescriptor(mixin, key);"
      + "   if (d === undefined) {"
      + "    obj.prototype[key] = mixin[key];"
      + "   }"
      + "   else {"
      + "    Object.defineProperty(obj.prototype, key, d);"
      + "   }"
      + "  }"
      + "  mixin = Object.getPrototypeOf(mixin);"
      + " }"
      + "}"
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

var SourcePos;
this.SourcePos = SourcePos = (function() {
  function SourcePos(line, column) {
    this.line = line;
    this.column = column;
  }

  return SourcePos;
})();

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
    this._asyncDataVar = null;
  }

  var DelayedValue = (function() {
    function DelayedValue(object, prop) {
      //An item that may be written to the output stream in order to look up a
      //value at Writer.getOutput() time instead of before.
      this.obj = object;
      this.prop = prop;
    }

    DelayedValue.prototype.toString = function() {
      return this.obj[this.prop];
    };

    return DelayedValue;
  })();

  Closure.prototype.getNamedInstanceVariable = function() {
    this.props.usesNamedThis = true;
    return "__this";
  };

  Closure.prototype.newTemp = function(isLocalVar, forceNewVar) {
    //isLocalVar is normally set by the Writer, but if we're allocating our own,
    //we need it.
    //forceNewVar is useful for async, if we're late-binding a variable that
    //needs to never have another value.
    var c = -1;
    while (true) {
      c += 1;
      var id = '__t' + c;
      if (id in this.vars && !(id in this.tmpVars)) {
        continue;
      }
      if ((!(id in this.tmpVars) || this.tmpVars[id] === 0)
          && (!forceNewVar || !(id in this.vars))) {
        this.tmpVars[id] = 1;
        if (isLocalVar) {
          this.vars[id] = 1;
        }
        return id;
      }
    }
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
    //Ensure our closure knows about the usage of this variable
    if (callbackName !== null && !(callbackName instanceof DelayedValue)) {
      this.resolveAsyncRoot().setVarUsed(callbackName, true);
    }
  };

  Closure.prototype._getAsyncCallback = function() {
    if (this.asyncCallback === undefined) {
      throw new Error("Never set asyncCallback!");
    }
    if (this._realCallback) {
      //Delayed callback since we have a catch/finally block
      return this._realCallback;
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
    if (this._asyncDataVar === null) {
      if (!this.props.isAsync) {
        throw new Error("No async data var?");
      }
      //This means we also have asyncParent if we have a parent scope to
      //get variable names from.
      this._asyncDataVar = this.resolveAsyncRoot().newTemp(false, true);
    }
    return this._asyncDataVar;
  };

  Closure.prototype.setAsyncDataVar = function(newVar) {
    if (this._asyncDataVar !== null) {
      throw new Error("Cannot re-assign asyncDataVar!");
    }
    this._asyncDataVar = newVar;
  };

  Closure.prototype.asyncAddCall = function(writer, debugComment) {
    //There's another async request for us, so increment our counter.
    if (ASYNC.debug) {
      writer.write("console.log('");
      writer.write(this.getAsyncDataVar());
      writer.write(" called ");
      if (debugComment) {
        writer.write(" (" + debugComment + ")");
      }
      writer.write(" - '+");
      writer.write(this.getAsyncDataVar());
      writer.write(".");
      writer.write(ASYNC.COUNT);
      writer.write("),");
    }
    writer.write(this.getAsyncDataVar() + "." + ASYNC.COUNT + "++");
  };

  Closure.prototype.asyncCheck = function(writer, errorVar, wasThrown) {
    writer.write("__asyncCheck(");
    writer.write(this.getAsyncDataVar());
    if (errorVar) {
      writer.write(",");
      writer.write(errorVar);
    }
    if (wasThrown) {
      writer.write(",true");
    }
    writer.write(")");
  };

  Closure.prototype.asyncCloseTry = function(w) {
    //NOTE - Does NOT end the closure!  That must be done by caller after this.
    //Add the tail to a try statement.  If there is a catch/finally part to this
    //closure, it must have already been added!
    w.write("}catch(__error){");
    w.newline(1);
    //Add 1 to count since we'll also trigger in the finally block!
    this.asyncAddCall(w, "error: ' + __error + '");
    w.write(";");
    this.asyncCheck(w, "__error", true);
    w.newline(-1);
    w.write("}finally{");
    w.newline(1);
    this.asyncCheck(w);
    w.newline(-1);
    w.write("}");

    //Assign _realCallback to our actual follow-up callback, and our callback
    //to the desired one based on catch / finally (if one exists)
    if (this._catchFinallyCallback) {
      this._realCallback = this._catchFinallyCallback;
    }
  };

  Closure.prototype.asyncSetupCatchFinally = function(w, e, catchStmt,
      finallyStmt) {
    //Must be called within a closure and before the closure variable is
    //defined, since catchStmt and finallyStmt's defined callbacks will be
    //used as the result callback for this async closure.
    if (this._asyncSetupCatchCalled) {
      throw new Error("Cannot be called more than once");
    }
    this._asyncSetupCatchCalled = true;


    var catchCall = null;
    var catchFollower = null;
    var finallyCall = null;
    var finallyFollower = null;

    //Mark that we have a catch or finally block, and should use it
    this._catchFinallyCallback = new DelayedValue(this, 'asyncCallback');
    if (finallyStmt) {
      //We use getClosure().newTemp() to avoid setting the "used" flag which
      //would trigger a closure event
      finallyCall = w.getClosure().newTemp(false, true);
      finallyFollower = this._catchFinallyCallback;
      this._catchFinallyCallback = finallyCall;
    }
    if (catchStmt) {
      //See finallyStmt note.
      catchCall = w.getClosure().newTemp(false, true);
      catchFollower = this._catchFinallyCallback;
      this._catchFinallyCallback = catchCall;
    }

    if (catchCall) {
      w.goToNode(catchStmt);
      w.newline();
      w.write("var ");
      w.write(catchCall);
      w.write("=function(__error){");
      w.getClosure().setVarUsed("__error", true);
      var eVar = "__error";
      var cBlock = w.newAsyncBlock(catchFollower);
      //Assign error variable
      catchStmt.internalId = "__error";
      w.write("if(");
      w.write(eVar);
      w.write("){");
      e.translate(catchStmt);
      w.write("}");
      cBlock.asyncCloseTry(w, e);
      w.endClosure();
      w.write("};");
    }
    if (finallyCall) {
      w.goToNode(finallyStmt);
      w.newline();
      w.write("var ");
      w.write(finallyCall);
      w.write("=function(__error){");
      w.getClosure().setVarUsed("__error", true);
      var callback = w.tmpVar(true, true);
      //Be sure we write in the variable before assigning the return function
      //in the async closure!
      w.write(callback);
      w.write("=function(){");
      w.write(finallyFollower);
      w.write("(__error)");
      w.write("};");
      var cBlock = w.newAsyncBlock(callback);
      e.translate(finallyStmt.body);
      cBlock.asyncCloseTry(w, e);
      w.endClosure();
      w.write("};");
    }
  };

  Closure.prototype.asyncResult = function(writer, e, resultNode) {
    //Write the meta code for calling our result callback
    writer.write("return ");
    writer.write(this.getAsyncDataVar());
    writer.write(".");
    writer.write(ASYNC.RETURN_VALUE);
    writer.write("=");
    if (resultNode) {
      e.translate(resultNode);
    }
    else {
      //Assigning undefined is important, since it makes the return apply
      //to higher asynchronous scopes.
      writer.write("undefined");
    }
  };

  Closure.prototype.setVarUsed = function(id, notForClosures) {
    //notForClosures is useful when, for instance, you have a variable that
    //won't be changing and you shouldn't use in a closure (like a function
    //declaration).  Catch blocks use this.
    if (!(id in this.vars) && !(id in this.funcArgs)) {
      this.vars[id] = (notForClosures ? "static" : "used");
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
      if (this.vars[v] !== true) {
        //inherited
        continue;
      }
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
      r += this.getAsyncDataVar() + "={";
      //Start with 1 count for our thread
      r += ASYNC.COUNT + ":1";
      r += "," + ASYNC.SELF_NAME + ":\"" + this.getAsyncDataVar() + "_"
          + this.props.line + "\"";
      r += "," + ASYNC.RESULT_CALLBACK + ":" + this._getAsyncCallback();
      r += "," + ASYNC.THIS + ":this";
      if (this.props.isAsyncNoError) {
        r += "," + ASYNC.NOERROR + ":true";
      }
      r += "}";
      if (this._asyncCheckVar !== null) {
        checkVar();
        r += this._asyncCheckVar + "=function(error){";
        r += "__asyncCheck(" + this.getAsyncDataVar() + ",error)";
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
    this._indent = 0;
    this._output = [];
    this._closures = [];
    //NOT actual line number; used to debug e.g. async code.  This is always
    //a constant (due to headers) off from the actual line number.
    this._line = 1;
    this._isInArgs = false;
    this._redirects = [];
    this._renames = {};

    //Copy over enumeration
    this.ASYNC = ASYNC;

    var c = this.startClosure({ isModule: true });
    this._output.push(c);
  }

  Writer.prototype.getOutput = function(header, footer, options) {
    //[generated line, generated col, source line, source col]
    //Columns are zero based
    var map = [ [ 1, 1, 1, 0 ] ];
    var output = [ header ];
    var nlFinder = /\n/g;
    var outLine = header.match(nlFinder);
    if (outLine && outLine.length) {
      outLine = 1 + outLine.length;
    }
    else {
      outLine = 1;
    }
    var outCol = 1;
    var outLength = header.length;
    if (outLine > 1) {
      outCol = header.length - header.lastIndexOf("\n");
    }
    try {
      for (var i = 0, m = this._output.length; i < m; i++) {
        var oi = this._output[i];
        if (oi instanceof SourcePos) {
          map.push([ outLine, outCol,
              oi.line, oi.column || 0 ]);
          continue;
        }

        var s = oi.toString();
        outLength += s.length;
        var nls = s.match(nlFinder);
        if (nls && nls.length) {
          outLine += nls.length;
          outCol = s.length - s.lastIndexOf('\n');
        }
        else {
          outCol += s.length;
        }
        output.push(s);
      }

      output.push(footer);
    }
    catch (e) {
      console.log("Before error: " + output.join(""));
      throw e;
    }

    return { js: output.join(""), map: map };
  };

  Writer.prototype.addClosureNode = function(e, n) {
    getClosure().onEntryNodes.push([ e, n ]);
  };

  Writer.prototype.export = function(v) {
    var c = this._closures[this._closures.length - 1];
    if (c.exports === null) {
      c.exports = {};
    }
    c.exports[v] = true;
  };

  Writer.prototype.startContinuation = function() {
  };

  Writer.prototype.endContinuation = function() {
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
    else if (spec.isAsyncLoop) {
      //Walk backward through closures until we find either a closure (return
      //null) or isLoop: true and isAsync: true
      for (var i = this._closures.length - 1; i >= 0; --i) {
        var c = this._closures[i];
        if (c.props.isClosure) {
          return null;
        }
        else if (c.props.isAsync && c.props.isLoop) {
          return c;
        }
      }
      return null;
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
      if (!(c.props.className || c.props.isFunction || c.props.isClosure)) {
        return false;
      }
    }
    if (spec.isClosure) {
      if (!c.props.isClosure) {
        return false;
      }
    }
    if (spec.catchAsync) {
      if (!c.props.catchAsync) {
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
    if (spec.isAsyncOrClosure) {
      if (!c.props.isAsync && !c.props.isClosure) {
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
    //Can also resume a closure if props is, itself, a Closure object.
    if (props instanceof Closure) {
      this._closures.push(props);
      return props;
    }

    props.line = this._line;
    var c = new Closure(props);
    this._closures.push(c);
    return c;
  };

  Writer.prototype.endClosure = function() {
    var c = this._closures.pop();

    //Any var === "used" on c should be propagated to the parent closure as
    //it is inherited.  This is how the "closure" keyword works.
    var parent = this._closures[this._closures.length - 1];
    for (var v in c.vars) {
      if (c.vars[v] === "used") {
        parent.setVarUsed(v);
      }
    }
  };

  Writer.prototype.afterClosure = function(fn) {
    this.getClosure().afterStart.push(fn);
  };

  Writer.prototype.startArgs = function() {
    this._isInArgs = true;
    this._indent += 2;
  };

  Writer.prototype.endArgs = function() {
    this._indent -= 2;
    this._isInArgs = false;
  };

  Writer.prototype.isInArgs = function() {
    return this._isInArgs;
  };

  Writer.prototype.goToLine = function(l) {
    if (l == null) {
      return;
    }
    this.write(new SourcePos(l));
  };

  Writer.prototype.goToNode = function(node) {
    //Go to a specific node's position information
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
    else if (methodC === null && topC !== null) {
      throw new Error("Cannot use '@' in a nested method outside of a class "
          + "method");
    }
    else {
      return methodC.getNamedInstanceVariable();
    }
  };

  Writer.prototype.newAsyncBlock = function(callback) {
    var cParent = this.getClosure({ isAsync: true });
    var c = this.startClosure({ isAsync: true, asyncParent: cParent });
    c.setAsyncCallback(callback);
    this.write(c);
    this.write("try{");
    return c;
  };

  Writer.prototype.tmpVar = function(isAssign, noWrite) {
    //noWrite implies that it must never have been allocated in the first place
    var c = this.getClosure();
    var id = c.newTemp(false, noWrite);
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

  Writer.prototype.setVariableRename = function(oldId, newId) {
    //Any instances of oldId after this call will be newId until
    //unsetVariableName is called.
    if (typeof oldId === "object") {
      if (typeof oldId.id !== "string") {
        throw new Error("Bad compiler - " + oldId);
      }
      oldId = oldId.id;
    }
    this._renames[oldId] = newId;
  };

  Writer.prototype.unsetVariableRename = function(oldId) {
    delete this._renames[oldId];
  };

  Writer.prototype.variable = function(id, isAssign, noWrite) {
    if (this._renames.hasOwnProperty(id)) {
      id = this._renames[id];
    }

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
    else {
      c.setVarUsed(id);
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

  Writer.prototype.newline = function(indentDelta) {
    if (indentDelta !== undefined) {
      this._indent += indentDelta;
    }
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
