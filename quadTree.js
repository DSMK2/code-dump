function quadTreeNode(parent, pos, size, level){
	this.parent;
	this.children = new Array();
	
	this.pos = pos != null ? pos : new vector(0,0);
	this.size = size != null ? size : new vector(0,0);
	
	this.items = new Array();
	this.level = level;
	return this;
}

quadTreeNode.prototype = {
	max_items: 5,
	max_levels: 5,
	clear: function(){
		this.items = new Array();
		for(var i = 0; i < this.children.length; i++)
		{
			if(this.children[i] != null)
			{
				this.children[i].clear();
				this.children = new Array();
			}
		}
	},
	split: function(){
		var size = new vector(this.size.x/2, this.size.y/2);
		
		this.children.push(new quadTreeNode(this, new vector(this.pos.x, this.pos.y), size, this.level+1));
		this.children.push(new quadTreeNode(this, new vector(this.pos.x+this.size.x/2, this.pos.y), size, this.level+1));
		this.children.push(new quadTreeNode(this, new vector(this.pos.x, this.pos.y+this.size.y/2), size, this.level+1));
		this.children.push(new quadTreeNode(this, new vector(this.pos.x+this.size.x/2, this.pos.y+this.size.y/2), size, this.level+1));
	},
	getIndex: function(tar){
		if(!tar)
		{
			return -1;
		}
	
		var index = -1;
		var mid_x = this.pos.x+this.size.x/2;
		var mid_y = this.pos.y+this.size.y/2;
		
		var fits_top = tar.pos.y < mid_y && tar.pos.y+tar.size.y < mid_y;
		var fits_bottom = tar.pos.y > mid_y;
		
		if(tar.size.x >= mid_x || tar.size.y >=mid_y)
		{
			return index;
		}
		
		if((tar.pos.x < mid_x && tar.pos.x+tar.size.x > mid_x) || (tar.pos.y < mid_y && tar.pos.y+tar.size.y > mid_x))
		{
			return index;
		}
		
		
		if(tar.pos.x < mid_x && tar.pos.x + tar.size.x < mid_x)
		{
			if(fits_top){
				index = 0;
			}
			else if(fits_bottom){
				index = 2;
			}
		}
		else if(tar.pos.x > mid_x)
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
	insert: function(tar){
		if(this.children[0] != null){
			var index = this.getIndex(tar);
			if(index != -1){
				this.children[index].insert(tar);
				return;
			}
		}
		
		this.items.push(tar);
		
		if(this.items.length > this.max_items && this.level < this.max_levels)
		{
			if(this.children[0] == null)
			{
				this.split();
			}
			
			for(var i = 0; i < this.items.length; i++)
			{
				var index =  this.getIndex(this.items[i]);
				if(index != -1){
					this.children[index].insert(this.items[i]);
					this.items.splice(i, 1);
				}
			}
		}
	},
	retrieve: function(result, tar){
		var index = this.getIndex(tar);
		if(index != -1 && this.children[0] != null){
			this.children[index].retrieve(result, tar);
		}
		
		for(var i = 0; i < this.items.length; i++)
		{
			if(this.items[i].id != tar.id)
			{
				result.push(this.items[i]);
			}
		}
		
		return result;
	},
	drawNodes: function(){
		for(var i = 0; i < this.children.length; i++)
		{
			this.children[i].drawNodes();
		}
		GLOBALS.context.beginPath();
		GLOBALS.context.lineWidth=1;
		GLOBALS.context.moveTo(this.pos.x, this.pos.y);
		GLOBALS.context.lineTo(this.pos.x, this.pos.y+this.size.y);
		GLOBALS.context.strokeStyle = '#ff0000';
		GLOBALS.context.stroke();
		
		GLOBALS.context.beginPath();
		GLOBALS.context.lineWidth=1;
		GLOBALS.context.moveTo(this.pos.x, this.pos.y+this.size.y);
		GLOBALS.context.lineTo(this.pos.x+this.size.x, this.pos.y+this.size.y);
		GLOBALS.context.strokeStyle = '#00ff00';
		GLOBALS.context.stroke();
		
		GLOBALS.context.beginPath();
		GLOBALS.context.lineWidth=1;
		GLOBALS.context.moveTo(this.pos.x+this.size.x, this.pos.y+this.size.y);
		GLOBALS.context.lineTo(this.pos.x+this.size.x, this.pos.y);
		GLOBALS.context.strokeStyle = '#0000ff';
		GLOBALS.context.stroke();
		
		GLOBALS.context.beginPath();
		GLOBALS.context.lineWidth=1;
		GLOBALS.context.moveTo(this.pos.x+this.size.x, this.pos.y);
		GLOBALS.context.lineTo(this.pos.x, this.pos.y);
		GLOBALS.context.strokeStyle = '#ffff00';
		GLOBALS.context.stroke();
	},
}