
require console

fib = (n) ->
  if n <= 0
    return 0
  elif n == 1
    return 1
  return fib(n - 1) + fib(n - 2)

if process.argv.length > 2
  v = parseInt(process.argv[2])
  if isNaN(v)
    console.error "ERROR: isNaN: #{v}"
    process.exit()
  console.log "fib(#{ v }): #{ fib(v) }"
else
  console.log "fib(5): #{ fib(5) }"
  console.log "fib(10): #{ fib(10) }"
  console.log "fib(20): #{ fib(20) }"

