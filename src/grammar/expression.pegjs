

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
  / ternary_expr

ternary_expr
  = head:logic_expr tail:(_ "?" _ expression _ ":" _ expression)? {
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
  = head:compare_expr tail:(_ logic_op _ compare_expr)* {
    return R(getBinary(head, tail, 1, 3));
  }

compare_op
  = "<="
  / "=="
  / ">="
  / "<"
  / ">"

compare_expr
  = head:instance_expr tail:(_ compare_op _ instance_expr)* {
      return R(getBinary(head, tail, 1, 3));
    }

instance_expr
  = head:add_expr tail:(_ "instanceof" _ add_expr)? {
      var r = head;
      if (tail) {
        r = { op: "instanceof", left: r, right: tail[3] };
      }
      return R(r);
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
  = head:atom_chain tail:(_ mul_op _ atom_chain)* {
    return getBinary(head, tail, 1, 3);
  }

atom_chain
  = un:unary_op* base:base_atom chain:atom_mod* {
    var r = R({ op: "atom", unary: un, atom: base, chain: chain });
    for (var i = un.length - 1; i >= 0; --i) {
      r = { op: un[i], right: r };
    }
    return r;
  }

unary_op
  = "not" _ { return "unary_not"; }
  / "new" _ { return "unary_new"; }
  / "-" { return "unary_negate"; }

base_atom
  = dict_literal
  / IdentifierMaybeMember
  / string
  / list_literal
  / num:DecimalLiteral { return R({ op: "number", num: num}); }
  / "(" _ expr:assign_stmt _ ")" {
      return { "op": "()", "expr": expr };
    }
  / "(" _ expr:expression _ ")" {
      return { "op": "()", "expr": expr };
    }

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
  = "[" args:arguments_delimited "]"? {
      return { "op": "list", "elements": args };
    }

##include dict.pegjs

atom_mod
  //Method calls cannot have space before them.
  = "(" args:arguments_delimited ")"? {
      return R({ op: "call", args: args });
    }
  / _ mod:atom_mod_expr { return mod; }

atom_mod_expr
  = "[" expr:expression "]" {
      return { "op": "arrayMember", "expr": expr };
    }
  / "." id:Identifier {
      return { "op": "member", "id": id };
    }
