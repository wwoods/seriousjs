
async_stmt
  = "async" _ call:async_call {
      return R(call);
    }
  / await_stmt


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


await_stmt
  = "await" _ time:DecimalLiteral interval:"s"? {
      var timeMs = parseFloat(time);
      if (interval) {
        if (interval === "s") {
          timeMs *= 1000.0;
        }
        else {
          throw new Error("Could not parse await interval: " + interval);
        }
      }
      //note that "after" will be filled in automagically before we get to
      //the translator.
      return R({
          op: "await",
          after: null,
          body: [ R({ op: "asyncCall", call: {
            op: "asyncCallee", func: { op: "id", id: "setTimeout" },
            args: [ { op: "id", id: "callback" },
              { op: "number", num: timeMs } ] } }) ]
      });
    }
  / "await" _ call:async_call {
      return R({ op: "await", after: null,
          body: [ R(call) ] });
    }
  / "await" body:statement_body_block {
      return R({ op: "await", after: null, body: body });
    }