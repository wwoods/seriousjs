
dict_literal
  = "{" args:dict_arguments_delimited "}"? {
      return { "op": "dict", "elements": args };
    }
  / INDENT_BLOCK_START args:dict_arguments_list? BLOCK_END
        & { return args; } {
      return { "op": "dict", "elements": args };
    }
    
dict_arguments_delimited
  //A list of arguments delimited by something like [] or ().
  //May go into an indented body.
  //We use MAYBE_BLOCK_END so that end delimiters (like ] or ) ) can be
  //on the same line as the final content.
  = MAYBE_INDENT_BLOCK_START args:dict_arguments_delimited_inner? MAYBE_BLOCK_END 
        & { return args; } {
      return args;
    }

dict_arguments_delimited_inner
  //Note - we might have leading and trailing whitespace.
  = _? ARG_SEP? elements:dict_arguments_list? ARG_SEP? _? {
      var r = [];
      if (elements) {
        r = elements;
      }
      return r;
    }
  
dict_arguments_list
  //A list of arguments that has no delimiter
  = head:dict_argument tail:(ARG_SEP dict_argument)* {
      return getArray(head, tail, 1);
    }
    
dict_argument
  = id:Identifier _ ":" _ expr:expression {
      return { "op": "keyValue", "key": id, "value": expr };
    }
    