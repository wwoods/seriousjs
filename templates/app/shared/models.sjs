
Model = Backbone.Model

class ColorHolder extends Model
  promptColor: () ->
    cssColor = prompt("CSS color?")
    @set({ color: cssColor })
