
assign_op
  = "="
  / "+="
  / "-="
  / "*="
  / "/="
    
assign_stmt 
  = head:assign_clause+ tail:expression {
      var r = tail;
      for (var i = head.length - 1; i >= 0; --i) {
        head[i].right = r;
        r = head[i];
      }
      return R(r);
    }
    
assign_clause
  = op:dict_assignable _ "=" _ {
      return op;
    }
  / left:assignable_atom _ op:assign_op _ {
      return R({ op: op, left: left });
    }
    
dict_assignable
  = "{" mod:dict_assignable_mod? _ head:Identifier 
        tail:(ARG_SEP Identifier)* _ "}" {
      return R({ op: "dictAssign", keys: getArray(head, tail, 1), mod: mod });
    }
    
dict_assignable_mod
  = "="
  / "<"
