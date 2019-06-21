/* eslint complexity: "off" */
/* Todo: Implement an update thingo? */

function Conveyor(element, options) {
  var _this = this;
  var defaults = {
    axis: {type: ['string', 'number', 'boolean'], default: 'horizontal'},
    reverse: {type: ['boolean'], default: false},
    fps: {type: ['number'], default: '60'}
  };

  this.slides = [];
  this.currentSlide = 0;

  this.angleIncrement = 0;
  this.angleCurrent = 0;

  options = options || {};

  Object.keys(defaults).forEach(function(key) {
    options[key] = defaults[key].type.indexOf(typeof options[key]) !== -1 ? options[key] : defaults[key].default;
  });

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

  this.carousel = element;

  // Ensure the carousel has preserve-3d
  this.carousel.style.transformStyle = 'preserve-3d';
  this.carousel.style['-webkit-transform-style'] = 'preserve-3d';
  this.carousel.style['-moz-transform-style'] = 'preserve-3d';

  //if (typeof MutationObserver !== 'undefined')
  // TODO: Implement shim via mutationEvents
  // Lifted straight from MDN
  // Do we listen for attribute changes?
  this.observer = new MutationObserver(function(mutationList) {
    mutationList.forEach(function(mutation) {
      if (mutation.type === 'childList') {
        _this.build();
      }
    });
  });
  this.observer.observe(this.carousel, {childList: true});
  this.build();
}

Conveyor.prototype = {
  // Used to update state of carousel based on the carousel's transform: rotateY;
  update: function() {
    // Implement
  },
  goto: function(slide) {
    var axis = this.axis === 'horizontal' ? 'Y' : 'X';

    slide = slide >= this.slides.length ? 0 : slide < 0 ? this.slides.length - 1 : slide;
    this.currentSlide = slide;
    this.angleCurrent = this.currentSlide * (this.axis === 'vertical' ? 1 : -1) * this.angleIncrement;
    this.carousel.style.transform = 'rotate' + axis + '(' + this.angleCurrent + 'deg)';
  },
  next: function() {
    this.goto(++this.currentSlide);
  },
  previous: function() {
    this.goto(--this.currentSlide);
  },
  build: function() {
    var _this = this;
    var largestSize = 0;
    var RAD2DEG = Math.PI / 180;
    var magnitude;
    var axis = this.axis === 'horizontal' ? 'Y' : 'X';
    // We assume the center is where the slide is to be displayed

    // Get immediate children
    this.slides = [].slice.call(this.carousel.children, 0);

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
    this.currentSlide = this.currentSlide >= this.slides.length ? this.slides.length : this.currentSlide;
    this.carousel.style.transform = 'rotate' + axis + '(' + (this.currentSlide * -this.angleIncrement) + 'deg)';
  }
};