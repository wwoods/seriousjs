
require css!plugin

require ./sibling
require js!./plainJs

require shared/models for ColorHolder
require ./views for ColorView

$('body').empty()

$('body').append("<p>Loaded app.sjs!</p>")
sibling.method()
plainJs.test()

$('body').append("<p>Click this BackboneJS view:</p>")
colorHolder = new ColorHolder()
colorView = new ColorView(model: colorHolder)
$('body').append(colorView.el)
