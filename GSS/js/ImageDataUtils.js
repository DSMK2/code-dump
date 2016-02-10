/**
*
* @param data [array] - 2d array to travel
* @param x - Starting x coordinate
* @param y - Starting y coordinate
* @param result [array] - A 1d array of coordinates
*/
function marchingSquaresTraveler(data, x, y, result, start_x, start_y, prev_index)
{
	/*
		Direction codes:
		-1: Nowhere
		0 : up
		1 : right
		2 : down
		3 : left
		
		Square setup
		1---2
		|   |
		8---4
	*/
	var square = [
		{dir: -1, points: []}, //'0000', // 0 No sides
		{dir: 3, points: [{x: 0.5, y: 0}, {x: 0, y: 0.5}]}, //'0001', // 1
		{dir: 0, points: [{x: 1, y: 0.5}, {x: 0.5, y: 1}]}, //'0010', // 2
		{dir: 3, points: [{x: 1, y: 0.5}, {x: 0, y: 0.5}]}, //'0011', // 3
		{dir: 1, points: [{x: 0.5, y: 0}, {x: 1, y: 0.5}]}, //'0100', // 4
		{dir: 2, points: [{x: 0.5, y: 0}, {x: 0, y: 0.5}, {x: 1, y: 0.5}, {x: 0.5, y: 1}]}, //'0101', // 5 // Special case of "//" We need special case cells
		{dir: 0, points: [{x: 0.5, y: 0}, {x: 0.5, y: 1}]}, //'0110', // 6
		{dir: 3, points: [{x: 0, y: 0.5}, {x: 0.5, y: 0}]}, //'0111', // 7 Uses reversed coordinates of 1 to signify inside
		{dir: 2, points: [{x: 0.5, y: 1}, {x: 0, y: 0.5}]}, //'1000', // 8
		{dir: 2, points: [{x: 0.5, y: 1}, {x: 0.5, y: 0}]},  //'1001', // 9 Uses reversed coordinates of 6 to signify inside
		{dir: 2, points: [{x: 0.5, y: 0}, {x: 1, y: 0.5}, {x: 0, y: 0.5}, {x: 0.5, y: 1}]}, //'1010', // 10 // Special case of "\\"
		{dir: 2, points: [{x: 1, y: 0.5}, {x: 0.5, y: 0}]}, //'1011', // 11 Uses reversed coordinates of 4 to signify inside
		{dir: 1, points: [{x: 0, y: 0.5}, {x: 1, y: 0.5}]}, //'1100', // 12
		{dir: 1, points: [{x: 0.5, y: 1}, {x: 1, y: 0.5}]}, //'1101', // 13 Uses reversed coordinates of 2 to signify inside
		{dir: 0, points: [{x: 0, y: 0.5}, {x: 0.5, y: 1}]}, //'1110', // 14 Uses reversed coordinates of 1 to signify inside
		{dir: -1, points: []},  // 15 All sides (same as 0)
		
		// Special cases for case 5 and 10 (should never be found normally)
		{dir: 3, points: [{x: 0.5, y: 1}, {x: 1, y: 0.5}]},			// 5-16 come in from up 0
		{dir: 0, points: [{x: 0.5, y: 1}, {x: 1, y: 0.5}]}, 		// 5-17 come in from right 1
		{dir: 1, points: [{x: 0.5, y: 0}, {x: 0, y: 0.5}]}, 		// 5-18 come in from down 2
		{dir: 2, points: [{x: 1, y: 0.5}, {x: 0.5, y: 1}]}, 		// 5-19 come in from left 3
		
		{dir: 3, points: [{x: 0.5, y: 1}, {x: 0.5, y: 0.5}]},		// 10-20 come in from up 0
		{dir: 0, points: [{x: 0.5, y: 0}, {x: 1, y: 0.5}]},			// 10-21 come in from right 1
		{dir: 1, points: [{x: 0, y:0.5}, {x: 0.5, y: 1}]},			// 10-22 come in from down 2
		{dir: 2, points: [{x: 1, y: 0.5}, {x: 0.5, y: 0}]}			// 10-23 come in from left 3
	],
	selected_square,
	index = 0,
	result = result === undefined ? [] : result,
	dir,
	x_offset,
	y_offset;
	
	function getCellDataFromCell(x, y, position) {
		var result = [];
		switch(position)
		{
			case 0: // Top left
				x+=-2;
				y+=-2;
				break;
			case 1: // Top
				y+=-2;
				break;
			case 2: // Top right
				x+=3;
				y+=-2;
				break;
			case 3: // Right
				x+=3;
				break;
			case 4: // Bottom right
				x+=3;
				y+=3;
				break;
			case 5: // Bottom
				y+=3;
				break;
			case 6: // Bottom left
				x+=-2; 
				y+=3;
				break;
			case 7: // Left
				x+=-2;
				break;
		}
		
		result.push((x >= 0 && y >= 0 && y < data.length && x < data[0].length) ? data[y][x] : 0);
		result.push((x+1 >= 0 && y >= 0 && y < data.length && x+1 < data[0].length) ? data[y][x+1] : 0);
		result.push((x+1 >= 0 && y+1 >= 0 && y+1 < data.length && x+1 < data[0].length) ? data[y+1][x+1] : 0);
		result.push((x >= 0 && y+1 >= 0 && y+1 < data.length && x < data[0].length) ? data[y+1][x] : 0);
		
		return result;
	}
	
	/* Simple function to average an array of ints */
	function averageArray(array){
		var sum;
		
		for(var i = 0; i < array.length; i++)
			sum+=array[i];
		
		return sum/array.length;
	}
		
	// Back at the start, return the result
	if(x == start_x && y == start_y)
		return result;
	
	if(x < 0 || y < 0 || x > data[0].length || y > data.length)
	{
		console.log('Exceeded bounds x:', x, 'y:', y, 'x-length:', data[0].length, 'y-length:', data.length);
		return result;
	}
	
	// Remember starting x position
	if(start_x === undefined)
		start_x = x;
		
	// Remember starting y position
	if(start_y === undefined)
		start_y = y;
	
	index = data[y][x] + data[y][x+1]*2 + data[y+1][x+1]*4 + data[y+1][x]*8;
	selected_square = square[index];
	dir = selected_square.dir;
	console.log(selected_square, 'square index:', index, 'x:', x, 'y:', y, 'previous square index:', prev_index);
	
	// Blank spaces need not apply
	if(selected_square.dir == -1)
	{
		console.log('blank stopping');
		return result;
	}
	
	// Solve for ambigious saddle cases
	// COnnecting points get index subbed
	if(index == 5 || index == 10)
	{
		var prev_dir = square[prev_index].dir;
		if(index == 5)
		{
			switch(prev_dir)
			{
				case 0:
					index = 16;
					selected_square = square[index];
					dir = selected_square.dir;
					break;
				case 1:
					index = 17;
					selected_square = square[index];
					dir = selected_square.dir; 
					break;
				case 2:
					index = 18;
					selected_square = square[index];
					dir = selected_square.dir;
					break;
				case 3:
					index = 19;
					selected_square = square[index];
					dir = selected_square.dir;
					break;
			}
		}
		
		if(index == 10)
		{
			switch(prev_dir)
			{
				case 0:
					index = 20;
					selected_square = square[index];
					dir = selected_square.dir;
					break;
				case 1:
					index = 21;
					selected_square = square[index];
					dir = selected_square.dir; 
					break;
				case 2:
					index = 22;
					selected_square = square[index];
					dir = selected_square.dir;
					break;
				case 3:
					index = 23;
					selected_square = square[index];
					dir = selected_square.dir;
					break;
			}
		}
	}
	
	// Add acquired points to the list of points that make up polygons
	// TODO: Simplify later see: http://gamedev.stackexchange.com/questions/38721/how-can-i-generate-a-navigation-mesh-for-a-tile-grid/43826#43826
	for(var i = 0; i < selected_square.points.length; i++)
		result.push({x: selected_square.points[i].x+x, y: selected_square.points[i].y+y});
	
	// Get new coordinate modifiers based on direction to move
	x_offset = (dir == 1 || dir == 3) ? (dir == 1 ? 1 : -1) : 0;
	y_offset = (dir === 0 || dir == 2) ? (dir === 0 ? -1 : 1) : 0;
	
	return marchingSquaresTraveler(data, x+x_offset, y+y_offset, result, start_x, start_y, index); 
}

var ImageDataUtils = {
	getColor:function(image_data, x, y) {
			var 
			width = image_data.width,
			index = (width*y+x)*4;
			
			return {r: image_data.data[index], g:image_data.data[index+1], b:image_data.data[index+2], a: image_data.data[index+3]};
	},
	isColor: function(rgba, rgba_target) {
		// Matching or color is completely transparent
		return (rgba.r == rgba_target.r && rgba.g == rgba_target.g && rgba.b == rgba_target.b && rgba.a == rgba_target.a) || (rgba == rgba_target.a && rgba_target.a === 0);
	},
	scanX: function(image_data, rgba_target, left) {
		var
		width = image_data.width,
		height = image_data.height,
		x_start = left ? 0 : width-1,
		x_end = left ? width : 0;

		for(var x = x_start; left ? x < x_end : x >= x_end; left ? x++ : x--)
		{
			for(var y = 0; y < height; y++)
			{
				if(!ImageDataUtils.isColor(ImageDataUtils.getColor(image_data, x, y), rgba_target))
					return (left ? x : width-x-1); // Return the previous x position in which it was clear
			}
		}
		return 0;
	},
	scanY: function(image_data, rgba_target, down) {
		var
		width = image_data.width,
		height = image_data.height,
		y_start = down ? 0 : height-1,
		y_end = down ? height : 0;
		
		for(var y = y_start; down ? y < y_end : y >= y_end; down ? y++ : y--)
		{
			for(var x = 0; x < width; x++)
			{
				if(!ImageDataUtils.isColor(ImageDataUtils.getColor(image_data, x, y), rgba_target))
					return (down ? y : height-y-1) ; // Return the previous y position in which it was clear
			}
		}
		return 0;
	},
	/* Returns an array of 0 and 1s matching colors are 0, non-maching is 1. Created for the purposes of marching squares*/	
	getPixelGrid: function(image_data, rgba_ignore){
		var width = image_data.width,
		height = image_data.height,
		result = [],
		new_row;
		console.log(width, height);
		for(var y = 0; y < height; y++)
		{
			new_row = [];
			for(var x = 0; x < width; x++)
			{
				if(ImageDataUtils.isColor(ImageDataUtils.getColor(image_data, x, y), rgba_ignore))
					new_row.push(false);
				else
					new_row.push(true);
			}
			result.push(new_row);
		}
		
		return result;
	},
	getOutline:function(image_data, r, g, b, a) {
		// Coordinates for each vector square possibility (clockwise from top corner), actual offsets happen later
		var rgba_ignore = {r: r, g: g, b: b, a: a},
		pixel_grid = ImageDataUtils.getPixelGrid(image_data, rgba_ignore),
		result = [],
		index;
		// Default to transparent
		r = r === undefined ? 0 : r;
		g = g === undefined ? 0 : g;
		b = b === undefined ? 0 : b;
		a = a === undefined ? 0 : a; 
		
		if(pixel_grid.length === 0)
			return result;
		
		// Incrementally step per pixel a 2x2 square (build a one dimensional array of selected points)
		/*
			Square setup
			1---2
			|   |
			8---4
		*/
		// Second implementation
		/*
		Move cell based on clockwise direction, not scanning
		*/
		// Find start position
		var found_poly = false;
		for(var y = 0; y < pixel_grid.length-1; y++)
		{
			for(var x = 0; x < pixel_grid[y].length; x++)
			{
				if(pixel_grid[y+1][x])
				{
					console.log('start');
					result = marchingSquaresTraveler(pixel_grid, x-1, y);
					found_poly = true;
				}
				if(found_poly)
					break;
			}
			if(found_poly)
					break;
		}
		
		
		// Simply polygon by traveling circuits;
		
		//http://stackoverflow.com/questions/6989100/sort-points-in-clockwise-order
		/*
		result.sort(function(a, b){
			
		});
		*/
		// Build polygon out of results by joining points into lines
		return result;
		//ImageDataUtils
		
	},
	getOutline2:function(image_data, r, g, b, a) {
		// Coordinates for each vector square possibility (clockwise from top corner), actual offsets happen later
		var square = [
			[], //'0000', // 0 No sides
			[{x: 0.5, y: 0}, {x: 0, y: 0.5}], //'0001', // 1
			[{x: 1, y: 0.5}, {x: 0.5, y: 1}], //'0010', // 2
			[{x: 1, y: 0.5}, {x: 0, y: 0.5}], //'0011', // 3
			[{x: 0.5, y: 0}, {x: 1, y: 0.5}], //'0100', // 4
			[{x: 0.5, y: 0}, {x: 0, y: 0.5}, {x: 1, y: 0.5}, {x: 0.5, y: 1}], //'0101', // 5 // Special case of "//"
			[{x: 0.5, y: 0}, {x: 0.5, y: 1}], //'0110', // 6
			[{x: 0, y: 0.5}, {x: 0.5, y: 0}], //'0111', // 7 Uses reversed coordinates of 1 to signify inside
			[{x: 0.5, y: 1}, {x: 0, y: 0.5}], //'1000', // 8
			[{x: 0.5, y: 1}, {x: 0.5, y: 0}],  //'1001', // 9 Uses reversed coordinates of 6 to signify inside
			[{x: 0.5, y: 0}, {x: 1, y: 0.5}, {x: 0, y: 0.5}, {x: 0.5, y: 1}], //'1010', // 10 // Special case of "\\"
			[{x: 1, y: 0.5}, {x: 0.5, y: 0}], //'1011', // 11
			[{x: 0, y: 0.5}, {x: 1, y: 0.5}], //'1100', // 12
			[{x: 0.5, y: 1}, {x: 1, y: 0.5}], //'1101', // 13
			[{x: 0, y: 0.5}, {x: 0.5, y: 1}], //'1110', // 14
			[]  // 15 All sides (same as 0)
		],
		tl_c,
		tr_c,
		br_c,
		bl_c,
		rgba_ignore = {r: r, g: g, b: b, a: a},
		pixel_grid = ImageDataUtils.getPixelGrid(image_data, rgba_ignore),
		result = [],
		index,
		half_width = image_data.width/2,
		half_height = image_data.height/2;

		// Default to transparent
		r = r === undefined ? 0 : r;
		g = g === undefined ? 0 : g;
		b = b === undefined ? 0 : b;
		a = a === undefined ? 0 : a; 
		
		if(pixel_grid.length === 0)
			return result;
		
		// Incrementally step per pixel a 2x2 square (build a one dimensional array of selected points)
		/*
			Square setup
			1---2
			|   |
			8---4
		*/
		// First implementation
		for(var y = 0; y < pixel_grid.length-1; y++)
		{
			var row = [],
			selected_square;
			for(var x = 0; x < pixel_grid[y].length-1; x++)
			{
				tl_c = pixel_grid[y][x];
				tr_c = pixel_grid[y][x+1];
				br_c = pixel_grid[y+1][x+1];
				bl_c = pixel_grid[y+1][x];
				index = tl_c+tr_c*2+br_c*4+bl_c*8;
				
				
				if(index != 0 && index != 15)
				{
					selected_square = square[index];
					// Offset values in selected square
					for(var i = 0; i < selected_square.length; i++)
					{
						result.push({x: selected_square[i].x+x, y: selected_square[i].y+y});
					}
				}
			}
		}
		
		
		// Simply polygon by traveling circuits;
		
		//http://stackoverflow.com/questions/6989100/sort-points-in-clockwise-order
		/*
		result.sort(function(a, b){
			
		});
		*/
		// Build polygon out of results by joining points into lines
		return result;
		//ImageDataUtils
		
	},
	
	// See http://stackoverflow.com/questions/12175991/crop-image-white-space-automatically-using-jquery/12178531#12178531
	// Oh oh good time to learn how to use web workers!
	/**
	* Clean up image so there's less things to check via marching squares
	* @param image_data [ImageData] - Image data to process
	* @param r [int] - Red value of color 0 - 255
	* @param g [int] - Green value of color 0 - 2555
	* @param b [int] - Blue value of color 0 - 255
	* @param a [float] - Alpha value of color 0 - 1
	*/
	getTrimAmounts: function(image_data, r, g, b, a)
	{
		// Default to transparent
		r = r === undefined ? 0 : r;
		g = g === undefined ? 0 : g;
		b = b === undefined ? 0 : b;
		a = a === undefined ? 0 : a; 
		
		var rgba_target = {r: r, g: g, b: b, a: a};

		return {top: ImageDataUtils.scanY(image_data, rgba_target, true), 
		bottom: ImageDataUtils.scanY(image_data, rgba_target, false),
		left: ImageDataUtils.scanX(image_data,rgba_target, true), 
		right: ImageDataUtils.scanX(image_data, rgba_target, false)};
	}
}