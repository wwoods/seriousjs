""" Hook in routing and database connection information.

Typically, this file might incorporate a separate routes file or folder, and
any other initialization logic needed by the application.
"""

endpoint = (req, res) ->
  async
    await 1000
    res.send("Delayed result!")


init = async (app) ->
  """Application initialization - database and route hooks.

  By default, returns a dict that hooks into the serving of the index page:
      title: Title of the page (tab name)
      scripts: List of scripts & css files to load NOT through requireJS.  These
        default to being from the "shim" subdirectory within the "webapp"
        directory.  Precede paths with a ../ to escape the "shim" directory.
  """
  app.get('/endpoint', endpoint)
  return {
      title: '__project__'
      scripts: [ '../index.css', 'jquery-1.9.1.min', 'underscore-min',
        'backbone-min' ]
