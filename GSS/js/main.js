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
	FPS: 1/60,
	entities: [],
	entities_to_remove: [],
	projectiles: [],
	projectiles_to_remove: [],
	weapon_data: [],
	entity_data: [],
	image_data: [],
	faction_data: [], // Holds collision filtering info,
	
	player: false,
	follow_player: true
};


/* Load this externally */
var weapon_data = [
	{image_src: 'images/laser_beam.png', data: {id: 0, dmg: 1}}
],
entity_data = [
	{image_src: 'images/simplefighter.png', data: {is_player: true, angle: 90, angular_velocity_max: 180, angular_acceleration: 45, thrust_acceleration: 10, thrust_deceleration: 25, velocity_magnitude_max: 10, weapon_slots:[[{x: -21, y: 0, weapon_id: 0}]]}}
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

	if(end-start <= 0 || id == undefined)
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
	
	if(candidate === undefined || candidate.id === undefined)
		return -1;
	
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

GSS.cameraFollowPlayer = function(follow_player) {
	if(follow_player === undefined)
		GSS.follow_player = !GSS.follow_player
	
	GSS.follow_player = follow_player;
}

var node_size = 1000
// From world center
function getNodeDataAtPoint(x, y){
	var node_x = Math.floor(x/node_size),
	node_y = Math.floor(y/node_size),
	bounds = {upperBound: new b2Vec2(node_x, node_y), lowerBound: new b2Vec2(node_x+node_size, node_y+node_size)};
	console.log(node_x, node_y, bounds);
	var array_test = [];
	function test(p){
		this.point = p;
		this.fixture = null;
	}
	test.prototype.ReportFixture = function(asdf)
	{
		console.log('hit');
		array_test.push(asdf.body);
		this.fixture = asdf;
		return true;
	}
	var test_p = new test(new b2Vec2(0,0));
	world.QueryAABB(test_p, bounds, array_test);
	console.log(test_p);
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
	// Find weapon images to load
	for(var i = 0; i < weapon_data.length; i++)
	{
		var img_src = weapon_data[i].image_src,
		existing_index = -1;
		
		for(var a = 0; a < GSS.image_data.length; a++)
		{
			if(GSS.image_data[a].url == img_src)
			{
				existing_index = a;
				break;
			}
		}
		
		if(existing_index == -1)
		{
			GSS.image_data.push({url: img_src, index: GSS.image_data.length});
			existing_index = GSS.image_data.length-1;
		}
		weapon_data[i].data.image_index = existing_index;
		GSS.weapon_data.push(weapon_data[i]);
	}
	
	// Find entity images to load
	for(var i = 0; i < entity_data.length; i++)
	{
		var img_src = entity_data[i].image_src,
		existing_index = -1;
		
		for(var a = 0; a < GSS.image_data.length; a++)
		{
			if(GSS.image_data[a].url == img_src)
			{
				existing_index = a;
				break;
			}
		}
		
		if(existing_index == -1)
		{
			GSS.image_data.push({url: img_src, index: GSS.image_data.length});
			existing_index = GSS.image_data.length-1;
		}
		entity_data[i].data.image_index = existing_index;
	}
	
	console.log('test', GSS.image_data);
	// Load images
	for(var i = 0; i < GSS.image_data.length; i++)
	{
		var texture_loader = new THREE.TextureLoader(),
		material,
		image_data = GSS.image_data[i];
		console.log(image_data.url);
		texture_loader.load(image_data.url, function(texture){
			// Prevents blurry sprites
			texture.anisotropy = 0;
			texture.minFilter = THREE.NearestFilter;
			texture.magFilter = THREE.NearestFilter;
			
			// Create material
			material = new THREE.MeshBasicMaterial({map: texture, wireframe: false, transparent: true});
			material.side = THREE.DoubleSide;
			
			for(var id = 0; id < GSS.image_data.length; id++)
			{
				console.log(texture.image.src);
				if(texture.image.src.search(GSS.image_data[id].url) != -1)
				{
					console.log('hit');
					GSS.image_data[id].width = texture.image.width, 
					GSS.image_data[id].height = texture.image.height, 
					GSS.image_data[id].material =  material
				}
			}
			
			images_loaded++;
			
			if(images_loaded == GSS.image_data.length)
				$(window).trigger('all_images_loaded');
		});
	}
	

	// Events
	$(window).on('all_images_loaded', function(){
		GSS.player = new GSSEntity(0, entity_data[0].data) 
		GSS.entities.push(GSS.player);
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
	
	update_interval = window.setInterval(update, GSS.FPS);
	
	// Updates the game
	function update()
	{
		//console.log(GSS.entities.length, GSS.projectiles.length);
		var offset_mouse_x = GSS.mouse_info.x-GSS.context.width()/2,
		offset_mouse_y = -(GSS.mouse_info.y-GSS.context.height()/2),
		angle = Math.atan2(offset_mouse_y, offset_mouse_x), 
		max_distance = 500,
		distance = ( Math.sqrt(Math.pow(-offset_mouse_x, 2)+Math.pow(-offset_mouse_y, 2))).clamp(0, max_distance),
		x = distance*Math.cos(angle),
		y = distance*Math.sin(angle);
		
		//console.log(GSS.mouse_info);
		GSS.old_time = (new Date()).getMilliseconds();
		GSS.world.Step(GSS.FPS, 6, 2);
		
		for(var i = 0; i < GSS.entities.length; i++)
		{
			GSS.entities[i].update();
		}
		
		for(var i = 0; i < GSS.projectiles.length; i++)
		{
			GSS.projectiles[i].update();
		}
		
		if(GSS.follow_player && (GSS.player !== undefined && GSS.player))
		{		
			GSS.camera.position.lerp(new THREE.Vector3(x+GSS.player.mesh_plane.position.x, y+GSS.player.mesh_plane.position.y, GSS.camera.position.z), 0.5*GSS.FPS);
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
		
		// Clean up
		while(GSS.projectiles_to_remove.length !== 0)
		{
			var projectile = GSS.projectiles_to_remove.pop(),
			index = GSS.getProjectileWithID(projectile.id);
			GSS.projectiles.splice(index, 1);
		}
	}
	
	function renderScene(){
		renderer.render(scene, camera);
		window.requestAnimationFrame(renderScene);
	}
	window.requestAnimationFrame(renderScene);
});