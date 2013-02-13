### Shows the line continuation features of SeriousJS.

SeriousJS enforces syntax where a double indent means a line
continuation, and single indents mean a statement block.  Line continuations
may optionally have extra spaces or tabs in subsequent lines, to
###

if
    (b == c
      # Nested!  This groups it with the line above it, meaning that there
      # are implicit parenthesis around these lines
      or c == d
    and d == e
  body

if
    b == c or c == d
    or d == e
    and b == e
  body

(paren + test
34 +
    paren
    + test * (
      55

# Preferred syntax
if a
    + b * 3
    == 8
  body

# Not preferred, but valid
if a +
    b * 3 ==
    8
  body
elif b
    + c == 8
  body

if a == [
    1,2,3
  body

a = [1,2,3,
    4,5,6]
