    
assignable
  = Identifier
    
assign_stmt 
  = head:(assignable _ "=" _)+ tail:expression {
      if (!head) {
        return tail;
      }
      var r = tail;
      for (var i = head.length - 1; i >= 0; --i) {
        r = { "op": "=", "left": head[i][0], "right": r };
      }
      return r;
    }
