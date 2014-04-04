
require assert
require ../ as sjs

# Note that the test for await calls happens in async.sjs, since that is
# required for this module.

describe "Async catch/finally", ->
  # These should all be snappy..
  @timeout 1000

  it "Should support catch with async blocks", async extern ->
    m = sjs.eval """
        f = async ->
          await 0
          throw "Error1"
          console.log "POST THROW"
        g = async ->
          async
            async f
            console.log "POST F"
          catch e
            throw "Error2"
        """
    await m.g
    catch e
      console.log "GOT SOMMIN: #{ e }"
      if e == "Error2"
        return
    throw new Error("Failed to catch")

  it "Should support finally blocks", async extern ->
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

  it "Should re-raise exceptions from finally", async extern ->
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

  it "Should execute finally with a catch block", async extern ->
    m = sjs.eval """
        f = async ->
          await 0
        g = async ->
          await
            await f
          catch e
            3
          finally
            return 46
        """
    await r = m.g
    assert.equal 46, r

  it "Should execute finally with an error from catch block", async extern ->
    m = sjs.eval """
        f = async ->
          await 0
          throw "GOTCHA"
        g = async ->
          await
            await f
          catch e
            throw e
          finally
            return 46
        """
    await
      await r = m.g
      assert.fail "No error!"
    catch e
      assert.equal "GOTCHA", e

  it "Should work with double layer", async extern ->
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


  it "Should work with nested asyncs with catches and closures", async extern ->
    m = sjs.eval """
        g = async (v) ->
          await (v * 10)ms
          throw "I'm an error"
          return v + 1
        f = async ->
          values = []
          async g
          catch e
            values.push(e)
          for a in [ 1, 2, 3 ]
            async g a
            catch e
              values.push(e + ", " + a)
          return values
        """
    await r = m.f
    s = "I'm an error"
    assert.deepEqual [ s, s + ", 1", s + ", 2", s + ", 3" ], r
