/* eslint complexity: "off" */
/* global TimelineMax */
/* Todo: Implement an update thingo? */
function DSCarousel(element, options) {
  var _this = this;
  var defaults = {
    axis: {type: ['string', 'number', 'boolean'], default: 'horizontal'},
    fps: {type: ['number'], default: '60'},
    GSAP: {type: ['boolean'], default: false},
    GSAPDuration: {type: ['number'], default: 0.5},
    GSAPEase: {type: ['object'], default: undefined}
  };

  this.slides = [];
  this.currentSlide = 0;

  this.angleIncrement = 0;
  this.angleCurrent = 0;

  options = options || {};

  Object.keys(defaults).forEach(function(key) {
    options[key] = defaults[key].type.indexOf(typeof options[key]) !== -1 ? options[key] : defaults[key].default;
  });

  this.options = options;

  this.DOMTarget = element;

  // Ensure the carousel has preserve-3d
  this.DOMTarget.transformStyle = 'preserve-3d';
  this.DOMTarget['-webkit-transform-style'] = 'preserve-3d';
  this.DOMTarget['-moz-transform-style'] = 'preserve-3d';

  // Get axis
  // Maybe provide and angle?
  this.axis = (function(optionDirection) {
    var direction = 'horizontal';

    if (typeof optionDirection === 'undefined') {
      return direction;
    }

    if ((typeof optionDirection === 'string' && optionDirection === 'vertical')
    || (typeof optionDirection === 'number' && optionDirection === 1)
    || (typeof optionDirection === 'boolean' && optionDirection)) {
      direction = 'vertical';
    }

    return direction;
  })(options.axis);

  // Get TweenMax
  if (options.GSAP) {
    options.GSAP = TimelineMax ? true : false;
    this.timeline = new TimelineMax();
  }

  //if (typeof MutationObserver !== 'undefined')
  // TODO: Implement shim via mutationEvents
  // Lifted straight from MDN
  // Do we listen for attribute changes?
  /*
  this.observer = new MutationObserver(function(mutationList) {
    mutationList.forEach(function(mutation) {
      if (mutation.type === 'childList') {
        _this.build();
      }
    });
  });
  this.observer.observe(this.DOMTarget, {childList: true});
  */
  this.build();
}

DSCarousel.events = {
  progress: 'DSCarousel.progress',
  build: 'DSCarousel.build',
  // Shim for custom events
  customEvent: function(eventName, options) {
    var event = document.createEvent('Event');
    var bubbles = typeof options.bubbles === 'boolean' ? option.bubbles : true;
    var cancelable = typeof options.cancelable === 'boolean' ? option.cancelable : true;

    event.initEvent(eventName, true, true);

    event.dscarousel = options.data;

    return event;
  }
};

DSCarousel.dataAttributePrefix = 'data-dscarousel-';

DSCarousel.prototype = {
  goto: function(slide) {
    var _this = this;
    var deltaSlide = slide - this.currentSlide;
    var axis = this.axis === 'horizontal' ? 'Y' : 'X';
    var from = {};
    var to = {};
    if (this.options.GSAP) {
      if (!this.timeline.isActive()) {
        from['rotation' + axis] = (axis === 'Y' ? 1 : -1) * -this.currentSlide * this.angleIncrement;
        to['rotation' + axis] = (axis === 'Y' ? 1 : -1) * -(this.currentSlide + deltaSlide) * this.angleIncrement;
        to.ease = this.options.GSAPEase;
        to.onComplete = function() {
          _this.DOMTarget.dispatchEvent(DSCarousel.events.customEvent(DSCarousel.events.progress, {data: {
            currentSlide: this.currentSlide - deltaSlide,
            prevSlide: this.currentSlide,
            deltaSlide: deltaSlide
          }}));
        };

        this.timeline.fromTo(this.DOMTarget, this.options.GSAPDuration, from, to);
        this.currentSlide += deltaSlide;
        this.currentSlide = this.currentSlide >= this.slides.length ? 0 : this.currentSlide < 0 ? this.slides.length - 1 : this.currentSlide;
      }
    } else {
      this.currentSlide += deltaSlide;
      this.currentSlide = this.currentSlide >= this.slides.length ? 0 : this.currentSlide < 0 ? this.slides.length - 1 : this.currentSlide;
      this.angleCurrent = this.currentSlide * (this.axis === 'vertical' ? 1 : -1) * this.angleIncrement;
      this.DOMTarget.style.transform = 'rotate' + axis + '(' + this.angleCurrent + 'deg)';
    }

    // Update carousel angle data
    this.DOMTarget.setAttribute(DSCarousel.dataAttributePrefix + 'angle', this.currentSlide * this.angleIncrement);
  },
  next: function() {
    this.goto(this.currentSlide + 1);
  },
  previous: function() {
    this.goto(this.currentSlide - 1);
  },
  /**
    @function DSCarousel.build
    @description Generates the CSS transform for each slide, or shows the CSS transform results after a dry run
    @param {boolean} dryRun - Whether to run a dry run or not, dry runs will not affect CSS of slides but will cause the function to return an object that describes future layout
    @returns {Object} undefined if dry is not set
  */
  build: function(dryRun) {
    var _this = this;
    var largestSize = 0;
    var RAD2DEG = Math.PI / 180;
    var magnitude;
    var axis = this.axis === 'horizontal' ? 'Y' : 'X';
    // We assume the center is where the slide is to be displayed
    var newSlides = [];
    var oldSlides = this.slides.slice(0);
    var newAngleIncrement;
    var dryRunResults = {
      dscarousel: {
        DOMElement: undefined,
        transform: undefined,
        angleIncrementOld: this.angleIncrement,
        currentSlide: this.currentSlide
      },
      slides: []
    };

    // Dry run defaults to false
    dryRun = typeof dryRun !== 'boolean' ? false : dryRun;

    // Get immediate children
    newSlides = [].slice.call(this.DOMTarget.children, 0);

    // Only take visible slides into consideration
    newSlides = newSlides.filter(function(element) {
      return window.getComputedStyle(element).getPropertyValue('display') !== 'none';
    });

    // Update currentSlide if it falls outside of new slide length;
    if (!dryRun && this.slides.length < this.currentSlide) {
      this.currentSlide = this.slides.length - 1;
    } else if (dryRun && this.slides.length < this.currentSlide) {
      dryRunResults.dscarousel.currentSlide = this.slides.length - 1;
    }

    newAngleIncrement = 360 / newSlides.length;

    // Clear and find the largest slide based on axis, we use this to find the magnitude
    newSlides.forEach(function(element) {
      largestSize = Math.max(largestSize, _this.axis === 'horizontal' ? element.clientWidth : element.clientHeight);
    });

    magnitude = (largestSize / 2 * Math.sin((90 - newAngleIncrement / 2) * RAD2DEG)) / Math.sin(newAngleIncrement / 2 * RAD2DEG);

    // Position each slide
    newSlides.forEach(function(element, index) {
      if (dryRun) {
        dryRunResults.slides.push({
          DOMElement: element,
          axis: axis,
          angle: (_this.axis === 'vertical' ? -1 : 1) * newAngleIncrement * index,
          magnitude: magnitude,
          transformCSS: 'rotate' + axis + '(' + ((_this.axis === 'vertical' ? -1 : 1) * newAngleIncrement * index) + 'deg) translateZ(' + magnitude + 'px)'
        });
      } else {
        element.setAttribute(DSCarousel.dataAttributePrefix + 'angle', (_this.axis === 'vertical' ? -1 : 1) * newAngleIncrement * index);
        element.setAttribute(DSCarousel.dataAttributePrefix + 'magnitude', magnitude);
        element.style.transform = 'rotate' + axis + '(' + ((_this.axis === 'vertical' ? -1 : 1) * newAngleIncrement * index) + 'deg) translateZ(' + magnitude + 'px)';
      }
    });

    // Init carousel
    if (dryRun) {
      dryRunResults.dscarousel.DOMElement = this.DOMTarget;
      dryRunResults.dscarousel.angleOld = this.angleCurrent;
      dryRunResults.dscarousel.angleNew = dryRunResults.dscarousel.currentSlide * newAngleIncrement;
      dryRunResults.dscarousel.angleIncrementNew = this.angleIncrement;
      dryRunResults.dscarousel.axis = axis;
      dryRunResults.dscarousel.transformCSS = 'rotate' + axis + '(' + this.currentSlide * this.angleIncrement + 'deg);';
      return dryRunResults;
    } else {
      this.angleIncrement = newAngleIncrement;
      this.slides = newSlides;
      this.DOMTarget.setAttribute(DSCarousel.dataAttributePrefix + 'angle', this.currentSlide * this.angleIncrement);

      // Stay on current slide, or if the current slide no longer exists, go to last available slide
      this.DOMTarget.style.transform = 'rotate' + axis + '(' + this.currentSlide * this.angleIncrement + 'deg);';
      this.DOMTarget.dispatchEvent(DSCarousel.events.customEvent(DSCarousel.events.build, {data: {
        newSlides: this.slides.slice(0),
        oldSlides: oldSlides
      }}));
    }
  },
  // Gets the current angle on the current axis and updates currentSlide to match
  update: function() {
    var axis = this.axis === 'horizontal' ? 'Y' : 'X';
    var transform = this.DOMTarget.style.transform;
    var regExpResultRotate = (new RegExp('rotate' + axis + '\\((.*)deg\\)')).exec(transform); // Capture group for rotateY
    var regExpResultMatrix = /matrix3d\((.*)\)/.exec(transform); // Capture Group for matrix3D
    var estimatedSlide = -1;

    if (regExpResultRotate !== null) {
      estimatedSlide = Math.floor(parseFloat(regExpResultRotate[1]) / this.angleIncrement);
    } else if (regExpResultMatrix !== null) {
      // TODO: Get different matrix positions based on matrix...
    } else {
      return estimatedSlide;
    }
  }
};
