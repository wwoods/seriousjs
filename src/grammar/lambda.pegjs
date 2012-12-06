lambda_op "-> or =>"
  = op:("->" / "=>") {
      log("Got lambda_op " + op); 
      return op;
    }
  
lambda "function"
  = parms:lambda_args? op:lambda_op 
        body:statement_body {
      if (!parms) {
        parms = [];
      }
      log("Finished lambda at " + _pos());
      return { "op": op, "parms": parms, "body": body };
    }
    
lambda_args
  //Note - we might have leading and trailing whitespace.
  = "(" _ ARG_SEP? args:lambda_args_list?
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

