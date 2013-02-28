
regex_literal
  = expr:RegularExpressionLiteral { return R({ op: 'regex', 
        literal: "/" + expr.body + "/" + expr.flags }); }

/* Shamelessly ripped from pegjs javascript doc */
RegularExpressionLiteral "regular expression"
  = "/" body:RegularExpressionBody "/" flags:RegularExpressionFlags {
      return {
        type:  "RegularExpressionLiteral",
        body:  body,
        flags: flags
      };
    }

RegularExpressionBody
  = char_:RegularExpressionFirstChar chars:RegularExpressionChars {
      return char_ + chars;
    }

RegularExpressionChars
  = chars:RegularExpressionChar* { return chars.join(""); }

RegularExpressionFirstChar
  = ![*\\/[] char_:RegularExpressionNonTerminator { return char_; }
  / RegularExpressionBackslashSequence
  / RegularExpressionClass

RegularExpressionChar
  = ![\\/[] char_:RegularExpressionNonTerminator { return char_; }
  / RegularExpressionBackslashSequence
  / RegularExpressionClass

/*
 * This rule contains an error in the specification: "NonTerminator" instead of
 * "RegularExpressionNonTerminator".
 */
RegularExpressionBackslashSequence
  = "\\" char_:RegularExpressionNonTerminator { return "\\" + char_; }

RegularExpressionNonTerminator
  = !("\n" / "\r") char_:. { return char_; }

RegularExpressionClass
  = "[" chars:RegularExpressionClassChars "]" { return "[" + chars + "]"; }

RegularExpressionClassChars
  = chars:RegularExpressionClassChar* { return chars.join(""); }

RegularExpressionClassChar
  = ![\]\\] char_:RegularExpressionNonTerminator { return char_; }
  / RegularExpressionBackslashSequence

RegularExpressionFlags
  = parts:IdentifierPart* { return parts.join(""); }

