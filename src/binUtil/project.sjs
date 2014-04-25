
require child_process
require console
require fs
require path

copyAndFormat = (fileOrDir, target, options: {>project}) ->
  if fs.statSync(fileOrDir).isDirectory()
    if path.basename(fileOrDir) in [ "node_modules", "_requirejs" ]
        or /^build\./.test(path.basename(fileOrDir))
      # Don't clone node_modules
      return
    fs.mkdirSync(target)
    for f in fs.readdirSync(fileOrDir)
      copyAndFormat(path.join(fileOrDir, f), path.join(target, f), options)
    return

  contents = fs.readFileSync(fileOrDir, 'utf8')
  newContents = contents.replace(/__project__/g, project)
  fs.writeFileSync(target, newContents)

  oldMode = fs.statSync(fileOrDir).mode & 0777
  newMode = fs.statSync(target).mode & 0777
  console.log "#{ target }: #{ oldMode.toString(8) }, #{ newMode.toString(8) }"
  if oldMode & 0100
    newMode |= 0100
  if oldMode & 0010
    newMode |= 0010
  if oldMode & 0001
    newMode |= 0001
  console.log newMode.toString(8)
  fs.chmodSync(target, newMode)


createFromTemplate = (template, name) ->
  base = path.resolve(name)
  name = path.basename(name)
  if fs.existsSync(base)
    console.error("Project at #{base} exists")
    process.exit(1)

  copyAndFormat(path.join(__dirname, '../../templates', template), base,
      project: name)

  if fs.existsSync(path.join(base, 'package.json'))
    # Run npm install so that they have dependencies installed
    console.error("Installing dependencies...")
    child = child_process.spawn(
        "npm",
        [ "install", "." ],
        { cwd: base }
    child.on 'exit', (code) ->
      if code == 0
        console.log("Project #{name} created")
      process.exit(code)
