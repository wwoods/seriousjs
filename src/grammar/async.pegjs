
async_stmt
  = "async" inner:async_stmt_inner {
      return R(inner);
    }
  / await_stmt


async_stmt_inner
  = closure:(_ "closure")? body:statement_body_block {
      var r = R({ op: "async", body: body });
      if (closure) {
        r.hasClosure = true;
        r = R({ op: "closure", body: r });
      }
      return r;
    }
  / _ call:async_call {
      return R(call);
    }


async_call
  = assign:assign_clause* call:inner_async_call {
      return R({ op: "asyncCall", assign: assign, call: call });
    }


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
  = "await" _ time:await_time {
      //note that "after" will be filled in automagically before we get to
      //the translator.
      return R({
          op: "await",
          after: null,
          body: [ R({ op: "asyncCall", call: {
            op: "asyncCallee", func: { op: "id", id: "setTimeout" },
            args: [ { op: "id", id: "callback" }, time ] } }) ]
      });
    }
  / "await" _ call:async_call {
      return R({ op: "await", after: null,
          body: [ R(call) ] });
    }
  / "await" body:statement_body_block {
      return R({ op: "await", after: null, body: body });
    }
