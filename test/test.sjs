
require assert
require ../src/seriousjs as sjs

# Real test - sanity
describe "Compile", ->
  describe "Basic", ->
    it "Should work with basic nesting and continuations", ->
      sjs.compile """
          a
          if a
              + a
            a
          a"""
          
    it "Should follow operator ordering", ->
      assert.equal 19, sjs.eval("3*4+8/2-3/(2-3)", { isScript: true })
      
    it "Should assign top level attributes to module", ->
      assert.equal 20, sjs.eval("a=20\nb=19").a
      
    it "Should support doc strings", ->
      m = sjs.eval("a = () ->\n  'my method'\n  5")
      assert.equal "my method", m.a.__doc__
      
    it "Should not allow method calls across a newline", ->
      assert.throws -> sjs.eval("a\n    b\nc")
      
    it "Should group multi-line lists correctly", ->
      m = sjs.eval("a = [\n    1,2\n    3,4\n    5,6")
      assert.deepEqual [1,2,3,4,5,6], m.a

