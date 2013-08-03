
require vm
require repl
require ../../ as sjs

options =
    prompt: 'sjs> '
    eval: async nocheck (input, context, filename) ->
      input = input.replace(/^\(([\s\S]*)\n\)$/m, '$1')
      if not input
        return

      # Ensure it has access to require
      if not context.require?
        context.require = require

      if /^await [^\n]+$/.test(input)
        await r = _handleAwait(input, context, filename)
        return r

      if not /^require [^\n]+$/.test(input)
        input = "_=#{ input }"

      script = sjs.compile(input)
      return vm.runInContext(script.js, context, filename)


start = () ->
  rpl = repl.start(options)
  rpl.on "exit", -> rpl.outputStream.write("\n")
  return rpl


_handleAwait = async (input, context, filename) ->
  m = /^await ([a-zA-Z0-9_]+(, *[a-zA-Z0-9_]+)* *= *)?(.*)$/.exec(input)
  allVars = []
  if m[1]
    allVars = m[1].replace(/[= ]/g, "").split(/,/g)
  else
    allVars = [ "_" ]

  realInput = """
      __ = async (callback) ->
        await #{ allVars.join(",") }=#{ m[3] }
        return [ #{ allVars.join(",") } ]
      """
  script = sjs.compile(realInput)
  r = vm.runInContext(script.js, context, filename)
  await varVals = context.__
  for v, i in allVars
    context[v] = varVals[i]

  if allVars.length == 1
    return context[allVars[0]]
  return varVals
