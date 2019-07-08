/* eslint complexity: "off" */
/* global TimelineMax */
/* Todo: Implement an update thingo? */
function matrixMultiplication(multiplicand, multiplier) {
  var result = [];
  var sum = 0;
  var x1 = 0;
  var y1 = 0;
  var x2 = 0;
  var y2 = 0;

  if (typeof multiplicand === 'undefined' || typeof multiplier === 'undefined') {
    return;
  }

  if (multiplicand[y1].length !== multiplier.length) {
    console.log('skipped', multiplicand, multiplier);
    return;
  }

  // For each row of the multiplicand...
  for (y1 = 0; y1 < multiplicand.length; y1++) {
    result.push([]);
    // for each column of the multiplier...
    for (x2 = 0; x2 < multiplier[y2].length; x2++) {
      sum = 0;

      // For each column of the multiplicand
      for (x1 = 0; x1 < multiplicand[y1].length; x1++) {
        sum += multiplicand[y1][x1] * multiplier[x1][x2];
      }

      result[result.length - 1].push(sum);
    }
  }

  return result;
}

function createTransformationMatrix(options) {
  var defaults = {
    scale: {x: 1, y: 1, z: 1},
    rotation: {x: 0, y: 0, z: 0},
    translation: {x: 0, y: 0, z: 0}
  };
  var radiansX;
  var radiansY;
  var radiansZ;
  var rotationMatrixX;
  var rotationMatrixY;
  var rotationMatrixZ;
  var rotationMatrix;
  var scaleMatrix;
  var translationMatrix;
  var transformationMatrix;

  options = Object.assign({}, defaults, options);

  // Build rotation matrix
  radiansX = options.rotation.x * Math.PI / 180;
  radiansY = options.rotation.y * Math.PI / 180;
  radiansZ = options.rotation.z * Math.PI / 180;
  rotationMatrixX = [
    [1, 0, 0, 0],
    [0, Math.cos(radiansX), -Math.sin(radiansX), 0],
    [0, Math.sin(radiansX), Math.cos(radiansX), 0],
    [0, 0, 0, 1]
  ];
  rotationMatrixY = [
    [Math.cos(radiansY), 0, Math.sin(radiansY), 0],
    [0, 1, 0, 0],
    [-Math.sin(radiansY), 0, Math.cos(radiansY), 0],
    [0, 0, 0, 1]
  ];
  rotationMatrixZ = [
    [Math.cos(radiansZ), -Math.sin(radiansZ), 0, 0],
    [Math.sin(radiansZ), Math.cos(radiansZ), 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1]
  ];
  rotationMatrix = matrixMultiplication(matrixMultiplication(rotationMatrixZ, rotationMatrixY), rotationMatrixX);

  // Scale Matrix
  scaleMatrix = [
    [options.scale.x, 0, 0, 0],
    [0, options.scale.y, 0, 0],
    [0, 0, options.scale.z, 0],
    [0, 0, 0, 1]
  ];

  // Translation Matrix
  translationMatrix = [
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [options.translation.x, options.translation.y, options.translation.z, 1]
  ];

  // Build Transformation Matrix
  // translate * scale * rotation (GSAP)
  transformationMatrix = matrixMultiplication(translationMatrix, scaleMatrix);
  transformationMatrix = matrixMultiplication(transformationMatrix, rotationMatrix);

  return transformationMatrix;
}

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
            currentSlide: this.currentSlide - deltaSlide,
            prevSlide: this.currentSlide,
            deltaSlide: deltaSlide
          }});
        };

        this.timeline.fromTo(this.DOMTarget, this.options.GSAPDuration, from, to);
        this.currentSlide += deltaSlide;
        this.currentSlide = this.currentSlide >= this.slides.length ? 0 : this.currentSlide < 0 ? this.slides.length - 1 : this.currentSlide;
        console.log(this.currentSlide);
      }
    } else {
      this.currentSlide += deltaSlide;
      this.currentSlide = this.currentSlide >= this.slides.length ? 0 : this.currentSlide < 0 ? this.slides.length - 1 : this.currentSlide;
      this.angleCurrent = this.currentSlide * (this.axis === 'vertical' ? 1 : -1) * this.angleIncrement;
      this.DOMTarget.style.transform = 'rotate' + axis + '(' + this.angleCurrent + 'deg)';
      console.log(this.currentSlide);
    }
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
    var oldSlides = this.slides.slice(0);
    var dryRunResults = {
      dscarousel: {
        DOMElement: undefined,
        transform: undefined
      },
      slides: []
    };
    var transformMatrix;

    dryRun = typeof dryRun !== 'boolean' ? false : dryRun;

    // Get immediate children
    this.slides = [].slice.call(this.DOMTarget.children, 0);

    this.angleIncrement = 360 / this.slides.length;

    // Clear and find the largest slide based on axis
    this.slides.forEach(function(element) {
      var prevTransform;
      if (dryRun) {
        prevTransform = element.style.transform;
      }

      element.style.transform = '';

      largestSize = Math.max(largestSize, _this.axis === 'horizontal' ? element.clientWidth : element.clientHeight);

      if (typeof prevTransform !== 'undefined') {
        element.style.transform = prevTransform;
      }
    });

    magnitude = (largestSize / 2 * Math.sin((90 - this.angleIncrement / 2) * RAD2DEG)) / Math.sin(this.angleIncrement / 2 * RAD2DEG);

    this.slides.forEach(function(element, index) {
      transformMatrix = createTransformationMatrix({
        rotation: {x: 0, y: (_this.axis === 'vertical' ? 1 : -1) * _this.angleIncrement * index, z: 0},
        translation: {x: 0, y: 0, z: magnitude}
      }).join(',');
      if (dryRun) {
        dryRunResults.slides.push({
          DOMElement: element,
          axis: axis,
          angle: (_this.axis === 'vertical' ? -1 : 1) * _this.angleIncrement * index,
          magnitude: magnitude,
          transformCSS: 'rotate' + axis + '(' + ((_this.axis === 'vertical' ? -1 : 1) * _this.angleIncrement * index) + 'deg) translateZ(' + magnitude + 'px)'
        });
      } else {
        element.setAttribute('style', 'transform: matrix3d(' + transformMatrix + ');');
      }
    });

    transformMatrix = createTransformationMatrix({
      rotation: {x: 0, y: this.currentSlide * this.angleIncrement, z: 0}
    }).join(',');

    if (dryRun) {
      dryRunResults.dscarousel.DOMElement = this.DOMTarget;
      dryRunResults.dscarousel.angle = this.currentSlide * -this.angleIncrement;
      dryRunResults.dscarousel.axis = axis;
      dryRunResults.dscarousel.transformCSS = 'matrix3d(' + transformMatrix + ')';
      return dryRunResults;
    } else {
      // Stay on current slide, or if the current slide no longer exist, go to last available slide
      this.DOMTarget.style.transform = 'matrix3d(' + transformMatrix + ')';

      this.DOMTarget.dispatchEvent(DSCarousel.events.build, {detail: {
        newSlides: this.slides.slice(0),
        oldSlides: oldSlides
      }});
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
