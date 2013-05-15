
require assert
require ../ as sjs

describe "Lambdas", ->
  it "Should work", ->
    m = sjs.eval "a = (b) -> b*b"
    assert.equal 25, m.a(5)

  it "Should map dict args", ->
    m = sjs.eval "a = {b,c} -> b*c"
    assert.equal 36, m.a({ b: 9, c: 4 })

  it "Should support defaults", ->
    m = sjs.eval("a = (b = 5) -> b*b")
    assert.equal 49, m.a(7)
    assert.equal 25, m.a()

  it "Should support dict defaults", ->
    m = sjs.eval("a = {b = 8, a} -> a*b")
    assert.equal 56, m.a(a: 7)
    assert.equal 14, m.a(a: 7, b: 2)

  it "Should map dict args even without argument", ->
    m = sjs.eval("""
        a = {b} ->
          if b
            return 3 + b
          return -1
        """
    assert.equal 6, m.a(b: 3)
    # assert.equal (-1), m.a()
    jj = 32
    assert.equal -1, m.a()

  it "Should support nested dict specifications", ->
    m = sjs.eval("a = (a, {<b, c} = d) -> [ a + (b or c) * 2, d ]")
    assert.deepEqual [ 8, b: 3 ], m.a(2, b: 3)
    assert.deepEqual [ 10, c: 4 ], m.a(2, c: 4)
    assert.deepEqual [ 8, b: 3, c: 4 ], m.a(2, b: 3, c: 4)

  it "Should support nested dict specifications with defaults", ->
    m = sjs.eval("a = (a, {<b = 8, c}) -> a + (b or c) * 2")
    assert.equal 18, m.a(2, c: 3)
    assert.equal 8, m.a(2, b: 0, c: 3)

  it "Should support doc strings", ->
    m = sjs.eval("""
        a = (a, b) ->
          '''This is an example doc string.
          '''
          return a + b""")
    assert.equal "This is an example doc string.", m.a.help
