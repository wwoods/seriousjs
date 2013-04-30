
async_stmt
  = async_stmt_inner
  / await_stmt
  / async_expr


/* Separate to allow for usage in async lambdas */
async_expr
  = "async" _ call:async_call {
      return call;
    }
  / "await" _ time:await_time {
      //note that "after" will be filled in automagically before we get to
      //the translator.
      return R({
          op: "await",
          after: null,
          body: [ R({ op: "asyncCall", call: {
            op: "asyncCallee", func: "setTimeout",
            args: [ { op: "id", id: "callback" }, time ] } }) ]
      });
    }
  / "await" _ call:async_call {
      var r = R({ op: "await", after: null, body: [ call ] });
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
  = assign:async_assign_clause* call:inner_async_call catchStmt:async_catch?
      finallyStmt:async_finally? {
      var r = R({ op: "asyncCall", assign: assign, call: call });
      if (catchStmt || finallyStmt) {
        //Don't add a closure here...  it has rammifications on variable scope.
        r = { op: "async", body: r,
            catchStmt: catchStmt, finallyStmt: finallyStmt };
      }
      return r;
    }


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
      if (!args) {
        if (base.chain.length > 0
            && base.chain[base.chain.length - 1].op === "call") {
          var realCall = base.chain.pop();
          args = realCall.args;
        }
      }
      return R({ op: "asyncCallee", func: base, args: args && args[1] || [] });
    }
  / base:atom_chain "(" args:arguments_delimited ")"? {
      return R({ op: "asyncCallee", func: base, args: args });
    }


async_catch
  = cont:CONTINUATION_POP inner:(NEWLINE_SAME "catch" (_ Identifier)? statement_body)?
        & { continuationPush(cont); return inner; } {
      var eId = inner[2] && inner[2][1];
      return R({ op: "catch", id: eId, body: inner[3] });
    }


async_finally
  = cont:CONTINUATION_POP inner:(NEWLINE_SAME "finally" statement_body)?
        & { continuationPush(cont); return inner; } {
      return R({ op: "finally", body: inner[2] });
    }


await_time
  = time:DecimalLiteral interval:await_interval? {
      interval = interval || 1.0;
      return R({ op: "number", num: parseFloat(time) * interval });
    }
  / "(" expr:expression ")" {
      //If expr was atom, we're actually an async call, so don't handle here.
      return expr;
    }


await_interval
  = "s" { return 1000.0; }
  / "ms" { return 1.0; }


await_stmt
  = "await" body:statement_body_block catchStmt:async_catch?
        finallyStmt:async_finally? {
      return R({ op: "await", after: null, body: body, catchStmt: catchStmt,
          finallyStmt: finallyStmt });
    }
