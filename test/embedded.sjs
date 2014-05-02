
require assert
require fs
require vm
require ../ as sjs

describe "seriousjs-embed.js", ->
  built = [ null ]
  before async extern ->
    @timeout 10000
    await extern sjs._buildEmbedded()
    built[0] = sandbox = vm.Script.createContext()
    vm.runInContext(
        fs.readFileSync(__dirname + '/../lib/seriousjs-embed.js', 'utf8')
        sandbox
        "seriousjs-embed.js"

  it "Should compile a basic statement", () ->
    assert.equal('"use strict";\nvar __sjs_seriousjs = require(\'seriousjs\');\nvar a;this.a=a = b + 5',
        built[0].seriousjs.compile('a = b + 5').js

  it "Should work with builtins", () ->
    js = built[0].seriousjs.getJsForEval """
        a = new __sjs_seriousjs.Event()
        happiness = [ 0 ]
        a.on "happy", (amt) -> happiness[0] += amt
        """
    jsMod = [ null ]
    built[0].define = (a, b) -> jsMod[0] = b()
    vm.runInContext(js, built[0])
    assert.equal 0, jsMod[0].happiness[0]
    jsMod[0].a.trigger "happy", 6
    assert.equal 6, jsMod[0].happiness[0]
    # Ensure that we're not using node's version
    assert.equal false, jsMod[0].a instanceof sjs.Event

