// Global values per script since typing Math.PI/180 repeatedly gets old
var 
DEGTORAD = Math.PI/180,
RADTODEG = 180/Math.PI;

GSSEntity.defaults = {
	x: 0,
	y: 0,
	triangles: [],
	
	thrust_acceleration: 50,
	thrust_deceleration: 50,
	angle: 0,
	
	velocity_magnitude_max: 10,
	
	lock_rotation: false
}

/**
Argument setup:
image object required
polygons array used to build body (in PX)
bool if controlled by player (controls override)
*/
function GSSEntity(image, player, options) {
	if(GSS.world === undefined || GSS.context === undefined)
		return;
	
	options = extend(GSSEntity.defaults, options);
	
	// BEGIN: GSSEntity Data
	this.image = image;
	this.polygons;
	
	this.is_player = player;
	// END: GSSEntity Data
	
	// BEGIN: Movement stats
	// Thrust in Newtons
	this.thrust_acceleration = options.thrust_acceleration;
	this.thrust_deceleration = options.thrust_deceleration;
	
	// m/s
	this.velocity_magnitude_max = options.velocity_magnitude_max;
	this.velocity_current = new b2Vec2(0,0);
	
	// deg/sec
	this.angular_velocity_max = 1*DEGTORAD;
	this.angular_acceleration = 360*DEGTORAD;
	this.angular_velocity_current = 0;
	this.lock_rotation = options.lock_rotation
	// END: Movement stats
	
	// BEGIN: liquidfun
	var entity_body_def = new b2BodyDef();
	entity_body_def.type = b2_dynamicBody;
	entity_body_def.angle = options.angle*DEGTORAD;
	entity_body_def.position = new b2Vec2(options.x/GSS.PTM, options.y/GSS.PTM);
	this.entity_body = GSS.world.CreateBody(entity_body_def);
	
	// Todo: Create Polygons for each fixture
	var entity_body_fixture = new b2FixtureDef();
	entity_body_fixture.shape = new b2PolygonShape();
		
	entity_body_fixture.shape.SetAsBoxXY(this.image.width/2/GSS.PTM, this.image.height/2/GSS.PTM);
	entity_body_fixture.density = 1;
	entity_body_fixture.friction = 1;
	entity_body_fixture.restitution = 0;

	this.entity_body.CreateFixtureFromDef(entity_body_fixture);
	// END: liquidfun
	
}

GSSEntity.prototype = {
	update: function(){

		var 
		x = 0,
		y = 0,
		x_force,
		y_force,
		dt = (new Date()).getMilliseconds()-GSS.old_time,
		move_angle = 0,
		left, right, up, down,
		// Get mouse position relative to world
		offset_mouse_x = GSS.mouse_info.x/GSS.PTM,
		offset_mouse_y = GSS.mouse_info.y/GSS.PTM,
		angle_current = this.entity_body.GetAngle(),
		position = this.entity_body.GetPosition(),
		angle_target,
		angle_delta,
		angle_future,
		dir; 
	
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
			
			if(up)
			{
				if(left)
					move_angle = 225;
				else if(right)
					move_angle = 315;
				else
					move_angle = 270;
			}
			else if(down)
			{
				if(left)
					move_angle = 135;
				else if(right)
					move_angle = 45;
				else
					move_angle = 90;
			}
			else
			{
				if(left)
					move_angle = 180;
				else if(right)
					move_angle = 0;
			}
			
			x = this.thrust_acceleration*Math.cos(move_angle*DEGTORAD);
			y = this.thrust_acceleration*Math.sin(move_angle*DEGTORAD);
			
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
				y_force = (this.entity_body.GetMass()*this.velocity_current.y)/GSS.fps;
				if(this.velocity_current.y !== 0)
					this.entity_body.ApplyForceToCenter(new b2Vec2(0, (Math.abs(y_force) >= this.thrust_deceleration ? this.thrust_deceleration*(y_force > 0 ? -1 : 1): -y_force)), true);				
			}
			
			// Slowdown for horizontal movement
			if(!left && !right)
			{
				x_force = (this.entity_body.GetMass()*this.velocity_current.x)/GSS.fps;
				if(this.velocity_current.x !== 0)
					this.entity_body.ApplyForceToCenter(new b2Vec2((Math.abs(x_force) >= this.thrust_deceleration ? this.thrust_deceleration*(x_force > 0 ? -1 : 1): -x_force), 0), true);
			}
			// END: Linear Movement
			
			// BEGIN: Angular Movement (Mouse Tracking)
			// See: http://www.iforce2d.net/b2dtut/rotate-to-angle
			// http://www.dummies.com/how-to/content/how-to-calculate-the-torque-needed-to-accelerate-a.html
			if(!this.lock_rotation)
			{
				
				angle_future = angle_current+this.angular_velocity_current / 60;
				angle_target = Math.atan2((position.y-offset_mouse_y), (position.x-offset_mouse_x));
				var angle_to = angle_target-angle_future;
				while(angle_to < -Math.PI) { angle_to += 360*Math.PI/180; }
				while(angle_to > Math.PI) { angle_to -= 360*Math.PI/180; }
				//console.log(angle_target);
				var desired_vel = angle_to;
				var torque = this.entity_body.GetInertia()*desired_vel / GSS.fps/0.3;
				dir = Math.cos(angle_current)*Math.sin(angle_target)-Math.sin(angle_current)*Math.cos(angle_target) > 0 ? 1 : -1; 
				//angle_delta = angle_current-angle_target;
				//console.log(torque);
				console.log(desired_vel, angle_to, this.entity_body.GetInertia(), 1/60, torque)
				//console.log(dir, angle_current*180/Math.PI+180);
				
				//if(Math.abs(this.angular_velocity) < this.angular_velocity_current)
				//{
					// Todo: Use torque to get ship to face direction
				
				
					
				if(Math.abs(this.entity_body.GetAngularVelocity()) > this.angular_velocity_max) {
					this.entity_body.SetAngularVelocity(dir*this.angular_velocity_max);
				}
				else
				{
					this.entity_body.ApplyTorque(torque);
				}
				//}
				
				 // Get the future angular velocity after update (need to know if this will exceed max angular velocity?)
				
				// Get Angle data
				/*
				var angle_target,
				dir,
				angle_delta;
				
				// These values will always be needed/helpful
				angle_target = Math.atan2((position.y-offset_mouse_y), (position.x-offset_mouse_x));
				angle_target = angle_target < 0 ? angle_target+(2*Math.PI) : angle_target;
				
				// Constrain body's current angle to 0 - 360
				if(angle_current > 2*Math.PI)
					this.entity_body.SetTransform(this.entity_body.GetPosition(), angle_current-2*Math.PI);
					
				dir = Math.cos(angle_current)*Math.sin(angle_target)-Math.sin(angle_current)*Math.cos(angle_target) > 0 ? 1 : -1;
				
				angle_target = dir > 0 && angle_target < angle_current ? angle_target+=2*Math.PI : angle_target;
					
				angle_delta = angle_target-angle_current;
				
				// Find shortest angle to rotate to 
				while(angle_delta < -Math.PI) { angle_delta += 360*Math.PI/180; }
				while(angle_delta > Math.PI) { angle_delta -= 360*Math.PI/180; }
				
				angle_future = this.angular_velocity_current+(dir*this.angular_acceleration/GSS.fps);
				
				
				
				acceleration = angle_delta/GSS.fps
				
				console.log(angle_delta*RADTODEG, 'vel', angle_current*RADTODEG, angle_target*RADTODEG, (angle_current+angle_delta)*RADTODEG);
				//this.entity_body.SetAngularVelocity(30*DEGTORAD);


				var torque = this.entity_body.GetInertia()*dir*this.angular_acceleration;
				//console.log(torque);
				
				//if(Math.abs(this.angular_velocity_current) < this.angular_velocity_max)
					this.entity_body.ApplyTorque(torque);
					*/
			}
			// END: Angular Movement (Mouse Tracking)
		}
	},
	redraw: function(){
		var angle = this.entity_body.GetAngle(),
		x = this.entity_body.GetPosition().x*GSS.PTM,
		y = this.entity_body.GetPosition().y*GSS.PTM; 

		GSS.context.translate(x, y);
		GSS.context.rotate(angle);
		GSS.context.drawImage(this.image, -this.image.width/2, -this.image.height/2);
		GSS.context.rotate(-angle);
		GSS.context.translate(-x, -y);
	}
}