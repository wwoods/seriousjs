
require assert
require ../ as sjs

describe "await splits", ->
  @timeout 500

  it "Should work with a meta test", (done) ->
    m = sjs.eval """
        require seriousjs as sjs
        it = async extern ->
          mm = sjs.eval '''
              f = async ->
                await 0
                return "result"
              '''
          await r = mm.f()
          if r != "result"
            throw new Error("Meta failure")
        """
    m.it (error, value) ->
      # Use true instead of equal because sjs' == is stronger than javascript's
      # ==
      console.log "#{ error }, #{ value }"
      assert.equal true, null == error
      assert.equal true, undefined == value
      done()


  it "Should work with tests", async extern ->
    m = sjs.eval """
        f = async ->
          await 0
          return "result"
        """
    await r = m.f()
    assert.equal "result", r


  it "Should work with if statements", async extern ->
    m = sjs.eval """
        g = async ->
          await 0
          return 5
        f = async (a) ->
          '''Inputs > 8 get 8 added then doubled, <= 8 gets 1 subtracted then doubled'''
          a += 1
          if a > 9
            a += 1
            await a += g
            a += 1
          else
            a -= 2
          a *= 2
          return a
        """
    await r = m.f 9
    assert.equal 34, r
    await r = m.f 8
    assert.equal 14, r
    await r = m.f 19
    assert.equal 54, r


  it "Async blocks should bind to the right await level", async extern ->
    m = sjs.eval """
        g = async (t) ->
          console.log "g() before await: #""" + """{ 30 - t * 4 }"
          await (300 - t * 40)
          console.log "g() after await"
        f = async ->
          r = []
          # Should bind here
          await
            for v in [ 1, 2, 3 ]
              async
                await (30 - v * 10)
                r.push(v)
              # This makes a new split over the for loop, so if coded
              # improperly, the async block will finish before this continues.
              await 0
          # Again, bind here
          await
            for v in [ 4, 5, 6 ]
              async
                console.log("CALLING g(\#{ v })")
                await g(v)
                r.push(v)
                console.log("EXITING \#{ v }")
              await 0
          return r
        """
    await r = m.f
    assert.equal 3, r[0]
    assert.equal 2, r[1]
    assert.equal 1, r[2]
    assert.equal 6, r[3]
    assert.equal 5, r[4]
    assert.equal 4, r[5]


  it "Should work with for statements and lists", async extern ->
    m = sjs.eval """
        g = async (val) ->
          await 0
          return val + 5
        f = async ->
          r = 0
          for val, i in [ 1, 2, 3, 4 ]
            await r += g val
            r += i
            console.log "HERE #""" + """{ r }"
          return r
        """
    await r = m.f
    assert.equal 36, r


  it "Should work with for statements and hashes", async extern ->
    m = sjs.eval """
        g = async (val) ->
          await 0
          return val + 5
        f = async ->
          r = ""
          for key, val of { a: 8, b: 9, c: 10 }
            r += key
            await r += g val
          return r
        """
    await r = m.f
    assert.equal "a13b14c15", r


  it "Should work with while statements", async extern ->
    m = sjs.eval """
        g = async (val) ->
          await 0
          return val + 1
        f = async ->
          r = 0
          while r < 10
            r += 1
            await r += g r
            r += 1
          return r
        """
    await r = m.f
    assert.equal 12, r


  it "Should work within a catch", async extern ->
    m = sjs.eval """
        g = async ->
          throw new Error()
        m = async ->
          await 0
          return 42
        f = async ->
          await g
          catch e
            await v = m
            return v
          return "fail"
        """
    await r = m.f
    assert.equal 42, r


  it "Should work within a finally", async extern ->
    m = sjs.eval """
        m = async ->
          await 0
          return 33
        f = async ->
          await r = m
          finally
            await 0
            r += 1
          return r
        """
    await r = m.f
    assert.equal 34, r


  it "Should preserve 'this' context across await splits", (done) ->
    m = sjs.eval """
        f = async extern ->
          r = @value
          console.log 'a'
          console.log this
          await 0
          console.log 'b'
          console.log this
          return r + @value
        """
    m.f.call value: 4, (error, result) ->
      assert.equal null, error and error.message or error
      assert.equal 8, result
      done()


  it "Should keep context with memberId expressions", async extern ->
    m = sjs.eval """
        class B
          a: 40
          b: async -> @a
          c: async ->
            await r = @b
            return r
        b = new B()"""
    await r = m.b.c
    assert.equal 40, r


  it "Should preserve 'this' context across if splits", async extern ->
    m = sjs.eval """
        class B
          a: 56
          g: async -> 44
          f: async ->
            console.log "@0: \#{ @g }"
            if false
              return 0
            else
              console.log "@1: \#{ @g }"
              await j = @g
              console.log "@2: \#{ @g }"
              return j + @a
        b = new B()"""
    await r = m.b.f
    assert.equal 100, r

