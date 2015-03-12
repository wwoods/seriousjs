
require assert
require ../ as sjs

describe "Line Continuations", ->
  it "Should work with statements", ->
    sjs.eval "3\n    +2"
    # Bad - uneven indent
    assert.throws -> sjs.eval "3\n    +2\n  +3"

  it "Should work with single line parens without a close", ->
    sjs.eval """(3 + 4"""
  it "Should work with single line parens with a close", ->
    sjs.eval """(3 + 4)"""
  it "Should work with parens with no close", ->
    """Note that the *4 should group with the 2 rather than the quantized
    3 + 2.  That's why we want 12, not 21."""
    assert.equal 12, (sjs.eval """
        m = 1 + (3 + 2
            * 4
        """).m
  it "Should work with parens with a close", ->
    sjs.eval """(3\n    + 4)"""
  it "Should fail bad paren indentations", ->
    assert.throws -> sjs.eval """
        34 +
            paren
            + test * (
                        55"""
    assert.throws -> sjs.eval """
        34 +
            paren
            + test * (
                55"""
    assert.throws -> sjs.eval """
        34 +
            paren
            + test * (
            55"""
    sjs.eval """
        paren = test = 4
        34 +
            paren
            + test * (
              55"""

  it "Should work with complicated lambda continuations", ->
    """This one comes out of some possibly unexpected behavior; in assignments,
    it makes sense for a lambda to continue at one indent beyond the base level
    of the assignment.  In one-line function calls, like assert.throws ->, it
    also makes sense for the lambda to just be indented one time.  But as
    complicated arguments inline, it stops making sense.  Here we see all three
    cases.
    """

    m = sjs.eval """
        a = ->
          b = ->
            f = (m) ->
              return m() + 8
            method = (a, b, c) ->
              return a + b + c(44)
            return f -> method(
                2
                20
                (v) ->
                  v += 8
                  return v
          return b
    """
    assert.equal 82, m.a()()


  it "Should properly error for block indented segments", ->
    assert.throws -> (sjs.eval """
        q = 3
            + 8
              + 2
            * 6""").q
  it "Should properly group paren on same line", ->
    assert.equal 63, (sjs.eval """
        q = 3
            + (8
              + 2
            * 6""").q
  it "Should properly group paren separate from args", ->
    assert.equal 63, (sjs.eval """
        q = 3
            + (
              8
              + 2
            * 6""").q
