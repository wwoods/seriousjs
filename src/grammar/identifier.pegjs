Identifier "identifier"
  = !ReservedWord name:IdentifierName { 
      return { "op": "id", "id": name };
    }

IdentifierName "identifier"
  = start:IdentifierStart parts:IdentifierPart* {
      return start + parts.join("");
    }

IdentifierStart
  = UnicodeLetter
  / "$"
  / "_"
  / "\\" sequence:UnicodeEscapeSequence { return sequence; }

IdentifierPart
  = IdentifierStart
  / UnicodeCombiningMark
  / UnicodeDigit
  / UnicodeConnectorPunctuation
  / "\u200C" { return "\u200C"; } // zero-width non-joiner
  / "\u200D" { return "\u200D"; } // zero-width joiner
