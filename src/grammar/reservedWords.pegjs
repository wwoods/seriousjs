ReservedWord "ReservedWord"
  = (ReservedWordSjsInner / ReservedWordJsInner) !IdentifierPart

ReservedWordSjs "SeriousJS ReservedWord"
  = ReservedWordSjsInner !IdentifierPart

/** To avoid issues with partial keyword matching (in in instanceof), this list
    is sorted backwards. */
ReservedWordSjsInner
  = "undefined"
  / "true"
  / "then"
  / "super"
  / "or"
  / "of"
  / "null"
  / "not"
  / "is"
  / "false"
  /" class"
  /" await"
  / "async"
  / "and"

ReservedWordJs
  = ReservedWordJsInner !IdentifierPart

/** To avoid issues with partial keyword matching (in in instanceof), this list
    is sorted backwards. */
ReservedWordJsInner
  = "with"
  / "while"
  / "void"
  / "var"
  / "typeof"
  / "try"
  / "throw"
  / "this"
  / "switch"
  / "super"
  / "return"
  / "new"
  / "instanceof"
  / "in"
  / "import"
  / "if"
  / "function"
  / "for"
  / "finally"
  / "extends"
  / "export"
  / "enum"
  / "else"
  / "do"
  / "delete"
  / "default"
  / "debugger"
  / "continue"
  / "class"
  / "catch"
  / "case"
  / "break"
