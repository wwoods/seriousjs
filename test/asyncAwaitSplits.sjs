
require assert
require ../ as sjs

describe "await splits", ->
  it "Should work with a meta test", (done) ->
    m = sjs.eval """
        require seriousjs as sjs
        it = async ->
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


  it "Should work with tests", async ->
    m = sjs.eval """
        f = async ->
          await 0
          return "result"
        """
    await r = m.f()
    assert.equal "result", r


  it "Should work with if statements", async ->
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


  it "Async blocks should bind to the right await level", async ->
    m = sjs.eval """
        g = async (t) ->
          console.log "g() before await: #""" + """{ 30 - t * 4 }"
          await (30 - t * 4)
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
                console.log("CALLING g(v)")
                await g(v)
                r.push(v)
                console.log("EXITING")
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


  it "Should work with for statements", async ->
    m = sjs.eval """
        g = async (val) ->
          await 0
          return val + 5
        f = async ->
          r = 0
          for val in [ 1, 2, 3, 4 ]
            await r += g val
            console.log "HERE #""" + """{ r }"
          return r
        """
    await r = m.f
    assert.equal 30, r


  it "Should work with while statements", async ->
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


  it "Should preserve 'this' context across await splits", (done) ->
    m = sjs.eval """
      f = async ->
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
