
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
  = !ASSERT_ON_NEWLINE _ head:expression { return [ head ]; }
  / INDENT_BLOCK_START inner:statement_list_inner? BLOCK_END
        & { return inner; } { 
      return inner;
    }
  

statement
  /* Elements at this level are either statements or require parenthesis around them */
  = if_stmt
  / "return" _ result:expression {
      return { "op": "return", "result": result };
    }
  / expression
  
if_stmt
 = "if" _ CONTINUATION_START cond:expression? CONTINUATION_END
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
  
  