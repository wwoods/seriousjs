

expression
  = assign_stmt
  / lambda
  / base:atom_chain _ CONTINUATION_START args:arguments_list? CONTINUATION_END
        & { return args; } {
      //This is the paren-less syntax for calling a function;
      //for instance: "fib n+1"
      var call = { "op": "call", "args": args };
      base.chain.push(call);
      return base;
    }
  / compare_expr
  
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
  = base:base_atom chain:atom_mod* {
    return { "op": "atom", "atom": base, "chain": chain };
  }

base_atom
  = Identifier
  / string
  / list_literal
  / dict_literal
  / DecimalLiteral
  / "(" _ expr:expression _ ")" { 
      return { "op": "()", "expr": expr }; 
    }
    
list_literal
  = "[" args:arguments_delimited "]"? {
      return { "op": "list", "elements": args };
    }
    
##include dict.pegjs
  
atom_mod
  = "(" args:arguments_delimited ")"? {
      return { "op": "call", "args": args };
    }
  / "[" expr:expression "]" {
      return { "op": "arrayMember", "expr": expr };
    }
  / "." id:Identifier {
      return { "op": "member", "id": id };
    }
