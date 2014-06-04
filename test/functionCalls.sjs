require assert
require ../ as sjs

describe "functionCalls", ->
  it "Should allow calling a function with no parens", ->
    m = sjs.eval """
        q = (a) -> a + 5
        f = () -> q 7
        """
    assert.equal 12, m.f()


  it "Should not work with parens", ->
    assert.throws -> sjs.eval """(3 + 4) 5"""


  it "Should not work with regex", ->
    assert.throws -> sjs.eval """/hey/ 5"""


  it "Should work with this combination of situations", ->
    # This can break because (vec.x + 1) is a function called with regex /2*.../
    m = sjs.eval """
        vec = { x: 0, y: 0 }
        wwidth = 1
        wheight = 2
        t = {
            css: {= position, left, top } -> left + top,
            width: -> 4, height: -> 4 }
        r = t.css(
            position: 'absolute'
            left: (vec.x + 1) / 2 * wwidth - t.width() / 2
            top: -(vec.y - 1) / 2 * wheight - t.height() / 2
        """
    assert.equal -2.5, m.r
