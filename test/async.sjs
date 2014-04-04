
require assert
require ../ as sjs

"""Note - this file should NOT use the "async" or "await" keyword as part of
the tests; those should all be in eval blocks.  That is what separates this
async test file from the other ones - this one should still work if the
keywords are broken.
"""

describe "async functionality", ->
  # If async isn't working we won't catch stuff.  Don't let the tests run
  # forever.
  @timeout(1000)

  it "Should be applicable to lambdas", (done) ->
    m = sjs.eval """q = async extern -> 32"""
    m.q (error, r) ->
      assert.equal 32, r
      done()


  it "Should work with this", ->
    # This was a grammar error...  apparently the "await" part was choking
    # because there weren't expressions for it (as single-line lambdas only
    # support)
    m = sjs.eval """
        assert = { throws: () -> "ok" }
        assert.throws async extern -> await m.g
        """


  it "Should be applicable to lambdas with callback specified", (done) ->
    m = sjs.eval """q = async extern (callback) -> 33"""
    m.q (error, r) ->
      assert.equal 33, r
      done()


  it "Should be applicable to lambdas with first parm as callback", (done) ->
    m = sjs.eval """q = async extern (callback, b, c) -> b * 10 + c"""
    m.q(
        (error, r) ->
          assert.equal 12, r
          done()
        1
        2


  it "Should disallow calling an async method without the async or await keyword", ->
    m = sjs.eval """
        f = async ->
          return 56
        g = ->
          # Should throw
          f()

        h = async extern ->
          return 56
        z = ->
          # Should not throw
          h()
        """
    try
      m.g()
      assert.fail "Did not throw"
    catch e
      assert.equal "Runtime: cannot call async method without async or await "
          + "keywords unless extern is specified", e.message
    m.z (e, v) ->
      assert.equal 56, v


  it "Should disallow calling a normal method with the async keyword", ->
    m = sjs.eval """
        f = ->
          return 56
        g = ->
          # Should throw
          async f
        h = ->
          # Should not throw
          async extern f
        """
    try
      m.g()
      assert.fail "Did not throw"
    catch e
      expected = "Runtime: called non-async function with async or await "
          + "keywords.  If you meant this, use the extern keyword after "
          + "async or await"
      assert.equal expected, e.message
    m.h (e, v) ->
      assert.equal 56, v


  it "Should disallow calling a normal method with the await keyword", ->
    m = sjs.eval """
        f = ->
          return 56
        g = ->
          # Should throw
          async
            await f
          console.log "g is returning"
        h = ->
          # Should not throw
          async
            await extern f
        """
    try
      m.g()
      assert.fail "Did not throw"
    catch e
      console.log e
      assert.equal "Runtime: called non-async function with async or await "
          + "keywords.  If you meant this, use the extern keyword after "
          + "async or await", e.message
    m.h (e, v) ->
      assert.equal 56, v


  it "Should allow calling a extern async function without the extern kw", ->
    m = sjs.eval """
        f = async extern ->
          return 56
        h = async extern ->
          async f
        g = async extern ->
          await f
        """
    # Neither of these should result in errors
    m.h()
    m.g()


  it "Should support noerror for no check and no error arg", ->
    m = sjs.eval """
        f = (callback) ->
          callback(new Error("HI"))
        g = (callback) ->
          callback(88)

        r = [ null, null ]
        async
          await noerror r[0] = f
          await noerror r[1] = g
        """
    assert.equal "HI", m.r[0].message
    assert.equal 88, m.r[1]


  it "Should support defining a method as noerror to skip check", ->
    m = sjs.eval """
        f = async noerror (a, b) -> a + b
        q = [ 0 ]
        f 3, 6, (r) -> q[0] = r
        """
    assert.equal 9, m.q[0]


  it "Should properly bind async methods to context", ->
    m = sjs.eval """
        class B
          a: async (v) -> @value + v

        b = new B()
        b.value = 88
        r = [ 0 ]
        async
          await r[0] = b.a(2)
        """
    assert.equal 90, m.r[0]


  it "Should not squelch multiple errors from async", ->
    """Ensure that if there are several errors thrown, the non-first ones
    get thrown again (rather than getting passed to the callback).  
    Also shouldn't be handled by onSecondaryError since it happened in a
    callback.
    """
    m = sjs.eval """
        q = async extern ->
          n = 0
          await
            while n < 100
              throw 'g'
              n += 1
          return g[0]"""

    threw = true
    try
      m.q(
          (error, r) ->
            throw "Don't squelch me!"
      threw = false
    catch e
      assert.equal "Don't squelch me!", e.message or e
    if not threw
      assert.fail "Never threw"


  it "Should work with a blank return", (done) ->
    m = sjs.eval """
        f = async extern ->
          return
        """
    m.f()
    done()


  it "Should disallow try", () ->
    try
      m = sjs.eval """
          f = async ->
            try
              a
            catch e
              return e
          """
      assert.fail "Never threw"
    catch e
      assert.equal "On line 3: 'try' may not be used in an async function; use "
          + "'await' instead", e.message


  it "Should cascade callback argument", (done) ->
    """By which we mean that if a method expects two arguments and does
    not get one of them, the callback argument should drift back to earlier
    arguments.
    """
    m = sjs.eval """
        f = async extern (data) ->
          return typeof data + "46"
        """
    # Call it without the data argument
    m.f (error, result) ->
      assert.equal null, error
      assert.equal "undefined46", result
      done()


  it "Should not cascade beyond first undefined", ->
    m = sjs.eval """
        f = async extern (data1, data2) ->
          data1(data2)
        """
    v = [ 0 ]
    m.f(
        (val) -> v[0] = val
        55
    assert.equal 55, v[0]


  it "Should properly cascade when combined with dict unmappings", (done) ->
    m = sjs.eval """
        f = async extern (object: { a, b }) ->
          return object
        """
    m.f (error, resut) ->
      assert.equal null, error
      assert.equal "undefined", typeof object
      done()


  it "Should allow specifying nocascade on callback", () ->
    m = sjs.eval """
        f = async extern nocascade (data) ->
          return 56
        """
    m.f () -> assert.fail("Should not have called data as callback")


  it "Should work with tracebacks", (done) ->
    m = sjs.eval """
        first = async () ->
          await 99
          return 45
        f = async extern () ->
          "A function"
          # A comment
          await 0
          # Do something else
          await 1
          inner = async () ->
            "Hey thar!"
            throw new Error("NOOOoooooo")
          await inner
          return "FailWhale"
        """
    m.f (error) -> 
      assert.equal "NOOOoooooo", error and error.message or error
      assert.equal true, error.stack.indexOf('/eval:13') >= 0
      done()


  it "Should support and wait for internal async", (done) ->
    m = sjs.eval """
        g = [ 0 ]
        m = (callback) ->
          setTimeout(
              () ->
                g[0] += 1
                callback()
              0
        q = async extern ->
          n = 0
          await
            while n < 100
              async extern m
              n += 1
          return g[0]"""
    m.q(
        (error, r) ->
          assert.equal null, error and error.message
          assert.equal 100, r
          done()


  it "Should support async at global (non-function) levels", () ->
    m = sjs.eval """
        val = [ 0 ]
        f = async () ->
          val[0] += 1
        g = () ->
          async
            val[0] += 1
          async f
        g()
        async f
        """
    assert.equal 3, m.val


  it "Should disallow async with results at global level", () ->
    assert.throws -> sjs.compile """async r = f"""


  it "Should disallow async with results at function level outside await", () ->
    assert.throws -> sjs.compile """
        f = async () ->
          async r = f
        """


  it "Should not support await at global levels", () ->
    assert.throws -> sjs.compile """await q"""


  it "Should support noerror for result", (done) ->
    m = sjs.eval """
        f = async extern noerror ->
          return 45
        g = async extern noerror ->
          throw "FAILURE!"
        """
    try
      m.g()
      assert.fail "No failure seen?"
    catch e
      assert.equal "FAILURE!", e.message or e

    m.f (result) ->
      assert.equal 45, result
      done()


  it "Should throw an error when no callback is specified rather than hiding "
      + "it", ->
        m = sjs.eval """
            f = async extern ->
              throw "error"
            """
        try
          # deliberately call without any callback
          m.f()
        catch e
          assert.equal "error", e.message or e


  it "Should propagate errors", (done) ->
    m = sjs.eval """
        q = async extern ->
          throw new Error("ERROR!!!")
        """
    m.q(
        (error, r) ->
          assert.equal true, "ERROR!!!" in error.toString()
          done()


  it "Should throw the error if there is no callback", () ->
    m = sjs.eval """
        q = async extern ->
          throw "ERROR"
        """
    try
      m.q()
      throw "Failed to throw!"
    catch e
      assert.equal "ERROR", e


  it "Should support await with a break in ms", (done) ->
    m = sjs.eval """
        times = []
        q = async extern ->
          times.push(Date.now())
          console.log("A1")
          await 10
          times.push(Date.now())
          console.log("A2")
          await 15
          console.log("A3")
        """
    n = Date.now()
    m.q(
        (error) ->
          assert.equal true, Date.now() - n >= 25
          assert.equal true, m.times[1] - m.times[0] >= 10
          done()


  it "Should support await with a break in s", (done) ->
    m = sjs.eval """
        q = async extern ->
          await 0.01s
        """
    n = Date.now()
    m.q(
        (error) ->
          assert.equal true, Date.now() - n >= 10
          done()


  it "Should work with a basic counter", (done) ->
    m = sjs.eval """
        val = [ 0 ]
        progressDemo = async extern ->
          val[0] = 1
          await 0
          val[0] = 2
          await 0
          val[0] = 3
          await 0
          val[0] = 4
          await 0
          val[0] = 5
          await 0
          val[0] = 6
        """
    m.progressDemo () ->
      assert.equal 6, m.val[0]
      done()


  it "Should work with await statements", (done) ->
    m = sjs.eval """
        val = [ 0 ]
        g = async ->
          await 5
          val[0] += 1
        q = async extern ->
          await g
          await g
        """
    n = Date.now()
    m.q () ->
      assert.equal 2, m.val[0]
      assert.equal true, Date.now() - n >= 10
      done()


  it "Should work with await statements with explicit callback", (done) ->
    m = sjs.eval """
        f = (callback, a, b) ->
          callback(null, a + b)
        g = async extern ->
          await extern ar = f callback, 4, 8
          return ar
        """
    m.g (error, r) ->
      assert.equal null, error and error.message or error
      assert.equal 12, r
      done()


  it "Should work with assigned await statements", (done) ->
    m = sjs.eval """
        val = [ 0 ]
        inner = async ->
          await 0
          return 12

        g = async extern ->
          await val[0] = inner
        """
    m.g (error) ->
      assert.equal null, error
      assert.equal 12, m.val[0]
      done()


  it "Should maintain context in await assignments", (done) ->
    m = sjs.eval """
        g = (callback) ->
          callback(null, 56)
        class Me
          f: async extern ->
            await extern @value = g
        me = new Me()
        """
    m.me.f (error) ->
      assert.equal 56, m.me.value
      done()


  it "Should maintain context object for extern calls", (done) ->
    m = sjs.eval """
        class Test
          f: async extern ->
            await extern r = this.g()
            return r
          g: (callback) ->
            @value = 88
            callback(null, 33)
        test = new Test()
        """
    m.test.f (error, result) ->
      assert.equal 88, m.test.value
      assert.equal 33, result
      done()


  it "Should work with assigned await statements to dicts", (done) ->
    m = sjs.eval """
        inner = async ->
          await 0
          return { a: 8, b: 9
        g = async extern ->
          await { a, b } = inner
          return a - b
        """
    m.g (error, r) ->
      assert.equal -1, r
      done()


  it "Should work with assigned async statements", (done) ->
    m = sjs.eval """
        val = [ 0 ]
        inner = async ->
          await 0
          return 12

        g = async extern ->
          await
            async a = inner
            async b = inner
          val[0] = a + b
        """
    m.g (error) ->
      assert.equal 24, m.val[0]
      done()


  it "Should work with await and async and nesting", (done) ->
    m = sjs.eval """
        val = [ 0 ]
        g = async ->
          await 0
          val[0] += 1
        q = async extern ->
          await
            async g
            await
              async g
              async g
            async g
        """
    m.q(
        (error) ->
          assert.equal 4, m.val[0]
          done()


  it "Should forward exceptions from before await", (done) ->
    m = sjs.eval """
        q = async extern ->
          throw "Error Before"
          await 0
          return 32 + 66
        """
    m.q (error) ->
      assert.equal "Error Before", error
      done()


  it "Should forward exceptions from after await", (done) ->
    m = sjs.eval """
        q = async extern ->
          33 + 88
          await 0
          throw "Error After"
        """
    m.q (error) ->
      assert.equal "Error After", error
      done()


  it "Should forward exceptions from async statements", (done) ->
    m = sjs.eval """
        other = async ->
          throw "Error in"
        q = async extern ->
          async other
        """
    m.q (error) ->
      assert.equal "Error in", error
      done()


  it "Should forward exceptions from await statements", (done) ->
    m = sjs.eval """
        other = async ->
          throw "Error in await"
        q = async extern ->
          await other
        """
    m.q (error) ->
      assert.equal "Error in await", error
      done()


  it "Should forward exceptions from really nested awaits", (done) ->
    m = sjs.eval """
        q = async extern ->
          await
            await
              await
                await 0
                throw "Inner error"
        """
    m.q (error) ->
      assert.equal "Inner error", error
      done()


  it "Should support async blocks", (done) ->
    m = sjs.eval """
        q = async extern ->
          r = [ 0 ]
          await
            for i in [ 1, 2, 3, 4, 5 ]
              async
                await 0
                r[0] += 1
          return r[0]
        """
    m.q (error, r) ->
      assert.equal null, error
      assert.equal 5, r
      done()


  it "Should have a closure for async blocks", ->
    m = sjs.eval """
        i = 5
        f = {}
        async
          f.b = -> [ i, true, false, null, undefined ]
        i = 99
        """
    result = m.f.b()
    for part, i in [ 5, true, false, null, undefined ]
      if part != result[i]
        assert.fail("Part #{ i } doesn't match: #{ result[i] }")


  it "Should work with function args in async blocks", ->
    """Regression failure where the function params were considered "used"
    args, thus leading to an error."
    """
    m = sjs.eval """
        e = []
        async
          f = (a, b) -> a + b
          e[0] = f(1, 2)
        """
    assert.equal 3, m.e[0]


  it "Should support return in an async block", ->
    m = sjs.eval """
        f = {}
        async
          return
          f.b = 99
        """
    assert.equal undefined, m.f.b


  it "Should support async closure blocks", (done) ->
    m = sjs.eval """
        r = []
        q = async extern ->
          for i in [ 1, 2, 3, 4, 5 ]
            async
              # Delay each one so that the variable i is propagated; we are
              # ensuring that the above closure closes i even though i is
              # used in a child scope.
              console.log i
              await 0
              console.log "End #""" + """{ i }"
              async
                r.push(i)
          return r
        """
    m.q (error, r) ->
      assert.equal null, error and error.message or error
      assert.equal 1, r[0]
      assert.equal 2, r[1]
      assert.equal 3, r[2]
      assert.equal 4, r[3]
      assert.equal 5, r[4]
      done()


  it "Should support async blocks at any level", () ->
    m = sjs.eval """
        r = [ 33 ]
        b = 55
        async
          a = b + 5
          r[0] = a
        """
    assert.equal 60, m.r[0]
    # and a shouldn't be defined, since the async block has its own closure.
    assert.equal true, undefined == m.a


  it "Should properly not close dict keys", () ->
    m = sjs.eval """
        r = [ 0 ]
        method = { value } -> value + 4
        async
          r[0] = method(value: 86)
        """
    assert.equal 90, m.r[0]


  it "Should work with tuple assignments", (done) ->
    m = sjs.eval """
        f = (callback) ->
          callback(null, 1, 2)
        g = async extern ->
          await extern a, b = f
          return [ a, b ]
        """
    m.g (error, value) ->
      assert.equal null, error
      assert.equal 1, value[0]
      assert.equal 2, value[1]
      done()


  it "Should work with tuple assignments and dicts", (done) ->
    m = sjs.eval """
        f = (callback) ->
          callback(null, { a: 1, b: 3 }, 2)
        g = async extern ->
          await extern { a, b }, c = f
          return [ a, b, c ]
        """
    m.g (error, value) ->
      assert.equal null, error
      assert.equal 1, value[0]
      assert.equal 3, value[1]
      assert.equal 2, value[2]
      done()


  it "Should work with tuple assignments and out of place error", (done) ->
    m = sjs.eval """
        f = (callback) ->
          callback(1, null, 2)
        g = async extern ->
          await extern a, error, b = f
          return [ a, b ]
        """
    m.g (error, value) ->
      assert.equal null, error and error.message or error
      assert.equal 1, value[0]
      assert.equal 2, value[1]
      done()



  it "Should raise exception for out of place error", (done) ->
    m = sjs.eval """
        f = (callback) ->
          callback(1, "error!", 2)
        g = async extern ->
          await extern a, error, b = f
          return [ a, b ]
        """
    m.g (error, value) ->
      assert.equal "error!", error
      done()


  it "Should catch on await calls", (done) ->
    m = sjs.eval """
        g = async ->
          await 0
          throw "ERRORED"
        f = async extern ->
          await g
          catch e
            return "HANDLED!"
          return "OK"
        """
    m.f (error, result) ->
      assert.equal null, error
      assert.equal "HANDLED!", result
      done()


  it "Should properly scope async variables with catch and finally", (done) ->
    m = sjs.eval """
        g = async ->
          await 0
          return 33
        f = async extern ->
          await
            async r = g
            catch e
              ok = 3
            finally
              ok = 3
          return [ r, ok ]
        """
    m.f (error, r) ->
      assert.equal null, error and error.message or error
      assert.equal 33, r[0]
      assert.equal 3, r[1]
      done()


  it "Should work with a rather complicated example", (done) ->
    """So, async keyword means "take this block out of the control flow, but
    execute it up to the first await (the whole thing if there is none)."
    await means "this block interrupts control flow."

    async and await blocks are both also "try" statements (can have catch and
    finally, but not necessary).

    async () -> blah is the same as a function whose whole body is async, and
    one of the parameters must be "callback".  The callback is ALWAYS called
    with "error" as the first argument.

    await can only happen inside of async; async inside of await delays the
    await.

    await "method" is shorthand for await async.
    """
    @timeout 2000
    m = sjs.eval """
        myMethod = (a, b, callback) ->
          '''Plain async method without keywords to interface with'''
          inner = () ->
            if a > 6
              callback(new Error("a > 6!! was #""" + """{ a }"))
            callback(null, a + b, a)
          setTimeout inner, 0

        asyncSansError = (callback) ->
          '''This method is here to demonstrate that you can use the async
          and await keywords for callbacks with no error as well; just beware
          that you cannot use catch or finally with them, and execution may
          never return if there is an error that prevents the callback from
          being called.
          '''
          inner = () ->
            callback 12, 13
          setTimeout inner, 0

        asyncWeirdError = (callback) ->
          '''This method shows how to deal with an irregularly placed error
          parameter in the callback.
          '''
          inner = () ->
            callback 12, new Error("Weird error"), 13
          setTimeout inner, 0

        # If unspecified, callback is always the last argument.  This doesn't
        # play well with optional arguments, but it is convention.  The way we
        # actually handle it should be marching backwards through arguments if
        # callback is null and there are arguments with defaults, until we find
        # a function.
        doAsyncWork = async extern () ->
          results = []
          await
            timeSeries = [ 0 ]
            nextTime = ->
              timeSeries[0] += 1
              return timeSeries[0]
            results.push "Async start: #""" + """{ nextTime() }"
            await extern blah, halo = myMethod 1, 2
            results.push "Blah, halo: #""" + """{ blah }, #""" + """{ halo }"
            await
              # If there is an await block above an async call, they will be
              # tied together, and async's results will be available to the
              # await block's parent scope.
              async extern a1, a2 = myMethod 3, 4
              r = []
              for v in [1, 2, 3, 4, 5, 6, 7, 8]
                async
                  if v == 4
                    # Delay this request so that it's after 2 more
                    results.push "Waiting 45"
                    await 45
                  results.push "Making call for #""" + """{ v } at #""" + """{ nextTime() }"
                  await extern a, b = myMethod v, 2
                  r.push("#""" + """{ v }: #""" + """{ a }")
                catch e
                  results.push("Failed #""" + """{ v }: #""" + """{ e }")
                finally
                  if v < 3 or v > 6
                    results.push("Finally from #""" + """{ v }")
                # Make each request some time apart
                await 20  # Could have been await 0.02s
            # Stuff with blah, halo, a1, a2, r...
            results.push("a1: #""" + """{ a1 }")
            results = results.concat(r)
          catch blah
            results.push "Caught #""" + """{ blah }"
            throw blah
          finally
            # do more stuff
            results.push "Outer await finally"

          await extern v1, error, v2 = asyncWeirdError()
          catch e
            results.push("Weird error caught: #""" + """{ e }")

          # And callbacks without errors.. poorly
          await extern v1, v2, error = asyncSansError()
          results.push "Got #""" + """{ v1 + ', ' + v2 }"

          return results
        """

    m.doAsyncWork (error, results) ->
      assert.equal null, error and error.message or error
      expected = [
          "Async start: 1"
          "Blah, halo: 3, 1"
          "Making call for 1 at 2"
          "Finally from 1"
          "Making call for 2 at 3"
          "Finally from 2"
          "Making call for 3 at 4"
          "Waiting 45"
          "Making call for 5 at 5"
          "Making call for 6 at 6"
          "Making call for 4 at 7"
          "Making call for 7 at 8"
          "Failed 7: Error: a > 6!! was 7"
          "Finally from 7"
          "Making call for 8 at 9"
          "Failed 8: Error: a > 6!! was 8"
          "Finally from 8"
          "a1: 7"
          # Async callbacks are happening
          "1: 3"
          "2: 4"
          "3: 5"
          "5: 7"
          "6: 8"
          "4: 6"
          "Outer await finally"
          "Weird error caught: Error: Weird error"
          "Got 12, 13"

      for v, i in expected
        if i >= results.length
          assert.fail "Did not get expected: #{ v }"
        assert.equal v, results[i]
      if results.length > expected.length
        assert.fail "Got extra message: #{ results[expected.length] }"
      done()
