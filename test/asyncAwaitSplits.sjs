
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
