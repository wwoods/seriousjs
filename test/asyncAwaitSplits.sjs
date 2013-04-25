
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
          '''Inputs > 8 get 9 added, <= 8 get 0 added'''
          a += 1
          if a > 9
            a += 1
            await a += g
            a += 1
          else
            a -= 2
          a += 1
          return a
        """
    await r = m.f 9
    assert.equal 18, r
    await r = m.f 8
    assert.equal 8, r
    await r = m.f 19
    assert.equal 28, r


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
