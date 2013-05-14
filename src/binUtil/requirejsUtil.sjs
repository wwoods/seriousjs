
require child_process
require fs
require path
require ./util as sjsUtil

setupProject = (app, express, embeddedFile, source, webappPath, callback) ->
  """This method is responsible for handling an application that uses the
  built-in support for RequireJS of SeriousJs.
  """
  target = path.resolve(path.join(webappPath, '_requirejs'))
  if not fs.existsSync(target)
    fs.mkdirSync(target)

  copy = (name, isAbsolute) ->
    copySource = name
    if not isAbsolute
      copySource = path.join(source, name)
    else
      name = path.basename(copySource)

    copyTarget = path.join(target, name)

    if fs.existsSync(copyTarget)
      fs.unlinkSync(copyTarget)

    contents = fs.readFileSync(copySource, 'utf8')
    fs.writeFileSync(copyTarget, contents)

  # Copy require.js into path...
  copy(embeddedFile, true)
  copy('require.js')
  copy('css.js')
  copy('sjs.js')
  copy('loader.js')
  copy('app.build.js')

  # Now that it's set up, check for compiles and whatnot.
  if '--build' in process.argv
    _buildApp(path.join(target, '..'))
    # Exit without calling callback or any setup.
    return

  # Link lib folders, which are never compiled
  app.use('/src/lib', express.static(path.join(webappPath, 'lib')))
  app.use('/src/shared/lib',
      express.static(path.join(webappPath, '../shared/lib')))

  # Link the app to /src and run callback to start the server
  if '--built' in process.argv
    app.use('/src', express.static(path.join(webappPath, '../webapp.build.new')))
    _buildApp(path.join(target, '..'), callback)
  else
    app.use('/src/shared', express.static(path.join(webappPath, '../shared'))
    app.use('/src', express.static(webappPath))
    callback()


_buildApp = (target, callback) ->
  appBuildJs = path.join(target, '_requirejs/app.build.js')
  rJs = path.join(__dirname, '../../lib/requirejs/r.js')
  rJsProc = child_process.spawn(
      'node',
      [ rJs, '-o', appBuildJs ],
      cwd: target
      stdio: 'pipe'
  allStdout = []
  allStderr = []
  rJsProc.stdout.on 'data', (data) ->
    allStdout.push(data)
  rJsProc.stderr.on 'data', (data) ->
    allStderr.push(data)
  cleanup = (code) ->
    if code == 0
      # Delete every file in the new build directory except _requirejs/*
      sjsUtil.rmDirFiles(path.join(target, '../webapp.build.new'),
          /\.(js|sjs)$/,
          /_requirejs\/loader\.js|_requirejs\/require\.js$/)
      not callback and console.log("Build finished.")
      callback and callback()
    else
      throw new Error("Build failed:\n== stdout ==\n#{ allStdout.join("") }\n"
          + "== stderr ==\n#{ allStderr.join("") }")
  rJsProc.on('exit', cleanup)
