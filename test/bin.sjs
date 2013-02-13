
require assert
require child_process as cp
require ../src/seriousjs as seriousjs
'''
describe "bin/seriousjs", ->
  it "Should run", ->
    cp.exec(
        "bin/seriousjs examples/fibonacci.sjs"
        { cwd: __dirname + '/..' }
        (error, stdout, stderr) ->
          assert.equals null, error
          assert.equals "Hey", stdout
'''