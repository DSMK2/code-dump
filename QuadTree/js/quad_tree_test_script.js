$(function(){

	var canvas = $('#quad_tree_zone')[0],
	context = canvas.getContext('2d');
	
	context.canvas.width = $('body').width();
	context.canvas.height = $('body').height();
	context.rect(0, 0, context.canvas.width, context.canvas.height); 
	context.fillStyle = 'white';
	context.fill();
	
	var quad_tree = new QuadTree(context.canvas.width, context.canvas.height, 5, 5);
	quad_tree.drawQuadTree(canvas);
	
	var quad_tree_test_timer = window.setInterval(function(){
		var start_x = context.canvas.width*0.50*Math.random(),
		start_y = context.canvas.height*0.50*Math.random(),
		end_x = start_x + (context.canvas.width-start_x)*Math.random(),
		end_y = start_y + (context.canvas.height-start_y)*Math.random(),
		color = color = '#8b8e89';
		
		context.beginPath();
		context.rect(start_x, start_y, 10, 10);
		context.fillStyle = color;
		context.fill();
		context.closePath();
		quad_tree.insert({}, 10, 10, start_x, start_y);
		var canvas = $('#quad_tree_zone')[0];
		quad_tree.drawQuadTree(canvas);
	}, 1);
	
});