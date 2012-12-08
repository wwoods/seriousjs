
require assert
require ../src/seriousjs as sjs

describe "Lambdas", ->
  it "Should work", ->
    m = sjs.eval "a = (b) -> b*b"
    assert.equal 25, m.a(5)
  
  it "Should map dict args", ->
    m = sjs.eval "a = {b,c} -> b*c"
    assert.equal 36, m.a({ b: 9, c: 4 })
    
    