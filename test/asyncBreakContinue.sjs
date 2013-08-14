
require assert
require ../ as sjs

describe "Async loops", ->
  it "Should work with while statements and break / continue", async extern ->
    m = sjs.eval """
        f = async ->
          r = 0
          while r < 100
            await 0
            r += 1
            if r < 2
              continue
            await 0
            r *= 8
            break
            r += 99
            await 0
            r += 99
          return r
        """
    await r = m.f
    assert.equal 16, r


  it "Should work with while and break", async extern ->
    m = sjs.eval """
        f = async ->
          r = 0
          while r < 5
            await 0
            r += 1
            await 0
            break
            await 0
            r += 1
          return r
        """
    await r = m.f
    assert.equal 1, r


  it "Should work with nested loops", async extern ->
    m = sjs.eval """
        f = async ->
          r = 0
          while r < 5
            await 0
            r += 1
            while r < 50
              await 0
              r += 1
              break
            await 0
            r += 1
            break
          return r
        """
    await r = m.f
    assert.equal 3, r

