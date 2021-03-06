
async_stmt
  = async_stmt_inner
  / await_stmt
  / async_expr


/* Separate to allow for usage in async lambdas */
/* Note that all "await" that the user types should have catchAsync: true so
   that they stop any async blocks under them.  Generated awaits (such as a
   for loop or if loop) do not have this attribute. */
async_expr
  = "async" _ call:async_call {
      return call;
    }
  / "await" _ time:await_time {
      //note that "after" will be filled in automagically before we get to
      //the translator.
      var method = "setTimeout";
      var args = [ { op: "id", id: "callback" }, time ];
      if (time.op === "number" && time.num == 0) {
        method = "setImmediate";
        args.pop();
      }
      return R({
          op: "await",
          catchAsync: true,
          after: null,
          body: [ R({ op: "asyncCall", spec: { asyncExtern: true }, call: {
            op: "asyncCallee", func: method,
            args: args } }) ]
      });
    }
  / "await" _ call:async_call {
      var r = R({ op: "await", catchAsync: true, after: null,
          body: [ call ] });
      if (call.op === "closure") {
        //It had try or finally...
        var realCall = call.body[0];
        if (realCall.catchStmt) {
          r.catchStmt = realCall.catchStmt;
          realCall.catchStmt = null;
        }
        if (realCall.finallyStmt) {
          r.finallyStmt = realCall.finallyStmt;
          realCall.finallyStmt = null;
        }
        //r.body = realCall;
      }
      return r;
    }


async_stmt_inner
  = "async" body:statement_body_block catchStmt:async_catch?
        finallyStmt:async_finally? {
      var r = { op: "closure", body: R({ op: "async", body: body,
          catchStmt: catchStmt, finallyStmt: finallyStmt }) };
      return r;
    }


async_call
  = spec:async_call_spec* assign:async_assign_clause* call:inner_async_call catchStmt:async_catch?
      finallyStmt:async_finally? {
      var r = R({ op: "asyncCall", assign: assign, call: call, spec: {} });
      var rCall = r;
      if (catchStmt || finallyStmt) {
        //Don't add a closure here...  it has rammifications on variable scope.
        r = { op: "async", body: r,
            catchStmt: catchStmt, finallyStmt: finallyStmt };
      }

      for (var i = 0, m = spec.length; i < m; i++) {
        rCall.spec[spec[i]] = true;
      }

      return r;
    }


async_call_spec
  = "extern" _ { return "asyncExtern"; }
  / "noerror" _ { return "asyncNoError"; }


async_assign_clause
  = head:async_tuple_assign_part tail:(ARG_SEP async_tuple_assign_part)* _ "=" _
      {
      var r = [ head ];
      for (var i = 0, m = tail.length; i < m; i++) {
        r.push(tail[i][1]);
      }
      return R({ op: "tupleAssign", left: r });
    }
  / assign_clause


async_tuple_assign_part
  = dict_assignable
  / left:assignable_atom { return R({ op: "=", left: left }); }


inner_async_call
  = base:atom_chain args:([ \t]+ arguments_list)? {
      //atom_chain also catches implicit call, so if the last part of base is
      //a call and we have no args, use that.
      if (args) {
        args = args[1];
      }
      else {
        if (base.chain.length > 0
            && base.chain[base.chain.length - 1].op === "call") {
          var realCall = base.chain.pop();
          args = realCall.args;
        }
        else {
          args = [];
        }
      }
      return R({ op: "asyncCallee", func: base, args: args });
    }


async_catch
  = cont:CONTINUATION_POP inner:(NEWLINE_SAME try_stmt_catch)?
        & { continuationPush(cont); return inner; } {
      return inner[1];
    }


async_finally
  = cont:CONTINUATION_POP inner:(NEWLINE_SAME try_stmt_finally)?
        & { continuationPush(cont); return inner; } {
      return inner[1];
    }


await_time
  = time:NumberLiteral interval:await_interval? {
      interval = interval || 1.0;
      return R({ op: "number", num: parseFloat(time) * interval });
    }
  / "(" expr:expression ")" interval:await_interval? {
      //If expr was atom, we're actually an async call, so don't handle here.
      interval = interval || 1.0;
      if (interval != 1.0) {
        return { op: "*", left: { op: "()", expr: expr }, right: interval };
      }
      else {
        return expr;
      }
    }


await_interval
  = "s" { return 1000.0; }
  / "ms" { return 1.0; }


await_stmt
  = "await" body:statement_body_block catchStmt:async_catch?
        finallyStmt:async_finally? {
      return R({ op: "await", catchAsync: true, after: null, body: body,
          catchStmt: catchStmt, finallyStmt: finallyStmt });
    }
