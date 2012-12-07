  
string
  = '"""' chars:string_not_double_quote_triple* '"""' 
      { return { op: "string", chars: stringMultiline(chars.join("")) } }
  / "'''" chars:string_not_single_quote_triple* "'''"
      { return { op: "string", chars: stringMultiline(chars.join("")) } }
  / '"' chars:string_not_double_quote* '"'
      { return { op: "string", chars: stringSingleline(chars.join("")) } }
  / "'" chars:string_not_single_quote* "'" 
      { return { op: "string", chars: stringSingleline(chars.join("")) } }

string_not_double_quote_triple
  = !'"""' ch:. { return ch; }
  
string_not_single_quote_triple
  = !"'''" ch:. { return ch; }
  
string_not_double_quote
  = "\\\\"
  / '\\"'
  / !["\n] ch:. { return ch; }

string_not_single_quote
  = "\\\\"
  / "\\'"
  / !['\n] ch:. { return ch; }

string_not_space
  = ![ \t\r\n] ch:. { return ch; }
  