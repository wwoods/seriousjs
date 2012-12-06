### Implementation of some math methods.  Note that anything at the
global scope will be exposed as the module definition.
###

require console

exports sqr, fib, iter

a = b = c = 8

d = e = (a) ->
  # closure fallthroughs fail: a + b
  console.log a * a
  a * a

_f = 2
_q = d e _f # Should be d(e(f))

sqr = (a) ->
  a * a

# Fibonacci using lots of different syntaxes...
fib = (n) ->
  if n <= 0
    return 0
  elif n == 1
    return 1
  (fib n - 1) + fib(n - 2)
  
iter = (n) ->
  r = 0
  if (m = n - 1) > 0
    r += m * n
    n -= 1
  return r

console.log fib 9