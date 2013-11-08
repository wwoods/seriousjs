NumberLiteral
  = HexIntegerLiteral
  / DecimalLiteral

DecimalLiteral
  = before:DecimalIntegerLiteral
    "."
    after:DecimalDigits?
    exponent:ExponentPart? {
      return parseFloat(before + "." + after + exponent);
    }
  / "." after:DecimalDigits exponent:ExponentPart? {
      return parseFloat("." + after + exponent);
    }
  / before:DecimalIntegerLiteral exponent:ExponentPart? {
      return parseFloat(before + exponent);
    }

DecimalIntegerLiteral
  = "0" / digit:NonZeroDigit digits:DecimalDigits? { return digit + digits; }

DecimalDigits
  = digits:DecimalDigit+ { return digits.join(""); }

DecimalDigit
  = [0-9]

NonZeroDigit
  = [1-9]

ExponentPart
  = indicator:ExponentIndicator integer:SignedInteger {
      return indicator + integer;
    }

ExponentIndicator
  = [eE]

SignedInteger
  = sign:[-+]? digits:DecimalDigits { return sign + digits; }

HexIntegerLiteral
  = "0" [xX] digits:HexDigit+ { return parseInt("0x" + digits.join("")); }

HexDigit
  = [0-9a-fA-F]