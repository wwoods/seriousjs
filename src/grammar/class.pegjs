
class_stmt
  = "class" _ id:Identifier ext:(_ "extends" _ Identifier)?
        body:class_body? {
      var parent = null;
      if (ext) {
        parent = ext[3];
      }
      return R({ op: "class", name: id, parent: parent, body: body });
    }


class_body
  = INDENT_BLOCK_START inner:class_statement_list? BLOCK_END
        & { return inner; } {
      return inner;
    }

class_statement_list
  = ASSERT_ON_NEWLINE
        head:class_statement tail:(NEWLINE_SAME class_statement)*
        {
      var r = [ head ];
      for (var i = 0, m = tail.length; i < m; i++) {
        r.push(tail[i][1]);
      }
      return r;
    }


class_statement
  = CONTINUATION_START stmt:class_statement_inner? CONTINUATION_END
      & { return stmt; } {
      return stmt;
    }


class_statement_inner
  = id:assignable_atom _ ":" _ val:class_assign_right {
      return R({ op: "=", left: id, right: val });
    }


class_assign_right
  = ASSERT_ON_NEWLINE right:dict_literal { return right; }
  / expression