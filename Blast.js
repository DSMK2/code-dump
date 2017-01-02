var debug = false;

function isAngleBetween(angle, angle_a, angle_b)
{
	//if(angle < angle_b)
	//{
	//	angle_a-=360;
	//}
	
	if(angle_b <= angle_a)
	{
		if(angle_b > angle)
			angle_a-=360;
		else
			angle_b+=360;
	}
	
	//console.log('checking:', angle, angle_a, angle_b);
	if(angle >= angle_a && angle <= angle_b)
	{	
		return true;
	}
	
	return false;
}

// see http://stackoverflow.com/questions/3180000/calculate-a-vector-from-a-point-in-a-rectangle-to-edge-based-on-angle
function distanceToRectangleEdge(x, y, angle, x1, y1, x2, y2)
{
	// Correct for javascripts 0 degrees is actually 180 degrees... In reverse
	angle+=180;
	var left, right, top, bottom, 
	walls = [],
	distance, 
	aX = Math.cos(angle*Math.PI/180), 
	aY = Math.sin(angle*Math.PI/180);
	
	if(aX !== 0)
	{
		left = (x1-x)/aX;
		right = (x2-x)/aX;
		walls.push(left);
		walls.push(right);
	}
	
	if(aY !== 0)
	{
		top = (y1-y)/aY;
		bottom = (y2-y)/aY;
		walls.push(top);
		walls.push(bottom);
	}
	
	for(var i = 0; i < walls.length; i++)
	{
		var wall = walls[i];
		if((distance === undefined && wall !== undefined && wall >= 0) || (wall < distance && wall >= 0))
		{
			distance = wall;
		}
	}
	
	return distance;
}

/*
* Blast
*
* Creates a blast with properties defined in options. Requires a canvas element to work
*/		
var Blast = function(target_canvas, options){	
	options = extend(Blast.defaults, options);

	this.debug = options.debug === undefined || console === undefined ? false : options.debug;
	
	if(target_canvas === undefined || !target_canvas)
	{
		if(this.debug) console.log('Blast: Canvas element required');
		return;
	}
	var regex_rgb_rgba =/(rgb\(\s*[0-9]{1,9},\s*[0-9]{1,9},\s*[0-9]{1,9}\){1})|(rgba\(\s*[0-9]{1,9},\s*[0-9]{1,9},\s*[0-9]{1,9},\s*([0-9]+\.[0-9]+\)|(1|0){1})){1}/,
	regex_hex = /#[a-fA-F0-9]{6}/;
	
	// Check if first color is valid
	if(!(regex_rgb_rgba.test(options.color_a) || regex_hex.test(options.color_a)))
		options.color_a = '#000000';
	
	// Check if second color is valid	
	if(!(regex_rgb_rgba.test(options.color_b) || regex_hex.test(options.color_b)))
		options.color_b = '#ffffff';
		
	// Blast properties
	
	this.segments = options.segments;
	this.position_x = options.x;
	this.position_y = options.y;
	this.canvas = target_canvas;
	this.angle_current = 0;
	this.color_a = options.color_a;
	this.color_b = options.color_b;
	this.opacity = options.opacity;
	
	// Animation related
	this.speed = options.speed;
	this.direction = options.direction;
	this.animation_timeout = false;
	
	//
	this.canvas_origin = {x: this.canvas.width*this.position_x, y: this.canvas.height*this.position_y};
	this.canvas.width = this.canvas.parentNode.clientWidth;
	this.canvas.height = this.canvas.parentNode.clientHeight;
	
	return this;
};

Blast.defaults = {
	speed: 0,
	direction: 1,
	segments: 10,
	x: 0.5,
	y: 0.5,
	debug: false,
	color_a: '#000000',
	color_b: '#ffffff',
	opacity: 1
};

Blast.prototype = {
	/**
	* Draws the blast rotated based on a given angle.
	* @name drawBlast
	* @param angle {double=0} - Angle to rotate and draw blast
	*/
	drawBlast: function(angle){
		if(angle === undefined)
			angle = 0;

		var canvas = this.canvas,
		context = canvas.getContext("2d"),
		angle_current = 0+angle,
		angle_destination = 360+angle,
		angle_increment = (angle_current-angle_destination >= 0 ? -1 : 1)*Math.abs(angle_current-angle_destination)/(this.segments),
		x = 0,
		y = 0,
		screen_width = document.body.clientWidth,
		screen_height = document.body.clientHeight,
		old_global_alpha = context.globalAlpha, // Save old opacity
		swap = false,
		angle_corners = [];
		
		context.clearRect(0,0,screen_width, screen_height, canvas.width, canvas.height);
		
		// Get/update canvas origin (recalculated based on current canvas size)
		context.canvas.width = this.canvas.clientWidth;
		context.canvas.height = this.canvas.clientHeight;
		this.canvas_origin = {x: this.canvas.width*this.position_x, y: this.canvas.height*this.position_y};
		// Get canvas corners (recalculated based on current canvas size)
		angle_corners.push({angle: Math.atan2(-this.canvas_origin.y, -this.canvas_origin.x)*(180/Math.PI)+180, x : 0, y: 0});
		angle_corners.push({angle: Math.atan2(-this.canvas_origin.y, this.canvas.width-this.canvas_origin.x)*(180/Math.PI)+180, x : this.canvas.width, y : 0});
		angle_corners.push({angle: Math.atan2(this.canvas.height-this.canvas_origin.y, this.canvas.width-this.canvas_origin.x)*(180/Math.PI)+180, x :this.canvas.width, y : this.canvas.height});
		angle_corners.push({angle: Math.atan2(this.canvas.height-this.canvas_origin.y, -this.canvas_origin.x)*(180/Math.PI)+180, x : 0, y: this.canvas.height});
		
		//console.log(angle_corners);
		
		// Set alpha to specified opacity for drawing
		context.globalAlpha = this.opacity;
		
		// Draw each segment
		for(var i = 0; i < this.segments; i++)
		{
			var angle_start = (angle_current+angle_increment*i),
			angle_end = angle_start+angle_increment,
			sorted_corners,
			distance_start,
			distance_end,
			x_start = 0,
			y_start = 0,
			x_end = 0,
			y_end = 0,
			t = this;
			
			angle_start = angle_start > 360 ? angle_start-360 : angle_start;
			angle_end = angle_end > 360 ? angle_end-360 : angle_end;
			
			// Get distances for each line to canvas edges
			distance_start = Math.round(distanceToRectangleEdge(this.canvas_origin.x, this.canvas_origin.y, angle_start, 0, 0, this.canvas.width, this.canvas.height));
			distance_end = Math.round(distanceToRectangleEdge(this.canvas_origin.x, this.canvas_origin.y, angle_end, 0, 0, this.canvas.width, this.canvas.height));
			
			x_start = Math.round(this.canvas_origin.x-distance_start*Math.cos(angle_start*Math.PI/180));
			y_start = Math.round(this.canvas_origin.y-distance_start*Math.sin(angle_start*Math.PI/180));
			
			x_end = Math.round(this.canvas_origin.x-distance_end*Math.cos(angle_end*Math.PI/180));
			y_end = Math.round(this.canvas_origin.y-distance_end*Math.sin(angle_end*Math.PI/180));

			context.beginPath();
			context.moveTo(this.canvas_origin.x, this.canvas_origin.y);
			context.lineTo(x_start, y_start);
			
			sorted_corners = angle_corners.sort(function(a){
				if(angle_start > angle_end && a.angle <= angle_end)
					return 1;
					
				return 0;
			});
			for(var i2 = 0; i2 < sorted_corners.length; i2++)
			{
				var angle_check = sorted_corners[i2];
				if(isAngleBetween(angle_check.angle, angle_start, angle_end))
				{
					context.lineTo(angle_check.x, angle_check.y);
				}
			}
			
			context.lineTo(x_end, y_end);
			context.closePath();
			
			if(!swap)
				context.fillStyle = this.color_a;
			else
				context.fillStyle = this.color_b;
			context.fill();
	
			swap = !swap;
			
				
			if(this.debug)
			{
				context.fillStyle = "#000";
				context.font = "20px Arial";
				var angle_test = Math.abs(angle_end-angle_start)/2,
				d_x = Math.round(this.canvas_origin.x-distance_start*0.5*Math.cos((angle_start+angle_test)*Math.PI/180)),
				d_y = Math.round(this.canvas_origin.y-distance_start*0.5*Math.sin((angle_start+angle_test)*Math.PI/180));
			
				context.fillText("Segment: "+i, d_x, d_y);
				context.fillText("Segment: "+i+" Angle: Start: "+parseInt(angle_start)+ " End: " + parseInt(angle_end), 50, 50*i+50);
				//context.fillText("Segment: "+i+" Angle: End", x_end*0.5, y_end*0.5);
			}
		}
		
		if(this.debug)
		{
			context.beginPath();
			for(var d = 0; d < angle_corners.length; d++)
			{
				//console.log(this.angle_corners[i].angle);
				x = this.canvas_origin.x-2000*Math.cos(angle_corners[d].angle*Math.PI/180);
				y = this.canvas_origin.y-2000*Math.sin(angle_corners[d].angle*Math.PI/180);
				context.lineTo(this.canvas_origin.x, this.canvas_origin.y);
				context.lineTo(Math.round(x), Math.round(y));
				context.lineWidth = 5;
				context.strokeStyle = "#000000";
				context.stroke();
			}
			context.closePath();
		}
		
		// Set alpha to specified opacity
		context.globalAlpha = old_global_alpha;
		window.requestAnimationFrame(function(){
				t.drawBlast(t.angle_current);
		});

	},
	start : function(){
		var t = this;
		this.needs_stop = false;
		window.requestAnimationFrame(function(){t.drawBlast(t.angle_current);});
		this.animation_timeout = window.setInterval(function(){
			t.rotateBlast();
		}, 1/60);
		
		return this;
		
	},
	stop: function(){
		this.needs_stop = true;
		window.clearTimeout(this.animation_timeout);
		
		return this;
	},
	rotateBlast : function(){
		//this.drawBlast(this.angle_current);
		this.angle_current+= this.direction <= 0 ? 360-this.speed/60 : this.speed/60;
		this.angle_current = this.angle_current > 360 ? this.angle_current-360 : this.angle_current;
		var t = this;
		
		
	},
	setAngle: function(new_angle)
	{
		this.angle_current = new_angle;
		this.drawBlast(this.angle_current);
	},
	setSpeed: function(new_speed)
	{
		this.speed = new_speed;
	}
};