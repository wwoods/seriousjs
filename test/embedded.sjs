
require assert
require fs
require vm
require ../ as sjs

describe "seriousjs-embed.js", ->
  built = [ null ]
  before async extern ->
    await extern sjs._buildEmbedded()
    built[0] = sandbox = vm.Script.createContext()
    vm.runInContext(
        fs.readFileSync(__dirname + '/../lib/seriousjs-embed.js', 'utf8')
        sandbox
        "seriousjs-embed.js"

  it "Should compile a basic statement", () ->
    assert.equal('"use strict";\nvar __sjs_seriousjs = require(\'seriousjs\');\nvar a;this.a=a = b + 5',
        built[0].seriousjs.compile('a = b + 5').js
