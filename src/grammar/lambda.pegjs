lambda_op "-> or =>"
  = op:("->" / "=>") {
      log("Got lambda_op " + op); 
      return op;
    }
  
lambda "function"
  = parms:lambda_args? op:lambda_op 
        body:lambda_body {
      if (!parms) {
        parms = [];
      }
      log("Finished lambda at " + _pos());
      return { op: op, parms: parms, body: body.body, doc: body.doc };
    }
    
lambda_args
  //Note - we might have leading and trailing whitespace.
  = d:dict_assignable _ {
      return [ { op: "dictAssignArgs", assign: d } ];
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
  = Identifier
 

lambda_body
  = CHECK_NEWLINE !ASSERT_ON_NEWLINE _ head:expression { 
      return R({ body: [ head ] }); 
    }
  / INDENT_BLOCK_START doc:lambda_doc? inner:statement_list_inner? BLOCK_END
        & { return inner; } { 
      return R({ doc: doc, body: inner });
    }
    
lambda_doc
  = doc:string NEWLINE { return doc; }
