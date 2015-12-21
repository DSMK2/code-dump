/**
*	Goal: To create a self standing quadtree which stores objects
*/
function QuadTree(x, y, width, height, max_levels, max_items, level){

	// width, height, max_levels, max_children all required values
	if(x === undefined || y === undefined || width === undefined || height === undefined || max_levels === undefined || max_items === undefined)
		return;

	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
	this.max_levels = max_levels;
	this.max_items = max_items; // Max items before split, not absolute max items
	this.level = level === undefined ? this.max_levels : level;
	
	this.children = [];
	this.items = [];
}

/** 
* Get QuadTree and its children (for debug purposes)
*/
QuadTree.getQuadTrees = function(QuadTree, QuadTrees) {
	var results = QuadTrees === undefined ? [] : QuadTrees;
	
	// Must have a QuadTree to work
	if(QuadTree === undefined)
		return;
		
	results.push(QuadTree);
	
	// Add child QuadTrees
	if(QuadTree.children.length !== 0)
	{
		for(var i = 0; i < QuadTree.children.length; i++)
		{
			QuadTree.getQuadTress(QuadTree.children[i], results);
		}
	}
	
	return results;
	
};

QuadTree.prototype = {
	/**
	* Deference everything.
	*/
	clear: function(){
		this.items = [];
		this.children = [];
	},
	/**
	* "Splits" a QuadTree into four child QuadTrees and redistributes items into each
	*/
	split : function(){
	
		// Do not try splitting if child QuadTrees were already created
		// Or if it's at level 0
		if(this.children.length == 4 || this.level === 0)
			return;
	
		var new_width = this.width/2,
		new_height = this.height/2,
		items = this.items; // Save items for re-insertion
		
		this.children.push(new QuadTree(this.x, this.y, new_width, new_height, this.level - 1)); // Top left
		this.children.push(new QuadTree(this.x+new_width, this.y, new_width, new_height, this.level - 1)); // Top right
		this.children.push(new QuadTree(this.x, this.y+new_height, new_width, new_height, this.level - 1)); // Bottom left
		this.children.push(new QuadTree(this.x+new_width, this.y+new_height, new_width, new_height, this.level - 1)); // Bottom right
		
		// clear this QuadTree's items
		this.items = [];
		
		// Re-insert everything
		for(var i = 0; i < items.length; i++)
		{
			var item = items[i];
			this.insert(item.item, item.x, item.y, item.width, item.height);
		}
	},
	/**
	* Inserts an item into the QuadTree
	*/
	insert: function(item, x, y, width, height) {
		var index = this.getIndex(x, y, width, height);

		// Prepare to split if max_items is reached, but only if the item can fit into any of its children
		if(this.items.length+1 > this.max_items && index != -1 && this.level !== 0)
		{	
			// Split if not split already, insert into target child QuadTree
			if(this.children === 0)
			{
				this.split();
				this.children[index].insert(item, x, y, width, height);
			}
			// Insert into target child Quadtree
			else 
				this.children[index].insert(item, x, y, width, height);
		}
		else
			this.items.push({item: item, x: x, y: y, width: width, height: height});
	},
	/**
	* Returns possible items that will collide with the target item
	*/
	retrieve: function(x, y, width, height, items){
		var index = this.getIndex(x, y, width, height),
		results = items === undefined ? [] : items;
		
		for(var i = 0; i < this.items.length; i++)
		{
			results.push(this.items[i]);
		}
		
		if(index != -1 && this.children.length !== 0)
			return this.children[index].retrieve(x, y, width, height, results);
			
		return results;
	},
	/**
	* Determines quad fit, width and height is from center
	* x-width/2, y-height/2
	*/
	getIndex: function(x, y, width, height) {
		var index = -1,
		half_width = this.width/2,
		half_height = this.height/2,
		offset_width = x-width/2,
		offset_height = y-height/2,
		outside_x = offset_width < 0 || offset_width > this.width, // x-width/2 outside of QuadTree horizontally
		outside_y = offset_height < 0 || offset_height > this.height; // y-height/2 outside of QuadTree vertically
		
		// Size bigger than QuadTree children or outside of QuadTree entirely
		if(half_width <= width || half_height <= height || (outside_x && outside_y))
			return index;
			
		if(y < half_height)
		{
			// Top left
			if(x < half_width)
				index = 0;
			// Top right
			else if(x <= this.width)
				index = 1;
		}
		else if(y < this.height)
		{
			// Bottom left
			if(x < half_width)
				index = 2;
			// Bottom right
			else if(x <= this.width)
				index = 3;
		}
	
		return index;
	}
};