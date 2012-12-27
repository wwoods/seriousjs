
require assert
require ../src/seriousjs as sjs

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
    m = sjs.eval("a = {b} -> (b ? 3 + b : -1)")
    assert.equal 6, m.a(b: 3)
    # assert.equal (-1), m.a()
    jj = 32
    assert.equal -1, m.a()
