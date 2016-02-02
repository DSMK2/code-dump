/*
* Intended to come and go, GSSEffect objects aren't supposed to persist
*/

GSSEffect.id = 0;
GSSEffect.defaults = {
	image_id: 0,
	image_frames: 0,
	image_frame_rate: 0.5,
	animate_with_lifetime : false,
	x: 0, 
	y: 0,
	lifetime: 1000	
};

function GSSEffect(options){
	extend(GSSEffect.defaults, options);
	
	this.mark_for_delete = false;
	
	this.mesh_data = GSS.image_data[options.image_id];
	this.image_frames = options.image_frames;
	this.image_frame_current = 0;
	if(options.animate_with_lifetime)
		this.image_frame_rate = 1000/this.image_frames;
	else
		this.image_frame_rate = options.image_frame_rate;
	this.time_to_next_frame = Date.now()+this.image_frame_rate;
	this.lifetime = Date.now()+options.lifetime;
	
	// BEGIN: THREE.js 
	this.mesh_plane = new THREE.Mesh(new THREE.PlaneGeometry(this.mesh_data.width/this.image_frames, this.mesh_data.height), this.mesh_data.material);
	this.mesh_plane.position.x = options.x;
	this.mesh_plane.position.y = options.y;
	GSS.scene.add(this.mesh_plane);
	// END: THREE.js
}

GSSEffect.prototype = {
	update: function(){
		if(this.mark_for_delete)
			return;
			
		var current_date = Date.now();
		if(current_date >= this.time_to_next_frame)
		{
			this.time_to_next_frame = current_date+this.image_frame_rate;
			this.image_frame_current++;
		}
		
		if(current_date >= this.lifetime)
			this.destroy();
	},
	destroy: function(){
		if(this.mark_for_delete)
			return;
		
		GSS.scene.remove(this.mesh_plane);
		
		this.mark_for_delete = true;
	}
}