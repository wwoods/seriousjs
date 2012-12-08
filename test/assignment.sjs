
require assert
require ../src/seriousjs as sjs

describe "Assignment", ->
  it "Should work with variables", ->
    assert.equal 5, (sjs.eval "a = 5").a
    assert.equal 6, (sjs.eval "a = b = 6").b
  it "Should work with dicts", ->
    assert.equal 3, (sjs.eval "{a}={a:3,b:4}").a
  it "Should work with matching dict mods", ->
    m = sjs.eval """
        d = {a:1, b:2, c:3
        {a,b} = d
        {=a,b,c} = d
        {<a} = d"""
    assert.equal 1, m.a
    assert.equal 2, m.b
    assert.equal 3, m.c
    
  it "Should fail with non-matching dict mods", ->
    assert.throws -> sjs.eval "{=a}={a:1,b:2}"
    assert.throws -> sjs.eval "{=a}={c:1}"
    assert.throws -> sjs.eval "{<a,b}={a:1}"
