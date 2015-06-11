var debug = false;

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
	options = Blast.defaults.extend(options);
	
	this.debug = options.debug === undefined || console === undefined ? false : options.debug;
	
	if(target_canvas === undefined || !target_canvas)
	{
		if(this.debug) console.log('Blast: Canvas element required');
		return;
	}
	
	// Blast properties
	this.segments = options.segments*2;
	this.position_x = options.x;
	this.position_y = options.y;
	this.canvas = target_canvas;
	this.angle_current = 0;
	this.color_a = options.color_a;
	this.color_b = options.color_b;
	
	// Animation related
	this.speed = options.speed;
	this.direction = options.direction;
	this.animation_timeout = false;
	
	//
	this.canvas_origin = {x: document.body.clientWidth*this.position_x, y: document.body.clientHeight*this.position_y};

	var t = this;
	window.onresize = function(){
		t.canvas_origin = {x: document.body.clientWidth*t.position_x, y: document.body.clientHeight*t.position_y};
	
		
	};
};
Blast.defaults = {
	speed: 0,
	direction: 1,
	segments: 10,
	x: 0.5,
	y: 0.5,
	debug: false,
	color_a: '#000000',
	color_b: '#ffffff'
};

Blast.prototype = {
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
		screen_height = document.body.clientHeight;
		context.clearRect(0,0,screen_width, screen_height);
		this.angle_corners = [];
		this.angle_corners.push({angle: Math.atan2(-this.canvas_origin.y, -this.canvas_origin.x)*(180/Math.PI)+180, x : 0, y: 0});
		this.angle_corners.push({angle: Math.atan2(-this.canvas_origin.y, document.body.clientWidth-this.canvas_origin.x)*(180/Math.PI)+180, x : document.body.clientWidth, y : 0});
		this.angle_corners.push({angle: Math.atan2(document.body.clientHeight-this.canvas_origin.y, document.body.clientWidth-this.canvas_origin.x)*(180/Math.PI)+180, x : document.body.clientWidth, y : document.body.clientHeight});
		this.angle_corners.push({angle: Math.atan2(document.body.clientHeight-this.canvas_origin.y, -this.canvas_origin.x)*(180/Math.PI)+180, x : 0, y: document.body.clientHeight});
		
		context.canvas.width = document.body.clientWidth;
		context.canvas.height = document.body.clientHeight;
		
		
		
		var
		swap = false;
		
		for(var i = 0; i < this.segments; i++)
		{
			var angle_start = (angle_current+angle_increment*i),
			angle_end = angle_start+angle_increment,
			distance_start,
			distance_end,
			x_start,
			y_start,
			x_end,
			y_end;
			
			angle_start = angle_start > 360 ? angle_start-360 : angle_start;
			angle_end = angle_end > 360 ? angle_end-360 : angle_end;
			distance_start = Math.round(distanceToRectangleEdge(this.canvas_origin.x, this.canvas_origin.y, angle_start, 0, 0, document.body.clientWidth, document.body.clientHeight));
			distance_end = Math.round(distanceToRectangleEdge(this.canvas_origin.x, this.canvas_origin.y, angle_end, 0, 0, document.body.clientWidth, document.body.clientHeight));
			
			x_start = Math.round(this.canvas_origin.x-distance_start*Math.cos(angle_start*Math.PI/180));
			y_start = Math.round(this.canvas_origin.y-distance_start*Math.sin(angle_start*Math.PI/180));
			
			x_end = Math.round(this.canvas_origin.x-distance_end*Math.cos(angle_end*Math.PI/180));
			y_end = Math.round(this.canvas_origin.y-distance_end*Math.sin(angle_end*Math.PI/180));
			
			context.beginPath();
			context.moveTo(this.canvas_origin.x, this.canvas_origin.y);
			context.lineTo(x_start, y_start);
			//console.log(angle_start, angle_end, this.angle_corners);
			
			for(var i2 = 0; i2 < this.angle_corners.length; i2++)
			{
				var angle_check = this.angle_corners[i2];
				
				if(angle_check.angle >= angle_start && angle_check.angle <= angle_end+(angle_end < angle_start ? 360 : 0))
				{
					context.lineTo(angle_check.x, angle_check.y);
				}
			}
			
			context.lineTo(x_end, y_end);
			context.lineTo(this.canvas_origin.x, this.canvas_origin.y);
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
				context.fillText("Angle: "+parseInt(angle_start)+ " " + parseInt(angle_end), x_start, y_start);
			}
		}
		
		if(this.debug)
		{
			context.beginPath();
			for(var d = 0; d < this.angle_corners.length; d++)
			{
				//console.log(this.angle_corners[i].angle);
				x = this.canvas_origin.x-2000*Math.cos(this.angle_corners[d].angle*Math.PI/180);
				y = this.canvas_origin.y-2000*Math.sin(this.angle_corners[d].angle*Math.PI/180);
				context.lineTo(this.canvas_origin.x, this.canvas_origin.y);
				context.lineTo(Math.round(x), Math.round(y));
				context.lineWidth = 5;
				context.strokeStyle = "#000000";
				context.stroke();
			}
			context.closePath();
		}
	},
	start : function(){
		var t = this;
		window.requestAnimationFrame(function(){t.rotateBlast();});
	},
	stop: function(){
		this.needs_stop = true;
		window.clearTimeout(this.animation_timeout);
	},
	rotateBlast : function(){
		this.drawBlast(this.angle_current);
		this.angle_current+= this.direction <= 0 ? 360-this.speed/30 : this.speed/30;
		this.angle_current = this.angle_current > 360 ? this.angle_current-360 : this.angle_current;
		var t = this;
		
		this.animation_timeout = window.setTimeout(function(){
			window.requestAnimationFrame(function(){
				t.rotateBlast();
		
			});
		});
	}
};