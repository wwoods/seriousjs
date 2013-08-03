  
string
  = '"""' chars:string_not_double_quote_triple* '"""' 
      { return R(stringProcess(chars)); }
  / "'''" chars:string_not_single_quote_triple* "'''"
      { return R(stringProcess(chars)); }
  / '"' chars:string_not_double_quote* '"'
      { return R(stringProcess(chars)); }
  / "'" chars:string_not_single_quote* "'" 
      { return R(stringProcess(chars)); }

string_not_double_quote_triple
  = string_interpol
  / !'"""' !"#{" ch:string_ch { return ch; }
  
string_not_single_quote_triple
  = string_interpol
  / !"'''" !"#{" ch:string_ch { return ch; }
  
string_not_double_quote
  = string_interpol
  / "\\\\"
  / '\\"'
  / !["\n] !"#{" ch:string_ch { return ch; }

string_not_single_quote
  = string_interpol
  / "\\\\"
  / "\\'"
  / !['\n] !"#{" ch:string_ch { return ch; }
  
string_interpol
  = "#{" _ expr:expression _ "}" {
      return R({ op: "()", expr: expr });
    }

string_for_require
  = ![ \t\r\n,] ch:. { return ch; }


string_ch
  = "\\" ch:. { return "\\" + ch; }
  / .
  