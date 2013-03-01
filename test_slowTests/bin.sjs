
require assert
require child_process as cp
require fs
require path
require util

require ../src/seriousjs as seriousjs

describe "bin/seriousjs and dependencies", ->
  before (done) ->
    # Test setup; remove the node_modules directory to test that packages.json
    # installs everything needed
    this.timeout(5000)

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

    rmDir(path.join(__dirname, '../node_modules'))

    # Install our dependencies again
    cp.exec(
        "npm install --production ."
        cwd: __dirname + '/..'
        (error, stdout, stderr) ->
          console.log(stderr)
          assert.equal null, error
          done()


  it "Should run fibonacci.sjs", (done) ->
    this.timeout(10000)
    cp.exec(
        "bin/seriousjs examples/fibonacci.sjs"
        cwd: __dirname + '/..'
        (error, stdout, stderr) ->
          assert.equal "", stderr
          assert.equal "fib(5): 5\nfib(10): 55\nfib(20): 6765\n", stdout
          done()
