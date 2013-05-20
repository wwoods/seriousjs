
require assert
require ../ as sjs

describe "for loops", ->
  it "should work with arrays", ->
    assert.equal 6, sjs.eval("""
        r = 0
        for q in [ 1, 2, 3 ]
          r += q""").r

  it "Should work with arrays and break and continue", ->
    m = sjs.eval """
        r = 0
        for i in [ 1, 2, 3, 4, 5, 6 ]
          if i > 4
            break
          if i % 2 == 0
            continue
          r += i
        """
    assert.equal 4, m.r

  it "Should work with arrays and counter", ->
    assert.equal 39, sjs.eval("""
        r = 0
        for q, i in [ 11, 12, 13 ]
          r += q + i""").r

  it "Should work with hashes", ->
    assert.equal "hey", sjs.eval("""
        r = ""
        for q of { h: 1, e: 2, y: 3 }
          r += q""").r


  it "Should work with hashes and values", ->
    assert.equal "h1e2y3", sjs.eval("""
        r = ""
        for q, v of { h: 1, e: 2, y: 3 }
          r += q
          r += v""").r

  it "Should work with hashes and break and continue", ->
    m = sjs.eval """
        r = ""
        for i of { 'a': 1, 'b': 2, 'c': 3, 'd': 4, 'e': 5, 'f': 6 }
          if i > 'd'
            break
          if i == 'b' or i == 'd'
            continue
          r += i
        """
    assert.equal "ac", m.r


describe "while loops", ->
  it "should work with count downs", ->
    assert.equal 10, sjs.eval("""
        r = 0
        n = 4
        while n > 0
          r += n
          n -= 1""").r

  it "Should work with break and continue", ->
    m = sjs.eval """
        r = 0
        while r < 100
          r += 1
          if r < 2
            continue
          r *= 8
          break
        """
    assert.equal 16, m.r
