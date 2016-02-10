/*
Goal: Generate collision polygon vertices/tris for b2PolygonShape 
*/
jQuery(function($){
	var $canvas = $('#canvas'),
	context = $canvas[0].getContext('2d'),
	$hidden_canvas = $('#hidden_canvas');
	
	// Image data
	var image = new Image(),
	image_width = 0,
	image_height = 0,
	image_data,
	result,
	polygon_result,
	processed_image = false,
	processed_image_2 = false;
	
	/*
		Marching Squares
		http://jamie-wong.com/2014/08/19/metaballs-and-marching-squares/
		https://www.youtube.com/watch?v=6ovo5b6vLKA
		8, 4, 2, 1
	*/
	
	// Init canvas with white background
	context.canvas.width = $canvas.width();
	context.canvas.height = $canvas.height();
	context.beginPath();
	context.rect(0, 0, context.canvas.width, context.canvas.height);
	context.fillStyle = '#ffffff';
	context.fill();
	context.closePath();
	
	context.imageSmoothingEnabled = false;
	
	// Web worker setup
	var worker;
	if(typeof Worker !== "undefined")
	{
		if(typeof worker === "undefined")
		{
			console.log('worker test');
			worker = new Worker('js/cropImage_worker.js');
		
			
			worker.onerror = function(error){
				console.log('error', error.message);
			};
			worker.onmessage = function(event) {
				var data = event.data;
				console.log(data);
				if(data.requestType === undefined)
					console.log('something went wrong');
				else
				{
					switch(data.requestType)
					{
						case 'crop':
						{
							var new_width,
							new_height;
							
							result = data.result;
							
							new_width = image_width = context.canvas.width -= (result.left+result.right)-2;
							new_height = image_height = context.canvas.height -= (result.top+result.bottom)-2;
							processed_image= true;
							redraw();
							
							
							var image_data = context.getImageData(0, 0, image_width, image_height);
							worker.postMessage({request: 'get_outline', args:[image_data, 0, 0, 0, 0]});
							
							
							context.drawImage(image, -result.left+(image.width-result.right), -result.top+(image.height-result.bottom), result.right, result.bottom, -result.left, -result.top, result.right, result.bottom);
						}
							break;
						case 'get_outline':

							polygon_result = data.result;
							processed_image_2 = true;
							redraw();
							break;
					}
				}
			};
			
				
		}
	}
	else
	{
		console.log('no Worker support');
	}
	
	// Load image data from file input
	$('#image_file').change(function(){
		console.log('image changed');
		processed_image = false;
		result = undefined;
		polygon_result = undefined;
		processed_image_2 = false;
		if(window.FileReader)
		{
			var file_list = $('#image_file').prop("files");
			var file = file_list[0];
			var file_reader = new FileReader();
			var t = this;
			file_reader.onload = (function(file_target){
				if(file_target.type.search(/image/) >= 0) // Error happens here
				{	

					console.log('image found');
					return function(f){
						
						image = new Image();
						image.onload = function(){
							console.log('image loaded');
							image_width = image.width;
							image_height = image.height;
							context.canvas.width = image_width;
							context.canvas.height = image_height;
							redraw();
							var image_data = context.getImageData(0, 0, image_width, image_height);
							
							// Get trim data after drawing image
							if(worker)
								worker.postMessage({request: 'crop', args:[image_data, 0, 0, 0, 0]});
						}
						image.src = f.target.result;
						console.log('creating image with', image);
					}
				}
				else
				{
					
				}
			})(file);
			
			file_reader.readAsDataURL(file);
		}
	});
	

	
	function redraw()
	{
		context.clearRect(0, 0, context.canvas.width, context.canvas.height);
		
		/*
		context.beginPath();
		context.rect(0, 0, context.canvas.width, context.canvas.height);
		context.fillStyle = '#ffffff';
		context.fill();
		context.closePath();
		*/
		
		if(processed_image && result !== undefined && processed_image_2 === false)
		{
			var horizontal_offset = result.left+result.right,
			vertical_offset = result.top+result.bottom
			context.drawImage(image, result.left, result.top, image.width-result.right, image.height-result.bottom, 1, 1, image.width-result.right, image.height-result.bottom);
			//context.drawImage(image, context.canvas.width/2-image_width/2, context.canvas.height/2-image_height/2);
		}
		else if(processed_image && result !== undefined && processed_image_2 && polygon_result !== undefined)
		{
			var horizontal_offset = result.left+result.right,
			vertical_offset = result.top+result.bottom
			context.drawImage(image, result.left, result.top, image.width-result.right, image.height-result.bottom, 1, 1, image.width-result.right, image.height-result.bottom);
			for(var i = 0; i < polygon_result.length; i+=2)
			{
				context.beginPath();
				context.moveTo(polygon_result[i].x+1, polygon_result[i].y+1);
				context.lineTo(polygon_result[i+1].x+1, polygon_result[i+1].y+1);
				context.strokeStyle='#ff00ff';
				context.strokeWidth = 2;
				context.stroke();
				context.closePath();
			}
		}
		else
			context.drawImage(image, context.canvas.width/2-image_width/2, context.canvas.height/2-image_height/2);
	}
});