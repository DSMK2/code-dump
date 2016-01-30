/* Load this externally */
var weapon_data = [
	{image_url: 'images/laser_beam.png', image_frames: 1, fire_sound_url:'sounds/shoot.wav', hit_sound_url: 'sounds/explode.wav', data: {id: 0, dmg: 1}}
],
entity_data = [
	{image_url: 'images/simplefighter.png', image_frames: 2, image_frame_rate: 0.5, data: 
		{
			angle: 90, 
			angular_velocity_max: 180, 
			angular_acceleration: 45, 
			thrust_acceleration: 10, 
			thrust_deceleration: 25, 
			velocity_magnitude_max: 10, 
			weapons:[{x: -21, y: 0, weapon_id: 0}]
		}
	}
],
faction_data = [
	{faction: 'player'},
	{faction: 'enemy'}
],
num_images_loaded = 0,
num_audio_loaded = 0,
images_loaded = false,
audio_loaded = false;

var world,
GSS = {
	keys: {},
	mouse_info: {x: -1, y: -1, left_click: false, right_click: false, middle_click: false},
	
	entities_index: 0,
	entities: [],
	entities_to_remove: [],
	projectiles: [],
	projectiles_to_remove: [],
	weapon_data: [],
	entity_data: [],
	image_data: [],
	audio_data: [],
	faction_data: [],
	player: false,
	flag_follow_player: true,
	flag_init: false,
	
	/* Event vars */
	event_images_loaded: new Event('all_images_loaded'),
	event_audio_loaded: new Event('all_audio_loaded'),
	event_assets_loaded: new Event('all_assets_loaded'),
	
	/* Update vars */
	FPS: 1/60,
	update_timer: null,
	
	/* Liquidfun vars */
	PTM: null,
	world: null,
	
	/* THREE.js vars*/
	canvas: null,
	scene: null,
	renderer: null,
	camera: null,
	
	// Functions
	/**
	* Init
	* Initializes GSS; creates THREE.js and liquidfun related objects
	* @param canvas canvas - Canvas to render GSS on
	*/
	init: function(canvas, faction_data, entity_data, weapon_data) {
			var 
			canvas_width = canvas.clientWidth,
			canvas_height = canvas.clientHeight,
			near = 0.1,
			far = 10000;

			/* Init THREE.js */
			GSS.canvas = canvas;
			GSS.renderer = new THREE.WebGLRenderer({canvas: GSS.canvas, antilias: false});
			GSS.camera = new THREE.OrthographicCamera( canvas_width / - 2, canvas_width / 2, canvas_height / 2, canvas_height / - 2, near, far );
			GSS.scene = new THREE.Scene();

			GSS.renderer.setClearColor(0xFFFFFF);
			GSS.renderer.setSize(canvas_width, canvas_height);
			
			GSS.scene.add(GSS.camera);
			GSS.camera.position.z = 300;
	
			GSS.renderer.render(GSS.scene, GSS.camera);
			
			/* Init Liquidfun */
			GSS.PTM = 12;
			GSS.world = world = new b2World(new b2Vec2(0, 0));
			
			// Collision handling
			GSS.world.SetContactListener({
				BeginContactBody: function(contact) {
					var
					a = contact.GetFixtureA(),
					b = contact.GetFixtureB(),
					a_body = a.body,
					b_body = b.body, 
					a_GSSData,
					b_GSSData,
					a_type,
					b_type,
					a_GSSObject,
					b_GSSObject,
					GSSData,
					type;
			
					if(a_body.GSSData !== undefined)
					{
						a_GSSData = a_body.GSSData;
						a_type = a_GSSData.type;
						a_GSSObject = a_GSSData.obj;
					}
			
					if(b_body.GSSData !== undefined)
					{
						b_GSSData = b_body.GSSData;
						b_type = b_GSSData.type;
						b_GSSObject = b_GSSData.obj;
					}
			
					if(a_GSSData !== undefined && b_GSSData !== undefined)
					{
						// Projectiles cannot interact with each other
						if((a_type == 'GSSProjectile' || b_type == 'GSSProjectile') && (a_type != 'GSSProjectile' && b_type != 'GSSProjectile') && (a_type == 'GSSEntity' || b_type == 'GSSEntity'))
						{
							var projectile = a_type == 'GSSProjectile' ? a_GSSObject : b_GSSObject,
							entity = a_type == 'GSSEntity' ? a_GSSObject : b_GSSObject;
					
							projectile.destroy();
						}
					}
					else if(a_GSSData !== undefined || b_GSSData !== undefined)
					{
						GSSData = a_GSSData !== undefined ? a_GSSData : b_GSSData;
						if(GSSData.type == 'GSSProjectile')
						{
							GSSData.obj.destroy();
						}
					}
				}
			});
			
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
			
			// Find entity images to load
			for(var e = 0; e < entity_data.length; e++)
			{
				var img_src = entity_data[e].image_url,
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
					GSS.image_data.push({url: img_src, index: GSS.image_data.length, frames: entity_data[e].image_frames});
					existing_index = GSS.image_data.length-1;
				}
				entity_data[e].data.image_index = existing_index;
				entity_data[e].data.image_frames = entity_data[e].image_frames;
				entity_data[e].data.image_frame_rate = entity_data[e].image_frame_rate;
				GSS.entity_data.push(entity_data[e].data);
			}
			
			// Build list of images to load (avoid duplicates)
			// Find weapon images to load
			// Find audio to load
			for(var w = 0; w < weapon_data.length; w++)
			{
				var projectile_image_url = weapon_data[w].image_url,
				fire_sound_url = weapon_data[w].fire_sound_url,
				hit_sound_url = weapon_data[w].hit_sound_url,
				image_existing_index = -1,
				fire_audio_existing_index = -1,
				hit_audio_existing_index = -1;
		
				// Find duplicate images
				for(var a = 0; a < GSS.image_data.length; a++)
				{
					if(GSS.image_data[a].url == projectile_image_url)
					{
						image_existing_index = a;
						break;
					}
				}
		
				// Find duplicate fire audio
				for(var af = 0; af < GSS.audio_data.length; af++)
				{
					if(GSS.audio_data[af].url == fire_sound_url)
					{
						fire_audio_existing_index = af;
						break;
					}		
				}
		
				// Find duplicate hit audio
				for(var ah = 0; ah < GSS.audio_data.length; ah++)
				{
					if(GSS.audio_data[ah].url == hit_sound_url)
					{
						hit_audio_existing_index = ah;
						break;
					}
				}
		
				if(image_existing_index == -1)
				{
					GSS.image_data.push({url: projectile_image_url, index: GSS.image_data.length, frames: weapon_data[w].image_frames});
					image_existing_index = GSS.image_data.length-1;
				}
		
				if(fire_audio_existing_index == -1)
				{
					GSS.audio_data.push({url: fire_sound_url, index: GSS.audio_data.length});
					fire_audio_existing_index = GSS.audio_data.length-1;
				}
		
				if(hit_audio_existing_index == -1)
				{
					GSS.audio_data.push({url: hit_sound_url, index: GSS.audio_data.length});
					hit_audio_existing_index = GSS.audio_data.length-1;
				}
				weapon_data[w].data.projectile_image_index = image_existing_index;
				weapon_data[w].data.fire_sound_index = fire_audio_existing_index;
				weapon_data[w].data.projectile_hit_sound_index = hit_audio_existing_index;
				console.log(weapon_data[w],'check');
				GSS.weapon_data.push(weapon_data[w]);
			}
				
			console.log(GSS.image_data, GSS.weapon_data);
			// Load images
			if(GSS.image_data.length === 0)
				window.dispatchEvent(event_images_loaded);
	
			function loadTexture(texture){
				var image_index = -1;
				for(var id = 0; id < GSS.image_data.length; id++)
				{
					if(texture.image.src.search(GSS.image_data[id].url) != -1)
						image_index = id;
				}
				
				if(image_index == -1)
					return;
				
				// Prevents blurry sprites
				texture.anisotropy = 0;
				texture.minFilter = THREE.NearestFilter;
				texture.magFilter = THREE.NearestFilter;
				
				
				texture.repeat.x = (texture.image.width/GSS.image_data[image_index].frames)/texture.image.width;
				console.log( texture.image.width/(texture.image.width/GSS.image_data[image_index].frames));
				// Create material
				material = new THREE.MeshBasicMaterial({map: texture, wireframe: false, transparent: true});
				material.side = THREE.DoubleSide;
				
				GSS.image_data[image_index].width = texture.image.width;
				GSS.image_data[image_index].height = texture.image.height;
				GSS.image_data[image_index].material =  material;
				
				num_images_loaded++;
	
				if(num_images_loaded == GSS.image_data.length)
					window.dispatchEvent(GSS.event_images_loaded);
			}
	
			for(var i = 0; i < GSS.image_data.length; i++)
			{
				var texture_loader = new THREE.TextureLoader(),
				material,
				image_data = GSS.image_data[i];
				texture_loader.load(image_data.url, loadTexture);
			}
	
			// Load audio
			if(GSS.audio_data.length)
				window.dispatchEvent(GSS.event_audio_loaded);
	
			function loadAudio(){
				num_audio_loaded++;
				if(num_audio_loaded == GSS.audio_data.length)
					window.dispatchEvent(GSS.event_audio_loaded);
			}
	
			for(var i = 0; i < GSS.audio_data.length; i++)
			{
				var 
				audio_data = GSS.audio_data[i],
				audio = new Audio();
		
				audio.preload = 'auto';
				audio.src = audio_data.url;
				audio.oncanplaythrough = loadAudio;
			}

			// Events
			window.addEventListener('all_images_loaded', function(){
				images_loaded = true;
				
				if(images_loaded && audio_loaded)
					window.dispatchEvent(GSS.event_assets_loaded);
			});
			
			window.addEventListener('all_audio_loaded', function(){
				audio_loaded = true;
				
				if(images_loaded && audio_loaded)
					window.dispatchEvent(GSS.event_assets_loaded);
			});

			window.addEventListener('all_assets_loaded', function(){
				console.log('All assets loaded: Showing player');
				GSS.addEntity(0, 0, true);
			});
				
			flag_init = true;
	},
	/**
	* update
	* Updates the current state of the GSS game world, handles camera tracking of player and cleans up 'dead' entities and projectiles	
	*/
	update: function() {
		if(GSS.world === undefined)
			return;
			
		var offset_mouse_x = GSS.mouse_info.x-GSS.canvas.clientWidth/2,
		offset_mouse_y = -(GSS.mouse_info.y-GSS.canvas.clientHeight/2),
		angle = Math.atan2(offset_mouse_y, offset_mouse_x), 
		max_distance = 500,
		distance = ( Math.sqrt(Math.pow(-offset_mouse_x, 2)+Math.pow(-offset_mouse_y, 2))).clamp(0, max_distance),
		x = distance*Math.cos(angle),
		y = distance*Math.sin(angle);
		
		GSS.old_time = (new Date()).getMilliseconds();
		GSS.world.Step(GSS.FPS, 6, 2);
		
		for(var e = 0; e < GSS.entities.length; e++)
		{
			GSS.entities[e].update();
		}
		
		for(var p = 0; p < GSS.projectiles.length; p++)
		{
			GSS.projectiles[p].update();
		}
		
		if(GSS.flag_follow_player && (GSS.player !== undefined && GSS.player))
		{	
			var vel = GSS.player.entity_body.GetLinearVelocity(),
			perpend_vel = new b2Vec2(-vel.y, vel.x);
			
			b2Vec2.Normalize(perpend_vel, perpend_vel);
			b2Vec2.MulScalar(perpend_vel, perpend_vel, -100);
			GSS.camera.position.lerp(new THREE.Vector3(x+GSS.player.mesh_plane.position.x, y+GSS.player.mesh_plane.position.y, GSS.camera.position.z), 0.5*GSS.FPS);
		}
		
		// Clean up
		while(GSS.entities_to_remove.length !== 0)
		{
		}
		
		while(GSS.projectiles_to_remove.length !== 0)
		{
			var projectile = GSS.projectiles_to_remove.pop(),
			index = GSS.getProjectileWithID(projectile.id);
			GSS.projectiles.splice(index, 1);
		}
	},
	/**
	* start
	* Starts the main game loop and rendering
	*/
	start: function(){
		GSS.update_timer = setInterval(GSS.update, GSS.FPS);
		
		function renderScene(){
			GSS.renderer.render(GSS.scene, GSS.camera);
			
			if(GSS.update_timer !== undefined)
				window.requestAnimationFrame(renderScene);
		}
		window.requestAnimationFrame(renderScene);
	},
	/**
	* stop
	* Stops the main game loop and rendering
	*/
	stop: function(){
		clearInterval(GSS.update_timer);
		GSS.update_timer = null;
	},
	addEntity: function(faction_id, entity_data_index, is_player)
	{
		var data = clone(GSS.entity_data[entity_data_index]),
		new_entity;
		if(is_player)
		{
			// Clear the current player
			if(GSS.player !== undefined && GSS.player)
				GSS.player.is_player = false;
		
			data.is_player = true;
		}
	
		data.faction_id = faction_id;
	
		new_entity = new GSSEntity(GSS.entities_index++, data);
		if(is_player)
			GSS.player = new_entity;
	
		GSS.entities.push(new_entity);
	},
	/**
	* Will assume the projectile array is sorted
	*/
	getProjectileWithID: function(id, start, end) {
		var halfway, candidate;

		if(end-start <= 0 || id === undefined)
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
	},
	cameraFollowPlayer: function(follow_player) {
		if(follow_player === undefined)
			GSS.follow_player = !GSS.follow_player;
	
		GSS.follow_player = follow_player;
	}
};

// A* algorithm implementation
var node_size = 1000;
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
	};
	var test_p = new test(new b2Vec2(0,0));
	world.QueryAABB(test_p, bounds, array_test);
	console.log(test_p);
}
	

jQuery(function($){
	var $canvas = $('#canvas');
	
	GSS.init($canvas[0], faction_data, entity_data, weapon_data);

	// Temp LiquidFun 
	var 
	ground_def = new b2BodyDef(),
	ground_body,
	ground_poly;
	
	ground_def.position.Set(0, 5);
	ground_body = GSS.world.CreateBody(ground_def);
	ground_poly = new b2PolygonShape();
	ground_poly.SetAsBoxXY(500/GSS.PTM, 20/GSS.PTM);
	ground_body.CreateFixtureFromShape(ground_poly, 0);
	var ground_mesh = new THREE.Mesh(new THREE.PlaneGeometry(1000, 40), new THREE.MeshBasicMaterial({color: 0x8B8E89}));
	ground_mesh.position.x = ground_body.GetPosition().x*GSS.PTM;
	ground_mesh.position.y = ground_body.GetPosition().y*GSS.PTM;
	GSS.scene.add(ground_mesh);
	
	$(window).on('resize', function(){
		canvas_width = $canvas.width();
		canvas_height = $canvas.height();
		GSS.renderer.setSize(canvas_width, canvas_height);
	}).trigger('resize');
	
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
	

	GSS.start();
});