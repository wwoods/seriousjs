
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

  it "Should support multi-line headers with proper indentation of body", ->
    m = sjs.eval("""
        a = (a, b,
            c) ->
          return a*b*c
        """)
    assert.equal 8, m.a(1,2,4)

    # Also test as an argument
    m = sjs.eval("""
        retFunc = (a, b, c) ->
          if a != 1
            throw new Error("a not 1!")
          if b != 2
            throw new Error("b not 2!")
          return c
        a = () ->
          return retFunc(1,
              2, (alpha,
                  beta) ->
                return alpha * (beta + 1)
        """)
    assert.equal 32, m.a()(4, 7)

    # And another argument setup
    m = sjs.eval("""
        retFunc = (a, c, b) ->
          if a != 1
            throw new Error("a not 1!")
          if b != 2
            throw new Error("b not 2!")
          return c
        a = () ->
          return retFunc(1,
              (alpha,
                  beta) ->
                return alpha * (beta + 1)
              2
        """)
    assert.equal 64, m.a()(8, 7)


  it "Should not return from multiline", ->
    m = sjs.eval("""
        a = (b) ->
          b*b
        b = (b) ->
          return b*b""")
    assert.equal undefined, m.a(8)
    assert.equal 64, m.b(8)

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
    m = sjs.eval("a = (a, d: {<b, c}) -> [ a + (b or c) * 2, d ]")
    assert.deepEqual [ 8, b: 3 ], m.a(2, b: 3)
    assert.deepEqual [ 10, c: 4 ], m.a(2, c: 4)
    assert.deepEqual [ 8, b: 3, c: 4 ], m.a(2, b: 3, c: 4)

  it "Should work with a return statement with a dict", ->
    # If the dict starts on a line other than the return, some JS engines
    # interpret it as a new statement, which doesn't work.
    m = sjs.eval """
        defaults = () ->
          return
              cards: []
              dropTarget: false
        """
    assert.equal 0, m.defaults().cards.length

  it "Should support nested dict specifications with defaults", ->
    m = sjs.eval("a = (a, {<b = 8, c}) -> a + (b or c) * 2")
    assert.equal 18, m.a(2, c: 3)
    assert.equal 8, m.a(2, b: 0, c: 3)

  it "Should support compound nested dicts", ->
    m = sjs.eval("a = (a, b: {> test: {= bPart, aPart = 7}} = { test: { bPart: 7 } }) -> bPart * aPart + a").a
    assert.equal 50, m(1)
    assert.equal 53, m(4)
    assert.equal 91, m(0, { test: { bPart: 13
    assert.equal 13, m(0, { test: { bPart: 13, aPart: 1
    assert.throws -> m(0, { testt: { bPart: 1, aPart: 1
    assert.throws -> m(0, { test: { bPart: 1, cPart: 1

  it "Should do correct assignment of defaults to outer var for dict unmaps", ->
    m = sjs.eval("a = (a: { b, c = 3 }) -> a").a
    assert.deepEqual { b: 5, c: 3 }, m(b: 5)

  it "Should support doc strings", ->
    m = sjs.eval("""
        a = (a, b) ->
          '''This is an example doc string.
          '''
          return a + b""")
    assert.equal "This is an example doc string.", m.a.help
