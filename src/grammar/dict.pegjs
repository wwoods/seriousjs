
dict_literal
  = "{" args:dict_arguments_delimited ("}" / ASSERT_ON_ENDLINE) {
      return { "op": "dict", "elements": args };
    }
  / ASSERT_ON_NEWLINE args:dict_arguments_list?
        & { return args; } {
      return { "op": "dict", "elements": args };
    }

dict_arguments_delimited
  //A list of arguments delimited by something like [] or ().
  //May go into an indented body.
  = args:dict_arguments_delimited_inner?
        & { return args; } {
      return args;
    }

dict_arguments_delimited_inner
  //Note - we might have leading and trailing whitespace.
  = _? ARG_SEP? elements:dict_arguments_delimited_list? ARG_SEP? _? {
      var r = [];
      if (elements) {
        r = elements;
      }
      return r;
    }

dict_arguments_delimited_list
  = head:dict_argument_delimited tail:(ARG_SEP dict_argument_delimited)* {
      return getArray(head, tail, 1);
    }

dict_argument_delimited
  = CONTINUATION_START arg:dict_argument_delimited_inner? CONTINUATION_END
      & { return arg; } { return arg; }
  / dict_argument_delimited_inner

dict_argument_delimited_inner
  = dict_argument_inner
  / id:Identifier {
      return R({ op: "keyValue", key: id, value: id });
    }

dict_arguments_list
  //A list of arguments that has no delimiter.  This list is different because
  //it MUST be colon syntax.
  = head:dict_argument tail:(ARG_SEP dict_argument)* {
      return getArray(head, tail, 1);
    }

dict_argument
  = CONTINUATION_OPEN arg:dict_argument_inner? CONTINUATION_END?
      & { return arg; } { return arg; }

dict_argument_inner
  = id:(Identifier / string / NumberLiteral) _ ":" _ expr:expression {
      return R({ "op": "keyValue", "key": id, "value": expr });
    }
