
require css!./views

View = Backbone.View

class ColorView extends View
  className: "color-view"

  events:
      "click": "pickColor"

  initialize: () ->
    @listenTo(@model, "change", @render)
    @$el.data('bbView', @)

  pickColor: () ->
    @model.promptColor()

  render: () ->
    @$el.css('background-color', @model.get('color'))
