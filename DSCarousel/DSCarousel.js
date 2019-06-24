/* eslint complexity: "off" */
/* Todo: Implement an update thingo? */

function DSCarousel(element, options) {
  var _this = this;
  var defaults = {
    axis: {type: ['string', 'number', 'boolean'], default: 'horizontal'},
    reverse: {type: ['boolean'], default: false},
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
  this.reverse = options.reverse;

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
  progress: new Event('DSCarousel.progress'),
  build: new Event('DSCarousel.build')
};

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
          _this.DOMTarget.dispatchEvent(DSCarousel.events.progress, {detail: {
            currentSlide: this.currentSlide + deltaSlide,
            prevSlide: this.currentSlide,
            deltaSlide: deltaSlide
          }});
        };

        this.timeline.fromTo(this.DOMTarget, this.options.GSAPDuration, from, to);
        this.currentSlide += deltaSlide;
      }
    } else {
      this.currentSlide += deltaSlide;
      this.angleCurrent = this.currentSlide * (this.axis === 'vertical' ? 1 : -1) * this.angleIncrement;
      this.DOMTarget.style.transform = 'rotate' + axis + '(' + this.angleCurrent + 'deg)';
    }
  },
  next: function() {
    this.goto(this.currentSlide + 1);
  },
  previous: function() {
    this.goto(this.currentSlide - 1);
  },
  // TODO: Implement dry run results
  build: function(dry) {
    var _this = this;
    var largestSize = 0;
    var RAD2DEG = Math.PI / 180;
    var magnitude;
    var axis = this.axis === 'horizontal' ? 'Y' : 'X';
    // We assume the center is where the slide is to be displayed
    var oldSlides = this.slides.slice(0);

    // Get immediate children
    this.slides = [].slice.call(this.DOMTarget.children, 0);

    if (this.reverse) {
      this.slides.reverse();
    }

    this.angleIncrement = 360 / this.slides.length;

    this.slides.forEach(function(element) {
      element.style.transform = '';
      largestSize = Math.max(largestSize, _this.axis === 'horizontal' ? element.clientWidth : element.clientHeight);
    });

    magnitude = (largestSize / 2 * Math.sin((90 - this.angleIncrement / 2) * RAD2DEG)) / Math.sin(this.angleIncrement / 2 * RAD2DEG);

    this.slides.forEach(function(element, index) {
      element.setAttribute('style', 'transform: rotate' + axis + '(' + ((_this.axis === 'vertical' ? -1 : 1) * _this.angleIncrement * index) + 'deg) translateZ(' + magnitude + 'px);');
    });

    // Stay on current slide, or if the current slide no longer exist, go to last available slide
    this.DOMTarget.style.transform = 'rotate' + axis + '(' + (this.currentSlide * -this.angleIncrement) + 'deg)';

    this.DOMTarget.dispatchEvent(DSCarousel.events.build, {detail: {
      newSlides: this.slides.slice(0),
      oldSlides: oldSlides
    }});
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
