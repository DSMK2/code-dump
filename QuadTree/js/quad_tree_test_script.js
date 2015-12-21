$(function(){

	var canvas = $('#quad_tree_zone')[0],
	context = canvas.getContext('2d');
	
	context.canvas.width = $('body').width();
	context.canvas.height = $('body').height();
	
	var quad_tree = new QuadTree(context.canvas.width, context.canvas.height, 5, 5);
	quad_tree.drawQuadTree(canvas);
	
	var quad_tree_test_timer = window.setInterval(function(){
		var start_x = context.canvas.width*Math.random(),
		start_y = context.canvas.height*Math.random(),
		end_x = start_x + (context.canvas.width-start_x)*Math.random(),
		end_y = start_y + (context.canvas.height-start_y)*Math.random(),
		color = color = '#ffae00';
		
		context.beginPath();
		context.rect(start_x, start_y, 5, 5);
		context.fillStyle = color;
		context.fill();
		context.closePath();
		quad_tree.insert({}, 5, 5, start_x, start_y);
		var canvas = $('#quad_tree_zone')[0];
		quad_tree.drawQuadTree(canvas);
	}, 60/1000);
	
	var pos_x = 50,
	pos_y = 50,
	movement_flags = 
	{
		up: false,
		down: false,
		left: false,
		right: false
	},
	image_fighter;
	
	image_fighter = new Image();
	image_fighter.onload = function(){
		console.log('asdf');
	}
	image_fighter.src = 'images/shoot_stuff_ship.png';
	
	function redraw() {
		/*
		context.rect(0, 0, context.canvas.width, context.canvas.height); 
		context.fillStyle = 'white';
		context.fill();
	
		context.imageSmoothingEnabled= false;
		context.drawImage(image_fighter, pos_x, pos_y, 16, 22);
		quad_tree.drawQuadTree(canvas);
		window.setTimeout(function(){
			redraw();
		}, 60/1000);
		*/
	}
	
	/*
	window.setInterval(function(){
		quad_tree.clear();
		quad_tree.insert({}, 16, 22, pos_x, pos_y);
	});
	*/
	
	window.requestAnimationFrame(function(){
		redraw();
	}, 60/1000);
	window.setInterval(function(){
		if(movement_flags.left)
		{
			pos_x+=-5;
		}
		else if(movement_flags.right)
		{
			pos_x+=5;
		}
		
		if(movement_flags.up)
		{
			pos_y+=-5;
		}
		else if(movement_flags.down)
		{
			pos_y+=5;
		}
	}, 60/1000);
	$(window).on('keydown', function(e){
		switch(e.which){
			case 37: // left
				movement_flags.left = true;
			break;
			
			case 38: // up
				movement_flags.up = true;
			break;
			
			case 39: // right
				movement_flags.right = true;
			break;
			
			case 40: // down
				movement_flags.down = true;
			break;
		}
	});
	
	$(window).on('keyup', function(e){
		switch(e.which){
			case 37: // left
				movement_flags.left = false;
			break;
			
			case 38: // up
				movement_flags.up = false;
			break;
			
			case 39: // right
				movement_flags.right = false;
			break;
			
			case 40: // down
				movement_flags.down = false;
			break;
		}
	});
});