GSSEntity.defaults = {
	x: 0,
	y: 0,
	angle: 0,
	is_player : false,
	// Weapons data
	/*
	Example: {x: 0, y: 0, weapon: <GSSWeapon>, group: 0} and so on
	*/
	weapon_slots: [],
	power_max: 100,
	power_regen: 10,
	
	triangles: [],
	
	// Linear Movement
	thrust_acceleration: 50,
	thrust_deceleration: 10,
	velocity_magnitude_max: 10,
	movement_relative_to_screen: false, 
	
	// Angular Movement (Entered as degrees, converted to radians)
	angular_acceleration: 180,
	angular_velocity_max: 360,
	lock_rotation: false,
	follow_mouse: false,  // No acceleration 1:1 mouse tracking
	image_index: 0
}

/**
Argument setup:
image object required
polygons array used to build body (in PX)
bool if controlled by player (controls override)
*/
function GSSEntity(faction_id, options) {
	if(GSS.world === undefined || GSS.context === undefined)
		return;
	
	options = extend(GSSEntity.defaults, options);
	
	// BEGIN: GSSEntity Data
	this.image = GSS.images[options.image_index];
	this.polygons;
	
	this.is_player = options.is_player;
	this.faction = faction_id === undefined ? -1 : faction_id;
	
	// Weapons handling
	this.weapon_slots = options.weapon_slots;
	for(var g = 0; g < options.weapon_slots.length; g++)
	{
		var weapon_group = options.weapon_slots[g];
		for(var w = 0; w < weapon_group.length; w++)
		{
			var weapon_data = clone(GSS.weapon_data[weapon_group[w].weapon_id]);
			console.log(weapon_data, GSS.weapon_data, weapon_group, weapon_group.weapon_id);
			weapon_data.x = weapon_group[w].x;
			weapon_data.y = weapon_group[w].y;
			weapon_data.faction_id = this.faction;
			weapon_group[w].weapon = new GSSWeapon(this, weapon_data);
		}
	}

	/*
	// Sort weapon slots
	options.weapon_slots.sort(function(a, b){
		if(a.group === undefined || b.group === undefined)
			return 0;
	});
	*/
	this.power_max = options.power_max;
	this.power_current = this.power_max;
	this.power_regen = options.power_regen;
	this.movement_relative_to_screen = options.movement_relative_to_screen;
	// END: GSSEntity Data
	
	// BEGIN: Movement stats
	// Thrust in Newtons
	this.thrust_acceleration = options.thrust_acceleration;
	this.thrust_deceleration = options.thrust_deceleration;
	
	// m/s
	this.velocity_magnitude_max = options.velocity_magnitude_max;
	this.velocity_current = new b2Vec2(0,0);
	
	// rad/sec
	this.angular_velocity_max = options.angular_velocity_max*DEGTORAD;
	this.angular_acceleration = options.angular_acceleration*DEGTORAD;
	this.angular_velocity_current = 0;
	
	this.angle_current = options.angle*DEGTORAD;
	
	this.lock_rotation = options.lock_rotation;
	this.follow_mouse = options.follow_mouse;
	// END: Movement stats
	
	// BEGIN: liquidfun
	var entity_body_def = new b2BodyDef();
	entity_body_def.type = b2_dynamicBody;
	entity_body_def.angle = options.angle*DEGTORAD;
	entity_body_def.position = new b2Vec2(options.x/GSS.PTM, options.y/GSS.PTM);
	entity_body_def.fixedRotation = this.lock_rotation;
	this.entity_body = GSS.world.CreateBody(entity_body_def);
	
	// Todo: Create Polygons for each fixture
	var entity_body_fixture = new b2FixtureDef();
	entity_body_fixture.shape = new b2PolygonShape();
		
	entity_body_fixture.shape.SetAsBoxXY(this.image.width/2/GSS.PTM, this.image.height/2/GSS.PTM);
	entity_body_fixture.density = 1;
	entity_body_fixture.friction = 1;
	entity_body_fixture.restitution = 0;
	entity_body_fixture.filter.groupIndex = -GSS.faction_data[faction_id].category;
	
	
	
	this.entity_body.CreateFixtureFromDef(entity_body_fixture);
	this.entity_body.GSSData = {type: 'GSSEntity', obj: this};
	//this.entity_body.ptr.toFixed = this.lock_rotation;
	// END: liquidfun
	
	return this;
}

GSSEntity.prototype = {
	getBody: function(){
		return this.entity_body;
	},
	fireWeapons: function(){
		var current_weapon_group;
		for(var g = 0; g < this.weapon_slots.length; g++)
		{
			current_weapon_group = this.weapon_slots[g];
			for(var w = 0; w < current_weapon_group.length; w++)
			{
				console.log(w, current_weapon_group);
				if(current_weapon_group[w].weapon != undefined)
					current_weapon_group[w].weapon.fire();
			}
		}
	},
	setAngle: function(new_angle){			
		this.angle_current = new_angle*DEGTORAD;
		this.entity_body.SetTransform(this.entity_body.GetPosition(), this.angle_current);
	},
	update: function(){
		var 
		x = 0,
		y = 0,
		x_force,
		y_force,
		dt = (new Date()).getMilliseconds()-GSS.old_time,
		move_angle = 0,
		left = false,
		right = false,
		up = false,
		down = false,
		fire = false,
		// Get mouse position relative to world
		offset_mouse_x = GSS.mouse_info.x/GSS.PTM,
		offset_mouse_y = GSS.mouse_info.y/GSS.PTM,
		angle_current = this.entity_body.GetAngle(),
		position = this.entity_body.GetPosition(),
		angle_target,
		angle_delta,
		dir,
		angular_acceleration_needed,
		torque;
		
	
		this.angular_velocity_current = this.entity_body.GetAngularVelocity()
		this.velocity_current = this.entity_body.GetLinearVelocity();
		
		if(this.is_player)
		{	
			// BEGIN: Linear Movement
			// Up/Down
			if(GSS.keys[87] === true) // Down
				up = true;
			else if(GSS.keys[83] === true) // Up
				down = true;
			
			// Left/Right
			if(GSS.keys[65] === true) // Left
				left = true
			else if(GSS.keys[68] === true) // Right
				right = true;
			
			if(GSS.keys[32] === true)
				fire = true;
			
			if(up)
			{
				if(left)
					move_angle = this.movement_relative_to_screen ? 225*DEGTORAD : angle_current+135*DEGTORAD;
				else if(right)
					move_angle = this.movement_relative_to_screen ? 315*DEGTORAD : angle_current-135*DEGTORAD;
				else
					move_angle = this.movement_relative_to_screen ? 270*DEGTORAD : angle_current+180*DEGTORAD;
			}
			else if(down)
			{
				if(left)
					move_angle = this.movement_relative_to_screen ? 135*DEGTORAD : angle_current+45*DEGTORAD;
				else if(right)
					move_angle = this.movement_relative_to_screen ? 45*DEGTORAD : angle_current-45*DEGTORAD;
				else
					move_angle = this.movement_relative_to_screen ? 90*DEGTORAD : angle_current;
			}
			else
			{
				if(left)
					move_angle = this.movement_relative_to_screen ? 180*DEGTORAD : angle_current+90*DEGTORAD;
				else if(right)
					move_angle = this.movement_relative_to_screen ? 0*DEGTORAD : angle_current-90*DEGTORAD;
			}
			
			if(fire)
				this.fireWeapons();
			
			//move_angle = angle_current-move_angle*DEGTORAD;
			//console.log(move_angle*RADTODEG);
			x = this.thrust_acceleration*Math.cos(move_angle);
			y = this.thrust_acceleration*Math.sin(move_angle);
			
			// Apply thrust any controls
			if(up || down || left || right)
				this.entity_body.ApplyForceToCenter(new b2Vec2(x, y), true);
			
			// Set to max velocity if applied force exceeds max velocity
			if(this.velocity_current.Length() >= this.velocity_magnitude_max)
			{
				var new_vec = new b2Vec2(0, 0);
				b2Vec2.Normalize(new_vec, this.entity_body.GetLinearVelocity());
				b2Vec2.MulScalar(new_vec, new_vec, this.velocity_magnitude_max);
				this.entity_body.SetLinearVelocity(new_vec);
			}
			
			// Slowdown for vertical movement
			if(!up && !down)
			{
				y_force = (this.entity_body.GetMass()*this.velocity_current.y);
				if(this.velocity_current.y !== 0)
					this.entity_body.ApplyForceToCenter(new b2Vec2(0, (Math.abs(y_force) >= this.thrust_deceleration ? this.thrust_deceleration*(y_force > 0 ? -1 : 1): -y_force)), true);				
			}
			
			// Slowdown for horizontal movement
			if(!left && !right)
			{
				x_force = (this.entity_body.GetMass()*this.velocity_current.x);
				if(this.velocity_current.x !== 0)
					this.entity_body.ApplyForceToCenter(new b2Vec2((Math.abs(x_force) >= this.thrust_deceleration ? this.thrust_deceleration*(x_force > 0 ? -1 : 1): -x_force), 0), true);
			}
			
			// END: Linear Movement
			
			// BEGIN: Angular Movement (Mouse Tracking)
			// See: http://www.iforce2d.net/b2dtut/rotate-to-angle
			// See: http://www.dummies.com/how-to/content/how-to-calculate-the-torque-needed-to-accelerate-a.html
			if(!this.lock_rotation)
			{
				// Get Angle data
				// These values will always be needed/helpful
				angle_target = Math.atan2((position.y-offset_mouse_y), (position.x-offset_mouse_x));
				angle_target = angle_target < 0 ? angle_target+(2*Math.PI) : angle_target;
			
				if(this.follow_mouse)
				{
					this.entity_body.SetTransform(this.entity_body.GetPosition(), angle_target);
				}
				else
				{
					
					
					// Constrain body's current angle to 0 - 360
					if(angle_current > 2*Math.PI)
						this.entity_body.SetTransform(this.entity_body.GetPosition(), angle_current-2*Math.PI);
					
					// Get direction rotaiton is going to happen
					dir = Math.cos(angle_current)*Math.sin(angle_target)-Math.sin(angle_current)*Math.cos(angle_target) > 0 ? 1 : -1;
					
					// Offset angle target to match direction i.e. if the direction is possitive and the current angle is 360, the destination is 360 plus
					angle_target = dir > 0 && angle_target < angle_current ? angle_target+=2*Math.PI : angle_target;
					
					// Find amount of rotation
					angle_delta = angle_target-angle_current;
					
					// Find shortest angle to rotate to 
					while(angle_delta < -Math.PI) { angle_delta += 360*Math.PI/180; }
					while(angle_delta > Math.PI) { angle_delta -= 360*Math.PI/180; }
					
					// Find acceleration for a step needed to move angle_delta
					angular_acceleration_needed = ((angle_delta-this.angular_velocity_current)/GSS.fps).clamp(-this.angular_acceleration, this.angular_acceleration);

					torque = this.entity_body.GetInertia()*angular_acceleration_needed;
					this.entity_body.ApplyTorque(torque);
					
					// Cap angular velocity
					this.angular_velocity_current = this.entity_body.GetAngularVelocity();
					if(Math.abs(this.angular_velocity_current) > this.angular_velocity_max)
						this.entity_body.SetAngularVelocity(dir*this.angular_velocity_max);
				}
				this.angle_current = angle_current;
			}
			else
			{
				//console.log('hit');
				this.entity_body.SetTransform(this.entity_body.GetPosition(), this.angle_current);
			}
			// END: Angular Movement (Mouse Tracking)
		}	
	},
	redraw: function(){
		var angle = this.entity_body.GetAngle(),
		x = this.entity_body.GetPosition().x*GSS.PTM,
		y = this.entity_body.GetPosition().y*GSS.PTM; 
		
		if(x-this.image.width/2 < 0 || y-this.image.height/2 < 0 || x-this.image.width/2 > GSS.context.canvas.width || y-this.image.height/2 > GSS.context.canvas.height)
			return;
		
		GSS.context.translate(x, y);
		GSS.context.rotate(angle);
		GSS.context.drawImage(this.image, -this.image.width/2, -this.image.height/2);
		GSS.context.rotate(-angle);
		GSS.context.translate(-x, -y);
	}
}