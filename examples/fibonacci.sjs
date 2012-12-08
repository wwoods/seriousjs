
require console

fib = (n) ->
  if n <= 0
    return 0
  elif n == 1
    return 1
  fib(n - 1) + fib(n - 2)

console.log "fib(5): #{ fib(5) }"
console.log "fib(10): #{ fib(10) }"
console.log "fib(20): #{ fib(20) }"

