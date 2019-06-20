/* eslint complexity: "off" */
// Current build will only handle horizontal dimensions
function Conveyor(element, options) {
  options = options || {};

  var defaults = {
    direction: {type: ['string', 'number', 'boolean'], default: 'horizontal'}
  };
  this.slides = [];
  this.angleIncrement = 0;
  this.angleCurrent = 0;

  Object.keys(defaults).forEach(function(key) {
    options[key] = defaults[key].type.indexOf(typeof options[key]) !== -1 ? options[key] : defaults[key].default;
  });

  this.direction = (function(optionDirection) {
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
  })(options.direction);

  this.carousel = element;
  this.build();
}

Conveyor.prototype = {
  goto: function(angle) {
    var axis = this.direction === 'horizontal' ? 'Y' : 'X';

    this.angleCurrent += angle;
    this.carousel.style.transform = 'rotate' + axis + '(' + this.angleCurrent + 'deg)';
  },
  next: function() {
    this.goto(-this.angleIncrement);
  },
  previous: function() {
    this.goto(this.angleIncrement);
  },
  build: function() {
    var _this = this;
    var largestSize = 0;
    var RAD2DEG = Math.PI / 180;
    var magnitude;
    var axis = _this.direction === 'horizontal' ? 'Y' : 'X';
    // We assume the center is where the slide is to be displayed

    // Get immediate children
    this.slides = [].slice.call(this.carousel.children, 0);
    this.angleIncrement = 360 / this.slides.length;

    this.slides.forEach(function(element) {
      element.style.transform = '';
      largestSize = Math.max(largestSize, _this.direction === 'horizontal' ? element.getBoundingClientRect().width : element.getBoundingClientRect().height);
    });

    magnitude = (largestSize / 2 * Math.sin((90 - this.angleIncrement / 2) * RAD2DEG)) / Math.sin(this.angleIncrement / 2 * RAD2DEG);

    this.slides.forEach(function(element, index) {
      element.setAttribute('style', 'transform: rotate' + axis + '(' + (_this.angleIncrement * index) + 'deg) translateZ(' + magnitude + 'px);');
    });

    //this.carousel.style.transform = 'rotateY(0deg)';
  }
};
