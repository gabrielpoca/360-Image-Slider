/**
* We wrap all our code in the jQuery "DOM-ready" function to make sure the script runs only
* after all the DOM elements are rendered and ready to take action
*/
$(document).ready(function () {
  // Tells if the app is ready for user interaction
  var ready = false,
  // Tells the app if the user is dragging the pointer
  dragging = false,
  // Stores the pointer starting X position for the pointer tracking
  pointerStartPosX = 0,
  // Stores the pointer ending X position for the pointer tracking
  pointerEndPosX = 0,
  // Stores the distance between the starting and ending pointer X position in each time period we are tracking the pointer
  pointerDistance = 0,

  // The starting time of the pointer tracking period
  monitorStartTime = 0,
  // The pointer tracking time duration
  monitorInt = 10,
  // A setInterval instance used to call the rendering function
  ticker = 0,
  // Sets the speed of the image sliding animation
  speedMultiplier = -10,
  // Stores the total amount of images we have in the sequence
  totalFrames = 180,
  // The current frame value of the image slider animation
  currentFrame = 0,
  // Stores all the loaded image objects
  frames = [],
  // The value of the end frame which the currentFrame will be tweened to during the sliding animation
  endFrame = 0,
  // We keep track of the loaded images by increasing every time a new image is added to the image slider
  loadedImages = 0,

  // Caching DOM element references
  $document = $(document),
  $container = $('#threesixty'),
  $images = $('#threesixty_images');

  $.fn.threesixty = function(image, frames) {
    totalFrames = frames;
    var tmpImage = new Image();
    tmpImage.src = image;
    $(tmpImage).load(function() {
      var width = tmpImage.width;
      var height = tmpImage.height;

      for(var i = 0; i < totalFrames; i++) {
        loadImage(image, height, width / totalFrames, width / totalFrames * i);
      }
    });
  }

  /**
  * Creates a new <li> and loads the next image in the.
  */
  function loadImage(image, height, width, position) {
    var li = $("<li>");

    var styles = {
      'background-image': 'url(' + image + ')',
      'width': width + 'px',
      'height': height + 'px',
      'background-size': 'auto',
      'background-repeat': 'no-repeat',
      'background-position': '-' + new String(position) + 'px 0'
    }

    li.css(styles)
    li.addClass("previous-image");

    frames.push(li);
    $images.prepend(li);

    loadedImages++;
    if (loadedImages == totalFrames) {
      frames[0].removeClass("previous-image").addClass("current-image");
      showThreesixty();
    }
  };

  /**
  * Displays the images with the "swooshy" spinning effect.
  * As the endFrame is set to -720, the slider will take 4 complete spin before it stops.
  * At this point it also sets the application to be ready for the user interaction.
  */
  function showThreesixty () {
    // Fades in the image slider by using the jQuery "fadeIn" method
    $images.fadeIn("slow");
    // Sets the "ready" variable to true, so the app now reacts to user interaction 
    ready = true;
    // Sets the endFrame to an initial value...
    endFrame = 0;
    refresh();
  };

  /**
  * Renders the image slider frame animations.
  */
  function render () {
    // The rendering function only runs if the "currentFrame" value hasn't reached the "endFrame" one
    if(currentFrame !== endFrame)
    {	
      /*
      Calculates the 10% of the distance between the "currentFrame" and the "endFrame".
      By adding only 10% we get a nice smooth and eased animation.
      If the distance is a positive number, we have to ceil the value, if its a negative number, we have to floor it to make sure
      that the "currentFrame" value surely reaches the "endFrame" value and the rendering doesn't end up in an infinite loop.
      */
      var frameEasing = endFrame < currentFrame ? Math.floor((endFrame - currentFrame) * 0.1) : Math.ceil((endFrame - currentFrame) * 0.1);
      // Sets the current image to be hidden
      hidePreviousFrame();
      // Increments / decrements the "currentFrame" value by the 10% of the frame distance
      currentFrame += frameEasing;
      // Sets the current image to be visible
      showCurrentFrame();
    } else {
      // If the rendering can stop, we stop and clear the ticker
      window.clearInterval(ticker);
      ticker = 0;
    }
  };

  /**
  * Creates a new setInterval and stores it in the "ticker"
  * By default I set the FPS value to 60 which gives a nice and smooth rendering in newer browsers
  * and relatively fast machines, but obviously it could be too high for an older architecture.
  */
  function refresh () {
    // If the ticker is not running already...
    if (ticker === 0) {
      // Let's create a new one!
      ticker = self.setInterval(render, Math.round(1000 / 60));
    }
  };

  /**
  * Hides the previous frame
  */
  function hidePreviousFrame() {
    /*
    Replaces the "current-image" class with the "previous-image" one on the image.
    It calls the "getNormalizedCurrentFrame" method to translate the "currentFrame" value to the "totalFrames" range (1-180 by default).
    */
    frames[getNormalizedCurrentFrame()].removeClass("current-image").addClass("previous-image");
  };

  /**
  * Displays the current frame
  */
  function showCurrentFrame() {
    /*
    Replaces the "current-image" class with the "previous-image" one on the image.
    It calls the "getNormalizedCurrentFrame" method to translate the "currentFrame" value to the "totalFrames" range (1-180 by default).
    */
    frames[getNormalizedCurrentFrame()].removeClass("previous-image").addClass("current-image");
  };

  /**
  * Returns the "currentFrame" value translated to a value inside the range of 0 and "totalFrames"
  */
  function getNormalizedCurrentFrame() {
    var c = -Math.ceil(currentFrame % totalFrames);
    if (c < 0) c += (totalFrames - 1);
    return c;
  };

  /**
  * Returns a simple event regarding the original event is a mouse event or a touch event.
  */
  function getPointerEvent(event) {
    return event.originalEvent.targetTouches ? event.originalEvent.targetTouches[0] : event;
  };

  /**
  * Adds the jQuery "mousedown" event to the image slider wrapper.
  */
  $container.on("mousedown", function (event) {
    // Prevents the original event handler behaciour
    event.preventDefault();
    // Stores the pointer x position as the starting position
    pointerStartPosX = getPointerEvent(event).pageX;
    // Tells the pointer tracking function that the user is actually dragging the pointer and it needs to track the pointer changes
    dragging = true;
  });

  /**
  * Adds the jQuery "mouseup" event to the document. We use the document because we want to let the user to be able to drag
  * the mouse outside the image slider as well, providing a much bigger "playground".
  */
  $document.on("mouseup", function (event){
    // Prevents the original event handler behaciour
    event.preventDefault();
    // Tells the pointer tracking function that the user finished dragging the pointer and it doesn't need to track the pointer changes anymore
    dragging = false;
  });

  /**
  * Adds the jQuery "mousemove" event handler to the document. By using the document again we give the user a better user experience
  * by providing more playing area for the mouse interaction.
  */
  $document.on("mousemove", function (event){
    // Prevents the original event handler behaciour
    event.preventDefault();
    // Starts tracking the pointer X position changes
    trackPointer(event);
  });

  /**
  *
  */
  $container.on("touchstart", function (event) {
    // Prevents the original event handler behaciour
    event.preventDefault();
    // Stores the pointer x position as the starting position
    pointerStartPosX = getPointerEvent(event).pageX;
    // Tells the pointer tracking function that the user is actually dragging the pointer and it needs to track the pointer changes
    dragging = true;
  });

  /**
  *
  */
  $container.on("touchmove", function (event) {
    // Prevents the original event handler behaciour
    event.preventDefault();
    // Starts tracking the pointer X position changes
    trackPointer(event);
  });

  /**
  *
  */
  $container.on("touchend", function (event) {
    // Prevents the original event handler behaciour
    event.preventDefault();
    // Tells the pointer tracking function that the user finished dragging the pointer and it doesn't need to track the pointer changes anymore
    dragging = false;
  });

  /**
  * Tracks the pointer X position changes and calculates the "endFrame" for the image slider frame animation.
  * This function only runs if the application is ready and the user really is dragging the pointer; this way we can avoid unnecessary calculations and CPU usage.
  */
  function trackPointer(event) {
    var userDragging = ready && dragging ? true : false;

    if(userDragging) {

      // Stores the last x position of the pointer
      pointerEndPosX = getPointerEvent(event).pageX;

      // Checks if there is enough time past between this and the last time period of tracking
      if(monitorStartTime < new Date().getTime() - monitorInt) {
        // Calculates the distance between the pointer starting and ending position during the last tracking time period
        pointerDistance = pointerEndPosX - pointerStartPosX;
        // Calculates the endFrame using the distance between the pointer X starting and ending positions and the "speedMultiplier" values
        endFrame = currentFrame + Math.ceil((totalFrames - 1) * speedMultiplier * (pointerDistance / $container.width()));
        // Updates the image slider frame animation
        refresh();
        // restarts counting the pointer tracking period
        monitorStartTime = new Date().getTime();
        // Stores the the pointer X position as the starting position (because we started a new tracking period)

        pointerStartPosX = getPointerEvent(event).pageX;
      }
    } else {
      return;
    }
  };
});
