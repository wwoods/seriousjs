
require assert
require ../ as sjs

# Note that the test for await calls happens in async.sjs, since that is
# required for this module.

describe "Async catch/finally", ->
  # These should all be snappy..
  @timeout 100

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

  it "Should support finally blocks", async ->
    m = sjs.eval """
        f = async ->
          await 0
        g = async (f) ->
          await f
          finally
            return 22
          return 44
        """
    await r = m.g m.f
    assert.equal 22, r
    await r = m.g async ->
      await 0
      return "ok"
    assert.equal 22, r

  it "Should re-raise exceptions from finally", async ->
    m = sjs.eval """
        m = [ 0 ]
        f = async ->
          await 0
          throw new Error("HI!")
        g = async ->
          await f
          finally
            m[0] = 12
            # No effect; there is still an exception.
            return 32
        """
    await r = m.g
    catch e
      # Caught an error, make sure finally executed
      assert.equal 12, m.m[0]
      return
    assert.fail "No exception seen"

  it "Should work with double layer", async ->
    m = sjs.eval """
        f = async ->
          await 0
        g = async ->
          await
            await f
          finally
            return 22
        """
    await r = m.g
    assert.equal 22, r
