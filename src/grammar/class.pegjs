
class_stmt
  = "class" _ id:Identifier ext:(_ "extends" _ atom_chain)?
        uses:(_ "uses" _ atom_chain (ARG_SEP atom_chain)*)?
        body:class_body? {
      var parent = null;
      if (ext) {
        parent = ext[3];
      }
      var useList = [];
      if (uses) {
        useList.push(uses[3]);
        for (var i = 0, m = uses[4].length; i < m; i++) {
          useList.push(uses[4][i][1]);
        }
      }
      body = body || { statements: [] };
      return R({ op: "class", name: id, parent: parent, body: body.statements,
          uses: useList, docString: body.docString });
    }


class_body
  = INDENT_BLOCK_START docString:class_docstring? inner:class_statement_list? BLOCK_END
        & { return docString || inner; } {
      return { docString: docString, statements: inner };
    }


class_docstring
  = ASSERT_ON_NEWLINE str:string NEWLINE_SAME? { return str; }


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
  = "property" _ id:assignable_atom desc:class_property_body {
      return R({ op: "=prop", id: id, descriptor: desc });
    }
  / id:class_assign_id _ ":" _ val:class_assign_right {
      //Disallowing a memberId to be assigned to a non-lambda is done in
      //the translator.
      return R({ op: "=", left: id, right: val });
    }


class_property_body
  = INDENT_BLOCK_START desc:dict_literal? BLOCK_END &{ return desc; } {
      return desc;
    }
  / _ getter:lambda {
      return R({ op: "dict", elements: [ { op: "keyValue", key: "get", 
          value: getter } ] });
    }


class_assign_id
  = IdentifierExceptJsKeyword
  / "@" id:IdentifierExceptJsKeyword {
      return R({ op: "memberId", id: id.id });
    }


class_assign_right
  = ASSERT_ON_NEWLINE right:dict_literal { return right; }
  / expression
