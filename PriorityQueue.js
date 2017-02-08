/**
* @function PriorityQueue 
* @description A priority queue implementation where elements are ordered based on whether the queue is set to be a min/max queue
* @param {...Array} var_args - Array of starting elements, they will be prioritized based on index value
* @param {...boolean} var_args - Whether this is a min (true) or a max array (false/default);
* @see http://pages.cs.wisc.edu/~vernon/cs367/notes/11.PRIORITY-Q.html
*/
function PriorityQueue(isMin) {
	var i = 0;
	var arguementProperty;
	var argument;
	var startingElements = [];
	//var isMin;
	
	/*		
	for(arguementProperty in arguments) {
		if(arguments.hasOwnProperty(arguementProperty)) {
			argument = arguments[arguementProperty];
		
			if(typeof argument === 'object' && argument instanceof Array)
					startingElements = argument;
			
			if(typeof argument === 'boolean')
				isMin = argument;
		}
	}
	*/

	options = extend(defaults, options);

	this.queueArray = ['']; // Empty element so root is one
	this.isMin = true;

/*
	// Automatically assign priority based on index
	for(i = 0; i < startingElements.length; i++) {
		this.insert(startingElements[i], startingElements.length-1-i);
	}
*/

	return this;
}

PriorityQueue.prototype = {
	/**
	* @function PriorityQueue.prototype.swap
	* @description Swaps value at destination with value at target
	* @param {number} target - Target index to swap from
	* @param {number} destination - Target index to swap to
	*/
	swap: function (target, destination) {
		var temp;
	
		//if(typeof this.queueArray[destination] !== 'number' || typeof this.queueArray[target] !== 'number' || target > this.queueArray.length || destination > this.queueArray.length)
			//return;
			
		temp = this.queueArray[destination];
		this.queueArray[destination] = this.queueArray[target];
		this.queueArray[target] = temp;
	},
	/**
	* @function PriorityQueue.prototype.queueHelper 
	* @description Traverses up a the priority queue from an index, until the priority of the value at index doesn't satisfy min/max priority queue conditions. This rebalances the heap.
	* @param {number} index - Index to traverse the priority queue upwards from
	*/
	queueHelper: function(index) {
		var parentIndex = ~~(index/2);
	
		if(index == 1 || parentIndex <= 1)
			return;
	
		if(this.isMin ? this.queueArray[parentIndex].priority > this.queueArray[index].priority : this.queueArray[parentIndex].priority < this.queueArray[index].priority)
			this.swap(index, parentIndex);
		else // Do nothing if priority is equal
			return; 
		
		// Run until at root (index 1) node	
		this.queueHelper(parentIndex);
	},
	/**
	* @function PriorityQueue.prototype.queueHelper
	* @description Inserts a value into the priority queue and rebalances the tree based on min/max position
	* @param {object} value - Value to insert
	* @param {number} priority - Priority of the value inserted. In a max heap, high priority value is moved to up the heap, opposite in a min heap.
	*/
	queue: function (value, priority) {
	
		if(typeof value === 'undefined' || typeof priority === 'undefined')
			return; 
			
		this.queueArray.push({value: value, priority: priority});
		this.queueHelper(this.queueArray.length-1);
	},
	/** 
	* @function PriorityQueue.prototype.dequeueHelper
	* @description Traverses down the priority queue from an index until there are no more leaves in the heap to check
	* @param {number} index - Index value to travers the priority queue downwards from
	*/
	dequeueHelper: function(index) {
		var leftIndex;
		var rightIndex;
		var leftElement;
		var rightElement;
	
		if(typeof index === 'undefined')
			index = 1;
		
		leftIndex = index * 2;
		rightIndex = index * 2 + 1;
			
		if (typeof this.queueArray[leftIndex] !== 'undefined') {
			if(this.isMin ? this.queueArray[leftIndex].priority < this.queueArray[index].priority : this.queueArray[leftIndex].priority > this.queueArray[index].priority)
				leftElement = this.queueArray[leftIndex];
		} 
	
		if (typeof this.queueArray[rightIndex] !== 'undefined') {
			if(this.isMin ? this.queueArray[rightIndex].priority < this.queueArray[index].priority : this.queueArray[rightIndex].priority > this.queueArray[index].priority)
				rightElement = this.queueArray[rightIndex];
		}
			
		// Run until there are no more left/right leafs
		if(typeof leftElement  === 'undefined' && typeof rightElement === 'undefined')
			return;
	
		// If one or the other is undefined, use the one that has value		
		if(typeof leftElement !== 'undefined' && typeof rightElement === 'undefined') {
				this.swap(leftIndex, index);
				this.dequeueHelper(leftIndex);
		}
		else if(typeof leftElement === 'undefined' && typeof rightElement !== 'undefined') {
			this.swap(rightIndex, index);
			this.dequeueHelper(rightIndex);
		// If both are defined, use value based on priority 
		} else {					
			if (this.isMin ? leftElement.priority < rightElement.priority : leftElement.priority > rightElement.priority) {
				this.swap(leftIndex, index);
				this.dequeueHelper(leftIndex);
			} else if (this.isMin ? leftElement.priority >= rightElement.priority : leftElement.priority <= rightElement.priority) {
				this.swap(rightIndex, index);
				this.dequeueHelper(rightIndex);
			}
		}
	},
	/**
	* @function PriorityQueue.prototype.dequeue
	* @description Removes the top most element from the priority queue and rebalances the heap
	* @returns {*} Returns the value stored in the priority queue
	*/
	dequeue: function() {
		var result;
	
		if(this.queueArray.length === 0)
			return;
	
		this.swap(1, this.queueArray.length-1);
		result = this.queueArray.splice(this.queueArray.length-1, 1);
		this.dequeueHelper();
	
		if(result.length !== 0 && typeof result[0] !== 'undefined') {
			return result[0].value;
		} else
			return;
	},
	/** 
	* @function PriorityQueue.prototype.isEmpty
	* @description Returns if the queue is empty or not
	* @returns {boolean} - true if empty, false otherwise
	*/
	isEmpty: function() {
		return this.queueArray.length === 0;
	}

};