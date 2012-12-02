### Implementation of some math methods.  Note that anything at the
global scope will be exposed as the module definition.
###

a
b
c

d e f # Should be d(e(f))

sqr = (a) ->
  a * a

# Fibonacci using lots of different syntaxes...
fib = (n) ->
  if n <= 0
    return 0
  elif n == 1
    return 1
  (fib n - 1) + fib(n - 2)
