
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
  before(async extern ->
    this.timeout(60000)

    # Ensure seriousjs is compiled
    await extern seriousjs._getEmbeddedFile()

    fs.renameSync(modulesDir, modulesDirBackup)

    # Install our dependencies again
    await extern stdout, stderr = cp.exec(
        "npm install --production ."
        cwd: __dirname + '/../..'
    catch e
      rmDir(modulesDir)
      fs.renameSync(modulesDirBackup, modulesDir)
      throw e

    console.log(stdout)
    console.log(stderr)


  after ->
    this.timeout 60000
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


  it "Should run fibonacci.sjs with args", async extern ->
    await extern stdout, stderr = cp.exec(
        "bin/seriousjs examples/fibonacci.sjs 8"
        cwd: __dirname + '/../..'

    assert.equal "", stderr
    assert.equal "fib(8): 21\n", stdout


  it "Should work with create-app", async extern ->
    this.timeout(120000)

    if fs.existsSync(__dirname + "/testApp")
      rmDir(__dirname + "/testApp")

    await extern stdout, stderr = cp.exec(
        "../../bin/seriousjs create-app testApp"
        cwd: __dirname

    assert.equal "Installing dependencies...\n", stderr
    assert.equal "Project testApp created\n", stdout

    # Also ensure that --build works ok
    await extern stdout, stderr = cp.exec(
        "../../../bin/seriousjs index.sjs --build"
        cwd: __dirname + '/testApp'

    console.log("== stdout ==\n#{ stdout }")
    console.log("== stderr ==\n#{ stderr }")
    assert.equal "", stderr
    assert.equal "Build finished.\n", stdout
