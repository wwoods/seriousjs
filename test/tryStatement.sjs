
require assert
require ../ as sjs

describe "try statement", ->
  it "Should work with no var", ->
    m = sjs.eval """
        try
          throw 'test'
        catch
          q = 8
        """
    assert.equal 8, m.q

  it "Should work with a var", ->
    m = sjs.eval """
        try
          throw new Error('testMsg')
        catch e
          q = "" + e
        """
    assert.equal true, "testMsg" in m.q

  it "Should work with a condition", ->
    assert.throws ->
      sjs.eval """
          try
            throw new Error('testMsg')
          catch e if 'handle' in e.message
            q = "" + e
          """

  it "Should work with no body for catch", ->
    sjs.eval """
        try
          throw new Error("testMsg")
        catch e"""

  it "Should work with multiple catch statements", ->
    assert.equal 83, (sjs.eval """
        try
          result = 5
          throw new Error("c")
        catch e if 'a' in e.message
          throw e
        catch e if 'b' in e.message
          throw e
        catch e if 'c' in e.message
          result = 83
        catch e
          result = 99
        """).result

  it "Should throw an error if unconditional catch isn't last", ->
    assert.throws ->
      sjs.compile """
          try
            result = 5
          catch e
            result = 6
          catch e if e.c
            result = 7
          """

  it "Should work with finally", ->
    m = sjs.eval """
        try
          q = 123
        catch
          q = 456
        finally
          q = 789"""
    assert.equal 789, m.q

  it "Should work with just finally", ->
    m = sjs.eval """
        try
          q = 123
        finally
          q = 333"""
    assert.equal 333, m.q

  it "Should raise an error if there is no catch or finally", ->
    assert.throws -> sjs.eval """
        try
          q = 123
        """
