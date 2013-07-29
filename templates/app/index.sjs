
 # Module dependencies

require express
#require ./server/routes
#require ./server/routes/user
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
  await r = seriousjs.requireJs().setupWebapp(app, express,
      __dirname + '/webapp')
  if not r
    return

  # development only
  if 'development' == app.get('env')
    app.use(express.errorHandler())

  seriousjs.requireJs().serveWebapp(
      app, '/',
      shim: [ 'jquery-1.9.1.min', 'underscore-min', 'backbone-min' ]
      title: '__project__'

  await nocheck http.createServer(app).listen app.get('port')
  console.log('Express server listening on port ' + app.get('port'))
