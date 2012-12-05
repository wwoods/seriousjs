lambda_op
  = op:("->" / "=>") {
      log("Got lambda_op " + op); 
      return op;
    }
  
lambda "function"
  = parms:("(" _ arguments_delimited _ ")" _)? op:lambda_op 
        body:statement_body {
      if (!parms) {
        parms = [];
      }
      else {
        parms = parms[2];
      }
      log("Finished lambda at " + _pos());
      return { "op": op, "parms": parms, "body": body };
    }
    