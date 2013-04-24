lambda_op
  = op:"->" {
      log("Got lambda_op " + op);
      return op;
    }


lambda
  = spec:lambda_spec parms:lambda_args? op:lambda_op
        body:lambda_body {
      if (!parms) {
        parms = [];
      }
      log("Finished lambda at " + _pos());
      return { op: op, parms: parms, body: body.body, doc: body.doc,
          spec: spec };
    }


lambda_spec
  = async:("async" _)? { return { async: (async ? true : false) }; }


lambda_args
  //Note - we might have leading and trailing whitespace.
  = d:lambda_dict_arg _ {
      return [ d ];
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
  = lambda_dict_arg
  / member:"@"? id:Identifier defaultVal:(_ "=" _ expression)? {
      if (member) {
        id.op = "memberId";
      }
      if (defaultVal) {
        id.defaultVal = defaultVal[3];
      }
      return id;
    }


lambda_dict_arg
  = d:dict_assignable e:(_ "=" _ "@"? Identifier)? {
      var id = null;
      if (e) {
        id = e[4];
        if (e[3]) {
          id.op = "memberId";
        }
      }
      return R({ op: "dictAssignArgs", assign: d, id: id });
    }


lambda_body
  = CHECK_NEWLINE !ASSERT_ON_NEWLINE _ head:(assign_stmt / expression) {
      return R({ body: [ head ] });
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
