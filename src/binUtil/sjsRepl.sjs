
require vm
require repl
require ../../ as sjs

options =
    prompt: 'sjs> '
    eval: async extern (input, context, filename) ->
      input = input.replace(/^\(([\s\S]*)\n\)$/m, '$1')
      if not input
        return

      if /^await [^\n]+$/.test(input)
        await r = _handleAwait(input, context, filename)
        return r

      if not /^require [^\n]+$/.test(input)
        input = "_=#{ input }"

      sjs.eval(input, { sandbox: context })
      return context._


start = () ->
  rpl = repl.start(options)
  rpl.context = vm.Script.createContext()
  rpl.on "exit", -> rpl.outputStream.write("\n")
  return rpl


_handleAwait = async (input, context, filename) ->
  m = /^await +((extern|noerror) +)*([a-zA-Z0-9_]+(, *[a-zA-Z0-9_]+)* *= *)?(.*)$/.exec(input)
  allVars = []
  if m[3]
    allVars = m[3].replace(/[= ]/g, "").split(/,/g)
  else
    allVars = [ "_" ]

  realInput = """
      __ = async (callback) ->
        await #{ m[1] or "" } #{ allVars.join(",") }=#{ m[5] }
        return [ #{ allVars.join(",") } ]
      """
  sjs.eval(realInput, { sandbox: context })
  await varVals = context.__
  for v, i in allVars
    context[v] = varVals[i]

  if allVars.length == 1
    return context[allVars[0]]
  return varVals
