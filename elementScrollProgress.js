/*
	Requires jQuery to work
		
	This function returns a progress value between 0 and 1; 0 when the top of target is under 
	or at the bottom of the window and 1 when the bottom of the target is at or above the window.
	
	$target - target jQuery element to check progress on
	
	start_offset - px value to offset the start-of-progress. Positive values have the progress 
	start lower (begin later), while negative values have the progress start higher (start earlier).
	
	end_offset - px value ot offset the end-of-progress. Positive values have the progress end lower 
	(end earlier), while negative values have the progress end higher (end later).
	
	parent_container - test variable to change the scroll container. // NEEDS TESTING
*/

function elementScrollProgress($target, start_offset, end_offset, $parent_container)
{
	// Default to the window element
	if(!$parent_container)
		$parent_container = $(window);

	if($target.length === 0)
		console.log('No target: no progress');
	
	// Default start offset to 0
	/*
	Is this even needed?
	start_offset = !start_offset ? 0 : start_offset;
	end_offset = !end_offset ? 0 : end_offset;
	*/
	
	var target_height = $target.height(),
	target_top = $target.offset().top,
	parent_height = $parent_container.height();
	
	begin = $parent_container.scrollTop() + parent_height - target_top + start_offset,
	end = target_height + parent_height + end_offset;

	return begin/end;
}