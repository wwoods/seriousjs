ReservedWord "ReservedWord"
  = ReservedWordInner !IdentifierPart
  
ReservedWordInner
  = "and"
  / "async"
  / "await"
  / "break"
  / "catch"
  / "class"
  / "continue"
  / "default"
  / "else"
  / "finally"
  / "for"
  / "if"
  / "instanceof"
  / "in"
  / "is"
  / "new"
  / "not"
  / "of"
  / "or"
  / "return"
  / "super"
  / "then"
  / "throw"
  / "typeof"
  / "while"
