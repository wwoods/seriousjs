
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
  var VariableClosure = (function() {
    var cType = (function() {
      function cType(closure) {
        this.closure = closure;
        this.leaks = {};
      }
      cType.prototype.leak = function(name) {
        this.leaks[name] = true;
      };
      cType.prototype.toString = function() {
        var r = [];
        for (var v in this.closure.vars) {
          if (this.closure.vars[v] !== "used" || this.leaks.hasOwnProperty(v)) {
            //Assigned
            continue;
          }
          r.push(v);
        }
        return r.join(",");
      };
      return cType;
    })();

    function VariableClosure(w) {
      this.w = w;
      this.c = w.startClosure({ isClosure: true });
      this.args = new cType(this.c);
      w.write("(function(");
      w.write(this.args);
      w.write("){");
      w.write(this.c);
    }
    VariableClosure.prototype.close = function() {
      this.w.endClosure();
      this.w.write("}).apply(this, [");
      this.w.write(this.args);
      this.w.write("]);");
    };
    /** AFTER a variable has been assigned, leaking it will make it be declared
        at the parent closure's scope, and this VariableClosure() will not proxy
        its definition (since technically it's defined within).  Used for async
        catch and finally callbacks. */
    VariableClosure.prototype.leak = function(name) {
      this.args.leak(name);
      this.c.vars[name] = "used";
    };
    return VariableClosure;
  })();
  var opTable = {
    "->": function(e, n, w, options) {
          var nearClosure = w.getClosure();
          var isClassMethod = (options.isConstructorFor
              || nearClosure.props.className
              || nearClosure.props.isClassProperty);
          var c = w.startClosure({
              isClassMethod: isClassMethod,
              methodName: options.methodName,
              isFunction: true,
              isClosure: true,
              isAsync: n.spec && n.spec.async,
              isAsyncNoError: n.spec && n.spec.asyncNoError,
              catchAsync: n.spec && n.spec.async
          });
          c.setVarUsed("arguments", true);
          var hasInnerWrapper = false;
          if (n.doc || n.spec.async) {
            if (!options.isConstructorFor) {
              hasInnerWrapper = true;
              w.write("(function() {");
              if (n.doc) {
                w.write("var __doc__ = ");
                w.newline();
                e.translate(n.doc);
                w.write(";");
              }
            }
            else if (n.spec.async) {
              throw new Error("Constructors cannot be async!");
            }
          }
          if (hasInnerWrapper) {
            w.write("    var __inner__ = ");
          }
          if (options.isConstructorFor) {
            //For generated code readability, assign __doc__ to a variable above
            //the constructor rather than after it.
            if (n.doc) {
              w.write("var __doc__ = ");
              w.newline();
              e.translate(n.doc);
              w.write(";");
            }
            w.write("function ");
            w.write(options.isConstructorFor);
            w.write("(");
          }
          else {
            w.write("function(");
          }
          w.startArgs();
          e.translate(n.parms, { separator: ',' });
          var asyncCallback = null;
          var asyncCallbackIndex = null;
          if (c.props.isAsync) {
            w.usesFeature("async");
            for (var i = 0, m = n.parms.length; i < m; i++) {
              if (n.parms[i].id === "callback") {
                asyncCallback = "callback";
                asyncCallbackIndex = i;
                break;
              }
            }
            if (asyncCallback === null) {
              if (n.parms.length > 0) {
                w.write(",");
              }
              asyncCallback = w.tmpVar(true);
              asyncCallbackIndex = n.parms.length;
            }
            c.setAsyncCallback(asyncCallback);
          }
          w.endArgs();
          w.write(") {");
          w.newline(1);
          if (options.isBoundToClass) {
            //Bind to the prototype
            w.write("if(this!==");
            w.write(nearClosure.props.className);
            w.write(".prototype){");
            w.write("return ");
            w.write(nearClosure.props.className);
            w.write(".");
            w.write(options.methodName);
            w.write(".apply(");
            w.write(nearClosure.props.className);
            w.write(".prototype,arguments);");
            w.write("}");
          }
          if (n.spec.async && !n.spec.asyncExtern && !n.spec.asyncNoError) {
            //Do the check
            w.write("__asyncCheckCall(__inner__);");
          }
          if (asyncCallback !== null && !n.spec.asyncNoCascade) {
            //Note that we only cascade down - that is, if the programmer
            //specifies zero arguments and two get used, putting the callback
            //at the end, we will assume that there was no callback.
            w.write("if(");
            w.write(asyncCallback);
            w.write("===undefined){");
            var hasWrittenAsyncSub = false;
            for (var i = asyncCallbackIndex - 1; i >= 0; i--) {
              var parmId = null;
              if (n.parms[i].op === "id") {
                parmId = n.parms[i];
              }
              else if (n.parms[i].op === "dictAssignArgs") {
                if (!n.parms[i].id) {
                  throw new Error("Bad expectation; args not assigned");
                }
                parmId = n.parms[i].id;
              }
              else {
                throw new Error("Unknown param type for async: "
                    + n.parms[i].op);
              }

              if (hasWrittenAsyncSub) {
                w.write("else ");
              }
              hasWrittenAsyncSub = true;
              //Check if it's defined first - we only want to cascade to the
              //first defined argument, not beyond.
              w.write("if(typeof ");
              e.translate(parmId);
              w.write('!=="undefined"){');
              //If it's a function, use it, otherwise assume that there was no
              //callback specified.
              w.write("if(typeof ");
              e.translate(parmId);
              w.write('==="function"){');
              w.write(asyncCallback);
              w.write("=");
              e.translate(parmId);
              w.write(";");
              e.translate(parmId, { isAssign: true });
              w.write("=undefined");
              w.write("}}");
            }
            w.write("}");
            //If it was defined, was it a function?  There's a chance that the
            //caller was using a non-callback, in e.g. the case of bound UI
            //events that we are using an async function for, not anticipating
            //any number of parameters being passed.  In general, using async
            //functions as callbacks can be a good thing, so we're making not
            //throwing an error the default behavior over confusing "obj.r.call
            //is not a function" messages.
            w.write("else if(typeof ");
            w.write(asyncCallback);
            w.write('!=="function"){');
            w.write(asyncCallback);
            w.write("=undefined}");
          }
          w.write(c);
          if (c.props.isAsync) {
            //Whole method must be in a try..catch..finally
            w.write("try{");
          }
          if (options.isConstructorFor) {
            //Check if we're a function invocation or not
            w.write("if(!(this instanceof ");
            w.write(options.isConstructorFor);
            w.write(")){");
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
          w.newline();
          e.translate(n.body, { isReturnClosure: n.returnImplied });
          if (c.props.isAsync) {
            //Whole method must be in a try..catch..finally.  It's imperative
            //that we call our result.
            c.asyncCloseTry(w);
          }
          w.endClosure();

          w.newline(-1);
          w.write("}");
          if (n.doc) {
            if (hasInnerWrapper) {
              w.write("; __inner__.__doc__ = __inner__.help = __doc__");
            }
            else {
              //Constructor
              w.write("; ");
              w.write(options.isConstructorFor);
              w.write(".__doc__ = ");
              w.write(options.isConstructorFor);
              w.write(".help = __doc__");
            }
          }
          if (n.spec.async) {
            w.write("; __inner__." + w.ASYNC.FUNCTION_ISASYNC + "=true");
          }
          if (n.spec.async && n.spec.asyncExtern) {
            //Mark that it's an async function that doesn't check so that the
            //async and await keywords will still work without the extern
            //keyword.
            w.write("; __inner__." + w.ASYNC.FUNCTION_EXTERN + "=true");
          }
          if (hasInnerWrapper) {
            w.write("; return __inner__; })()");
          }
        },
     "::": function(e, n, w) {
          w.write(".prototype");
          e.translate(n.expr);
        },
     "and": function(e, n, w) {
          e.translate(n.left);
          w.write(" && ");
          e.translate(n.right);
        },
     "arrayMember": function(e, n, w) {
          if (n.expr.op === "rangeExpr") {
            if (n.expr.skip.op !== "number" || n.expr.skip.num !== 1) {
              throw new Error("Cannot use range skip for array ops");
            }
            w.write(".slice(");
            e.translate(n.expr.left || 0);
            if (n.expr.right) {
              w.write(",");
              e.translate(n.expr.right);
            }
            w.write(")");
          }
          else {
            w.write("[");
            e.translate(n.expr);
            w.write("]");
          }
        },
     "async": function(e, n, w) {
          w.usesFeature("async");
          //Get our async synchronization closure; async blocks are essentially
          //a "new thread", so we only accept certain await closures.
          var cAsyncParent = w.getClosure({ catchAsync: true });

          var outerClosure = null;
          if (cAsyncParent !== null && !cAsyncParent.props.isAwait) {
            //If we're not being waited on, we need a closure in case we're in
            //e.g. a for loop
            outerClosure = new VariableClosure(w);
          }

          //async blocks are always inside a closure.  So use the closure as
          //our asyncParent.
          var c = w.startClosure({ isAsync: true,
              asyncParent: w.getClosure({ isAsyncOrClosure: true }) });
          if (c.props.asyncParent.props.isClosure
              && !c.props.asyncParent.props.isFunction) {
            //Belongs to this async block, so flag it
            c.props.asyncParent.setAsyncDataVar(c.getAsyncDataVar());
          }

          //Before setting up catch and finally, which allocate vars, we need
          //to make note of any inherited vars we'll be using
          if (cAsyncParent) {
            c.props.asyncParent.setVarUsed(cAsyncParent.getAsyncDataVar(),
                true);
            var parentCallback = cAsyncParent.getAsyncCheckAsVar();
            c.setVarUsed(parentCallback);
            c.setAsyncCallback(parentCallback);
          }

          c.asyncSetupCatchFinally(w, e, n.catchStmt, n.finallyStmt);

          w.goToNode(n);
          w.write("/* async */" + w.ASYNC.BUFFER);
          w.write(c);

          if (cAsyncParent) {
            cAsyncParent.asyncAddCall(w);
            w.write(";");
          }
          else {
            c.setAsyncCallback(null);
          }
          w.write("try{");
          w.newline(1);
          e.translate(n.body);
          w.newline(-1);
          c.asyncCloseTry(w);
          w.endClosure();

          if (outerClosure) {
            outerClosure.close();
          }
        },
     "asyncCall": function(e, n, w) {
          w.usesFeature("async");
          //Get the closure whose variables we affect
          var cAsyncParent = w.getClosure({ isAsync: true });
          if (!w.getClosure({ isAwait: true }) && n.assign
              && n.assign.length > 0) {
            throw new Error("async calls with assigned variables require an "
                + "await or async context");
          }
          //Find the temp var parent to stop from overwriting stuff since we
          //refer up all the time in async code
          var cVarParent = w.getClosure();

          var callbackArg = 0;
          while (callbackArg < n.call.args.length) {
            if (n.call.args[callbackArg].id === "callback") {
              break;
            }
            callbackArg += 1;
          }
          if (cAsyncParent === null) {
            callbackArg = -1;
          }
          var argCount = Math.max(callbackArg + 1, n.call.args.length);
          var myCallback = null;
          if (cAsyncParent !== null) {
            //If we don't have a parent, there's no state to sync
            cAsyncParent.asyncAddCall(w);
            w.write(",");
            myCallback = w.tmpVar(true);
            var classMethodClosure = w.getClosure({ isClassMethod: true });
            if (classMethodClosure && n.assign) {
              //We must preserve our context on callback, in case assignment
              //used "this" or "@"
              w.write("=function(){");
              var hasContext = myCallback + "_b";
              w.variable(hasContext, true);
              w.write(".apply(");
              w.write(classMethodClosure.getNamedInstanceVariable());
              w.write(",arguments)},");
              w.write(hasContext);
            }
            w.write("=function(");
            w.startArgs();
            var maxArgs = 0;
            var errorPos = -1;
            var errorIsImplicit = false;
            if (n.assign) {
              //n.assign is undefined for custom crafted setTimeout calls.
              for (var i = 0, m = n.assign.length; i < m; i++) {
                if (n.assign[i].op === "tupleAssign") {
                  var nas = n.assign[i].left;
                  maxArgs = Math.max(maxArgs, nas.length);
                  for (var j = 0, k = nas.length; j < k; j++) {
                    if (nas[j].op === "=" && nas[j].left.op === "id"
                        && nas[j].left.id === "error") {
                      errorPos = j;
                      break;
                    }
                  }
                }
                else {
                  maxArgs = 1;
                }
              }
            }

            if (errorPos < 0 && !n.spec.asyncNoError) {
              //Defaults to first arg
              maxArgs += 1;
              errorPos = 0;
              errorIsImplicit = true;
            }
            var argNames = [];
            for (var i = 0; i < maxArgs; i++) {
              var argName;
              if (i === errorPos) {
                argName = "error";
              }
              else {
                argName = w.tmpVar(true, true);
              }
              argNames.push(argName);
              if (i > 0) {
                w.write(",");
              }
              w.variable(argName, true);
            }
            w.endArgs();
            w.write("){");
            if (n.assign && n.assign.length > 0) {
              if (errorPos >= 0) {
                w.write("if(!");
                w.write(argNames[errorPos]);
                w.write("){");
              }
              //variables...
              var firstArg = 1;
              if (errorPos !== 0) {
                firstArg = 0;
              }
              for (var i = 0, m = n.assign.length; i < m; i++) {
                if (n.assign[i].op === "tupleAssign") {
                  var parts = n.assign[i].left;
                  for (var j = 0, k = parts.length; j < k; j++) {
                    var argMatched = j;
                    if (errorIsImplicit) {
                      argMatched += 1;
                    }
                    parts[j].right = { op: "id", id: argNames[argMatched] };
                  }
                  e.translate(parts);
                }
                else {
                  n.assign[i].right = { op: "id", id: argNames[firstArg] };
                  e.translate(n.assign[i]);
                }
              }
              if (errorPos >= 0) {
                w.write("}");
              }
            }
            w.write(";__asyncCheck(");
            w.write(cAsyncParent.getAsyncDataVar());
            if (errorPos >= 0) {
              w.write("," + argNames[errorPos]);
            }
            w.write(")};");
          }
          var funcContext = null;
          var funcToCall = n.call.func;
          if (funcToCall === "setImmediate") {
            //Browser support for browsers who don't have it
            w.usesFeature("setImmediate");
          }
          //Do the check
          if (!n.spec.asyncExtern && !n.spec.asyncNoError) {
            if (n.call.func.op !== "id") {
              //Fun... so we need to preserve the context for when we call the
              //function, which javascript doesn't do natively.  So we'll just
              //ask for the "owner" of an atom, and then access our method on
              //that.
              var atom = w.tmpVar(true);
              w.write("=");
              e.translate(n.call.func, { splitAtom: true });
              w.write(",");
              funcToCall = atom + "[1]";
              funcContext = atom + "[0]";
            }
            else {
              funcToCall = n.call.func.id;
            }
            w.write("__asyncCheckAsync(");
            w.write(funcToCall);
            w.write("),");
          }
          w.goToNode(n);
          e.translate(funcToCall);
          if (funcContext) {
            w.write(".call(" + funcContext);
            if (argCount > 0) {
              w.write(", ");
            }
          }
          else {
            w.write("(");
          }
          for (var i = 0; i < argCount; i++) {
            if (i > 0) {
              w.write(",");
            }
            if (i === callbackArg) {
              w.write(myCallback);
            }
            else {
              e.translate(n.call.args[i]);
            }
          }
          w.write(")");
          if (!n.spec.asyncExtern) {
            //No longer needed
            w.tmpVarRelease(funcToCall);
          }
          //No longer need this variable...
          w.tmpVarRelease(myCallback);
        },
     "atom": function(e, n, w, options) {
          var atomOpts = null;
          if (options.splitAtom) {
            //Expecting to generating an array of [context, member] based
            //on our chain.
            w.write("(");
            var ctx = w.tmpVar(true);
            w.write("=");
            e.translate(n.atom, atomOpts);
            e.translate(n.chain.slice(0, n.chain.length - 1),
                { separator: '' });
            w.write(",[");
            w.write(ctx);
            w.write(",")
            w.write(ctx);
            e.translate(n.chain[n.chain.length - 1]);
            w.write("])");
          }
          else {
            if (n.chain.length === 0) {
              atomOpts = options;
            }
            e.translate(n.atom, atomOpts);
            e.translate(n.chain, { separator: '' });
          }
        },
     "await": function(e, n, w) {
          if (n.after == null) {
            throw new Error("Await never got after?");
          }

          if (n.body.length !== 1 || n.body[0].line !== n.line) {
            w.goToNode(n);
            w.write("/* await from " + n.line + " */" + w.ASYNC.BUFFER);
          }

          //We accomplish await blocks by creating a new async closure that's
          //not at the function level...
          var cParent = w.getClosure({ isAsync: true });
          if (cParent === null) {
            throw new Error("Await may only be used within async method or "
                + "block; line " + n.line);
          }

          if (n.name) {
            w.write(n.name);
            w.write("=function(){");
            w.newline(1);
          }

          //Add a count for us and the after chunk.
          cParent.asyncAddCall(w);

          if (n.isLoop) {
            //Loops always have a parent await block from the operations in
            //asyncTransform.js.  So, to the parent loop, we'll assign isLoop.
            cParent.props.isLoop = true;
          }

          var c = w.startClosure({ isAsync: true, asyncParent: cParent,
              isAwait: true, catchAsync: n.catchAsync });
          var cName = c.getAsyncDataVar() + "_f";
          c.setAsyncCallback(cName);

          //Build our callback method first since we're in strict mode; this has
          //to happen outside of our c closure though, since it calls outside of
          //c.
          w.endClosure();

          w.write(";var " + cName);
          w.write("=function(__error){");
          w.newline(1);
          w.write("if(__error){");
          cParent.asyncCheck(w, "__error");
          w.write(";return}");
          //Are we a loop?
          if (n.isLoop) {
            w.write("if(");
            w.write(cParent.getAsyncDataVar());
            w.write(".");
            w.write(w.ASYNC.LOOP_STATE);
            w.write("===" + w.ASYNC.LOOP_STATE_BREAK);
            w.write("){");
            cParent.asyncCheck(w);
            w.write(";return}");
            //Clear continue state
            w.write(cParent.getAsyncDataVar());
            w.write("." + w.ASYNC.LOOP_STATE + "=0;");
          }
          else {
            var cLoop = w.getClosure({ isAsyncLoop: true });
            if (cLoop) {
              w.write("if(");
              w.write(cLoop.getAsyncDataVar());
              w.write("." + w.ASYNC.LOOP_STATE);
              w.write("){");
              //Then it's either break or continue, either way jump to our
              //parent as though we've seen an error.
              cParent.asyncCheck(w);
              w.write(";return}");
            }
          }
          w.newline();
          w.write("try{");
          //Embedded return clause in e.g. catch or finally.  Use closure and
          //not async so that only the main control flow is blocked by a return.
          var cFunction = w.getClosure({ isClosure: true });
          if (cFunction !== null) {
            w.write("if('" + w.ASYNC.RETURN_VALUE + "' in ");
            w.write(cFunction.getAsyncDataVar());
            w.write("){return};");
          }
          w.newline(1);
          e.translate(n.after);
          w.newline(-1);
          w.write(w.ASYNC.BUFFER);
          cParent.asyncCloseTry(w);

          //Close our await block
          w.newline(-1);
          w.write("};");

          //Now we're writing our first part (strict mode is somewhat
          //unfortunate that it forces the ordering of function definitions...
          w.startClosure(c);

          //First part's await block's wrapper
          w.write("(function() {");
          c.asyncSetupCatchFinally(w, e, n.catchStmt, n.finallyStmt);
          w.newline(1);

          w.write(c);
          w.write("try{");
          w.newline(1);
          e.translate(n.body);
          w.newline(-1);
          w.write(w.ASYNC.BUFFER);
          c.asyncCloseTry(w);
          w.newline(-1);
          w.write("}).call(this);");
          w.endClosure();

          if (n.name) {
            w.newline(-1);
            w.write("};");
            w.write(n.name);
            w.write(".call(this);");
          }
        },
     "boundMethod": function(e, n, w) {
          var classC = w.getClosure({ isClassMethod: true });
          if (!classC) {
            throw new Error("@@ can only be used in a class' method; Line "
                + n.line);
          }

          w.write("function() {return ");
          w.write(classC.getNamedInstanceVariable());
          w.write(".");
          e.translate(n.id);
          w.write(".apply(");
          w.write(classC.getNamedInstanceVariable());
          w.write(",arguments)}");
        },
     "break": function(e, n, w) {
          var c = w.getClosure({ isAsyncLoop: true });
          if (!c) {
            w.write("break");
            return;
          }

          w.write("/* break */" + w.ASYNC.BUFFER);
          w.write(c.getAsyncDataVar());
          w.write("." + w.ASYNC.LOOP_STATE);
          w.write("=" + w.ASYNC.LOOP_STATE_BREAK);
          w.write(";return");
        },
     "call": function(e, n, w) {
          w.write('(');
          e.translate(n.args, { separator: ',' });
          w.write(')');
        },
     "catch": function(e, n, w) {
          //Note that we're already in the catch block here, and we have
          //n.internalId to work with
          if (!n.internalId) {
            throw new Error("internalId was not set on catch");
          }
          var hadUnconditional = false;
          for (var i = 0, m = n.parts.length; i < m; i++) {
            var part = n.parts[i];
            if (part.cond) {
              if (i !== 0) {
                w.write("else ");
              }
              w.write("if (");
              if (part.id) {
                w.setVariableRename(part.id, n.internalId);
              }
              e.translate(part.cond);
              if (part.id) {
                w.unsetVariableRename(part.id);
              }
              w.write(") {");
              w.newline(1);
            }
            else if (i !== m - 1) {
              throw new Error("Unconditional catch must be last");
            }
            else {
              hadUnconditional = true;
              if (i !== 0) {
                w.write("else {");
                w.newline(1);
              }
            }

            if (part.body) {
              if (part.id) {
                e.translate(part.id, { isAssign: true });
                w.write("=");
                w.variable(n.internalId);
                w.write(";");
                w.newline();
              }
              e.translate(part.body);
            }

            if (part.cond || i !== 0) {
              w.newline(-1);
              w.write("}");
            }
          }

          if (!hadUnconditional) {
            w.write("else { throw ");
            w.variable(n.internalId);
            w.write(" }");
          }
        },
     "class": function(e, n, w) {
          e.translate(n.name, { isAssign: true });
          w.write(" = ");
          var c = w.startClosure({ className: e.getNodeAsId(n.name) });
          w.write("(function(");
          w.startArgs();
          w.variable("_super", true);
          w.endArgs();
          w.write(") {");
          w.write(c);
          //sjs inheritance: http://jsfiddle.net/842nm/
          if (n.parent) {
            w.usesFeature("extends");
            w.write("__extends(");
            e.translate(n.name);
            w.write(", _super);");
          }
          for (var i = 0, m = n.uses.length; i < m; i++) {
            w.usesFeature("uses");
            w.write("__extendsUse(");
            e.translate(n.name);
            w.write(",");
            e.translate(n.uses[i]);
            w.write(");");
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
                  body: [],
                  spec: {}
                  },
            };
            if (n.parent) {
              fakeConstructor.value.body.push({ op: "super" });
            }
            w.write(";");
            e.translate(fakeConstructor);
          }
          if (n.docString) {
            w.write(";");
            e.translate(n.name);
            w.write(".__doc__=");
            e.translate(n.name);
            w.write(".help=");
            e.translate(n.docString);
            if (c.props.classConstructor.doc) {
              //Prepend to constructor docstring, with two newlines separating.
              w.write("+'\\n\\n'+");
              e.translate(n.name);
              w.write(".__doc__");
            }
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
     "closure": function(e, n, w) {
          var c = new VariableClosure(w);
          e.translate(n.body);
          c.close();
        },
     "comment": function(e, n, w) {
          var lines = n.comment.split(/\n/g);
          w.write("/*");
          for (var i = 0, m = lines.length; i < m; i++) {
            if (i > 0) {
              w.write("\n");
            }
            w.write(lines[i]);
          }
          w.write("*/" + w.ASYNC.BUFFER);
        },
     "continue": function(e, n, w) {
          var c = w.getClosure({ isAsyncLoop: true });
          if (!c) {
            w.write("continue");
            return;
          }

          w.write("/* continue */" + w.ASYNC.BUFFER);
          w.write(c.getAsyncDataVar());
          w.write("." + w.ASYNC.LOOP_STATE);
          w.write("=" + w.ASYNC.LOOP_STATE_CONTINUE);
          w.write(";return");
        },
     "delete": function(e, n, w) {
          w.write("delete ");
          e.translate(n.body);
        },
     "dict": function(e, n, w) {
          //Bracket must happen first, since return statements will become
          //disconnected from the next line in some javascript engines (chrome
          //and node, anyway)
          w.write("{");
          if (n.elements.length > 0) {
            w.goToNode(n.elements[0]);
          }

          e.translate(n.elements, { separator: ',' });
          w.write("}");
        },
     "dictAssign": function(e, n, w) {
          //n has keys, mod, and right.

          w.write("(");
          var r = w.tmpVar(true);
          w.write("=");
          //Remember that for the standard argument case, this will be a
          //reference to the passed dict.  We do modify it in place if
          //rightAssignDefaults is true.
          e.translate(n.right);
          if (n.allowUndefined) {
            //Used for args, map the object to an empty object if it's null
            //or undefined
            w.write(",");
            w.write(r);
            if (n.reassignRightDefaults) {
              w.write("=");
              e.translate(n.right);
            }
            w.write("=(" + r + "!=undefined?" + r + ":{})");
          }
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
            w.write(",");
            w.write(r);
            w.write("=");
            w.write("__" + f + "({");
            var isFirst = true;
            for (var i = 0, m = n.keys.length; i < m; i++) {
              if (f === "dictCheckRequired" && n.keys[i].defaultVal) {
                //If a value is required, but has a default, then it's not
                //really required.
                continue;
              }
              if (!isFirst) {
                w.write(",");
              }
              isFirst = false;
              w.write(e.getNodeAsId(n.keys[i]) + ':');
              if (n.keys[i].defaultVal) {
                w.write("0");
              }
              else {
                w.write("1");
              }
            }
            w.write("},");
            w.write(r);
            w.write(")");
          }

          for (var i = 0, m = n.keys.length; i < m; i++) {
            var key = n.keys[i];
            w.write(",");
            var nid;
            if (key.op === "memberId") {
              nid = w.tmpVar(true);
            }
            else {
              nid = key.id;
              w.variable(nid, true);
            }
            w.write("=");
            w.write(r + "." + e.getNodeAsId(key));
            if (key.defaultVal) {
              w.write(",");
              w.variable(nid);
              w.write("=(");
              w.variable(nid);
              w.write("!==undefined?");
              w.variable(nid);
              w.write(":");
              if (n.reassignRightDefaults) {
                w.write("(");
                e.translate(r);
                w.write(".");
                w.write(e.getNodeAsId(key));
                w.write("=");
                e.translate(key.defaultVal);
                w.write(")");
              }
              else {
                e.translate(key.defaultVal);
              }
              w.write(")");
            }
            if (key.op === "memberId") {
              var obj = w.getInstanceVariable();
              w.write("," + obj + "." + e.getNodeAsId(key) + "=" + nid);
            }
            if (key.unmapVal) {
              //Nested dict unmapping
              key.unmapVal.right = nid;
              w.write(",");
              e.translate(key.unmapVal);
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
            n.assign.reassignRightDefaults = true;
          }
          else {
            var r = w.tmpVar();
            n.id = { op: "id", id: r };
          }
          n.assign.right = n.id;
          if (n.defaultVal) {
            n.id.defaultVal = n.defaultVal;
            addArgDefault(e, n.id, w);
          }
          //Since they're args, allow null or undefined to map to an empty
          //object.
          n.assign.allowUndefined = true;
          w.afterClosure(function() {
            e.translate(n.assign);
          });
        },
     "existence": function(e, n, w) {
          if (n.atom.op === "id") {
            //Slightly different code since we can't assign it to anything
            w.write("(typeof ");
            e.translate(n.atom);
            w.write('!=="undefined"&&');
            e.translate(n.atom);
            w.write("!==null)");
          }
          else {
            w.write("(");
            var ref = w.tmpVar(true);
            w.write("=");
            e.translate(n.atom);
            w.write(",typeof ");
            w.write(ref);
            w.write('!=="undefined"&&');
            w.write(ref);
            w.write("!==null)");
          }
        },
     "exports": function(e, n, w) {
          for (var i = 0, m = n.exports.length; i < m; i++) {
            w.export(n.exports[i].id);
          }
        },
     "forHash": function(e, n, w) {
          var r = w.tmpVar(true);
          w.write("=");
          e.translate(n.expr);
          if (!n.hasAwait) {
            w.write(";");
            w.write("for(");
            //avoid writing (this.name=name in r) which is invalid syntax
            w.variable(n.keyId.id, true, true);
            e.translate(n.keyId);
            w.write(" in ");
            w.write(r);
            w.write("){");
            w.newline(1);
            if (n.valueId) {
              e.translate(n.valueId, { isAssign:true });
              w.write(" = ");
              w.write(r);
              w.write("[");
              e.translate(n.keyId);
              w.write("];");
            }
            e.translate(n.body);
            w.newline(-1);
            w.write("}");
          }
          else {
            //crazy async version, which mostly just leverages forList's
            //implementation.
            w.write(",");
            var rKeys = w.tmpVar(true);
            w.write("=[],");
            var rKeyTmp = w.tmpVar(true, true);
            var rKeysOp = {
                op: "forHash",
                keyId: rKeyTmp,
                expr: r,
                body: [
                  { op: "atom", atom: rKeys, chain: [
                      { op: "member", id: "push" },
                      { op: "call", args: [ rKeyTmp ] } ] }
                ]
            };
            e.translate(rKeysOp);
            w.write(";");
            var listBody = n.body;
            if (n.valueId) {
              listBody = [
                  { op: "=", left: n.valueId, right:
                    { op: "atom", atom: r, chain: [ { op: "arrayMember",
                      expr: n.keyId } ] } }
              ].concat(listBody);
            }
            var listIterOp = {
                op: "forList",
                hasAwait: true,
                ids: [ n.keyId ],
                expr: rKeys,
                body: listBody
            };
            e.translate(listIterOp);
          }
        },
     "forList": function(e, n, w) {
          var r = w.tmpVar(true);
          w.write("=");
          e.translate(n.expr);
          if (!n.hasAwait) {
            w.write(";");
            w.write("for(");
          }
          else {
            w.write(",");
          }
          var iter;
          if (n.ids.length > 1) {
            iter = n.ids[1];
            e.translate(iter, { isAssign: true });
          }
          else {
            iter = { op: "id", id: w.tmpVar(true) };
          }
          w.write("=0,");
          var iterLen = w.tmpVar(true);
          w.write("=");
          w.variable(r);
          w.write(".length");
          if (!n.hasAwait) {
            w.write(";");
            e.translate(iter);
            w.write("<");
            w.variable(iterLen);
            w.write(";");
            e.translate(iter);
            w.write("++){");
            w.newline(1);
            e.translate(n.ids[0], { isAssign: true });
            w.write("=");
            w.variable(r);
            w.write("[");
            e.translate(iter);
            w.write("];");
            e.translate(n.body);
            w.newline(-1);
            w.write("}");
          }
          else {
            //Crazy async version
            w.write(";if(");
            e.translate(iter);
            w.write("<");
            w.write(iterLen);
            w.write("){");
            var targetName = w.tmpVar(true, true);
            var namedTarget = {
                op: "await",
                name: targetName,
                isLoop: true,
                body: (
                  [
                    { op: "=", left: n.ids[0],
                      right: { op: "atom", atom: r, unary: [],
                        chain: [ { op: "arrayMember", expr: iter } ] } }
                  ].concat(n.body)
                ),
                after: [
                  { op: "+=", left: iter, right: 1 },
                    { op: "if",
                      condition: { op: "<", left: iter, right: iterLen },
                      then: [ { op: "atom", atom: targetName, unary: [],
                        chain: [
                          { op: "member", id: "call" },
                          { op: "call", args: [ "this" ] } ] } ] }
                ]
            };
            e.translate(namedTarget);
            w.write("}");
          }
          if (n.ids.length <= 1) {
            w.tmpVarRelease(iter);
          }
          w.tmpVarRelease(iterLen);
          w.tmpVarRelease(r);
        },
     "forRange": function(e, n, w) {
          var tmps = [];
          var range = n.expr;
          if (n.ids.length > 1) {
            throw new Error("Only one iteration variable supported for 'for' "
                + "statements with range arguments");
          }
          var skip = range.skip;
          var compareType = "either";
          if (skip.op !== "number") {
            var skipTmp = w.tmpVar(true);
            tmps.push(skipTmp);
            w.write("=");
            e.translate(skip);
            if (!n.hasAwait) {
              w.write(";");
            }
            else {
              w.write(",");
            }
            skip = skipTmp;
          }
          else {
            skip = skip.num;
            if (skip < 0) {
              compareType = ">";
            }
            else {
              compareType = "<";
            }
          }

          var iter = n.ids[0];
          var rangeMax = w.tmpVar(true, true);
          tmps.push(rangeMax);

          //Figure out our comparison step
          var compareTree = null;
          if (compareType === "either") {
            compareTree = { op: "ternary",
                'if': { op: "<", left: skip, right: 0 },
                'then': { op: ">", left: iter, right: rangeMax },
                'else': { op: "<", left: iter, right: rangeMax } };
          }
          else {
            compareTree = { op: compareType, left: iter, right: rangeMax };
          }

          //And our increment step
          var skipTree = { op: "+=", left: iter, right: skip };

          var realMin = range.left;
          if (!realMin) {
            realMin = 0;
          }

          if (!n.hasAwait) {
            w.write("for (");
            e.translate(iter, { isAssign: true });
            w.write("=");
            e.translate(realMin);
            w.write(",");
            w.write(rangeMax);
            w.write("=");
            e.translate(range.right);
            w.write(";");
            e.translate(compareTree);
            w.write(";");
            e.translate(skipTree);
            w.write("){");
            w.newline(1);
            e.translate(n.body);
            w.newline(-1);
            w.write("}");
          }
          else {
            //Fairly tame async version
            e.translate(iter, { isAssign: true });
            w.write("=");
            e.translate(realMin);
            w.write(",");
            w.write(rangeMax);
            w.write("=");
            e.translate(range.right);
            w.write(";if(");
            e.translate(compareTree);
            w.write("){");
            var targetName = w.tmpVar(true, true);
            var namedTarget = {
                op: "await",
                name: targetName,
                isLoop: true,
                body: n.body,
                after: [
                  skipTree,
                    { op: "if",
                      condition: compareTree,
                      then: [ { op: "atom", atom: targetName, unary: [],
                        chain: [
                          { op: "member", id: "call" },
                          { op: "call", args: [ "this" ] } ] } ] }
                ]
            };
            e.translate(namedTarget);
            w.write("}");
          }

          for (var i = 0, m = tmps.length; i < m; i++) {
            w.tmpVarRelease(tmps[i]);
          }
        },
     "id": function(e, n, w, options) {
          w.goToNode(n);
          if (w.isInArgs()) {
            w.variable(n.id, true);
            addArgDefault(e, n, w);
          }
          else if (options.isMember) {
            //Don't use variable; we don't want to create this in the local
            //scope and we're not using a variable named this.
            w.write(n.id);
          }
          else if (options.isAssign) {
            var c = w.getClosure();
            if (c === w.getClosure({ isClass: true })) {
              w.write(c.props.className + '.prototype.');
              w.write(n.id);
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
          w.newline(1);
          e.translate(n.then);
          w.newline(-1);
          w.write("}");
          if (n.else) {
            w.goToNode(n.else);
            w.write("else {");
            w.newline(1);
            e.translate(n.else);
            w.newline(-1);
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
     "jsKeyword": function(e, n, w) {
          w.write(n.js);
        },
     "keyValue": function(e, n, w) {
          var c = w.getClosure();
          if (c.props.className) {
            //Prototype assignment
            e.translate({ op: "=", left: n.key, right: n.value });
          }
          else {
            //Normal dict member
            //We use isMember on the key in case it is an ID.  This tricks the
            //compiler into not considering it as a variable used in a closure,
            //which it's not.  It's technically a string due to the way
            //javascript handles hash keys.
            e.translate(n.key, { isMember: true });
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
          e.translate(n.id, { isMember: true });
        },
     "memberClass": function(e, n, w) {
          var c = w.getClosure({ isClass: true });
          if (!c) {
            throw new Error("@class only valid in a class; line " + n.line);
          }
          var f = w.getClosure({ isFunction: true });
          if (!f) {
            throw new Error("@class only valid in a class' function; line "
                + n.line);
          }
          w.write(c.props.className + ".prototype");
        },
     "memberId": function(e, n, w, options) {
          w.goToNode(n);
          if (w.isInArgs()) {
            w.variable(n.id);
            addArgDefault(e, n, w);
            w.afterClosure(function() {
              w.write("this." + n.id + " = " + n.id + ";");
            });
            return;
          }
          var thisVar = null;
          var c = w.getClosure({ isClassMethod: true });
          if (c) {
            thisVar = w.getInstanceVariable();
          }
          else {
            c = w.getClosure({ isFunction: true });
            if (c) {
              //We're in an unbound method, just use this
              thisVar = "this";
            }
            else {
              c = w.getClosure({ isClass: true });
              if (c) {
                //We're a class property
                if (options.isAssign) {
                  //Also assign to prototype!
                  if (options.splitAtom) {
                    throw new Error("Should be impossible to splitAtom and "
                        + "isAssign");
                  }
                  w.write(c.props.className + ".prototype." + n.id);
                  w.write("=");
                }
                thisVar = c.props.className;
              }
            }
          }
          if (thisVar === null) {
            throw new Error("Unexpected member identifier '@" + n.id + "'");
          }

          if (options.splitAtom) {
            w.write("[");
            w.write(thisVar);
            w.write(",");
            w.write(thisVar);
            w.write(".");
            w.write(n.id);
            w.write("]");
          }
          else {
            w.write(thisVar);
            w.write(".");
            w.write(n.id);
          }
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
          var c = w.getClosure({ isAsyncOrClosure: true });
          if (!c) {
            throw new Error("return must be in a method or async block");
          }
          else if (c.props.isAsync) {
            //Set the result on our closest closure, since "return" in an
            //async block (return from closure) means something different
            //from "return" in an await block (no closure, function return)
            w.getClosure({ isClosure: true }).asyncResult(w, e, n.result);
          }
          else {
            w.write("return ");
            if (n.result) {
              //Otherwise, blank return statement.
              e.translate(n.result);
            }
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
          w.write(".apply(this, ");
          if (n.args == null) {
            w.write("arguments");
          }
          else {
            w.write("[");
            e.translate(n.args, { separator: ", " });
            w.write("]");
          }
          w.write(");");
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
     "throw": function(e, n, w) {
          w.goToNode(n);
          w.write("throw ");
          e.translate(n.body);
        },
     "try": function(e, n, w) {
          if (w.getClosure().props.isAsync) {
            throw new Error("'try' may not be used in an async function; "
                + "use 'await' instead");
          }
          w.write("try {");
          e.translate(n.stmt);
          w.write("}");
          if (n.catchStmt) {
            w.goToNode(n.catchStmt);
            w.write("catch (__error) {");
            w.getClosure().setVarUsed("__error", true);
            w.newline(1);
            n.catchStmt.internalId = "__error";
            e.translate(n.catchStmt);
            w.newline(-1);
            w.write("}");
          }
          if (n.finallyStmt) {
            w.goToNode(n.finallyStmt);
            w.write("finally {");
            w.newline(1);
            e.translate(n.finallyStmt.body);
            w.newline(-1);
            w.write("}");
          }
        },
     "typeof": function(e, n, w) {
          w.write("(typeof ");
          e.translate(n.right);
          w.write(")");
        },
     "bitwise_negate": function(e, n, w) {
          w.write("~");
          e.translate(n.right);
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
          if (!n.hasAwait) {
            w.write("while (");
            e.translate(n.expr);
            w.write(") {");
            w.newline(1);
            e.translate(n.body);
            w.newline(-1)
            w.write("}");
          }
          else {
            var loop = w.tmpVar(true, true);
            var realLoop = {
                op: "await",
                name: loop,
                isLoop: true,
                body: n.body,
                after: [ { op: "if", condition: n.expr,
                  then: [ { op: "atom", atom: loop, chain: [
                    { op: "member", id: "call" },
                    { op: "call", args: [ "this" ] } ] } ] }]
            };
            var ifClause = { op: "if", condition: n.expr,
              then: [ realLoop ] };
            e.translate(ifClause);
          }
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
     "%": binary,
     "<=": binary,
     ">=": binary,
     ">": binary,
     "<": binary,
     "<<": binary,
     ">>": binary,
     "&": binary,
     "|": binary,
     "^": binary,
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
              && e.getNodeAsId(n.left) === "constructor"
              && n.right.op === '->'
              ) {
            c.props.classConstructor = n.right;
            e.translate(n.right, { isConstructorFor: c.props.className,
                methodName: e.getNodeAsId(n.left) });
          }
          else {
            e.translate(n.left, { isAssign: true });
            w.write(" = ");
            var rightOptions = {};
            var cc = w.getClosure({ isClass: true });
            if (cc && cc === w.getClosure()
                && e.isNodeMemberId(n.left)
                && n.right.op !== "->") {
              throw new Error("Cannot use @id assignments at class level for "
                  + "non-methods.  Has no effect!");
            }
            if (cc
                && e.getNodeAsId(n.left) !== null
                && n.right.op === "->"
                ) {
              rightOptions.methodName = e.getNodeAsId(n.left);
              if (e.isNodeMemberId(n.left)) {
                rightOptions.isBoundToClass = true;
              }
            }
            var useFakeClosure = (c === cc && n.right.op !== "->");
            if (useFakeClosure) {
              //Since assigned ids in a class block are translated, make a fake
              //closure around the translation.
              w.startClosure({ noIndent: true, isFunction: true });
            }
            e.translate(n.right, rightOptions);
            if (useFakeClosure) {
              w.endClosure();
            }
          }
        },
     "=prop": function(e, n, w) {
          var c = w.getClosure();
          if (!c.props.className) {
            throw new Error("property definition outside of class?");
          }

          w.write("Object.defineProperty(");
          w.write(c.props.className);
          w.write('.prototype, "');
          e.translate(n.id);
          w.write('",');
          //Fake closure to stop using prototype in dictionary.
          w.startClosure({ noIndent: true, isFunction: true,
              isClassProperty: true });
          e.translate(n.descriptor);
          w.endClosure();
          w.write(");");
        },
     "+=": binary,
     "-=": binary,
     "*=": binary,
     "/=": binary,
     "&=": binary,
     "|=": binary,
     "^=": binary,
  };

  var badOpsForGoto = {
    async: true,
    asyncCall: true,
    await: true
  };

  var badOpsForReturn = {
    asyncCall: true,
    await: true,
    forList: true,
    forHash: true,
    forRange: true,
    if: true,
    return: true,
    try: true,
    throw: true,
    while: true
  };

  function Translator(writer, options) {
    this.writer = writer;
    this.options = options;
  }

  Translator.prototype.getNodeAsId = function(node) {
    //Returns either null or the name of the identifier represented by node if
    //it is a simple ID (an atom without a chain)
    //Can be id or memberId
    if (node.op === "atom"
        && (node.atom.op === "id" || node.atom.op === "memberId")
        && node.chain.length === 0) {
      return node.atom.id;
    }
    else if (node.op === "id" || node.op === "memberId") {
      return node.id;
    }
    return null;
  };

  Translator.prototype.isNodeMemberId = function(node) {
    if (this.getNodeAsId(node) === null) {
      throw new Error("isNodeMemberId is only valid with getNodeAsId");
    }
    var r = false;
    if (node.op === "atom" && node.atom.op === "memberId") {
      r = true;
    }
    else if (node.op === "memberId") {
      r = true;
    }
    return r;
  };

  Translator.prototype.translate = function(node, options, addReturnFirst) {
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
        if (i === m - 1 && options.isReturnClosure
            && !(node[i].op in badOpsForReturn)) {
          var c = w.getClosure({ isFunction: true });
          if (c.props.isAsync) {
            c.asyncResult(w, self, node[i]);
          }
          else {
            self.translate(node[i], options, true);
          }
        }
        else {
          self.translate(node[i], options);
        }
        if (i < m - 1) {
          w.write(separator);
          if (separator === ";") {
            w.newline();
          }
        }
      }
    }
    else if (typeof node === "object" && node.tree) {
      var treeOptions = { isModule: true };
      self.comments = node.comments;
      if (node.help) {
        w.write("this.__doc__=this.help=");
        self.translate(node.help, options);
        w.write(";");
      }
      self.translate(node.tree, treeOptions);
    }
    else if (typeof node === "object") {
      if (node.line && node.op !== "comment") {
        for (var i = 0, m = self.comments.length; i < m; i++) {
          if (self.comments[i].line < node.line) {
            //Make sure the comment's indentation matches our node
            self.comments[i].state = node.state;
            self.translate(self.comments[i]);
            self.comments.splice(i, 1);
            i -= 1;
            m -= 1;
          }
        }
      }
      if (!(node.op in badOpsForGoto)) {
        w.goToNode(node);
      }
      if (addReturnFirst) {
        w.write("return ");
      }
      var op = opTable[node['op']];
      if (op === undefined) {
        throw new Error("Unrecognized op: " + node['op']);
      }
      try {
        op(self, node, w, options);
      }
      catch (e) {
        if (e.message.indexOf("On line ") !== 0 && node.line) {
          e.message = "On line " + node.line + ": " + e.message;
        }
        throw e;
      }
    }
    else if (typeof node === "number") {
      w.write(node);
    }
    else if (typeof node === "string") {
      //Supported for debugging, shouldn't really be used elsewhere...
      w.write(node);
    }
    else {
      throw new Error("Unsupported type: " + typeof node);
    }
  };

  return Translator;
})();
