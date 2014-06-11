(function() {
  $.fn.threesixty = function(image, frames) {
    new ThreeSixty().initialize(this, image, frames);
  };

  function ThreeSixty() {
    this.ready = false,
    this.dragging = false,

    this.pointerStartPosX = 0,
    this.pointerEndPosX = 0,
    this.monitorStartTime = 0,

    // The pointer tracking time duration
    this.monitorInt = 10,

    // A setInterval instance used to call the rendering function
    this.ticker = 0,

    // Sets the speed of the image sliding animation
    this.speedMultiplier = -10,

    this.totalFrames = 180,
    this.currentFrame = 0,
    this.frames = [],
    this.endFrame = 0,
    this.loadedImages = 0,

    this.$document = $(document),
    this.$container = undefined,
    this.$images = undefined;
  }

  ThreeSixty.prototype.initialize = function (container, image, imageTotalFrames) {
    this.$container = container;
    this.$images = $('<ol>');
    this.$container.append(this.$images);

    this.totalFrames = imageTotalFrames;
    var tmpImage = new Image();
    tmpImage.src = image;
    $(tmpImage).load(function() {
      var width = tmpImage.width;
      var height = tmpImage.height;
      for(var i = 0; i < this.totalFrames; i++) {
        this._loadImage(image, height, width / this.totalFrames, width / this.totalFrames * i);
      }
    }.bind(this));
    this._setUserEvents();
  }

  ThreeSixty.prototype._loadImage = function(image, height, width, position) {
    var li = $("<li>");

    var styles = {
      'background-image': 'url(' + image + ')',
      'width': width + 'px',
      'height': height + 'px',
      'background-position': '-' + new String(position) + 'px 0'
    }

    li.css(styles)
    li.addClass("previous-image");

    this.frames.push(li);
    this.$images.prepend(li);

    this.loadedImages++;
    if (this.loadedImages == this.totalFrames) {
      this.frames[0].removeClass("previous-image").addClass("current-image");
      this._showThreesixty();
    }
  };

  ThreeSixty.prototype._showThreesixty = function() {
    this.$images.fadeIn("slow");
    this.ready = true;
    this.endFrame = 0;
    this._refresh();
  };

  ThreeSixty.prototype._render = function() {
    // The rendering function only runs if the "currentFrame" value hasn't reached the "endFrame" one
    if(this.currentFrame !== this.endFrame) {
      /*
      Calculates the 10% of the distance between the "currentFrame" and the "endFrame".
      By adding only 10% we get a nice smooth and eased animation.
      If the distance is a positive number, we have to ceil the value, if its a negative number, we have to floor it to make sure
      that the "currentFrame" value surely reaches the "endFrame" value and the rendering doesn't end up in an infinite loop.
      */
      var frameEasing = this.endFrame < this.currentFrame ? Math.floor((this.endFrame - this.currentFrame) * 0.1) : Math.ceil((this.endFrame - this.currentFrame) * 0.1);
      // Sets the current image to be hidden
      this._hidePreviousFrame();
      // Increments / decrements the "currentFrame" value by the 10% of the frame distance
      this.currentFrame += frameEasing;
      // Sets the current image to be visible
      this._showCurrentFrame();
    } else {
      // If the rendering can stop, we stop and clear the ticker
      window.clearInterval(this.ticker);
      this.ticker = 0;
    }
  };

  /**
  * Creates a new setInterval and stores it in the "ticker"
  * By default I set the FPS value to 60 which gives a nice and smooth rendering in newer browsers
  * and relatively fast machines, but obviously it could be too high for an older architecture.
  */
  ThreeSixty.prototype._refresh = function() {
    // If the ticker is not running already...
    if (this.ticker === 0) {
      // Let's create a new one!
      this.ticker = self.setInterval(function() { this._render() }.bind(this), Math.round(1000 / 60));
    }
  };

  ThreeSixty.prototype._hidePreviousFrame = function() {
    this.frames[this._getNormalizedCurrentFrame()].removeClass("current-image").addClass("previous-image");
  };

  ThreeSixty.prototype._showCurrentFrame = function() {
    this.frames[this._getNormalizedCurrentFrame()].removeClass("previous-image").addClass("current-image");
  };

  /**
  * Returns the "currentFrame" value translated to a value inside the range of 0 and "totalFrames"
  */
  ThreeSixty.prototype._getNormalizedCurrentFrame = function() {
    var c = -Math.ceil(this.currentFrame % this.totalFrames);
    if (c < 0) c += (this.totalFrames - 1);
    return c;
  };

  /**
  * Returns a simple event regarding the original event is a mouse event or a touch event.
  */
  ThreeSixty.prototype._getPointerEvent = function(event) {
    return event.originalEvent.targetTouches ? event.originalEvent.targetTouches[0] : event;
  };

  ThreeSixty.prototype._setUserEvents = function() {
    this.$container.on("mousedown", function (event) {
      event.preventDefault();
      this.pointerStartPosX = this._getPointerEvent(event).pageX;
      this.dragging = true;
    }.bind(this));

    this.$document.on("mouseup", function (event){
      event.preventDefault();
      this.dragging = false;
    }.bind(this));

    this.$document.on("mousemove", function (event){
      event.preventDefault();
      this._trackPointer(event);
    }.bind(this));

    this.$container.on("touchstart", function (event) {
      event.preventDefault();
      this.pointerStartPosX = this._getPointerEvent(event).pageX;
      this.dragging = true;
    }.bind(this));

    this.$container.on("touchmove", function (event) {
      event.preventDefault();
      this._trackPointer(event);
    }.bind(this));

    this.$container.on("touchend", function (event) {
      event.preventDefault();
      this.dragging = false;
    }.bind(this));
  };

  /**
  * Tracks the pointer X position changes and calculates the "endFrame" for the image slider frame animation.
  * This function only runs if the application is ready and the user really is dragging the pointer; this way we can avoid unnecessary calculations and CPU usage.
  */
  ThreeSixty.prototype._trackPointer = function(event) {
    var userDragging = this.ready && this.dragging ? true : false;

    if(userDragging) {

      // Stores the last x position of the pointer
      this.pointerEndPosX = this._getPointerEvent(event).pageX;

      // Checks if there is enough time past between this and the last time period of tracking
      if(this.monitorStartTime < new Date().getTime() - this.monitorInt) {
        // Calculates the distance between the pointer starting and ending position during the last tracking time period
        var pointerDistance = this.pointerEndPosX - this.pointerStartPosX;
        // Calculates the endFrame using the distance between the pointer X starting and ending positions and the "speedMultiplier" values
        this.endFrame = this.currentFrame + Math.ceil((this.totalFrames - 1) * this.speedMultiplier * (pointerDistance / this.$container.width()));
        // Updates the image slider frame animation
        this._refresh();
        // restarts counting the pointer tracking period
        this.monitorStartTime = new Date().getTime();
        // Stores the the pointer X position as the starting position (because we started a new tracking period)

        this.pointerStartPosX = this._getPointerEvent(event).pageX;
      }
    } else {
      return;
    }
  };
})();
