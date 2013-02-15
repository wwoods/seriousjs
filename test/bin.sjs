
require assert
require child_process as cp
require ../src/seriousjs as seriousjs

describe "bin/seriousjs", ->
  it "Should run", (done) ->
    this.timeout(10000)
    cp.exec(
        "bin/seriousjs examples/fibonacci.sjs"
        { cwd: __dirname + '/..' }
        (error, stdout, stderr) ->
          assert.equal "", stderr
          assert.equal "fib(5): 5\nfib(10): 55\nfib(20): 6765\n", stdout
          done()

