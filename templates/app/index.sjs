# Module dependencies

require ./server/main as server

require express
require http
require path
require seriousjs

app = express()

# all environments
app.set('port', process.env.PORT or 3000)
app.set('views', __dirname + '/server/views')
app.use(express.favicon())
app.use(express.logger('dev'))
app.use(express.bodyParser())
app.use(express.methodOverride())
app.use(app.router)

async
  # Link our webapp into /src, optionally building an optimized version
  await r = seriousjs.requireJs().setupWebapp(app, express,
      __dirname + '/webapp')
  if not r
    # This was a build only situation, don't actually start the server.
    return

  # Initialize application
  await sjsAppOptions = server.init(app)

  # development only
  if 'development' == app.get('env')
    app.use(express.errorHandler())

  # Expose a basic HTML page to serve the app at /src
  seriousjs.requireJs().serveWebapp(
      app, '/',
      shim: sjsAppOptions.scripts
      title: sjsAppOptions.title

  await extern http.createServer(app).listen(app.get('port'))
  console.log("Express server listening on port #{ app.get('port') }")
