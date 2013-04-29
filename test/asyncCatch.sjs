
require assert
require ../ as sjs

# Note that the test for await calls happens in async.sjs, since that is
# required for this module.

describe "Async catch/finally", ->
  it "Should support catch with async blocks", async ->
    m = sjs.eval """
        f = async ->
          await 0
          throw "Error1"
        g = async ->
          async
            async f
          catch e
            throw "Error2"
        """
    await m.g
    catch
      return
    throw new Error("Failed to catch")

  it "Should work with this", ->
    m = sjs.eval """
        assert = { throws: () -> "ok" }
        assert.throws async -> await m.g
        """
