// jquery.proportionalPosition.js
// jQuery plugin to create and apply scaling to non-responsive webpage designs
// Aric Ng
// Version: 1.0.0 <update this as changes are made!>

/*
<<< CLASSES >>>
[Main classes]
NOTE: All elements with the main classes below need either css position absolute, or css position relative. Elements will have css position fixed will treat the window as its parent propoContainer.

propoContainer - Parent element in which all propoElement/Scaled elements should reside. 
Must have a max-width and max-height set in the CSS, used for scaling
	REQUIRED CSS:
	max-width
	max-height
	
	OPTIONAL CSS:
	min-width
	min-height
	
propoElement - Non-scaling element that positions itself proportionally with the parent propoContainer. 
CSS values right and bottom will override left and top, respectively.
	REQUIRED CSS:
	left or right
	top or bottom

propoScaled - Scaling element that positions and scales itself proportionally with the parent propoContainer.
Must have a max-width and max-height set in the CSS, used for scaling
	REQUIRED CSS:
	left or right
	top or bottom
	max-width
	max-height

propoText - Mark element for font-size/line-height scaling, font-sizes scale to the nearest propoContainer
	REQUIRED CSS:
	font-size
	line-height

[Modifier classes]

propoFixed (propoElement/propoScaled)- Marks propoElement as a fixed element

propoIgnoreY (propoContainer/propoScaled) - Marks propoElement to ignore max-height, useful for elements that may have new content added to it

propoIgnoreH (propoElement/propoScaled) - Marks propoElement to ignore css left/right values

propoIgnoreV (propoElement/propoScaled) - Marks propoElement to ignore css top/bottom values

propoIgnoreLineHeight (propoText) - Marks propoText to ignore css line-height scaling

<<< SETUP >>>

propoContainer
	propoElement
	propoScaled
	
	propoContainer propoScaled <Nested propoContainers should have a propoElement/Scaled class! Otherwise it may scale weirdly>
		propoElement
		propoScaled
	
	propoElement

*/

(function (factory) {
	if (typeof define === 'function' && define.amd && define.amd.jQuery) {
		// AMD. Register as anonymous module.
		define(['jquery'], factory);
	} else {
		// Browser globals.
		factory(jQuery);
	}
} (function($){
	var DEBUG = false,
	COMPAT_FLAG = false,
	console_flag = window.console ? true : false,
	regex_css_per = /[0-9]+%{1}/,
	regex_css_px = /[0-9]+px{1}/;
	
	/**
		Processes all elements with propoContainer, propoElement, propoScaled, and propoText classes.
	**/
	$.processPropoStuff = function(config) {
		var $propoChildren = $('.propoElement, .propoScaled'),
		$propoContainer = $('.propoContainer');
		
		if(config)
		{
			COMPAT_FLAG = config.compatibility_flag;
			DEBUG = config.debug;
		}
		
		/* BEGIN: Process propoContainers */
		$propoContainer.each(function(){
			var $container = $(this);
			$container.processPropoContainer();
		});
		
		/* END: Process propoContainers */
	
		/* BEGIN: Process propoElements */
		$propoChildren.each(function(){
			var $target = $(this);
			$target.processPropoElement();			
		});
		/* END: Process propoElements */
	
		/* BEGIN: Process propoText */
		$('.propoText').each(function(){
			var $target = $(this);
			$target.processPropoText();
		});
		/* END: Process propoText */
		
		//Update everything
		propoContainerResize();
		propoTextResize();

		if(config.callback)
		{
			config.callback();
		}
	};
	
		
	/**
		Processes each propoElement or propoScaled element within a given propoContainer
	**/
	$.fn.processElementsInContainer = function(config)
	{
		var $this = $(this);
		if(!($this.hasClass('propoContainer') && $this.hasClass('propoContainerReady')))
		{
			return;
		}
		
		$this.find('.propoElement, .propoScaled').each(function(){
			var $this = $(this);
			$this.processPropoElement(config);
		});
		
		return $this;
	};
	
	$.updatePropoStuff = function(){
		propoContainerResize();
		propoTextResize();
	};
	
	/**
		Returns an array of scale factors of all propoContainer elements
	**/
	$.getPropoScale = function()
	{
		var propoContainer_scale_list = [];
		$('.propoContainer').each(function(){
			var $target = $(this);
			var current_width = $target.width();
			var max_width = $target.css('max-width').replace('px', '');
			var scale = current_width/max_width;
			
			propoContainer_scale_list.push(scale);
		});
		return propoContainer_scale_list;
	};
	
	/**
		Processes propoElements. Make sure a containing propoContainer has been processed before using this!
		
			
		NOTE:
		Combination pairs of left, top, right, or bottom css definitions are important, it determines 
		the element's anchor corner relative to the containing propoContainer. I.E. bottom, right
		position elements will be anchored by it's bottom right corner to its containing propoContainer
		
		max-width  and max-height usually have little issue with computed values in different browsers
	**/
	$.fn.processPropoElement = function(config){
		var $this = $(this),
		$parent = false,
		parent_width = false,
		parent_height = false,
		css_width = false,
		css_height = false,
		css_positions = ['top','left','bottom','right'],
		x_flag = false,
		y_flag = false,
		result = 0,
		t_width = false,
		t_height = false,
		has_x = false,
		has_y = false,
		
		// Compatibility Variables
		$target;
		
		if(config)
		{
			COMPAT_FLAG = config.compatibility_flag;
			DEBUG = config.debug;
		}
		
		// Must have propoElement or propoScaled class to process
		if(!($this.hasClass('propoElement') || $this.hasClass('propoScaled')))
			return;
		
		// Reprocess if processed already
		// Clear all possible CSS values that can possibly be set to avoid reprocessing conflicts
		if($this.hasClass('propoElementReady'))
		{
			$this.removeClass('propoElementReady');
			
			$this.css({
				'left':'',
				'right':'',
				'top':'',
				'bottom':''
			});
			
			if($this.hasClass('propoScaled'))
			{
				$this.css({
					'width':'',
					'height':''
				});
			}
			
			$this.removeData([
				'max-width',
				'max-height'
			]);
		}
		
		if(DEBUG && console_flag)
			console.log("<<<BEGIN: ID:"+$this.attr('id')+" CLASS:"+$this.attr('class')+" >>>");
		
		if(!$this.hasClass('propoFixed'))
		{
			// propoElements should have a propoContainer as it's offsetParent
			$parent = $($this.offsetParent());
			if(!$parent.hasClass('propoContainer'))
			{
				if(console && DEBUG)
					console.log('WARNING: Offset parent is not a propoContainer for ID: '+$this.attr('id')+' CLASS: '+$this.attr('class')+'with PARENT ID:'+$this.parent().attr('id')+' CLASS:'+$this.parent().attr('class'));
				$parent = false;
			}
		
			// Find the closest processed propoContainer if initial parent isn't found
			if(!$parent)
			{
				if($this.hasClass('propoContainer'))
				{
					$parent = $this.parent().closest('.propoContainerReady');
				}
				else if(!$this.hasClass('propoContainer'))
				{	
					$parent = $($this.parents('.propoContainer')[0]);
					$parent = $parent.hasClass('propoContainerReady') ? $parent : false;
				}
			}
		}
		else
		{
			$parent = $(window);
		}
		
		// Do not process if there are no processed propoContainers
		if(!$parent || $parent.length === 0){
			if(console)
				console.log('ERROR: No parent propoContainer found for ID: '+$this.attr('id')+' CLASS: '+$this.attr('class')+'with PARENT ID:'+$this.parent().attr('id')+' CLASS:'+$this.parent().attr('class'));
			return;
		}		
		
		// Use max window size
		if($this.hasClass('propoFixed'))
		{
			parent_width = window.screen.width;
			parent_height = window.screen.height;
		}
		else
		{
			parent_width = $parent.data('max-width').replace('px', '');
			parent_height = $parent.data('max-height').replace('px', '');
		}
		
			
		if($this.hasClass('propoScaled'))
		{
			css_width = $this.css('max-width');
			css_height = $this.css('max-height');
		
			$this.data('max-width', css_width);
			$this.data('max-height', css_height);
			
			if($this.data('max-width') == 'none' || typeof $this.data('max-width') == 'undefined')
			{
				css_width = $this.width()+'px';
				$this.data('max-width', css_width);
				if(console_flag)
					console.log('ERROR: css max-width for ID: '+$this.attr('id')+' CLASS: '+$this.attr('class')+'with PARENT ID:'+$this.parent().attr('id')+' CLASS:'+$this.parent().attr('class')+' not set');
			
				return;
			}
			
			// propoScaled elements can have an optional max-height; especially if the height of the element will be indeterminate
			if($this.data('max-height') == 'none' || typeof $this.data('max-height') == 'undefined')
			{
				if(console_flag)
					console.log('WARNING: css max-height for ID: '+$this.attr('id')+' CLASS: '+$this.attr('class')+'with PARENT ID:'+$this.parent().attr('id')+' CLASS:'+$this.parent().attr('class')+' not set');
			}
			
			var regex_css_px = /[0-9]+px{1}/;
		
			if(!has_y && regex_css_px.test(css_width))
			{
				if(DEBUG && console_flag)
				{
					console.log('PX width', css_width, 'PARENT WIDTH', parent_width);
				}
		
				t_width = parseInt(css_width.replace('px', ''), 10);
				$this.css('width', t_width/parent_width*100+'%');
			}
		
			if(!has_x && regex_css_px.test(css_height) && !$this.hasClass('propoIgnoreY'))
			{
				if(DEBUG && console_flag)
					console.log('PX HEIGHT', css_height, 'PARENT HEIGHT', parent_height);
		
				t_height = parseInt(css_height.replace('px', ''), 10);
				$this.css('height', t_height/parent_height*100+'%');
			}
		}
		
		$target = $(this);
		// Extract pixel values from set positions
		$(css_positions).each(function(key, value) {
			var prev_display = $target.css('display');
			// Hide element to get "correct" vanilla values
			if(prev_display != 'none')
			{
				$target.css('display', 'none');
			}
			
			var px,
			pos = false,
			css_position = $target.css(value),
			percent_flag = false;
			
			// Unhide element if its previous display value wasn't none
			if(prev_display != 'none')
			{
				$target.css('display', prev_display);
			}
			
			// Validate input
			if(typeof css_position === 'undefined' || css_position === 'auto') {
				if(DEBUG && console_flag)
					console.log('failed', css_position, value, key);
				return;
			}
			
			if(value == 'left' || value == 'right')
			{
				if($target.hasClass('propoIgnoreH'))
				{
					return;
				}
			}
			
			if(value == 'top' || value == 'bottom')
			{
				if($target.hasClass('propoIgnoreV'))
				{
					return;
				}
			}
			
			// Nuke left value if right exists
			// Set to auto to prevent override
			if(value == 'right')
				$target.css('left', 'auto');
		
			// Nuke right value if bottom exists
			if(value == 'bottom')
				$target.css('top' , 'auto');
		
			//Element must have propoElement or propoScaled class
			if(!($target.hasClass('propoElement') || $target.hasClass('propoScaled'))) return;

			// Store original set value
			$target.data(value, css_position);

			if(DEBUG && console_flag)
				console.log(value, css_position, $target.css(value));
			

			if(parseFloat(css_position.replace('px', ''))-parseInt(css_position.replace('px', ''), 10) > 0) {
				var old_display = $target.css('display');
				$target.css('display', 'none');
				css_position = $target.css(value);
				$target.css('display', old_display);
			}
		
			// Percentage checking		
			if(regex_css_per.test(css_position)) {
				if(DEBUG && console_flag)
					console.log('PERCENTAGE', value, css_position);
			
				percent_flag = true;
	
				if(value === 'top' || value === 'bottom')
					css_position = parseInt(css_position.replace('%', ''), 10)/100*parent_height;
				else if(value === 'left' || value === 'right')
					css_position = parseInt(css_position.replace('%', ''), 10)/100*parent_width;
				
				pos = css_position;
			}
			else
			{
				// Percentage checking: Get the possible percentage value, calculate the current percentage value of the element to it's parent.
				// Compare within a range
				// Prototype
				// Get the % position as if the CSS position is a px value
				var percent_test_position = parent_width*(css_position/100),
				// Get the % position in the document by getting the current px position and converting to a percentage
				percent_actual_position = Math.floor($target.position().top/((value === 'top' || value === 'bottom') ? parent_height : parent_width)*100);
			
				if(Math.abs(percent_test_position-percent_actual_position) <= 1)
				{
					percent_flag = true;
				
					if(value === 'top' || value === 'bottom')
					{
						css_position = css_position/100*parent_height;
					}
					else if(value === 'left' || value === 'right')
					{
						css_position = css_position/100*parent_width;
					}
	
					pos = css_position;
				}
			}
		
			if(!percent_flag) {
				if(DEBUG && console_flag)
					console.log('PX', value, css_position);
				
				css_position = parseInt(css_position.replace('px', ''), 10);
			
				px = css_position;
				// Pixel value
				if((value.indexOf('top') !== -1 || value.indexOf('bottom') !== -1) && pos === false) {
					pos = px/parent_height*100;
					$target.css(value,pos+'%');
				}
				else if((value.indexOf('left') !== -1 || value.indexOf('right') !== -1) && pos === false) {
					pos = px/parent_width*100;
					$target.css(value,pos+'%');
				}

				result = pos;
	
				if(result && (value === 'top' || value === 'bottom'))
				{
					y_flag = result;
				}
				else if(result && (value === 'left' || value === 'right'))
				{
					x_flag = result;
				}
			
				if(DEBUG && console_flag)
				{
					console.log(value, result, y_flag, x_flag);
				}
			}
			$target.css('display','prev_display');
		});
		
		
		$this.addClass('propoElementReady');
		
		if(DEBUG && console_flag)
			console.log("<<<END: ID:"+$this.attr('id')+" CLASS:"+$this.attr('class')+" WIDTH:"+$this.css('width')+" HEIGHT:"+$this.css('height')+" >>>");
		
		return $this;			
	};
	
	/**
		Processes target propoContainer, elements without propoContainer class will be given class. Must have max-width and max-height defined in css to work;
	**/
	$.fn.processPropoContainer = function(config){
		if(config)
		{
			COMPAT_FLAG = config.compatibility_flag;
			DEBUG = config.debug;
		}
	
		var $this = $(this),
		css_max_width = this.css('max-width'),
		css_max_height = this.css('max-height'),
		css_min_width = this.css('min-width'),
		css_min_height = this.css('min-height'),
		width = false,
		height = false, 
		percent_scale = false,
		parent_width = false,
		parent = false,
		$inflator = false,
		parent_display_none = false;
		
		// Remove any inflators and clear the width and height to avoid reprocessing errors
		if($this.hasClass('propoContainerReady'))
		{
			$this.children('.propoInflator').remove();
			$this.removeClass('propoContainerReady');
			$this.css({
				'width': '',
				'height':''
			});
			
			$this.removeData([
				'max-width',
				'max-height',
				'min-width',
				'min-height'
			]);
		}
		if(console_flag && DEBUG)
			console.log('<<<BEGIN PROPOCONTAINER CLASS: ' +$this.attr('class')+' ID: '+$this.attr('id')+' WIDTH: '+css_max_width+' HEIGHT: '+css_max_height+'>>>');
		
		$this.parents().each(function(){
			var $this = $(this);
			if($this.css('display') == 'none')
				parent_display_none = true;
		});
		
		if($this.css('display') === 'none' || parent_display_none)
			//return;
		
		if($this.css('position') == 'fixed')
		{
			parent = $(window);
		}
		else
		{
			$(this).parents().each(function(){
				var $this = $(this);
				
				if($this.css('position') == 'absolute' || $this.css('position') == 'relative')
				{
					parent = $this;
					parent_width = $this.width();
					return;
				}
			});
		}
		
		if(!$this.hasClass('propoContainer'))
		{
			$this.addClass('propoContainer');
		}
		
		if(css_min_width == 'none' || typeof css_min_width == 'undefined')
		{
			$this.css('min-width', '0px');
			css_min_width = '0px';
		}
		
		if(css_min_height == 'none' || typeof css_min_height == 'undefined')
		{
			$this.css('min-height', '0px');
			css_min_height = '0px';
		}
		
		if(!$this.hasClass('propoIgnoreX') && (css_max_width == 'none' || typeof css_max_width == 'undefined'))
		{
			if(console_flag)
			{
				console.log('ERROR: css max-width for ID: '+$this.attr('id')+' Class: '+$this.attr('class')+'not set');
			}
			return;
		}
		
		if(!$this.hasClass('propoIgnoreY') && (css_max_height == 'none' || typeof css_max_height == 'undefined'))
		{
			if(console_flag)
			{
				console.log('ERROR: css max-height for ID: '+$this.attr('id')+' Class: '+$this.attr('class')+'not set');
			}
			return;
		}
		
		$this.data('max-width', css_max_width);
		$this.data('max-height', css_max_height);
		$this.data('min-width', css_min_width);
		$this.data('min-height', css_min_height);
		
		// Clear max-width value if set to ignore width scaling (probably rarely needed?)
		if($this.hasClass('propoIgnoreX'))
		{
			$this.css('max-width', 'none');
		}
		
		// Clear max-height value if set to ignore height scaling
		if($this.hasClass('propoIgnoreY'))
		{
			$this.css('max-height', 'none');
		}
		
		width = parseInt($this.data('max-width').replace('px', ''), 10);
		height = parseInt($this.data('max-height').replace('px', ''), 10);
		percent_scale = width/parent_width;
		
		if(typeof width == 'undefined' || !width || typeof height == 'undefined' || !height)
			return;
	
		if(DEBUG && console_flag)
			console.log(width, height, parent_width);
		
		/*
			Not rounding percent_scale because values might not line up as perfectly as desired
		*/
		if(percent_scale*100 > 100)
			percent_scale = 1;
		
		// For containers of indeterminate height
		if(!COMPAT_FLAG) {
			$this.remove('.propoInflator');
			$this.css('width', percent_scale*100+'%');
			$this.prepend('<div class="propoInflator"></div>');
			if(!$this.hasClass('.propoIgnoreY'))
			{
				$inflator = $($this.find('.propoInflator')[0]);
				$inflator.css('padding-top', height/width*100+'%');
			}
		}
		else {
			$this.css('width', percent_scale * 100 + '%');
			if(!$this.hasClass('propoIgnoreY'))
				$this.css('height', height+'px');
			else
				// Use vanilla height values
				$this.css('height', '');
		}
		
		$this.addClass('propoContainerReady');
		
		return $this;
	};
	
	/**
		Processes elements with propoText class, makes text within them resize
		NOTE:
		propoText classed elements can have a max-font-size and min-font-size attribute defined within
		these data attributes determine the max and min font size the element's text can scale to.
		This must be set beforehand in the HTML!
	**/
	$.fn.processPropoText = function(config){
		
		var $this = $(this);
		
		if(config)
		{
			COMPAT_FLAG = config.compatibility_flag;
			DEBUG = config.debug;
		}
		
		// Clear possible set CSS values and data to avoid reprocessing conflicts
		if($this.hasClass('propoTextReady'))
		{
			$this.removeClass('propoTextReady');
			$this.css({
				'font-size': '',
				'line-height': '',
				'letter-spacing': ''
			});
			
			$this.removeData([
				'font-size',
				'line-height',
				'max-font-size',
				'letter-spacing'
			]);
		}
		
		$this.css('font-size', '');
		
		var text_css = $this.css('font-size'),
		line_height_css = $this.css('line-height'),
		letter_spacing_css = $this.css('letter-spacing');
				
		$this.data('font-size', text_css);
		$this.data('line-height', line_height_css);
		$this.data('max-font-size', text_css);
		$this.data('letter-spacing', letter_spacing_css);
		
		$this.addClass('propoTextReady');
		return $this;
	};
	
	$(window).bind('resize', function(){
		if(COMPAT_FLAG)
		{
			propoContainerResize();
		}
		propoTextResize();
		propoFixedResize();
	});
	
	/** 
	* Resizes all processed propoScaled elements with propoFixed
	*/
	function propoFixedResize(){
		$('.propoFixed').each(function(){
			var $this = $(this);
			$this.resizePropoFixed();
		});
	}
	
	/**
	* Resizes all processed propoContainerReady elements in page
	*/
	function propoContainerResize()
	{
		$('.propoContainerReady').each(function(){
			var $this = $(this);
			$this.resizePropoContainer();
		});
	}
	
	/** 
	* Resizes all processed propoTextReady elements in page
	*/
	function propoTextResize(){
		$('.propoTextReady').each(function(){
			var $this = $(this);
			$this.resizePropoText();
		});
	}
	
	$.fn.resizePropoFixed = function(){
		var $this = $(this),
		max_width = parseInt($this.data('max-width').replace('px', ''), 10),
		max_height = parseInt($this.data('max-height').replace('px', ''), 10),
		parent = $this.parents('.propoContainer').eq(0),
		percent_scale;
		
		if(parent.length === 0)
			return;
			
		// Get parent scale
		percent_scale = parent.width()/parseInt(parent.data('max-width').replace('px', ''), 10);
		$this.css('width', max_width*percent_scale);
		$this.css('height', max_height*percent_scale);
		
		return $this;		
	};
	
	/**
	* Resizes a single propoContainer
	*/
	$.fn.resizePropoContainer = function(){
		var old_width = false,
		old_height = false,
		min_width = false,
		min_height = false,
		new_width = false,
		percent_scale = false,
		$this = $(this);
		
		// Do not resize if propoScaled, that does the resizing for you!
		if(typeof($this.data('max-width')) === 'undefined' || typeof($this.data('max-height')) === 'undefined' || !$this.hasClass('propoContainer') || $this.hasClass('propoScaled'))
			return;
		
		// Get the container width and height
		old_width = parseInt($this.data('max-width').replace('px', ''), 10);
		old_height = parseInt($this.data('max-height').replace('px', ''), 10);
		
		min_width = parseInt($this.data('min-width').replace('px', ''), 10);
		min_height = parseInt($this.data('min-height').replace('px', ''), 10);
		
		//Fixed containers scale to window size
		if($this.css('position') == 'fixed')
		{
			percent_scale = $(window).width()/window.screen.width;
			$this.css('width', old_width*percent_scale+'px');
			
			if(old_width*percent_scale <= min_width){
				percent_scale = min_width/old_width;
			}
		}
		else
		{ 
			// Get the current width of the container
			new_width = $this.width();
		
			// Calculate the current scale to update current height
			percent_scale = new_width/old_width;
		}
		
		
		//Find the nearest absolutely or relatively positioned parent to work with
		// Notes: Why am I searching for a parent? I'm not using it for scaling, scaling is already calculated from the max-width and current width.
		// Otherwise, use propoScaled
		/*
		for(var i = 0; i < parents.length; i++)
		{
			var parent_candidate = $(parents[i]);
			if(parent_candidate.css('position') == 'absolute' || parent_candidate.css('position') == 'relative')
			{
				parent = parent_candidate;
				break;
			}
		}
		
		// If no parent, base on window size
		if(!parent)
			parent = $(window);
		
		if($this.css('display') == 'none')
		{
			var parent_width = parent.width();
			if(parent.hasClass('propoContainerReady'))
			{
				parent_width = parseInt(parent.data('max-width').replace('px', ''), 10);
			}
			
			percent_scale = old_width/parent_width > 1 ? 1 : old_width/parent_width;
			//alert(percent_scale, $this.width(), old_width, $this.attr('id'));
		}
		*/
		
		// Do not scale height if propoIgnoreY
		if(!$this.hasClass('propoIgnoreY'))
		{	
			$this.css('height', Math.floor(old_height*percent_scale)+'px');
		}
		
		return $this;
	};
	
	/**
	* Resizes a single element with the propoText class
	*/
	$.fn.resizePropoText = function(){
		var old_width = false,
		percent_scale = false,
		css_width = false,
		text_size = false,
		line_height = false,
		letter_spacing = false,
		min_font_size = false,
		max_font_size = false,
		$parent = false,
		$this = $(this);
		
		if(!$this.hasClass('propoTextReady') || !$this.hasClass('propoText'))
		{
			return;
		}
		
		text_size = parseInt($this.data('font-size').replace('px', ''), 10);
		
		//if($this.data('line-height') != 'normal')
		//{
		if(!$this.hasClass('propoIgnoreLineHeight'))
		{
			line_height = parseInt($this.data('line-height').replace('px', ''), 10);
		}
		
		//}
		//else
		//{
		//	line_height = $this.data('line-height');
		//}
		min_font_size = parseInt($this.data('min-font-size'), 10) ? parseInt($this.data('min-font-size'), 10) : false;
		max_font_size = parseInt($this.data('max-font-size'), 10) ? parseInt($this.data('max-font-size'), 10) : false;

		$parent = $($this.closest('.propoContainerReady'));
	
		if(!$parent || $parent.length <= 0)
		{
			$this.css('background-color', '#f00');
			if(DEBUG && console_flag)
			{
				console.log('ERROR: No parents with propoContainer detected, text not scaled');
			}
			return;
		}
		
		if(DEBUG && console_flag)
		{
			console.log('<<< BEGIN: PROPO TEXT RESIZE ID:', $this.attr('id'), ' CLASS: ', $this.attr('class'), ' PARENT ID: ', $parent.attr('id'), ' PARENT CLASS: ', $parent.attr('class'),  '>>>');
		}
	
		old_width =	parseInt($parent.data('max-width').replace('px', ''), 10);
		css_width = $parent.css('width');
	
		if(regex_css_per.test(css_width))
		{	
			percent_scale = 1;
		}
		else if(regex_css_px.test(css_width))
		{
			css_width = parseInt(css_width.replace('px', ''), 10);
			percent_scale = css_width/old_width;
		}
		
		if(DEBUG && console_flag)
		{
			console.log($this.attr('id'), text_size, percent_scale, text_size*percent_scale);
		}

		if(min_font_size && text_size*percent_scale <= min_font_size)
		{
			$this.css('font-size', min_font_size+'px');
		}
		else if(max_font_size && max_font_size*percent_scale >= max_font_size)
		{
			$this.css('font-size', max_font_size+'px');
		}
		else
		{
			$this.css('font-size', max_font_size*percent_scale+'px');
		}
		
		if(line_height !== 0 && !$this.hasClass('propoIgnoreLineHeight'))
		{
			if(line_height*percent_scale >= line_height)
			{
				$this.css('line-height', line_height+'px');
			}
			else
			{
				$this.css('line-height', line_height*percent_scale+'px');
			}
		}
		else
		{
			$this.css('line-height', '');
		}
		
		if($this.hasClass('propoLetterSpacing'))
		{
			letter_spacing = parseInt($this.data('letter-spacing').replace('px', ''), 10);
			$this.css('letter-spacing', letter_spacing*percent_scale+'px');
		}
				
		if(DEBUG && console_flag)
		{
			console.log('<<< END: PROPO TEXT RESIZE ID:', $this.attr('id'), ' CLASS: ', $this.attr('class'), ' >>>');
		}
		
		return $this;
	};

}));