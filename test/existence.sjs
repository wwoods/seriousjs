
require assert
require ../ as sjs

describe "existence operator", ->
  it "Should work in an if", ->
    m = sjs.eval """a = b?"""
    assert.equal false, m.a
    m = sjs.eval """b = 0\na = b?"""
    assert.equal true, m.a


  it "Should work with chains", ->
    m = sjs.eval """c = {}\na = c.b?"""
    assert.equal false, m.a
    m = sjs.eval """c = {z:1}\na = c.z?"""
    assert.equal true, m.a


  it "Should only call functions once", ->
    m = sjs.eval """
        c = [ 0 ]
        f = () ->
          c[0] += 1
          return 99
        a = f()?
        """
    assert.equal true, m.a
    assert.equal 1, m.c[0]
