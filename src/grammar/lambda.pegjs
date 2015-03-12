lambda_op
  = op:"->" {
      log("Got lambda_op " + op);
      return op;
    }


lambda
  //CONTINUATION_END requires ASSERT_ON_ENDLINE, but we always want to pop
  //both.  Additionally, one-line lambdas don't need an endline, as they may
  //be bounded by e.g. parenthesis.  So, CONTINUATION_ENDs are optional here.
  = &{ return indentBlockStart(0, { isLambda: true }); } CONTINUATION_OPEN
        l:lambda_inner? CONTINUATION_END? CONTINUATION_END? &{ return l; } {
      return l;
    }


lambda_inner
  = spec:lambda_spec parms:lambda_args? op:lambda_op
        body:lambda_body {
      if (!parms) {
        parms = [];
      }
      log("Finished lambda at " + _pos());
      return { op: op, parms: parms, body: body.body, doc: body.doc,
          spec: spec, returnImplied: body.returnImplied };
    }


lambda_spec
  = async:("async" _ async_spec_mods*)? {
      r = {};
      if (async) {
        r.async = true;
        for (var i = 0, m = async[2].length; i < m; i++) {
          r[async[2][i]] = true;
        }
      }
      return r;
    }


async_spec_mods
  = "noerror" _ { return "asyncNoError"; }
  / "nocascade" _ { return "asyncNoCascade"; }
  / "extern" _ { return "asyncExtern"; }


lambda_args
  //Note - we might have trailing whitespace in any of these
  = d:dict_assignable _ {
      return [ R({ op: "dictAssignArgs", assign: d }) ];
    }
  / "(" _ ARG_SEP? args:lambda_args_list?
        ARG_SEP? _ ")" _ {
      if (!args) {
        return [];
      }
      return args;
    }


lambda_args_list
  //A list of arguments that has no delimiter
  = head:lambda_arg tail:(ARG_SEP lambda_arg)* {
      return getArray(head, tail, 1);
    }


lambda_arg
  = assignTo:lambda_arg_assignable
        defaultVal:(_ "=" _ expression)? {
      if (defaultVal) {
        assignTo.defaultVal = defaultVal[3];
      }
      return assignTo;
    }


lambda_arg_assignable
  = id:IdentifierMaybeMember unmapVal:(_ ":" _ dict_assignable)? {
      var r = id;
      if (unmapVal) {
        r = R({ op: "dictAssignArgs", assign: unmapVal[3], id: id });
      }
      return r;
    }
  / d:dict_assignable {
      return R({ op: "dictAssignArgs", assign: d });
    }


lambda_body
  = CHECK_NEWLINE !ASSERT_ON_NEWLINE _
        CONTINUATION_OPEN
        head:(assign_stmt / expression)?
        CONTINUATION_END? // Doesn't have to be end of line
        & { return head; } {
      return R({ body: [ head ], returnImplied: true });
    }
  / INDENT_BLOCK_START doc:lambda_doc? inner:statement_list_inner? BLOCK_END
        & { return inner; } {
      return R({ doc: doc, body: inner });
    }


lambda_doc
  = doc:string NEWLINE {
      //Trim them
      doc.chars = doc.chars.replace(/^\s+|\s+$/g, "");
      return doc;
    }
