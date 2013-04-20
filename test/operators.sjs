
require assert
require ../ as sjs

describe "in operator", ->
  it "Should work with arrays", ->
    assert.equal true, sjs.eval("a = ('hey' in [ 'a', 'hey', 'b' ])").a

  it "Should work with not", ->
    assert.equal false, sjs.eval("a = (not 'hey' in [ 'a', 'hey', 'b', false ])").a
    assert.equal false, sjs.eval("a = ('hey' not in [ 'a', 'hey', 'b', false ])").a


describe "of operator", ->
  it "Should work with objs", ->
    assert.equal true, sjs.eval("a = 'b' of { b: 'c' }").a
    assert.equal false, sjs.eval("a = 'b' of { c: 'c' }").a

  it "Should work with not", ->
    assert.equal false, sjs.eval("a = not 'b' of { b: 'c' }").a
    assert.equal false, sjs.eval("a = 'b' not of { b: 'c' }").a
