### Read in files from good & bad folders and ensure that they parse
accordingly.
###

require assert, fs
require ../src/seriousjs as sjs

addTest = (fname, shouldPass) ->
  """Adds a test to the suite for compiling the given file.
  """
  it "Should #{ shouldPass ? "" : "not" } compile #{ fname }", ->
    contents = fs.readFileSync(fname, 'utf8')
    if shouldPass
      sjs.compile(contents)
    else
      passing = false
      try
        sjs.compile(contents)
      catch e
        passing = true
      if not passing
        throw "Compilation did not fail"
        
addTestDir = (dir, shouldPass) ->
  listing = fs.readdirSync(dir)
  for fname in listing
    fname = dir + '/' + fname
    stat = fs.statSync(fname)
    if stat.isFile()
      addTest(fname, shouldPass)
      
describe "Smoke test - ", ->
  addTestDir __dirname + '/good', true
  addTestDir __dirname + '/bad', false
