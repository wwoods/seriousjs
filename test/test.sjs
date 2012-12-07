
require assert
require ../src/seriousjs as sjs

# Real test - sanity
describe "Compile", ->
  describe "Basic", ->
    it "Should work with basic nesting", ->
      sjs.compile """
          a
          if a
              + a
            a
          a"""

