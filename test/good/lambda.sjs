f = -> a
g = (a, b) -> a + b
h = (a) ->
  a
      + b
fixedG = (a, b = 7) -> g(a, b)

# Different call syntaxes
g(1, 2)
g(
    1
    2
g(
    1,
    2
g(
    1
    ,2
g(
    ,1
    ,2
g(
    1,
    2,
g(1,
    2

# Dict args!
{ a, b } -> a + b
(a, b, {< add = true}) -> add ? a + b : a

