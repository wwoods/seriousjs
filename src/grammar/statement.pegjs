
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
      & { return stmt; }
      { stmt.line = line(); return R(stmt); }

statement_inner
  = stmt:if_stmt { return R(stmt); }
  / stmt:for_stmt { return R(stmt); }
  / "return" _ result:expression {
      return R({ "op": "return", "result": result });
    }
  / try_stmt
  / stmt:assign_stmt { return stmt; }
  / stmt:class_stmt { return stmt; }
  / expr:expression { return R(expr); }

if_stmt
 = "if" _ cond:expression
        expr:statement_body
        elsePart:else_part? {
      return { "op": "if", "condition": cond, "then": expr,
          "else": elsePart || null };
    }

else_part
  = "else" expr:statement_body {
      return R(expr);
    }
  / "el" stmt:if_stmt {
      return R(stmt);
    }

for_stmt
  = "for" _ id:Identifier _ "in" _ expr:expression body:statement_body {
      return R({ op: "forList", ids: [ id ], expr: expr, body: body });
    }

try_stmt
  = "try" stmt:statement_body id:try_stmt_catch then:statement_body {
      return R({ op: "try", stmt: stmt, catchId: id, catchCode: then });
    }

try_stmt_catch
  //Separate rule to get the line #
  = "catch" _ id:Identifier {
      return R(id);
    }

class_stmt
  = "class" _ id:Identifier ext:(_ "extends" _ Identifier)?
        body:statement_body? {
      var parent = null;
      if (ext) {
        parent = ext[3];
      }
      return R({ op: "class", name: id, parent: parent, body: body });
    }

