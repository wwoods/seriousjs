
require assert
require ../src/seriousjs as sjs

describe "Assignment", ->
  it "Should work with variables", ->
    assert.equal 5, (sjs.eval "a = 5").a
    assert.equal 6, (sjs.eval "a = b = 6").b
  it "Should work with dicts", ->
    assert.equal 3, (sjs.eval "{a}={a:3,b:4}").a
  it "Should work with dict mod =", ->
    assert.equal 22, (sjs.eval "{=a} = {a:22}").a
    assert.throws -> sjs.eval "{=a} = {b:1}"
    assert.throws -> sjs.eval "{=a} = {a:1, b:1}"
  it "Should work with dict mod <", ->
    assert.equal 23, (sjs.eval "{<a} = {a:23}").a
    assert.equal undefined, (sjs.eval "{<a} = {}").a
    assert.throws -> sjs.eval "{<a} = {b:12}"
    assert.throws -> sjs.eval "{<a} = {a:5,b:12}"
  it "Should work with dict mod >", ->
    assert.equal 24, (sjs.eval "{>a} = {a:24, b:56}").a
    assert.throws -> sjs.eval "{>a} = {b:56}"
    assert.equal 56, (sjs.eval "{>a, b} = {a:24, b:56, c:42}").b
    assert.throws -> sjs.eval "{>a, b} = {a:24, c:42}"
