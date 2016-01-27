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
	
	this.lifetime_end = Date.now()+options.lifetime*Math.random();
	this.mark_for_delete = false;
	
	this.projectile_body_def = body_def;
	this.projectile_body_def.angle = options.angle;
	this.projectile_body_def.position = new b2Vec2(options.x, options.y);
	
	this.projectile_body = GSS.world.CreateBody(this.projectile_body_def);
	this.projectile_body.CreateFixtureFromDef(fixture_def);
	this.projectile_body.GSS_parent = this;
	
	this.velocity = new b2Vec2(-options.velocity_magnitude*Math.cos(options.angle), -options.velocity_magnitude*Math.sin(options.angle));

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
	
	power_cost: 0,
	damage: 1,
	velocity: 10,
	faction_id: -1,
	// Shots Per second
	firerate: 100,
	image_index: 0,
	lifetime: 1000
	
}


function GSSWeapon(GSSEntity_parent, options){
	if(GSSEntity_parent === undefined || GSS.world === undefined)
		return;
		
	options = extend(GSSWeapon.defaults, options);
	
	// Projectile Image

	this.image = GSS.image_data[options.image_index];
	console.log(this.image, options.image_index);
	this.last_fired = 0;
	this.fire_rate = 1000/options.firerate;
	
	// Position relative to parent image
	this.x = options.x/GSS.PTM;
	this.y = options.y/GSS.PTM;
	
	this.power_cost = options.power_cost;
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
		
			GSS.projectiles.push(new GSSProjectile(this.image, this.parent, this.projectile_body_def, this.projectile_fixture_def, 
				{
					angle: parent_angle, 
					velocity_magnitude: this.velocity, 
					x: new_x+parent_position.x, 
					y: new_y+parent_position.y
				}
			));
			
			this.last_fired = time_current;
		}
	}
}

