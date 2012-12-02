
require assert
require seriousjs as sjs

# Smoke test - compile some comments and non-sensical expressions
a = 0
if a
  a
a

# Real test - sanity
describe "Compile", ->
  describe "Basic", ->
    it "Should work with basic nesting", ->
      sjs.compile """
          a
          if a
              a
            a
          a"""
          
