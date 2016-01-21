// Global values per script since typing Math.PI/180 repeatedly gets old
var 
DEGTORAD = Math.PI/180,
RADTODEG = 180/Math.PI;

/* Todos: Pass box2d creation to a webworker, passback entity ID to main script */

/**
* Source: http://strd6.com/2010/08/useful-javascript-game-extensions-clamp/
* Returns a number whose value is limited to the given range.
*
* Example: limit the output of this computation to between 0 and 255
* (x * 255).clamp(0, 255)
*
* @param {Number} min The lower boundary of the output range
* @param {Number} max The upper boundary of the output range
* @returns A number in the range [min, max]
* @type Number
 */
Number.prototype.clamp = function(min, max) {
  return Math.min(Math.max(this, min), max);
};

var world,
GSS = {
	context: null,
	PTM: null,
	world: null,
	keys: {},
	mouse_info: {x: -1, y: -1, left_click: false, right_click: false, middle_click: false},
	fps: 1/60,
	entities: [],
	weapon_data: [],
	entity_data: [],
	images: [],
	faction_data: [] // Holds filtering info
},
weapon_data = [
	{image_src: 'images/laser_beam.png', data: {id: 0, dmg: 1}}
],
entity_data = [
	{image_src: 'images/simplefighter.png', data: {is_player: true, angle: 90, angular_velocity_max: 50, angular_acceleration: 180, thrust_acceleration: 25, thrust_deceleration: 10, velocity_magnitude_max: 4, weapon_slots:[[{x: -21, y: 0, weapon_id: 0}]]}}
],
faction_data = [
	{faction: 'player'},
	{faction: 'enemy'}
]
images_loaded = 0;



jQuery(function($){
	var $canvas = $('#canvas'),
	context = $canvas[0].getContext('2d'),
	update_interval;
	
	GSS.context = context;
	GSS.PTM = 12;
	GSS.world = world = new b2World(new b2Vec2(0, 0));
	
	// Temp LiquidFun 
	var 
	ground_def = new b2BodyDef(),
	ground_body,
	ground_poly;
	
	// Process factions (for collision filters) up to 16?
	for(var i = 0; i < faction_data.length; i++)
	{
		var faction = faction_data[i],
		hex_value="0x",
		category = (i+1).toString(16);
		for(var h = 0; h < 4-category.length; h++)
		{
			hex_value+='0';
		}
		hex_value+=category;
		
		faction.category = parseInt(hex_value, 16);
	}
	GSS.faction_data = faction_data;
	console.log(GSS.faction_data);
	
	// Build list of images to load (avoid duplicates)
	var img_srcs = [];
	for(var i = 0; i < weapon_data.length; i++)
	{
		var img_src = weapon_data[i].image_src,
		existing_index = img_srcs.indexOf(img_src);
		
		if(existing_index == -1)
		{
			img_srcs.push(img_src);
			existing_index = img_srcs.length-1;
		}
		weapon_data[i].data.image_index = existing_index;
		GSS.weapon_data.push(weapon_data[i]);
	}
	
	
	for(var i = 0; i < entity_data.length; i++)
	{
		var img_src = entity_data[i].image_src,
		existing_index = img_srcs.indexOf(img_src);
		
		if(existing_index == -1)
		{
			img_srcs.push(img_src);
			existing_index = img_srcs.length-1;
		}
		entity_data[i].data.image_index = existing_index;
	}
	
	
	// Load images
	for(var i = 0; i < img_srcs.length; i++)
	{
		var image = new Image();
		image.onload = function(){
			
			images_loaded++;
			if(images_loaded == img_srcs.length)
				$(window).trigger('all_images_loaded');
		}
		image.src = img_srcs[i];
		GSS.images.push(image);
	}
	
	
	$(window).on('all_images_loaded', function(){
		entity_data[0].data.x = context.canvas.width/2;
		entity_data[0].data.y = context.canvas.height/2;
		console.log(entity_data[0].data);
		GSS.entities.push(new GSSEntity(0, entity_data[0].data));
	});
	
	// Init Canvas
	context.canvas.width = $canvas.width();
	context.canvas.height = $canvas.height();
	context.imageSmoothingEnabled = false;
	
	$(window).on('resize', function(){
		context.canvas.width = $canvas.width();
		context.canvas.height = $canvas.height();
		context.imageSmoothingEnabled = false;
	}).trigger('resize');
	
	// World
	/*
	GSS.world.SetContactListener({
		BeginContactBody: function(contact) {
			console.log(contact);
		}
	});
	*/
	ground_def.position.Set(context.canvas.width/2/GSS.PTM, context.canvas.height*0.95/GSS.PTM);
	ground_body = GSS.world.CreateBody(ground_def);
	ground_poly = new b2PolygonShape();
	ground_poly.SetAsBoxXY(context.canvas.width/2/GSS.PTM, 5/GSS.PTM);
	ground_body.CreateFixtureFromShape(ground_poly, 0);
	window.ground_body = ground_body;
	
	context.beginPath();
	context.rect(0,0, context.canvas.width, context.canvas.height);
	context.fillStyle= '#ffffff';
	context.fill();
	context.stroke();
	context.closePath();
	
	 // document.oncontextmenu = function() {return false;};
	
	$(window)
	.on('keydown', function(e){
		GSS.keys[e.which] = true;
	}).on('keyup', function(e){
		GSS.keys[e.which] = false;
	});
	
	$canvas.on('mousemove', function(e){
		GSS.mouse_info.x = e.clientX-$canvas.offset().left;
		GSS.mouse_info.y = e.clientY-$canvas.offset().top;
	})
	.on('mousedown', function(e){
		e.preventDefault();
		switch(e.which)
		{
			case 1:
				GSS.mouse_info.left_click = true;
				break;
			case 2:
				GSS.mouse_info.middle_click = true;
				break;
			case 3:
				GSS.mouse_info.right_click = true;
				break;
		}
		return false;
	})
	.on('mouseup', function(e){
		switch(e.which)
		{
			case 1:
				GSS.mouse_info.left_click = false;
				break;
			case 2:
				GSS.mouse_info.middle_click = false;
				break;
			case 3:
				GSS.mouse_info.right_click = false;
				break;
		}
	});
	
	update_interval = window.setInterval(update, GSS.fps);
	
	// Updates the game
	function update()
	{
		//console.log(GSS.mouse_info);
		GSS.old_time = (new Date()).getMilliseconds();
		GSS.world.Step(GSS.fps, 6, 2);
		
		for(var i = 0; i < GSS.entities.length; i++)
		{
			GSS.entities[i].update();
		}
	}
	
	// Renders the canvas
	function updateCanvas(){
		context.clearRect(0, 0, context.canvas.width, context.canvas.height);

		// White background
		context.beginPath();
		context.rect(0,0, context.canvas.width, context.canvas.height);
		context.fillStyle= '#ffffff';
		context.fill();
		context.closePath();
		
		context.beginPath();
		context.rect(ground_body.GetPosition().x*GSS.PTM-context.canvas.width/2, context.canvas.height*0.95-10/2, context.canvas.width, 10*GSS.PTM/2);
		context.fillStyle= '#0000ff';
		context.fill();
		context.stroke();
		context.closePath();

		for(var i = 0; i < GSS.entities.length; i++)
		{
			GSS.entities[i].redraw();
		}
		
		window.requestAnimationFrame(updateCanvas);
	}
	
	window.requestAnimationFrame(updateCanvas);
});