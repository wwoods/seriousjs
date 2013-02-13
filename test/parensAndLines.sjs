
require assert
require ../src/seriousjs as sjs

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
    m = sjs.eval """
        a = ->
          b = ->
            method = (a, b, c) ->
              a + b + c(44)
            method(
                2
                20
                (v) ->
                  v += 8
                  return v
    """
    assert.equals 74, m.a()()


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
