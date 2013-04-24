
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
