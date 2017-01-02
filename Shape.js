function distance3d(point_a, point_b)
{
	return Math.sqrt(Math.pow(point_a.x-point_b.x, 2)+Math.pow(point_a.y-point_b.y, 2)+Math.pow(point_a.z-point_b.z, 2));
}

function matrixMultiplication(multiplicand, multiplier) {
	var result = [];
	var row = [];
	var sum = 0;
	var x1 = 0;
	var y1 = 0;
	var x2 = 0;
	var y2 = 0;
	var y3 = 0;
	
	if(typeof multiplicand === 'undefined' || typeof multiplier === 'undefined')
		return;
	
	if(multiplicand[y1].length !== multiplier.length) {
		console.log('skipped', multiplicand, multiplier);
		return;
	}
	
	for(y1 = 0; y1 < multiplicand.length; y1++) {
		result.push([]);
	}
	y1 = 0;
	
	for(y1 = 0; y1 < multiplicand.length; y1++) {
		
		for(x2 = 0; x2 < multiplier[y2].length; x2++) {
			sum = 0;
			for(x1 = 0; x1 < multiplicand[y1].length; x1++) {
				sum += multiplicand[y1][x1]*multiplier[x1][x2];
			
			}
			
			result[y3].push(sum);
		}
		
		y3++;
	}
	
	return result;
}

function createTransformationMatrix(options) {
	var defaults = {
		scale: {x: 1, y: 1, z: 1},
		rotation: {x:0, y: 0, z: 0},
		translation: {x:0, y: 0, z: 0}
	}
	var transformationMatrix;
	if(typeof options !== 'undefined')
	{
		(function(){
			var result = {};
			var defaultsProp;
			
			for(defaultsProp in defaults) {
			
				if(options.hasOwnProperty(defaultsProp))
					result[defaultsProp] = options[defaultsProp];
				else
					result[defaultsProp] = defaults[defaultsProp];
				
			}
			
			options = result;
		}());
	} else
		options = defaults;
	
	// Build rotation matrix
	var radiansX = options.rotation.x * Math.PI / 180;
	var radiansY = options.rotation.y * Math.PI / 180;
	var radiansZ = options.rotation.z * Math.PI / 180;
	var rotationMatrixX = [
		[1, 0, 0, 0],
		[0, Math.cos(radiansX), -Math.sin(radiansX), 0],
		[0, Math.sin(radiansX), Math.cos(radiansX), 0],
		[0, 0, 0, 1]
	];
	var rotationMatrixY = [
		[Math.cos(radiansY), 0, Math.sin(radiansY), 0],
		[0, 1, 0, 0],
		[-Math.sin(radiansY), 0, Math.cos(radiansY), 0],
		[0, 0, 0, 1]
	];
	var rotatationMatrixZ = [
		[Math.cos(radiansZ), -Math.sin(radiansZ), 0, 0],
		[Math.sin(radiansZ), Math.cos(radiansZ), 0, 0],
		[0, 0, 1, 0],
		[0, 0, 0, 1]
	];
	var rotationMatrix = matrixMultiplication(matrixMultiplication(rotatationMatrixZ, rotationMatrixY), rotationMatrixX);
	
	// Scale Matrix
	var scaleMatrix = [
		[options.scale.x, 0, 0, 0],
		[0, options.scale.y, 0, 0],
		[0, 0, options.scale.z, 0],
		[0, 0, 0, 1]
	];
	
	// Translation Matrix
	var translationMatrix = [
		[1, 0, 0, 0],
		[0, 1, 0, 0],
		[0, 0, 1, 0],
		[options.translation.x, options.translation.y, options.translation.z, 1]
	];
	
	// Build Transformation Matrix
	// scale * rotation * translate
	transformationMatrix = matrixMultiplication(scaleMatrix, rotationMatrix);
	transformationMatrix = matrixMultiplication(transformationMatrix, translationMatrix);
	return transformationMatrix;
}

// Finds the nearest point from a given point
function getNearestPointAtIndex(point, points)
{
	var 
	distance_prev,
	distance = 0,
	nearest,
	point_current,
	i = 0; 
	
	if(points === undefined || points === undefined)
		return -1;
	
	for(i = 0; i < points.length; i++)
	{
		point_current = points[i];
		distance = distance3d(point, point_current);
		if(distance === 0)
			continue;
		else{
			if(nearest === undefined)
			{
				nearest = i;
				distance_prev = distance;
			}
			else if(distance < distance_prev)
			{
				nearest = i;
				distance_prev = distance;
			}
		}
	}
	
	return nearest;
}

// Needs to return a new point
// This does euler angle rotation; meaning rotation will be local to the shape
// i.e. rotating x axis will rotate the y axis
//https://www.siggraph.org/education/materials/HyperGraph/modeling/mod_tran/3drota.htm
function rotatePointAboutAxis(axis, point, angle, offset, overwrite)
{
	//console.log(point);
	
	if(point === undefined)
		return false;
	var
	new_point = {
		x: point.x === undefined ? 0 : point.x,
		y: point.y === undefined ? 0 : point.y, 
		z: point.z === undefined ? 0 : point.z
	}, 
	coord_a,
	coord_b,
	new_coord_a, 
	new_coord_b;
	
	angle = angle * Math.PI/180; // Convert to radians
	
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
	
	// Instead of returning new point, replace old point coordinates
	if(overwrite !== undefined && overwrite)
	{
		point.x = new_point.x;
		point.y = new_point.y;
		point.z = new_point.z;
	}
	
	return new_point;
}

// Lets make a native javascript text height getter!
function getTextHeight(font, size, text)
{
	var span,
	height;
	
	text = text === undefined ? 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVQXYZ1234567890[]()*&^%$#@!~_+{}|:"<>?,./;\'[]\\=-`': text;
	
	span = document.createElement('span');
	
	span.style.fontFamily = font;
	span.style.fontSize = size;
	span.style.whiteSpace = 'nowrap';
	span.style.visibility = 'hidden';
	span.style.opacity = 0;
	span.style.position = 'fixed';
	span.style.top = 0;
	span.style.left = 0;
	span.style.border = 0;
	span.style.margin = 0;
	span.style.padding = 0;
	span.style.boxSizing = 'border-box';
	
	span.innerHTML = text;
	// Add element to body so that it takes "space"
	document.body.appendChild(span);
	height = span.offsetHeight;
	span.remove();
	
	return height;
}


function Branch(name)
{
	this.name = name === undefined ? '' : name;
	this.parent = false;
	this.branches = [];
	this.size = 1; // Sizes start at one, counting itself
	return this;
}

Branch.prototype = {
	addBranch: function(new_branch) {
		new_branch.parent = this;
		this.branches.push(new_branch);

		//this.size++;
		this.size+=new_branch.size;			
		return this;
	},
	addBranches: function(new_branches) {
		for(var i = 0; i < new_branches.length; i++)
		{
			this.addBranch(new_branches[i]);
		}

		return this;
	},
	/**
	* @description Recursive function that updates the size of each parent 
	*/
	updateParentWithSize: function(size)
	{	
		if(this.parent !== false)
		{
			this.parent+=1;
			this.parent.updateParentWithSize(1);
		}
	},
	getAllBranches(includeThis)
	{
		var branches = [];
		
		function getAllBranchesHelper(target_branch, branches){
			var b = 0,
			branch;
			
			if(target_branch.branches.length === 0)
				return branches;
			
			for(b = 0; b < target_branch.branches.length; b++)
			{
				branch = target_branch.branches[b];
				branches.push(branch);
				getAllBranchesHelper(branch, branches);
			}
			
			return branches;
		}
		
		if(typeof includeThis !== 'undefined' && includeThis)
			branches.push(this);
		
		getAllBranchesHelper(this, branches);
		
		return branches;
	}
};
// See: http://stackoverflow.com/questions/9600801/evenly-distributing-n-points-on-a-sphere sorta useless because it spits nothing but longitude / latitude, without radius
function SphereRenderer(canvas, branch, options) {	
	var n = 100;
	var	inc = Math.PI*(3-Math.sqrt(5));
	var	step = 2/n;
	var	phi = 0;
	var	y = 0;
	var	r = 0;
	var	i = 0;
	var	radius;
	var	branch_points;
	// Point selection and effects
	var	selected_point;
	var pointMatrix;
	
	this.points = [];
	this.canvas = canvas;
	this.context = canvas.getContext('2d');
	this.rotate_x = 0;
	this.rotate_y = 0;
	this.rotate_z = 0;
	this.rate_x = 1;
	this.rate_y = 1;
	this.rate_z = 1;
	this.branch = branch;
	this.radius = 300; // Scale in this case
	this.update_timer = false;
	this.position = {x: this.context.canvas.width/2, y: this.context.canvas.height/2};
	this.newPosition = undefined;
	this.autoRotate = true;
	this.rotationMatrix;
	
	function assignPointsToChildren(branch, points){
		var branch_child,
		index;
		
		for(var i2 = 0; i2 < branch.branches.length; i2++)
		{
			branch_child = branch.branches[i2];
			index = getNearestPointAtIndex(branch.point, points);
			if(index != -1)
			{
				branch_child.point = points[index];
				branch_child.point_current = {x: branch_child.point.x, y: branch_child.point.y, z: branch_child.point.z};
				points.splice(index, 1);
			}
			assignPointsToChildren(branch_child, points);
		}
	}
	
	radius = this.radius;
	step = 2/(this.branch.size-1);
	var test = {}
	// Generate points
	for(i = 0; i < this.branch.size-1; i++)
	{
		y = i * step - 1 + (step /2);
		r = Math.sqrt(1 - y * y);
		phi = i * inc;	
		test = {x: Math.cos(phi)*r, y: y, z: Math.sin(phi)*r};
		
		pointMatrix = [
			[test.x, test.y, test.z, 1]
		];

		pointMatrix = matrixMultiplication(
			pointMatrix, 
			createTransformationMatrix({
				rotation: {x: 0, y: 0, z: 0},
				scale: {x: this.radius, y: this.radius, z: this.radius},
				translation: {x: this.position.x, y: this.position.y, z: 0}
			})
		)
		
		this.points.push({x:  pointMatrix[0][0], y:  pointMatrix[0][1], z:  pointMatrix[0][2]});
	}
	
	branch_points = this.points.slice(0);
	
	// Assign points to each branch
	for(i = 0; i < this.branch.branches.length; i++)
	{
		branch = this.branch.branches[i];
		
		// Use first point
		if(i === 0)
			branch.point = branch_points.shift();
		// Use later points for "space"
		else
			branch.point = branch_points.splice(branch.size-1, 1)[0];
		
		branch.point_current = {x: branch.point.x, y: branch.point.y, z: branch.point.z};
		
		assignPointsToChildren(branch, branch_points);	
	}
	
	this.branch.point = {x: this.context.canvas.width/2, y: this.context.canvas.height/2, z: 0};
	this.branch.point_current = {x: this.context.canvas.width/2, y: this.context.canvas.height/2, z: 0};
	
	this.update();
	this.redraw();
	
	return this;
}

SphereRenderer.prototype = {
	start: function() {
		var _this = this;
		this.updateTimer = window.setInterval(function(){
			_this.update();
		}, 1/60);
		
		window.requestAnimationFrame(function(){
			_this.redraw();
		});
	},
	stop: function() {
		window.clearInterval(this.updateTimer);
	},
	setRotationRate: function(options) {
		var defaults = {
			x: this.rate_x,
			y: this.rate_y,
			z: this.rate_z
		}
		options = extend(defaults, options);
		
		this.rate_x = options.x;
		this.rate_y = options.y;
		this.rate_z = options.z;
		
		console.log(this.rate_x, this.rate_y, this.rate_z);
	},
	rotate: function (x, y, z) {
		//console.log(x, y, z);
		this.rotate_x += x; 
		this.rotate_y += y;
		this.rotate_z += z;

		this.rotate_x = this.rotate_x >= 360 ? this.rotate_x - 360 : (this.rotate_x < 0 ? this.rotate_x + 360 : this.rotate_x);
		this.rotate_y = this.rotate_y >= 360 ? this.rotate_y - 360 : (this.rotate_y < 0 ? this.rotate_y + 360 : this.rotate_y);
		this.rotate_z = this.rotate_z >= 360 ? this.rotate_z - 360 : (this.rotate_z < 0 ? this.rotate_z + 360 : this.rotate_z);
	},
	setPosition: function(x, y) {
		this.newPosition = {x: x, y: y};
	},
	update: function(){
		var branches = this.branch.getAllBranches(true);
		var b = 0;
		var branch_current;
		var point;
		var pointMatrix;
		var pointRotateMatrix;
		
		if(this.autoRotate)
			this.rotate(this.rate_x/60, this.rate_y/60, this.rate_z/60);

		for(b = 0; b < branches.length; b++)
		{
			branch_current = branches[b];
			point = branch_current.point;
			//point = {x: point.x, y: point.y, z: point.z};
			// Rotate points from STARTING position
			// Destination point
			// It will not join points at once
			/*
			point = rotatePointAboutAxis('x', point, this.rotate_x, {x: 0, y: 0, z: 0}, false);
			point = rotatePointAboutAxis('y', point, this.rotate_y, {x: 0, y: 0, z: 0}, false);
			point = rotatePointAboutAxis('z', point, this.rotate_z, {x: 0, y: 0, z: 0}, false);
			*/
			pointMatrix = [
				[point.x,
				point.y,
				point.z, 1]
			];
			
			pointRotateMatrix = matrixMultiplication(
				pointMatrix, 
				createTransformationMatrix({
					translation: {
						x: -this.position.x, 
						y: -this.position.y,
						z: 0
					}
				})
			);
			
			pointRotateMatrix = matrixMultiplication(
				pointRotateMatrix, 
				createTransformationMatrix({
					rotation: {
						x: this.rotate_x, 
						y: this.rotate_y,
						z: this.rotate_z
					},
					translation: {
						x: typeof this.newPosition !== 'undefined' && typeof this.newPosition.x !== 'undefined' ? this.newPosition.x : this.position.x, 
						y: typeof this.newPosition !== 'undefined' &&  typeof this.newPosition.y !== 'undefined' ? this.newPosition.y : this.position.y,
						z: 0
					}
				})
			);
			
			
			
			point.x = pointRotateMatrix[0][0];
			point.y = pointRotateMatrix[0][1];
			point.z = pointRotateMatrix[0][2];
			
			//console.log(pointRotateMatrix);
			//point = {x: pointRotateMatrix[0][0], y: pointRotateMatrix[0][1], z: pointRotateMatrix[0][2]};
			
			// Scale points outwards by radius
			/*
			point.x *= this.radius;
			point.y *= this.radius;
			point.z *= this.radius;
			*/
			// Offset based on canvas center
			//point.x += this.context.canvas.width/2;
			//point.y += this.context.canvas.height/2;
			
			branch_current.point_current = point;
		} 
		
		this.rotate_x = 0;
		this.rotate_y = 0;
		this.rotate_z = 0;
		
		if(typeof this.newPosition !== 'undefined' && typeof this.newPosition.x !== 'undefined' && typeof this.newPosition.y !== 'undefined') {
			this.position.x = this.newPosition.x;
			this.position.y = this.newPosition.y;			
			this.newPosition = undefined;
		}
		
	},
	redraw: function(){
		var context = this.context;
		var i = 0;
		var _this = this;
		var text = [];
		
		context.clearRect(0, 0, context.canvas.width, context.canvas.height);
		
		this.context.canvas.width = this.canvas.clientWidth;
		this.context.canvas.height = this.canvas.clientHeight;
		
		// Draw center point
		context.beginPath();
		context.arc(this.context.canvas.width/2, this.context.canvas.height/2, 20, 0, 2*Math.PI);
		this.context.fillStyle = 'rgb(100, 100, 100)';
		this.context.fill();
		context.closePath();
		
		// Draw points and branches, collect text to draw as it does so
		for(i = 0; i < this.branch.branches.length; i++)
		{
			text = text.concat(this.redrawHelper(this.branch.branches[i], this.branch));
		}
		
		// Draw collected text afterwards
		for(i = 0; i < text.length; i++)
		{
			context.font = text[i].font;
			context.textBaseline = 'middle';
			context.fillStyle = text[i].fillStyle;
			context.fillText(text[i].text, text[i].x, text[i].y);
		}
		
		window.requestAnimationFrame(function(){
			_this.redraw();
		});
	},
	// Recursively iterate over each branch in the "tree", also, collect text that should be displayed in foreground
	redrawHelper: function(branch, prev_branch, text_to_draw)
	{
		var context = this.context;
		var point_to = branch.point_current;
		var point_from = prev_branch.point_current;
		var i;
		var scale;
		var scale_prev;
		var gradient;
		
		text_to_draw = text_to_draw === undefined ? [] : text_to_draw;

		scale = point_to.z <= 0 ? 0 : Math.abs(point_to.z)/this.radius;
		scale_prev = point_from.z <= 0 ? 0 : Math.abs(point_from.z)/this.radius;
				
		// Draw line
		context.beginPath();
		gradient = context.createLinearGradient(point_from.x, point_from.y, point_to.x, point_to.y);
		gradient.addColorStop(0, 'rgba(100, 100, 100,'+ (1-0.9*scale_prev)+')');
		gradient.addColorStop(1, 'rgba(100, 100, 100,'+ (1-0.9*scale)+')');
		context.moveTo(point_from.x, point_from.y);
		context.lineTo(point_to.x, point_to.y);
		this.context.strokeStyle = gradient;
		this.context.stroke();
		context.closePath();
		
		// Draw circle
		context.beginPath();
		context.arc(point_to.x, point_to.y, (10-8*scale), 0, 2*Math.PI);
		this.context.strokeStyle = 'rgba(100, 100, 100,'+(1-0.9*scale)+')';
		this.context.stroke();
		this.context.fillStyle = 'rgba(100, 100, 100,'+(1-0.9*scale)+')';
		this.context.fill();
		context.closePath();
		
		
		if(Math.round(point_to.z) > 0)
		{
			context.font = 20-10*scale+'px monospace';
			context.textBaseline = 'middle';
			context.fillStyle = 'rgba(40, 40, 40, '+(1-0.9*scale)+')';
			context.fillText(branch.name, point_to.x+20-10*scale, point_to.y);		
		}
		else
		{
			text_to_draw.push({font: 20-10*scale+'px monospace', fillStyle: 'rgba(40, 40, 40, '+(1-0.9*scale)+')', text: branch.name, x: point_to.x+20-10*scale, y: point_to.y});
		}
		
		if(branch.branches.length === 0)
			return text_to_draw;

		for(i = 0; i < branch.branches.length; i++)
		{
			this.redrawHelper(branch.branches[i], branch, text_to_draw);
		}
		
		return text_to_draw;
	},
	// Returns rotated and offseted points
	getCurrentBranches: function(options){
		var branches = [];
		var branch_results = [];
		// Yes, yes they're undefined but I wanna keep track of values
		var defaults = {
			minX: undefined,
			maxX: undefined,
			
			minY: undefined,
			maxY: undefined,
			
			minZ: undefined,
			maxZ: undefined
		};
		var branche;
		var point;
		var b = 0;
		var pass_x = true;
		var pass_y = true;
		var pass_z = true;
		var pointMatrix;
		//console.log(options);
		options = extend(defaults, options);
		
		branches = this.branch.getAllBranches(true);
		
		for(b = 0; b < branches.length; b++)
		{
			branch = branches[b];
			point = {x: branch.point.x, y: branch.point.y, z: branch.point.z};
			
			/*
			point = rotatePointAboutAxis('x', point, this.rotate_x, {x: 0, y: 0, z: 0}, false);
			point = rotatePointAboutAxis('y', point, this.rotate_y, {x: 0, y: 0, z: 0}, false);
			point = rotatePointAboutAxis('z', point, this.rotate_z, {x: 0, y: 0, z: 0}, false);
			
			// Scale points outwards by radius
			point.x *= this.radius;
			point.y *= this.radius;
			point.z *= this.radius;
			
			// Offset based on canvas center
			point.x += this.context.canvas.width/2;
			point.y += this.context.canvas.height/2;
			*/
			
			pointMatrix = [
				[point.x, point.y, point.z, 1]
			];
			
			pointMatrix = matrixMultiplication(
				pointMatrix, 
				createTransformationMatrix({
					rotation: {x: 0, y: 0, z: 0},
					scale: {x: this.radius, y: this.radius, z: this.radius},
					translate: {x: this.context.canvas.width/2, y: this.context.canvas.height/2, z: 0}
				})
			)
			
			point.x = pointMatrix[0][0];
			point.y = pointMatrix[0][1];
			point.z = pointMatrix[0][2];
			
			pass_x =  (typeof options.minX !== 'undefined' ? !(point.x < options.minX) : true) && (typeof options.maxX !== 'undefined' ? !(point.x > options.maxX) : true);
			pass_y =  (typeof options.minY !== 'undefined' ? !(point.y < options.minY) : true) && (typeof options.maxY !== 'undefined' ? !(point.y > options.maxY) : true);
			pass_z =  (typeof options.minZ !== 'undefined' ? !(point.z < options.minZ) : true) && (typeof options.maxZ !== 'undefined' ? !(point.z > options.maxZ) : true);
			
			if(pass_x && pass_y && pass_z)
				branch_results.push({branch: branch, point: point});
		}
		
		return branch_results;
	},
	// TODO: This looks like a very expensive operation
	// Gets the current points without z position and returns the nearest point to the given x/y coordinates
	
	getNearestPointAtCoordinates: function(x, y, options) {
		var branch_points = this.getCurrentBranches({maxZ: 0});
		var branch_points_sorted;

		if(branch_points.length === 0)
			return;
		
		branch_points_sorted = branch_points.sort(function(a, b) {
			a.point.z = 0;
			b.point.z = 0;
		
			var 
			distance_a = distance3d(a.point, {x: x, y: y, z: 0}),
			distance_b = distance3d(b.point, {x: x, y: y, z: 0});
			
			if(distance_a < distance_b)
				return -1;
			else if(distance_a > distance_b)
				return 1;
			else
				return 0;
		});
		
		return branch_points_sorted[0];
		
	}
};