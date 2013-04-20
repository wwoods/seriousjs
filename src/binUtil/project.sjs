
require child_process
require console
require fs
require path

copyAndFormat = (fileOrDir, target, {>project} = options) ->
  if fs.statSync(fileOrDir).isDirectory()
    if path.basename(fileOrDir) in [ "node_modules", "_requirejs",
        "webapp.build", "webapp.build.new" ]
      # Don't clone node_modules
      return
    fs.mkdirSync(target)
    for f in fs.readdirSync(fileOrDir)
      copyAndFormat(path.join(fileOrDir, f), path.join(target, f), options)
    return

  contents = fs.readFileSync(fileOrDir, 'utf8')
  newContents = contents.replace(/__project__/g, project)
  fs.writeFileSync(target, newContents)


this.createApp = (name) ->
  base = path.resolve(name)
  name = path.basename(name)
  if fs.existsSync(base)
    console.error("Project at #{base} exists")
    process.exit(1)

  copyAndFormat(path.join(__dirname, '../../templates/app'), base,
      project: name)

  # Run npm install so that they have dependencies installed
  child = child_process.spawn(
      "npm",
      [ "install", "." ],
      { cwd: base }
  child.on 'exit', (code) ->
    console.log("Project #{name} created")
    process.exit(code)
