
require assert
require seriousjs as sjs

describe "Compile", ->
  describe "Basic", ->
    it "Should work with basic nesting", ->
      sjs.compile """
          a
          if a
              a
            a
          a"""
