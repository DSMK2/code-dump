/*
Notes: Projectiles can either be a regular moving body or a line, but for the purposes of this stage of development, regular moving body
*/

GSSProjectile.id = 0;

GSSProjectile.defaults = {
	angle: 0, 
	x: 0, 
	y: 0, 
	velocity_magnitude: 1,
	lifetime: 1000
};


/** 
* Requires image, parent gss entity, body def
*/
function GSSProjectile(image, GSSEntity_parent, body_def, fixture_def, options) {
	options = extend(GSSProjectile.defaults, options);
	this.image = image;
	this.parent = GSSEntity_parent;
	
	this.lifetime_end = Date.now()+options.lifetime;
	this.mark_for_delete = false;
	
	this.projectile_body_def = body_def;
	this.projectile_body_def.angle = options.angle;
	this.projectile_body_def.position = new b2Vec2(options.x, options.y);
	
	this.projectile_body = GSS.world.CreateBody(this.projectile_body_def);
	this.projectile_body.CreateFixtureFromDef(fixture_def);
	this.projectile_body.GSS_parent = this;
	
	var new_velocity = new b2Vec2(-options.velocity_magnitude*Math.cos(options.angle), -options.velocity_magnitude*Math.sin(options.angle));
	b2Vec2.Add(new_velocity, new_velocity, this.parent.entity_body.GetLinearVelocity());
	this.velocity = new_velocity;
	console.log(this.velocity);
	this.projectile_body.SetLinearVelocity(this.velocity);
	
	this.id = GSSProjectile.id;
	GSSProjectile.id++;
	
	this.projectile_body.GSSData = {type: 'GSSProjectile', obj: this};
	
	this.destroyed = false;
	// BEGIN: THREE.js
	this.mesh_plane = new THREE.Mesh(new THREE.PlaneGeometry(this.image.width, this.image.height), this.image.material);
	GSS.scene.add(this.mesh_plane);
	// END: THREE.js
	
	return this;
}

GSSProjectile.prototype = {
	update: function(){
		if(this.mark_for_delete)
			return;
		
		this.mesh_plane.position.x = this.projectile_body.GetPosition().x*GSS.PTM;
		this.mesh_plane.position.y = this.projectile_body.GetPosition().y*GSS.PTM;
		this.mesh_plane.rotation.z = this.projectile_body.GetAngle();
		
		if(this.lifetime_end <= Date.now())
			this.destroy();
	},
	redraw: function(){
		var angle = this.projectile_body.GetAngle(),
		x = this.projectile_body.GetPosition().x*GSS.PTM,
		y = this.projectile_body.GetPosition().y*GSS.PTM; 
		
		if(x-this.image.width/2 < 0 || y-this.image.height/2 < 0 || x-this.image.width/2 > GSS.context.canvas.width || y-this.image.height/2 > GSS.context.canvas.height)
			return;
		
		GSS.context.translate(x, y);
		GSS.context.rotate(angle);
		GSS.context.drawImage(this.image, -this.image.width/2, -this.image.height/2);
		GSS.context.rotate(-angle);
		GSS.context.translate(-x, -y);
	},
	/* Remove projectile eligibility from rendering and simulation */
	destroy: function(){
		if(this.mark_for_delete)
			return; 
			
		this.mark_for_delete = true;
		GSS.scene.remove(this.mesh_plane);
		GSS.world.DestroyBody(this.projectile_body);
		GSS.projectiles_to_remove.push(this);
		
	}
}

GSSWeapon.defaults = {
	// Position relative to GSSEntity parent
	x: 0,
	y: 0,
	
	// Weapon fire image and sounds
	fire_image_index: 0,
	fire_sound_index: 0,
	
	// Weapon fire data
	power_cost: 0,
	firerate: 50,
	faction_id: -1,
	spread_oscilliate: true,
	spread_oscilliate_reverse: true,
	spread_oscilliate_reverse_on_complete: true,
	spread: 10,
	spread_fixed: false, // Fixed weapon spread flag, random spread otherwise
	projectiles_per_shot: 1,
	flipped: false,
	
	// Projectile image and sounds
	projectile_image_index: 0,
	projectile_hit_image_index: 0,
	projectile_hit_sound_index: 0,
	
	// Projectile data
	damage: 1,
	velocity: 10,
	lifetime: 1000
}


function GSSWeapon(GSSEntity_parent, options){
	if(GSSEntity_parent === undefined || GSS.world === undefined)
		return;
		
	options = extend(GSSWeapon.defaults, options);
	
	// Projectile Image

	this.image = GSS.image_data[options.projectile_image_index];
	this.last_fired = 0;
	this.fire_rate = 1000/options.firerate;
	
	// Position relative to parent image
	this.x = options.x/GSS.PTM;
	this.y = options.y/GSS.PTM;
	
	this.power_cost = options.power_cost;
	
	// Firing methods
	this.spread = options.spread*DEGTORAD;
	this.spread_fixed = options.spread_fixed;
	this.projectiles_per_shot = options.projectiles_per_shot;
	this.increment = this.projectiles_per_shot-1 !== 0 ? this.spread/(this.projectiles_per_shot-1) : 1;
	this.increment_max = this.spread/this.increment;
	this.increment_current = options.spread_oscilliate_reverse ? this.increment_max : 0;
	
	this.spread_oscilliate = options.spread_oscilliate;
	this.spread_oscilliate_reverse = options.spread_oscilliate_reverse;
	this.spread_oscilliate_reverse_on_complete = options.spread_oscilliate_reverse_on_complete;
	
	
	this.damage = options.damage;
	this.velocity = options.velocity;
	this.parent = GSSEntity_parent;


	this.projectile_body_def = new b2BodyDef();
	this.projectile_body_def.type = b2_dynamicBody;
	this.projectile_body_def.bullet = true;
	//this.projectile_body_def.fixedRotation = this.lock_rotation;
	
	this.projectile_fixture_def = new b2FixtureDef();
	this.projectile_fixture_def.shape = new b2PolygonShape();
	this.projectile_fixture_def.shape.SetAsBoxXY(this.image.width/2/GSS.PTM, this.image.height/2/GSS.PTM);
	this.projectile_fixture_def.density = 1;
	this.projectile_fixture_def.friction = 1;
	this.projectile_fixture_def.restitution = 0; // Bounce yes
	this.projectile_fixture_def.filter.groupIndex = -GSS.faction_data[options.faction_id].category;
	
}

GSSWeapon.prototype = {
	/*
	See: http://stackoverflow.com/questions/12161277/how-to-rotate-a-vertex-around-a-certain-point
	*/
	fire: function() {
		var time_current = Date.now();
		if(this.last_fired == 0 || this.last_fired+this.fire_rate-time_current < 0)
		{
			var parent_body = this.parent.getBody(),
			parent_position = parent_body.GetPosition(),
			parent_angle = parent_body.GetAngle(),
			new_x = (this.x)*Math.cos(parent_angle) - (this.y)*Math.sin(parent_angle),
			new_y = (this.x)*Math.sin(parent_angle) + (this.y)*Math.cos(parent_angle);
			
			if(this.spread_oscilliate && this.projectiles_per_shot > 1)
			{
				GSS.projectiles.push(new GSSProjectile(this.image, this.parent, this.projectile_body_def, this.projectile_fixture_def, 
					{
						angle: parent_angle+this.increment_current*this.increment-this.spread/2, 
						velocity_magnitude: this.velocity, 
						x: new_x+parent_position.x, 
						y: new_y+parent_position.y
					}
				));
				if(this.spread_oscilliate_reverse)
					this.increment_current--;
				else
					this.increment_current++;
					
				if(this.increment_current > this.increment_max)
				{
					if(this.spread_oscilliate_reverse_on_complete)
					{
						this.increment_current = this.increment_max;
						this.spread_oscilliate_reverse = true;
					}
					else
						this.increment_current = 0;
				}
				else if(this.increment_current < 0)
				{
					if(this.spread_oscilliate_reverse_on_complete)
					{
						this.increment_current = 0;
						this.spread_oscilliate_reverse = false;
					}
					else
						this.increment_current = this.increment_max;
				}
			}
			else
			{
				for(var i = 0; i < this.projectiles_per_shot; i++)
				{
					GSS.projectiles.push(new GSSProjectile(this.image, this.parent, this.projectile_body_def, this.projectile_fixture_def, 
						{
							angle: parent_angle+(this.spread_fixed ? this.increment*i-this.spread/2*(this.projectiles_per_shot != 1) : (this.spread*Math.random()-this.spread/2)), 
							velocity_magnitude: this.velocity, 
							x: new_x+parent_position.x, 
							y: new_y+parent_position.y
						}
					));
				}
			}
			
			this.last_fired = time_current;
		}
	}
}

