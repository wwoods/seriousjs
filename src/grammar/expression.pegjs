

expression
  = lambda
  / base:atom_chain [ \t]+ args:arguments_list
        & { return args; } {
      //This is the paren-less syntax for calling a function;
      //for instance: "fib n+1"
      var call = { "op": "call", "args": args };
      base.chain.push(call);
      return base;
    }
  / async_expr
  / ternary_expr

range_expression
  = "[" _ rangeExpr:range_expression_inner (_ "]" / ASSERT_ON_ENDLINE) {
      return rangeExpr;
    }

range_expression_inner
  = left:(expression _)? ":" right:(_ expression)? skip:(_ ":" _ expression)? {
      if (left) {
        left = left[0];
      }
      if (right) {
        right = right[1];
      }
      if (skip) {
        skip = skip[3];
      }
      else {
        skip = { op: "number", num: 1 };
      }
      return R({ op: "rangeExpr", left: left, right: right, skip: skip });
    }

ternary_expr
  = head:logic_expr tail:(_ "then" _ expression _ "else" _ expression)? {
      var r = head;
      if (tail) {
        r = { op: "ternary", if: r, then: tail[3], else: tail[7] };
      }
      return R(r);
    }

logic_op
  = "and"
  / "or"

logic_expr
  = head:not_expr tail:(_ logic_op _ not_expr)* {
      return R(getBinary(head, tail, 1, 3));
    }

not_expr
  = "not" _ expr:compare_expr { return R({ op: "unary_not", right: expr }); }
  / expr:compare_expr { return expr; }

compare_op
  = "<="
  / "=="
  / "!="
  / ">="
  / "<"
  / ">"
  / "not in" { return "in_not"; }
  / "not of" { return "of_not"; }
  / "in" { return "in"; }
  / "of" { return "of"; }

compare_expr
  = head:instance_expr tail:(_ compare_op _ instance_expr)* {
      return R(getBinary(head, tail, 1, 3));
    }

instance_expr
  = head:shift_expr tail:(_ "instanceof" _ shift_expr)? {
      var r = head;
      if (tail) {
        r = { op: "instanceof", left: r, right: tail[3] };
      }
      return R(r);
    }

shift_op
  = "<<"
  / ">>"

shift_expr
  = head:add_expr tail:(_ shift_op _ add_expr)* {
      return getBinary(head, tail, 1, 3);
    }

add_op
  = "+"
  / "-"

add_expr
  = head:mul_expr tail:(_ add_op _ mul_expr)* {
      return getBinary(head, tail, 1, 3);
    }

mul_op
  = "*" / "/" / "%"

mul_expr
  = head:existence_expr tail:(_ mul_op _ existence_expr)* {
      return getBinary(head, tail, 1, 3);
    }

existence_expr
  = base:atom_chain ex:(_ "?")? {
      var r = base;
      if (ex) {
        r = R({ op: "existence", atom: r });
      }
      return r;
    }

super_expr
  = "super" "(" args:arguments_delimited ")"? {
      return R({ op: "super", args: args });
    }
  / "super" { return R({ op: "super", args: null }); }

atom_chain
  = super_expr
  / un:unary_op* base:base_atom chain:atom_mod* {
      var r = R({ op: "atom", atom: base, chain: chain });
      for (var i = un.length - 1; i >= 0; --i) {
        r = { op: un[i], right: r };
      }
      return r;
    }

unary_op
  = "new" _ { return "unary_new"; }
  / "typeof" _ { return "typeof"; }
  / "-" { return "unary_negate"; }

base_atom
  = dict_literal
  / "@@" id:Identifier {
      return R({ op: "boundMethod", id: id });
    }
  / IdentifierMaybeMember
  / js:jsKeyword { return R({ op: "jsKeyword", js: js }); }
  / string
  / list_literal
  / regex_literal
  / num:NumberLiteral { return R({ op: "number", num: num}); }
  // We put parens in a continuation so that multi-line parens look like the
  // following:
  // (a
  //   or b
  / "(" CONTINUATION_OPEN
      innards:(_ paren_expr (_ ")")?)?
      //If we're parenthesis terminated, we don't need the continuation to
      //end with a newline.
      //Luckily, the code will still execute, popping our block off
      ended:CONTINUATION_END?
      & { return innards; }
      //We MUST use either an end of line or a closing paren to terminate the
      //structure.
      & { return ended || innards[2]; } {
      return R({ op: "()", expr: innards[1] });
    }

jsKeyword
  = "true"
  / "this"
  / "false"
  / "null"
  / "undefined"

paren_expr
  = assign_stmt
  / expression

assignable_atom
  = base:base_assignable_atom chain:atom_mod*
        & {
          var end = base;
          if (chain.length) {
            end = chain[chain.length - 1];
          }
          return end.op === 'id'
              || end.op === 'memberId'
              || end.op === 'member'
              || end.op === 'arrayMember'
              ;
        } {
      var r = R({ op: "atom", unary: [], atom: base, chain: chain });
      return r;
    }

base_assignable_atom
  = IdentifierMaybeMember
  / "(" _ expr:(assign_stmt / expression) _ ")" {
      return R({ op: "()", expr: expr });
    }

list_literal
  = "[" args:arguments_delimited ("]" / ASSERT_ON_ENDLINE) {
      return { "op": "list", "elements": args };
    }

##include dict.pegjs

##include regex.pegjs

atom_mod
  //Method calls cannot have space before them.
  = "(" args:arguments_delimited (")" / ASSERT_ON_ENDLINE) {
      return R({ op: "call", args: args });
    }
  / _ mod:atom_mod_expr { return mod; }

atom_mod_expr
  = "[" _ expr:(range_expression_inner / expression) (_ "]" / ASSERT_ON_ENDLINE) {
      return { "op": "arrayMember", "expr": expr };
    }
  / "." id:Identifier {
      return { "op": "member", "id": id };
    }
