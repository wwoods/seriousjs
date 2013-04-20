
require assert
require ../ as sjs

describe "in operator", ->
  it "Should work with arrays", ->
    assert.equal true, sjs.eval("a = ('hey' in [ 'a', 'hey', 'b' ])").a
