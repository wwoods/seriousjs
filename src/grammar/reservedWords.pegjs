ReservedWord "ReservedWord"
  = (ReservedWordSjsInner / ReservedWordJs) !IdentifierPart

ReservedWordSjs "SeriousJS ReservedWord"
  = ReservedWordSjsInner !IdentifierPart

ReservedWordSjsInner
  = "and"
  / "async"
  / "await"
  / "class"
  / "false"
  / "is"
  / "not"
  / "null"
  / "of"
  / "or"
  / "super"
  / "then"
  / "true"
  / "undefined"

ReservedWordJs
  = ReservedWordJsInner !IdentifierPart

ReservedWordJsInner
  = "break"
  / "case"
  / "catch"
  / "continue"
  / "debugger"
  / "default"
  / "delete"
  / "do"
  / "else"
  / "finally"
  / "for"
  / "function"
  / "if"
  / "in"
  / "instanceof"
  / "new"
  / "return"
  / "switch"
  / "this"
  / "throw"
  / "try"
  / "typeof"
  / "var"
  / "void"
  / "while"
  / "with"
