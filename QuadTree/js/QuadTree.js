/*
* QuadTree
*
* QuadTree starts from top left corner, fitting Javascript and HTML elements
*/
function QuadTree(width, height, max_levels, max_items, options){
	var has_options = options !== undefined;
	// Must have width, height, max_levels, and max_items
	if(width === undefined || height === undefined || max_levels === undefined || max_items === undefined)
		return;
	
	this.size = {width: width, height: height};
	this.pos = {x: (has_options && options.x !== undefined ? options.x : 0), y: (has_options && options.y !== undefined ? options.y : 0)}; // Origin corner
	this.max_levels = max_levels;
	this.max_items = max_items;
	
	this.children = []; // Contains child QuadTrees
	this.items = []; // Contains all elements put into the QuadTree
	this.level = has_options && options.level !== undefined ? options.level : 0; // Current level of this QuadTree if its a child
	return this;
}

QuadTree.prototype = {
	// Clears the QuadTree of items and children
	clear: function(){
		this.items = [];
		this.children = [];
	},
	// Splits QuadTree into four child QuadTrees
	split: function(){
		// Size of children
		var new_width = this.size.width/2,
		new_height = this.size.height/2;
		
		for(var y = 0; y < 2; y++)
			for(var x = 0; x < 2; x++)
				this.children.push(new QuadTree(new_width, new_height, this.max_levels, this.max_items, {x: this.pos.x+new_width*x, y:this.pos.y+new_height*y, level: this.level+1}));
		
	},
	// Gets the index of the child QuadTree the item fits in
	getIndex: function(target, target_width, target_height, target_x, target_y){
		if(!target)
			return -1;
	
		var index = -1,
		mid_x = this.pos.x+this.size.width/2,
		mid_y = this.pos.y+this.size.height/2,
		fits_top = target_y < mid_y && target_y+target_height < mid_y,
		fits_bottom = target_y > mid_y;
		
		/*
		What was this for?
		if(target_width >= mid_x || target_height >= mid_y)
			return -1;
		*/
		// Checks if the target is 'between' quadtrees
		if((target_x < mid_x && target_x+target_width > mid_x) || (target_y < mid_y && target_y+target_height > mid_y))
		{
			return -1;
		}
		
		// QuadTree children layout
		// 0 1
		// 2 3
		// Left side
		if(target_x < mid_x && target_x+target_width < mid_x)
		{	
			if(fits_top){
				index = 0;
			}
			else if(fits_bottom){
				index = 2;
			}
		}
		// Right side
		else if(target_x > mid_x)
		{
			if(fits_top){
				index = 1;
			}
			else if(fits_bottom){
				index = 3;
			}
		}
		return index;
	},
	// Inserts an item into the QuadTree
	insert: function(target, target_width, target_height, target_x, target_y){
		var index;
		
		// Check if target fits into any child quadtrees if any
		if(this.children.length !== 0){
			index = this.getIndex(target, target_width, target_height, target_x, target_y);
			// If it fits, insert into a child quadtree instead
			if(index != -1){
				this.children[index].insert(target, target_width, target_height, target_x, target_y);
				return;
			}
		}
		
		// Add item to QuadTree items list
		this.items.push({item: target, width: target_width, height:target_height, x: target_x, y: target_y});
		
		// Split this QuadTree and reinsert all items into fitting child QuadTrees
		if(this.items.length > this.max_items && this.level < this.max_levels)
		{
			if(this.children.length === 0)
				this.split();
			
			// See if item fits into any child QuadTrees
			for(var i = 0; i < this.items.length; i++)
			{
				index =  this.getIndex(this.items[i]);
				if(index != -1){
					this.children[index].insert(this.items[i], target_width, target_height, target_x, target_y);
					this.items.splice(i, 1);
					break;
				}
			}
		}
	},
	retrieve: function(result, target, target_width, target_height, target_x, target_y){
		var index = this.getIndex(target, target_width, target_height, target_x, target_y);
		if(index != -1 && this.children[0] !== null){
			this.children[index].retrieve(result, target);
		}
		
		for(var i = 0; i < this.items.length; i++)
		{
			var item = this.items[i];
			if(item.item === target)
			{
				result.push(this.items[i]);
			}
		}
		
		return result;
	},
	drawQuadTree: function(canvas)
	{
		var context = canvas.getContext('2d'),
		canvas = canvas;
		context.beginPath();
		context.lineWidth = 5;
		context.moveTo(this.pos.x, this.pos.y);
		context.lineTo(this.pos.x+this.size.width, this.pos.y);
		context.stroke();
		
		context.moveTo(this.pos.x+this.size.width, this.pos.y);
		context.lineTo(this.pos.x+this.size.width, this.pos.y+this.size.height);
		context.stroke();
		
		context.moveTo(this.pos.x+this.size.width, this.pos.y+this.size.height);
		context.lineTo(this.pos.x, this.pos.y+this.size.height);
		context.stroke();
		
		context.moveTo(this.pos.x, this.pos.y+this.size.height);
		context.lineTo(this.pos.x, this.pos.y);
		context.stroke();
		
		context.closePath();
		
		for(var i = 0; i < this.children.length; i++)
		{
			this.children[i].drawQuadTree(canvas);
		}
	}
};