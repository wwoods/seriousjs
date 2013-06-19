
require assert
require vm
require ../ as sjs
require ../src/binUtil/sjsRepl

eval = sjsRepl.options.eval

describe "sjsRepl", ->
  it "Should work with 2+2", async nocheck ->
    ctx = vm.createContext()
    await eval "2+2", ctx
    assert.equal 4, ctx._


  it "Should support await", async nocheck ->
    ctx = vm.createContext()
    ctx.f = async () ->
      await 0
      return 55
    await result = eval "await r = f", ctx
    assert.equal 55, result
    assert.equal 55, ctx.r


  it "Should support require", async nocheck ->
    ctx = vm.createContext()
    await eval "require assert", ctx
    assert.equal assert, ctx.assert
