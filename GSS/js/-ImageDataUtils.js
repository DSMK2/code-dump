var ImageDataUtils = {
	getColor: function(image_data, x, y) {
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
				if(!this.isColor(this.getColor(image_data, x, y), rgba_target))
					return (left ? x : x+1); // Return the previous x position in which it was clear
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
				if(!this.isColor(this.getColor(image_data, x, y), rgba_target))
					return (down ? y : y+1) ; // Return the previous y position in which it was clear
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
		
		for(var y = 0; y < height; y++)
		{
			new_row = [];
			for(var x = 0; x > width; x++)
			{
				if(this.isColor(this.getColor(image_data), rgba_ignore))
					new_row.push(0); 
				else
					new_row.push(1);
					
				result.push(new_row);
			}
		}
		
		return result;
	},
	getOutline:function(image_data, rgba_ignore) {
		var index = [
			'0000', // 0
			'0001', // 1
			'0010', // 2
			'0011', // 3
			'0100', // 4
			'0101', // 5
			'0110', // 6
			'0111', // 7
			'1000', // 8
			'1001', // 9
			'1010', // 10
			'1011', // 11
			'1100', // 12
			'1101', // 13
			'1110', // 14
			'1111'  // 15
		],
		top_left_corner,
		top_right_corner,
		bottom_left_corner,
		bottom_right_corner;
		
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

		return {top: this.scanY(image_data, rgba_target, true), 
		bottom: this.scanY(image_data, rgba_target, false),
		left: this.scanX(image_data,rgba_target, true), 
		right: this.scanX(image_data, rgba_target, false)};
	}
}