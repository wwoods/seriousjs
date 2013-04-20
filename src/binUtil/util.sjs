
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


rmDirFiles = (dir, include = null, exclude = null) ->
  try
    files = fs.readdirSync(dir)
  catch e
    return
  if files.length > 0
    for file in files
      path = dir + '/' + file
      stats = fs.lstatSync(path)
      if not fs.lstatSync(path).isDirectory()
        if include == null or include.test(path)
          if exclude == null or not exclude.test(path)
            fs.unlinkSync(path)
      else
        rmDirFiles(path, include, exclude)
  # Check again, if we removed all files, drop the folder too
  files = fs.readdirSync(dir)
  if files.length == 0
    fs.rmdirSync(dir)
