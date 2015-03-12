
require assert
require ../ as sjs

describe "binUtil", ->
  it "should work with requireJs", ->
    m = sjs.eval """
        require seriousjs as sjs
        sjs.requireJs()
        """
