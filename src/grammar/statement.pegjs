
statement_list
  = BLOCK_START inner:(statement_list_inner)? BLOCK_END
        & { return inner; } {
      return inner;
    }
    
statement_list_inner
  = ASSERT_ON_NEWLINE 
        head:statement tail:(NEWLINE_SAME statement)* 
        {
      var r = [ head ];
      for (var i = 0, m = tail.length; i < m; i++) {
        r.push(tail[i][1]);
      }
      return r;
    }

statement_body
  = CHECK_NEWLINE !ASSERT_ON_NEWLINE _ head:expression { return [ head ]; }
  / INDENT_BLOCK_START inner:statement_list_inner? BLOCK_END
        & { return inner; } { 
      return inner;
    }

statement
  = CONTINUATION_START stmt:statement_inner? CONTINUATION_END
      & { return stmt; } { return stmt; }
      
statement_inner
  = stmt:if_stmt { return R(stmt); }
  / "return" _ result:expression {
      return R({ "op": "return", "result": result });
    }
  / stmt:assign_stmt { return R(stmt); }
  / expr:expression { return R(expr); }
  
if_stmt
 = "if" _ cond:expression?
        & { return cond; } 
        expr:statement_body 
        elsePart:else_part? {
      return { "op": "if", "condition": cond, "then": expr, 
          "else": elsePart || null };
    }

else_part
  = "else" expr:statement_body {
      return expr;
    }
  / "el" stmt:if_stmt {
      return stmt;
    }
  
  