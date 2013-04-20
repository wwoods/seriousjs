
require assert
require ../ as sjs

describe "for loops", ->
  it "should work with arrays", ->
    assert.equal 6, sjs.eval("""
        r = 0
        for q in [ 1, 2, 3 ]
          r += q""").r

describe "while loops", ->
  it "should work with count downs", ->
    assert.equal 10, sjs.eval("""
        r = 0
        n = 4
        while n > 0
          r += n
          n -= 1""").r