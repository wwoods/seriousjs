
###

asyncMethod = async () ->
  try
    err, text = fs.readFile __filename, continue
    console.log(text)
    # Also supports pseudo-fibers... next can be "called" with an argument in
    # ms to delay execution more than one cycle.
    # Note that next only has an effect in the main level of statements... it
    # may not be used in e.g. an if statement.
    continue
    console.log("immediate")
    continue in 5000
    console.log("five seconds later")
    if Math.random() <= 0.9
      throw "Oh gosh, a transient failure"
  catch e, retry
    console.log(e)
    # At this point, retry is the frame that failed, and we have access to all 
    # of the variables used in the async try block.  Retry is a standard 
    # function with a closure containing the needed variables.
    # The first possible argument is the delay before retrying, and the second
    # argument is the maximum number of times that this frame should be retried.
    if not retry(1000, 2)
      console.log "We didn't retry, oh well"
  finally
    # Executes after the main body executes successfully, or an exception is
    # caught and retry is not called.
    console.log "Done with our asynchronous work!" 

###
a
