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
	scene: null,
	renderer: null,
	camera: null,
	PTM: null,
	world: null,
	keys: {},
	mouse_info: {x: -1, y: -1, left_click: false, right_click: false, middle_click: false},
	fps: 1/60,
	entities: [],
	projectiles: [],
	weapon_data: [],
	entity_data: [],
	images: [],
	faction_data: [] // Holds filtering info
},
weapon_data = [
	{image_src: 'images/laser_beam.png', data: {id: 0, dmg: 1}}
],
entity_data = [
	{image_src: 'images/simplefighter.png', data: {is_player: true, angle: 90, angular_velocity_max: 50, angular_acceleration: 180, thrust_acceleration: 25, thrust_deceleration: 10, velocity_magnitude_max: 4, weapon_slots:[[{x: -21, y: 0, weapon_id: 0}, {x: -21, y: -5, weapon_id: 0}, {x: -21, y: 5, weapon_id: 0}]]}}
],
faction_data = [
	{faction: 'player'},
	{faction: 'enemy'}
]
images_loaded = 0;

/**
* Will assume the projectile array is sorted
*/
GSS.getProjectileWithID = function(id, start, end) {
	var halfway, candidate, projectiles = GSS.projectiles;
	console.log(start, end);
	if(end-start <= 0)
	{
		if(GSS.projectiles[start].id == id)
			return start;
		else
			return -1;
	}
	start = start === undefined ? 0 : start;
	end = end === undefined ? GSS.projectiles.length-1 : end;
	halfway = start+Math.floor((end-start)/2);
	candidate = GSS.projectiles[halfway];

	if(candidate.id == id)
		return halfway; 
	else
	{
		if(id > candidate.id)
			return GSS.getProjectileWithID(id, halfway+1, end);
		else
			return GSS.getProjectileWithID(id, start, halfway);
	} 
}

jQuery(function($){
	var $canvas = $('#canvas'),
	update_interval,
	canvas_width = $canvas.width(),
	canvas_height = $canvas.height(),
	near = 0.1,
	far = 10000,
	renderer = new THREE.WebGLRenderer({canvas: $canvas[0], antilias: false}),
	camera = new THREE.OrthographicCamera( canvas_width / - 2, canvas_width / 2, canvas_height / 2, canvas_height / - 2, near, far ),
	scene = new THREE.Scene();
	
	renderer.setClearColor(0xFFFFFF);
	
	scene.add(camera);
	camera.position.z = 300;
	renderer.setSize(canvas_width, canvas_height);
	
	renderer.render(scene, camera);
	
	GSS.context = $canvas;
	GSS.scene = scene;
	GSS.camera = camera;
	GSS.renderer = renderer;
	
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
		var texture_loader = new THREE.TextureLoader(),
		material;
		texture_loader.load(img_srcs[i], function(texture){
			texture.anisotropy = 0;
			texture.minFilter = THREE.NearestFilter;
			texture.magFilter = THREE.NearestFilter;
			console.log(texture.image.width, texture.image.height);
			material = new THREE.MeshBasicMaterial({map: texture, wireframe: false, transparent: true});
			material.side = THREE.DoubleSide;
			GSS.images.push({width: texture.image.width, height: texture.image.height, material: material});
			images_loaded++;
			if(images_loaded == img_srcs.length)
				$(window).trigger('all_images_loaded');
		});
		/*
		var image = new Image();
		image.onload = function(){
			
			images_loaded++;
			if(images_loaded == img_srcs.length)
				$(window).trigger('all_images_loaded');
		}
		image.src = img_srcs[i];
		GSS.images.push(image);
		*/
	}	
	
	$(window).on('all_images_loaded', function(){
		console.log(entity_data[0].data);
		GSS.entities.push(new GSSEntity(0, entity_data[0].data));
	});
	
	$(window).on('resize', function(){
		canvas_width = $canvas.width();
		canvas_height = $canvas.height();
		renderer.setSize(canvas_width, canvas_height);
	}).trigger('resize');
	
	// World
	world.SetContactListener({
		BeginContactBody: function(contact) {
			var
			a = contact.GetFixtureA(),
			b = contact.GetFixtureB(),
			a_body = a.body,
			b_body = b.body, 
			GSSData,
			type,
			GSSObject;
			
			console.log('hit');
			if(a_body.GSSData !== undefined)
			{
				console.log('a', a_body.GSSData);
				GSSData = a_body.GSSData;
				type = GSSData.type;
				GSSObject = GSSData.obj;
				console.log(GSSObject);
				switch(type)
				{
					case 'GSSProjectile':
						GSSObject.destroy();
						break;
						
					default: 
						break;
				}
			}
			
			if(b_body.GSSData !== undefined)
			{
				GSSData = b_body.GSSData;
				type = GSSData.type;
				GSSObject = GSSData.obj;
				switch(type)
				{
					case 'GSSProjectile':
						
						GSSObject.destroy();
						break;
						
					default: 
						break;
				}
			}
		}
	});

	ground_def.position.Set(0, 5);
	ground_body = GSS.world.CreateBody(ground_def);
	ground_poly = new b2PolygonShape();
	ground_poly.SetAsBoxXY(canvas_width/2/GSS.PTM, 5/GSS.PTM);
	ground_body.CreateFixtureFromShape(ground_poly, 0);
	var ground_mesh = new THREE.Mesh(new THREE.PlaneGeometry(canvas_width, 10), new THREE.MeshBasicMaterial({color: 0x8B8E89}));
	ground_mesh.position.x = ground_body.GetPosition().x*GSS.PTM;
	ground_mesh.position.y = ground_body.GetPosition().y*GSS.PTM;
	scene.add(ground_mesh);
	
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
		
		for(var i = 0; i < GSS.projectiles.length; i++)
		{
			GSS.projectiles[i].update();
		}
		
		
		/*camera controls*/
		// Left
		if(GSS.keys[37])
			GSS.camera.position.x--;
		// Up
		if(GSS.keys[38])
			GSS.camera.position.y++;
		
		// Right
		if(GSS.keys[39])
			GSS.camera.position.x++;
		
		// Down
		if(GSS.keys[40])
			GSS.camera.position.y--;
		
	}
	
	function renderScene(){
		renderer.render(scene, camera);
		window.requestAnimationFrame(renderScene);
	}
	window.requestAnimationFrame(renderScene);
});