

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
  = head:compare_expr tail:(_ "?" _ expression _ ":" _ expression)? {
      var r = head;
      if (tail) {
        r = { op: "ternary", if: r, then: tail[3], else: tail[7] };
      }
      return r;
    }
  
compare_op
  = "<="
  / "=="
  / ">="
  / "<"
  / ">"
  
compare_expr
  = head:add_expr tail:(_ compare_op _ add_expr)* {
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

base_atom
  = dict_literal
  / Identifier
  / string
  / list_literal
  / num:DecimalLiteral { return R({ op: "number", num: num}); }
  / "(" _ expr:assign_stmt _ ")" {
      return { "op": "()", "expr": expr };
    }
  / "(" _ expr:expression _ ")" {
      return { "op": "()", "expr": expr };
    }
    
list_literal
  = "[" args:arguments_delimited "]"? {
      return { "op": "list", "elements": args };
    }
    
##include dict.pegjs
  
atom_mod
  = _ mod:atom_mod_expr { return mod; }
  
atom_mod_expr
  = "(" args:arguments_delimited ")"? {
      return { "op": "call", "args": args };
    }
  / "[" expr:expression "]" {
      return { "op": "arrayMember", "expr": expr };
    }
  / "." id:Identifier {
      return { "op": "member", "id": id };
    }
