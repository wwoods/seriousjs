
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

describe "not operator", ->
  it "Should work", ->
    assert.equal true, sjs.eval("a = not false").a
    assert.equal false, sjs.eval("a = not true").a

  it "Should bind to the closest boolean statement, not var", ->
    assert.equal true, sjs.eval("a = not 1 - 1").a

  it "Should work with in", ->
    assert.equal false, sjs.eval("a = 'b' not in [ 'a', 'b', 'c' ]").a
    assert.equal true, sjs.eval("a = 'b' not in [ 'a', 'd', 'c' ]").a
    assert.equal false, sjs.eval("a = not 'b' in [ 'a', 'b', 'c' ]").a
    assert.equal true, sjs.eval("a = not 'b' in [ 'a', 'd', 'c' ]").a

  it "Should work with of", ->
    assert.equal false, sjs.eval("a = 'b' not of { a: 1, b: 2, c: 3 }").a
    assert.equal true, sjs.eval("a = 'b' not of { a: 1, d: 2, c: 3 }").a
    assert.equal false, sjs.eval("a = not 'b' of { a: 1, b: 2, c: 3 }").a
    assert.equal true, sjs.eval("a = not 'b' of { a: 1, d: 2, c: 3 }").a

describe "typeof operator", ->
  it "Should bind correctly", ->
    assert.equal true, sjs.eval("z = typeof a == 'undefined'").z

describe "modulus operator", ->
  it "Should work", ->
    assert.equal 3, sjs.eval("r = 7 % 4").r

describe "bitwise operators", ->
  it "Should work", ->
    assert.equal 7, sjs.eval("r = 3 | 4").r
    assert.equal 0, sjs.eval("r = 3 & 4").r
    assert.equal 5, sjs.eval("r = 3 ^ 6").r
    assert.equal 7, sjs.eval("r = 3\nr |= 4").r
    assert.equal 0, sjs.eval("r = 3\nr &= 4").r
    assert.equal 5, sjs.eval("r = 3\nr ^= 6").r
    assert.equal -9, sjs.eval("r = ~8").r
