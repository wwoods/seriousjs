### Shows the line continuation features of SeriousJS.

SeriousJS enforces syntax where a double indent means a line
continuation, and single indents mean a statement block.  Line continuations
may optionally have extra spaces or tabs in subsequent lines, to
###

if
    b == c
    or c == d
    and d == e
  body

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

if a == [
    1,2,3
  body

a = [1,2,3,
    4,5,6]
