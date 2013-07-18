
require child_process
require fs
require path
require seriousjs
require ./util as sjsUtil

_embeddedFile = seriousjs._getEmbeddedFile()
_requireJsSource = path.join(__dirname, '../../lib/requirejs')

setupExpress = async (app, express, webappPath) ->
  """This method is responsible for handling an application that uses the
  built-in support for RequireJS of SeriousJs.

  Requires a reference to express so that we use the app's version of the
  module and not seriousjs'.

  Calls callback with true if app should continue executing (not just a build),
  false if it should terminate.
  """
  target = path.resolve(path.join(webappPath, '_requirejs'))
  if not fs.existsSync(target)
    fs.mkdirSync(target)

  copy = (name, isAbsolute) ->
    copySource = name
    if not isAbsolute
      copySource = path.join(_requireJsSource, name)
    else
      name = path.basename(copySource)

    copyTarget = path.join(target, name)

    if fs.existsSync(copyTarget)
      fs.unlinkSync(copyTarget)

    contents = fs.readFileSync(copySource, 'utf8')
    fs.writeFileSync(copyTarget, contents)

  # Copy require.js into path...
  copy(_embeddedFile, true)
  copy('require.js')
  copy('css.js')
  copy('shim.js')
  copy('sjs.js')
  copy('loader.js')
  copy('app.build.js')

  # Now that it's set up, check for compiles and whatnot.
  if '--build' in process.argv
    await _buildApp(path.join(target, '..'))
    console.log("Build finished.")
    # Exit without calling callback or any setup.
    return false

  # Link lib folders, which are never compiled
  app.use('/src/lib', express.static(path.join(webappPath, 'lib')))
  app.use('/src/shared/lib',
      express.static(path.join(webappPath, '../shared/lib')))

  # Link the app to /src and run callback to start the server
  if '--built' in process.argv
    # Compiled mode
    await _buildApp(path.join(target, '..'))
    app.use('/src', express.static(path.join(webappPath, '../build.webapp')))
  else
    # Debug mode
    app.use('/src/shared', express.static(path.join(webappPath, '../shared'))
    app.use('/src', express.static(webappPath))

  # Return true to say the app can start
  return true


_buildApp = async (target) ->
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

  await noerror code = rJsProc.on('exit')

  if code == 0
    # Delete the old build.webapp, and put in the new one
    sjsUtil.rmDir(path.join(target, '../build.webapp'))
    fs.renameSync(path.join(target, '../build.webapp.new'),
        path.join(target, '../build.webapp'))
    # Delete every file in the new build directory except _requirejs/*
    sjsUtil.rmDirFiles(path.join(target, '../build.webapp'),
        /\.(js|sjs)$/,
        /_requirejs\/loader\.js|_requirejs\/require\.js$/)
  else
    throw new Error("Build failed:\n== stdout ==\n#{ allStdout.join("") }\n"
        + "== stderr ==\n#{ allStderr.join("") }")
