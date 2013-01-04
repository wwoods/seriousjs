
require assert
require ../src/seriousjs as sjs

describe "Line Continuations", ->
  it "Should work with statements", ->
    sjs.eval "3\n    +2"
    # Bad - uneven indent
    assert.throws -> sjs.eval "3\n    +2\n  +3"

  it "Should work with parens", ->
    sjs.eval """(3\n    + 4"""
    sjs.eval """(3\n    + 4)"""
    sjs.eval """(3 + 4"""
    sjs.eval """(3 + 4)"""
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

  it "Should properly group paren or block indented segments", ->
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
