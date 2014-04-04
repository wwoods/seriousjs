
require assert
require ../ as sjs

describe "Indent syntax", ->
  it "Should work with this odd example", ->
    # What was happening was the 1 and 2 were being listed as parameters of
    # the it function call.
    assert.throws -> sjs.compile """
        it "Should be applicable to lambdas with first parm as callback", (done) ->
          m = sjs.eval '''q = async (callback, b, c) -> b * 10 + c'''
          m.q(
            (error, r) ->
              assert.equal 12, r
              done()
            1
            2
        """

  it "Should group params not with lambdas", ->
    m = sjs.eval """
        f = (p, inner) ->
          p(
              -> inner "example"
              "other"
        """
    inner = ((a) -> a)
    seen = [ 0 ]
    checkArgs = (callback, other) ->
      assert.equal "other", other
      assert.equal "example", callback()
      seen[0] = 1
    m.f(checkArgs, inner)
    assert.equal 1, seen[0]


  it "Should parse array members vs parenless calls correctly", ->
    assert.deepEqual.message = [ "message" ]
    try
      (sjs.eval """q = (assert) -> assert.deepEqual [ "message" ], [ "message" ]""").q(assert)
      (sjs.eval """q = (assert) -> assert.deepEqual assert.deepEqual[ "message" ], [ "message" ]""").q(assert)
      assert.throws ->
        sjs.eval """q = (assert) -> assert.deepEqual[ "message" ], [ "message" ]"""
      (sjs.eval """q = (assert) -> assert.deepEqual assert.deepEqual\n    [ "message" ], [ "message" ]""").q(assert)
      assert.throws ->
        (sjs.eval """q = (assert) -> assert.deepEqual 12, assert.deepEqual(\n    [ "message" ], [ "message" ]""").q(assert)
    finally
      delete assert.deepEqual.message
