
require fs

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
