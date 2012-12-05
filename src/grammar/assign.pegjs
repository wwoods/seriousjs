    
assignable
  = Identifier
  
assign_op "assign operator"
  = "="
  / "+="
  / "-="
  / "*="
  / "/="
    
assign_stmt 
  = head:(assignable _ assign_op _)+ tail:expression {
      if (!head) {
        return tail;
      }
      var r = tail;
      for (var i = head.length - 1; i >= 0; --i) {
        r = { "op": head[i][2], "left": head[i][0], "right": r };
      }
      return r;
    }
