/*
* Very light (first level) extention function that extends the objects class; made for applying options to defaults
*/
Object.prototype.extend = function(target)
{
	var extended = {};
	
	for(var prop in this)
	{
		if(this.hasOwnProperty(prop) && this[prop] !== undefined)
		{
			if(target.hasOwnProperty(prop) && target[prop] !== undefined)
				extended[prop] = target[prop];
			else
				extended[prop] = this[prop];
		}
	}
	
	return extended;
}