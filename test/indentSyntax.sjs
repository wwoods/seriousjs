
require assert
require ../ as sjs

describe "Indent syntax", ->
  it "Should work with this odd example", ->
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
