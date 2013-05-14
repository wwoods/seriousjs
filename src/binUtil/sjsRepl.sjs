
require vm
require repl
require ../../ as sjs

options =
    prompt: 'sjs> '
    eval: async (input, context, filename) ->
      input = input.replace(/^\(([\s\S]*)\n\)$/m, '$1')
      if not input
        return

      script = sjs.compile("_=" + input)
      return vm.runInContext(script, context, filename)

start = () ->
  rpl = repl.start(options)
  rpl.on "exit", -> rpl.outputStream.write("\n")
  return rpl
