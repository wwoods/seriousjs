
require assert
require child_process as cp
require fs
require path
require util

require ../../ as seriousjs

describe "bin/seriousjs and dependencies", ->
  before (done) ->
    this.timeout(10000)

    # Test setup; remove the node_modules directory to test that packages.json
    # installs everything needed
    rmDir = (dir) ->
      try
        files = fs.readdirSync(dir)
      catch e
        return
      if files.length > 0
        for file in files
          path = dir + '/' + file
          stats = fs.lstatSync(path)
          if not fs.lstatSync(path).isDirectory()
            fs.unlinkSync(path)
          else
            rmDir(path)
      fs.rmdirSync(dir)

    rmDir(path.join(__dirname, '../../node_modules'))

    # Install our dependencies again
    cp.exec(
        "npm install --production ."
        cwd: __dirname + '/../..'
        (error, stdout, stderr) ->
          if error != null
            console.log(stdout)
            console.log(stderr)
            assert.equal null, error
          done()


  it "Should run fibonacci.sjs", (done) ->
    cp.exec(
        "bin/seriousjs examples/fibonacci.sjs"
        cwd: __dirname + '/../..'
        (error, stdout, stderr) ->
          assert.equal "", stderr
          assert.equal "fib(5): 5\nfib(10): 55\nfib(20): 6765\n", stdout
          done()

  it "Should run fibonacci.sjs with args", (done) ->
    cp.exec(
        "bin/seriousjs examples/fibonacci.sjs 8"
        cwd: __dirname + '/../..'
        (error, stdout, stderr) ->
          assert.equal "", stderr
          assert.equal "fib(8): 21\n", stdout
          done()
