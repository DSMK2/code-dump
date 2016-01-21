window.angle = 0;
window.angle_z = 0;

// Needs to return a new point
//https://www.siggraph.org/education/materials/HyperGraph/modeling/mod_tran/3drota.htm
function rotatePointAboutAxis(axis, point, angle, offset, overwrite)
{
	//console.log(point);
	
	if(point == undefined)
		return false;
	var
	new_point = {
		x: point.x == undefined ? 0 : point.x,
		y: point.y == undefined ? 0 : point.y, 
		z: point.z == undefined ? 0 : point.z
	}, 
	angle = angle * Math.PI/180, // Convert to radians
	coord_a,
	coord_b,
	new_coord_a, 
	new_coord_b;
	
	// Translate target point to 0,0 origin
	if(offset !== undefined)
	{
		new_point.x-=offset.x;
		new_point.y-=offset.y;
		new_point.z-=offset.z;
	}
	
	// Get coordinates to modify based on axis
	switch(axis)
	{
		case 'x': // y, z
			coord_a = 'y';
			coord_b = 'z';
			break;
		case 'y': // x, z
			coord_a = 'x';
			coord_b = 'z';
			break;
		case 'z': // x, y
			coord_a = 'x';
			coord_b = 'y';
			break;
	}
	
	// Rotate point about origin, get new coordinates
	new_coord_a = new_point[coord_a]*Math.cos(angle) - new_point[coord_b]*Math.sin(angle);
	new_coord_b = new_point[coord_a]*Math.sin(angle) + new_point[coord_b]*Math.cos(angle);
	
	new_point[coord_a] = new_coord_a;
	new_point[coord_b] = new_coord_b;
	
	// Translate target point to "original" position
	if(offset !== undefined)
	{
		new_point.x+=offset.x;
		new_point.y+=offset.y;
		new_point.z+=offset.z;
	}
	
	if(overwrite !== undefined && overwrite)
	{
		point.x = new_point.x;
		point.y = new_point.y;
		point.z = new_point.z;
	}
	
	return new_point;
}

function Branch(name)
{
	this.name = name === undefined ? '' : name;
	this.parent = false;
	this.branches = [];
	this.bent = false;
	this.has_bent = false;
}

Branch.prototype = {
	addBranch: function(new_branch) {
		var branch_copy,
		new_bent_branches = [],
		bent_branch;
		
		// Fork branches for visual clarity when rendered. Branch becomes a bent branch
		if(this.branches.length >= 1 && !this.has_bent)
		{
			for(var i = 0; i < this.branches.length; i++)
			{	
				bent_branch = new Branch();
				bent_branch.parent = this;
				bent_branch.bent = true;
				this.branches[i].parent = bent_branch;
				
				bent_branch.addBranch(this.branches[i])
				new_bent_branches.push(bent_branch);
				
			}
			this.branches = new_bent_branches;
			this.has_bent = true;
		}
		
		if(!this.has_bent)
		{
			this.branches.push(new_branch);
			new_branch.parent = this;
		}
		else
		{
			bent_branch = new Branch();
			bent_branch.bent = true;
			bent_branch.parent = this;
			
			new_branch.parent = bent_branch;
			
			bent_branch.addBranch(new_branch)
			this.branches.push(bent_branch);
			
		}
		
		
		
		return this;
	},
	addBranches: function(new_branches) {
		for(var i = 0; i < new_branches.length; i++)
		{
			this.addBranch(new_branches[i]);
		}
		return this;
	}
}

// See: https://www.khanacademy.org/computing/computer-programming/programming-games-visualizations/programming-3d-shapes/a/creating-3d-shapes
TreeRenderer.defaults = {
	position: {x: 0, y: 0},
	debug: false,
	x_max: 500,
	x_min: -250,
	y_max: 500,
	y_min: -250,
	z_max: 500,
	z_min: -250,
	x_scale: 1,
	y_scale: 1, 
	z_scale: 1,
	x_rotation: 0, 
	y_rotation: 0, 
	z_rotation: 0,
	origin_x: null,
	origin_y: null
}
TreeRenderer.sub_branch = true;

function TreeRenderer(context, branch_bundle, options)
{
	var options = extend(TreeRenderer.defaults, options);

	if(!context || !branch_bundle)
	{
		if(debug)
			console.log('TreeRenderer: context required');
		return;
	}
	
	this.context = context;
	this.branch_bundle = branch_bundle; // Raw branches
	//{x: 0, y: 0, z: 0}
	this.tree = {};
	
	this.origin_x = options.origin_x === null ? this.context.canvas.width/2 : options.origin_x;
	this.origin_y = options.origin_y === null ? this.context.canvas.height/2 : options.origin_y;
	
	this.x_max = options.x_max;
	this.x_min = options.x_min;
	this.y_max = options.y_max;
	this.y_min = options.y_min;
	this.z_max = options.z_max;
	this.z_min = options.z_min;
	
	this.x_scale = options.x_scale;
	this.y_scale = options.y_scale;
	this.z_scale = options.z_scale;
	
	this.x_rotation = options.x_rotation;
	this.y_rotaiton = options.y_rotation;
	this.z_rotation = options.z_rotation;
	
	this.generatePoints(this.branch_bundle, 0, 150);
	for(var i = 0; i < this.tree.branches.length; i++)
	{
		//this.shapeTree(this.tree.branches[i], this.tree.branches[i]);
	}
}

TreeRenderer.prototype = {
	init: function(){
		var x, y, z, temp, target_index;
		
		return this;
	},
	/**
	* Generate points.
	* Functions as thus: point - spacer - point - spacer
	*/
	generatePoints: function(current_branch_bundle, level, distance, current_tree_branch, sub_branch) {
		var current_branch = current_branch_bundle,
		child_branches = current_branch.branches,
		current_tree_branch = current_tree_branch,
		angle_increment = 360/child_branches.length,
		sub_branch = sub_branch === undefined ? false : sub_branch,
		x = level == 0 ? this.origin_x : current_tree_branch.x,
		y = level == 0 ? this.origin_y : current_tree_branch.y,
		temp_point;
		
		angle_increment = child_branches.length === 1 ? 0  : angle_increment;
	
		if(current_tree_branch === undefined)
		{
			current_tree_branch = {text: current_branch.name, x: x, y: y, z: 0, level: level, branches:[], dir: 0};
			this.tree = current_tree_branch;
		}
		
		if(child_branches.length !== 0)
		{
			level+=1;
			for(var b = 0; b < child_branches.length; b++)
			{
				var new_branch = {
					text: child_branches[b].name,
					x: x+distance*Math.cos((angle_increment)*Math.PI/180*(child_branches.length !== 1 ? b : 1)), //(angle_increment-(Math.random()*angle_increment/4-angle_increment/8))*(Math.PI/180)*b),
					y: y+distance*Math.sin((angle_increment)*Math.PI/180*(child_branches.length !== 1 ? b : 1)), //(angle_increment-(Math.random()*angle_increment/4-angle_increment/8))*(Math.PI/180)*b),
					z: current_tree_branch.z,
					level: level,
					branches: [],
					dir: angle_increment*b,
					branch_obj: child_branches[b] // Lets make this relative to the parent point (z-axis)
				};
				
				//if(level > 1)
				//console.log(child_branches.length, (child_branches.length <= 1 ? 0 : angle_increment));
					rotatePointAboutAxis('y', new_branch,  child_branches.length == 1 ? 0 : 90, current_tree_branch, true);

				if(level-1 > 1)
					rotatePointAboutAxis('x', new_branch,  child_branches.length == 1 ? 0 : angle_increment+90, current_tree_branch, true);
				
				current_tree_branch.branches.push(new_branch);
				this.generatePoints(child_branches[b], level, distance*0.8, new_branch, !sub_branch);
			}
		}
		else
			return;
			
		//TreeRenderer.sub_branch = !TreeRenderer.sub_branch;
	},
	shapeTree: function(tree) {
		// Gather all points from a given point, not including the given point
		var branches = [];
		
		if(tree.branches.length === 0)
			return;
		
		 for(var b = 0; b < tree.branches.length; b++)
		 {
		 	this.shapeTreeHelper(tree.branches[b], branches);
		 }
		 
		 for(var b = 0; b < branches.length; b++)
		 {
		 	var target_branch = branches[b];
		 	rotatePointAboutAxis('x', target_branch, 90, tree, true);
		 	rotatePointAboutAxis('z', target_branch, tree.dir+90, tree, true);
		 }
		
	},
	shapeTreeHelper: function(tree, branches)
	{
		branches.push(tree);
	
		if(tree.branches.length === 0)
			return;
			
		for(var b = 0; b < tree.branches.length; b++)
		{
			this.shapeTreeHelper(tree.branches[b], branches);
		}
	},
	rotate: function(angle)
	{
		window.angle = angle;
		this.redraw();
	},
	redraw: function(){
		this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
		
		this.context.beginPath();
		
		if(this.tree.branches.length !== 0)
		{
			this.context.beginPath();
			this.context.arc(this.tree.x, this.tree.y, 30, 0, 360*Math.PI/180);
			this.context.fillText(this.tree.text+' '+this.tree.dir,this.tree.x, this.tree.y);
			this.context.stroke();
			this.context.closePath();
			for(var b = 0; b < this.tree.branches.length; b++)
			{
				var 
				target_point = this.tree.branches[b],
				child_point = rotatePointAboutAxis('y', target_point, window.angle, {x: this.context.canvas.width/2, y: this.context.canvas.height/2, z: 0});
				//child_point = rotatePointAboutAxis('z', child_point, window.angle_z, {x: this.context.canvas.width/2, y: this.context.canvas.height/2, z: 0});
				
				for(var prop in target_point)
				{
					if(target_point.hasOwnProperty(prop) && !child_point.hasOwnProperty(prop))
					{
						child_point[prop] = target_point[prop];
					}
				}
				
				//child_point = rotatePointAboutAxis('z', this.points.points[b], angle, {x: this.context.canvas.width/2, y: this.context.canvas.height/2, z: 0});
				this.context.beginPath();
				this.context.moveTo(this.tree.x, this.tree.y);
				this.context.lineTo(child_point.x, child_point.y);
				this.context.stroke();
				this.context.fillStyle = '#ffffff';
				this.context.fill();
				this.context.closePath();

				this.redrawTree(child_point)
			}
		}
		
		window.angle+=1;
		window.angle >= 360 ? 0 : window.angle;
		
		//window.angle_z+=1;
		//window.angle_z >= 360 ? 0 : window.angle_z;
		
		/*
		var triangle;
		
		this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
		
		for(var i = 0; i < this.triangles_modified.length; i++)
		{
			triangle = this.triangles_modified[i];
			this.context.beginPath();
			this.context.moveTo(triangle[0].x, triangle[0].y)
			for(var p = 1; p < triangle.length; p++)
			{
				this.context.lineTo(triangle[p].x, triangle[p].y);
			}
			this.context.lineTo(triangle[0].x, triangle[0].y)
			this.context.stroke();
			this.context.fillStyle = '#ffffff';
			this.context.fill();
			this.context.closePath();
		}
		*/
	},
	redrawTree: function(point) {
		this.context.beginPath();
		if(!point.branch_obj.bent) this.context.arc(point.x, point.y, 10, 0, 360*Math.PI/180);
		this.context.fillText(point.text+' '+point.level, point.x, point.y);
		this.context.stroke();
		this.context.closePath();

		if(point.branches.length === 0)
			return;
			
		for(var b = 0; b < point.branches.length; b++)
		{
			var 
			target_point = point.branches[b],
			child_point = rotatePointAboutAxis('y', target_point, window.angle, {x: this.context.canvas.width/2, y: this.context.canvas.height/2, z: 0});
			//child_point = rotatePointAboutAxis('z', child_point, window.angle_z, {x: this.context.canvas.width/2, y: this.context.canvas.height/2, z: 0});
			//child_point = rotatePointAboutAxis('z', point.points[b], angle, {x: this.context.canvas.width/2, y: this.context.canvas.height/2, z: 0});
			
			for(var prop in target_point)
			{
				if(target_point.hasOwnProperty(prop) && !child_point.hasOwnProperty(prop))
				{
					child_point[prop] = target_point[prop];
				}
			}
			
			this.context.beginPath();
			this.context.moveTo(point.x, point.y);
			this.context.lineTo(child_point.x, child_point.y);
			this.context.stroke();
			this.context.fillStyle = '#ffffff';
			this.context.fill();
			this.context.closePath();

			this.redrawTree(child_point)
		}
	}
	/**
	* @param x - rotate x degrees
	* @param y - rotate y degrees
	* @param z - rotate z degrees
	*/
	/*
	rotate: function(x, y, z)
	{
		var
		degToRad = Math.PI/180,
		cos = Math.cos(x*degToRad),
		sin = Math.sin(x*degToRad),
		triangle,
		point,
		a_point_x,
		a_point_y,
		x,
		y,
		z,
		offset_x = this.context.canvas.width/2,
		offset_y = this.context.canvas.height/2;
		
		for(var i = 0; i < this.triangles.length; i++)
		{
			triangle = this.triangles[i],
			triangle_new = [];
			for(var p = 0; p < triangle.length; p++)
			{
				point = triangle[p];
				a_point_x = point.x - offset_x;
				a_point_y = point.y - offset_y;
				//console.log(this.context.canvas.width);
				x = (a_point_x * cos - a_point_y * sin) + offset_x;
				y = (a_point_y * cos + a_point_x * sin) + offset_y;
				z = point.z;
				
				triangle_new.push({x, y, z});
				//console.log('angle', cos, sin, point.x, point.y, point.z, 'new', x, y, z);
			}
			this.triangles_modified[i] = triangle_new;
		}
	}
	*/
};