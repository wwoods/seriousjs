
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


  amdBuild = (code) ->
    """Evaluates code and returns the module context."""
    js = built[0].seriousjs.getJsForEval code
    jsMod = [ null ]
    built[0].define = (a, b) -> jsMod[0] = b()
    vm.runInContext(js, built[0])
    if not jsMod[0]?
      throw new Error("No module returned?")
    return jsMod[0]


  it "Should compile a basic statement", () ->
    assert.equal('"use strict";\nvar __sjs_seriousjs = require(\'seriousjs\');\nvar a;this.a=a = b + 5',
        built[0].seriousjs.compile('a = b + 5').js


  it "Should allow requiring seriousjs with no dependencies", ->
    m = amdBuild """
        require seriousjs
        """
    assert.equal true, m.seriousjs.compile?
    # Ensure it's not just using node's version
    assert.notEqual sjs.Event, m.seriousjs.Event


  it "Should work with renaming seriousjs", ->
    m = amdBuild """
        require seriousjs as e
        """
    assert.equal true, m.e.compile?
    assert.equal false, m.seriousjs?


  it "Should work with builtins", () ->
    """Compiles this code as an AMD module (like in browser)."""
    m = amdBuild """
        require seriousjs for Event
        a = new Event()
        happiness = [ 0 ]
        a.on "happy", (amt) -> happiness[0] += amt
        """
    assert.equal 0, m.happiness[0]
    m.a.trigger "happy", 6
    assert.equal 6, m.happiness[0]

