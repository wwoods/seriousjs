
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
  / statement_body_block


statement_body_block
  = INDENT_BLOCK_START inner:statement_list_inner? BLOCK_END
        & { return inner; } {
      return inner;
    }


statement
  = statement_with_body
  / CONTINUATION_START stmt:statement_no_body? CONTINUATION_END
      & { return stmt; }
      { return stmt; }


statement_with_body
  = stmt:if_stmt { return R(stmt); }
  / stmt:for_stmt { return R(stmt); }
  / stmt:while_stmt { return R(stmt); }
  / try_stmt


statement_no_body
  = "return" result:(_ result:expression)? {
      return R({ "op": "return", "result": result && result[1] });
    }
  / stmt:assign_stmt { return stmt; }
  / stmt:class_stmt { return stmt; }
  / stmt:throw_stmt { return stmt; }
  / stmt:delete_stmt { return stmt; }
  / stmt:async_stmt { return stmt; }
  / "break" { return R({ op: "break" }); }
  / "continue" { return R({ op: "continue" }); }
  / expr:expression { return R(expr); }


if_stmt
 //We use CONTINUATION around expression since, even if the continuation
 //feature is used, the body of the if is only one indent in.
 = "if" CONTINUATION_OPEN innerCond:(_ cond:expression)? CONTINUATION_END
        & { return innerCond; }
        expr:statement_body
        elsePart:else_part? {
      return { "op": "if", "condition": innerCond[1], "then": expr,
          "else": elsePart || null };
    }

else_part
  = "else" expr:statement_body {
      return R(expr);
    }
  / "el" stmt:if_stmt {
      return R(stmt);
    }

for_op
  = "in"
  / "of"

for_stmt
  = "for" _ id:Identifier counterId:("," _ Identifier)? _ tail:for_stmt_tail body:statement_body {
      var op = tail.op;
      var expr = tail.expr;
      if (op === "in") {
        var ids = [ id ];
        if (counterId) {
          ids.push(counterId[2]);
        }
        if (expr.op === "rangeExpr") {
          return R({ op: "forRange", ids: ids, expr: expr, body: body });
        }
        return R({ op: "forList", ids: ids, expr: expr, body: body });
      }
      else {
        return R({ op: "forHash", keyId: id, valueId: counterId && counterId[2],
            expr: expr, body: body });
      }
    }

for_stmt_tail
  = "in" _ expr:range_expression {
      return { op: "in", expr: expr };
    }
  / op:for_op _ expr:expression {
      return { op: op, expr: expr };
    }

while_stmt
  = "while" _ expr:expression body:statement_body {
      return R({ op: "while", expr: expr, body: body });
    }

try_stmt
  = "try" stmt:statement_body catchPart:try_stmt_catch?
        finalPart:try_stmt_finally?
        & { return catchPart || finalPart; } {
      return R({ op: "try", stmt: stmt, catchStmt: catchPart,
          finallyStmt: finalPart });
    }

try_stmt_catch
  = head:try_stmt_catch_inner tail:(NEWLINE_SAME try_stmt_catch_inner)* {
      return R({ op: "catch", parts: getArray(head, tail, 1) });
    }

try_stmt_catch_inner
  = "catch" id:(_ Identifier)? cond:try_stmt_catch_cond? body:try_stmt_catch_body {
      if (cond.op === 'instanceof' && cond.left === undefined) {
        cond.left = id && id[1];
      }
      return R({ op: "catchCondition", id: id && id[1], cond: cond,
          body: body });
    }

try_stmt_catch_cond
  = _ "if" _ expr:expression { return R(expr); }
  / _ "instanceof" _ t:expression { 
      //right is filled in by try_stmt_catch_inner
      return R({ op: 'instanceof', right: t });
    }

try_stmt_catch_body
  = statement_body
  / ASSERT_ON_ENDLINE

try_stmt_finally
  = "finally" body:statement_body {
      return R({ op: "finally", body: body });
    }

throw_stmt
  = "throw" _ body:expression {
      return R({ op: "throw", body: body });
    }


delete_stmt
  = "delete" _ body:expression {
      return R({ op: "delete", body: body });
    }
