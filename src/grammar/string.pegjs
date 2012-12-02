  
string
  = '"""' chars:string_not_double_quote_triple* '"""' 
      { return { "op": "string", "chars": chars.join("") } }
  / "'''" chars:string_not_single_quote_triple* "'''"
      { return { "op": "string", "chars": chars.join("") } }
  / '"' chars:string_not_double_quote* '"'
      { return { "op": "string", "chars": chars.join("") } }
  / "'" chars:string_not_single_quote* "'" 
      { return { "op": "string", "chars": chars.join("") } }

string_not_double_quote_triple
  = !'"""' .
  
string_not_single_quote_triple
  = !"'''" .
  
string_not_double_quote
  = "\\\\"
  / '\\"'
  / !["\n] .

string_not_single_quote
  = "\\\\"
  / "\\'"
  / !['\n] .
  
  