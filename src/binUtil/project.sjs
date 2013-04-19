
require fs
require path

copyAndFormat = (fileOrDir, target, {>project} = options) ->
  if fs.statSync(fileOrDir).isDirectory()
    fs.mkdirSync(target)
    for f in fs.readdirSync(fileOrDir)
      copyAndFormat(path.join(fileOrDir, f), path.join(target, f), options)
    return

  contents = fs.readFileSync(fileOrDir, 'utf8')
  newContents = contents.replace(/#\{\s*project\s*\}/g, project)
  fs.writeFileSync(target, newContents)


this.create = (name) ->
  if fs.existsSync(name)
    console.log("Project #{name} exists")
    process.exit(1)

  base = path.join(process.cwd(), name)
  copyAndFormat(path.join(__dirname, 'projectTemplates/default'), base, project: name)
  console.log("Project #{name} created")

