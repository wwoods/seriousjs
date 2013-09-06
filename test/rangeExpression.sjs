
require assert
require ../ as sjs

describe "Range expression", ->
  it "Should work with for statements", ->
    v = (sjs.eval """
        outV = 0
        for v in [ 0:10 ]
          outV += v""").outV
    assert.equal 45, v


  it "Should infer lower bound of zero", ->
    v = (sjs.eval """
        outV = ""
        for v in [:4]
          outV += v""").outV
    assert.equal "0123", v


  it "Should fail if two ids are requested", ->
    try
      sjs.eval """
          for a, b in [0:1]
            3"""
    catch e
      assert.equal "On line 2: Only one iteration variable supported for 'for' "
          + "statements with range arguments", e and e.message or e


  it "Should work with skip in for statements", ->
    v = (sjs.eval """
        outV = 0
        for v in [ 0:10:2 ]
          outV += v""").outV
    assert.equal 20, v


  it "Should work with negative skips", ->
    v = (sjs.eval """
        outV = 0
        for v in [ 0:-10:-1 ]
          outV += v""").outV
    assert.equal -45, v
