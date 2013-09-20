
require assert
require vm
require ../ as sjs
require ../src/binUtil/sjsRepl

_eval = sjsRepl.options.eval

describe "sjsRepl", ->
  it "Should work with 2+2", async extern ->
    ctx = vm.createContext()
    await _eval "2+2", ctx
    assert.equal 4, ctx._


  it "Should support await", async extern ->
    ctx = vm.createContext()
    ctx.f = async () ->
      await 0
      return 55
    await result = _eval "await r = f", ctx
    assert.equal 55, result
    assert.equal 55, ctx.r


  it "Should work with await and spec", async extern ->
    ctx = vm.createContext()
    ctx.f = (callback) ->
      callback(54)
    await result = _eval "await extern noerror r = f", ctx
    assert.equal 54, ctx.r


  it "Should support require", async extern ->
    ctx = vm.createContext()
    await _eval "require assert", ctx
    assert.equal assert, ctx.assert
