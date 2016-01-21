GSSWeapon.defaults = {
	// Position relative to GSSEntity parent
	x: 0,
	y: 0,
	
	power_cost: 0,
	damage: 1,
	velocity: 1
	
}

function GSSProjectile(image, GSSEntity_parent, body_def, fixture_def, angle, x, y, velocity) {
	this.image = image;
	this.parent = GSSEntity_parent;
	
	this.projectile_body_def = body_def;
	this.projectile_body_def.angle = angle;
	this.projectile_body_def.position = new b2Vec2(x, y);

	this.projectile_body = GSS.world.CreateBody(this.projectile_body_def);
	this.projectile_body.CreateFixtureFromDef(fixture_def);
	
	this.projectile_body.GSS_parent = this;
	this.velocity = new b2Vec2(-velocity*Math.cos(angle), -velocity*Math.sin(angle));
	GSS.entities.push(this);
	
	
}

GSSProjectile.prototype = {
	update: function(){
		
		this.projectile_body.SetLinearVelocity(this.velocity);
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
	}
}

function GSSWeapon(image, GSSEntity_parent, options){
console.log('position', options);
	console.log(GSSEntity_parent, typeof GSSEntity_parent);
	if(GSSEntity_parent === undefined || GSS.world === undefined)
		return;
		
	options = extend(GSSWeapon.defaults, options);
	
	// Projectile Image

	this.image = image;
	
	// Position relative to parent image
	this.x = options.x/GSS.PTM;
	this.y = options.y/GSS.PTM;
	
	this.power_cost = options.power_cost;
	this.damage = options.damage;
	this.velocity = options.velocity;
	this.parent = GSSEntity_parent;
	console.log(this.parent);
	this.projectile_body_def = new b2BodyDef();
	this.projectile_body_def.type = b2_dynamicBody;
	this.projectile_body_def.bullet = true;
	this.projectile_body_def.angle = options.angle*DEGTORAD;
	//this.projectile_body_def.fixedRotation = this.lock_rotation;
	
	this.projectile_fixture_def = new b2FixtureDef();
	this.projectile_fixture_def.shape = new b2PolygonShape();
	this.projectile_fixture_def.shape.SetAsBoxXY(this.image.width/2/GSS.PTM, this.image.height/2/GSS.PTM);
	this.projectile_fixture_def.density = 1;
	this.projectile_fixture_def.friction = 1;
	this.projectile_fixture_def.restitution = 0; // Bounce yes
}

GSSWeapon.prototype = {
	/*
	See: http://stackoverflow.com/questions/12161277/how-to-rotate-a-vertex-around-a-certain-point
	*/
	fire: function() {
		var _this = this;
		window.setTimeout(function(){
		var parent_body = _this.parent.getBody(),
		parent_position = parent_body.GetPosition(),
		parent_angle = parent_body.GetAngle(),
		new_vel = new b2Vec2(0,0),
		new_x = (_this.x)*Math.cos(parent_angle) - (_this.y)*Math.sin(parent_angle),
		new_y = (_this.x)*Math.sin(parent_angle) + (_this.y)*Math.cos(parent_angle);
		
		console.log(parent_angle * RADTODEG);		
		
		b2Vec2.MulScalar(new_vel, parent_angle, 1)
		new GSSProjectile(_this.image, _this.parent, _this.projectile_body_def, _this.projectile_fixture_def, parent_angle, new_x+parent_position.x, new_y+parent_position.y, 5);
		}, 1000);
	}
}

