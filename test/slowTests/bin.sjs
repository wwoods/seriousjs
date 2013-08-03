
require assert
require child_process as cp
require fs
require path
require util

require ../../ as seriousjs
require ../../src/binUtil/util as sjsUtil

rmDir = sjsUtil.rmDir

describe "bin/seriousjs and dependencies", ->
  modulesDir = path.join(__dirname, '../../node_modules')
  modulesDirBackup = modulesDir + '.bak'
  before (done) ->
    this.timeout(20000)

    # Ensure seriousjs is compiled
    seriousjs._getEmbeddedFile()

    fs.renameSync(modulesDir, modulesDirBackup)

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


  after ->
    rmDir(modulesDir)
    fs.renameSync(modulesDirBackup, modulesDir)


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

  it "Should work with create-app", (done) ->
    this.timeout(120000)

    if fs.existsSync(__dirname + "/testApp")
      rmDir(__dirname + "/testApp")

    cp.exec(
        "../../bin/seriousjs create-app testApp"
        cwd: __dirname
        (error, stdout, stderr) ->
          assert.equal "Installing dependencies...\n", stderr
          assert.equal "Project testApp created\n", stdout

          # Also ensure that --build works ok
          cp.exec(
              "../../../bin/seriousjs index.sjs --build"
              cwd: __dirname + '/testApp'
              (error, stdout, stderr) ->
                console.log("== stdout ==\n#{ stdout }")
                console.log("== stderr ==\n#{ stderr }")
                console.log("== error ==\n#{ error }")
                assert.equal "", stderr
                assert.equal "Build finished.\n", stdout
                done()
