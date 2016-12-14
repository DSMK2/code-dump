/**
* Generate a random array of numbers given a length
*/
function generateFilledRandomArr(length) {
	let arr = [];
	
	for(let i = 0; i < length; i++) {
		arr.push(Math.floor(Math.random()*20));
	}
	
	return arr;
}

/**
* Bubble sort implementation
*/
function bubbleSort(arrToSort) {
	let sortedArr = arrToSort.slice(0);
	
	function swap(tar, dest) {
	
		if(tar == dest)
			return;
			
		let temp = sortedArr[dest];
		sortedArr[dest] = sortedArr[tar];
		sortedArr[tar] = temp;
		
	}
	
	for(let i = 0; i < sortedArr.length; i++){

		for(let i2 = 1; i2 < sortedArr.length; i2++) {
		
			if(sortedArr[i2-1] > sortedArr[i2]) {
			
				swap(i2-1, i2);
				
			}
			
		}
		
	}
	
	return sortedArr;
}

/**
* Insertion sort implementation
*/
function insertionSort(arrToSort) {
	let sortedArr = arrToSort.slice(0);
	
	function swap(tar, dest) {
	
		if(tar == dest)
			return;
			
		let temp = sortedArr[dest];
		sortedArr[dest] = sortedArr[tar];
		sortedArr[tar] = temp;
		
	}
	
	for(let i = 1; i < sortedArr.length; i++) {
	
		if(sortedArr[i-1] > sortedArr[i]) {
		
			for(let i2 = i; i > 0; i--) {
			
				if(sortedArr[i-1] > sortedArr[i])
					swap(i, i-1);
					
			}
			
		}		
		
	}
	
	return sortedArr;
}

/** 
* Selection sort implementation
*/
function selectionSort(arrToSort) {
	let sortedArr = arrToSort.slice(0);
	
	function swap(tar, dest) {
	
		if(tar == dest)
			return;
			
		let temp = sortedArr[dest];
		sortedArr[dest] = sortedArr[tar];
		sortedArr[tar] = temp;
		
	}
	
	for(let i = 1; i < sortedArr.length; i++) {
		let minIndex = i-1;
		
		for(let i2 = i; i2 < sortedArr.length; i2++) {
			
			if(sortedArr[minIndex] > sortedArr[i2])
				minIndex = i2;
		}
		
		swap(minIndex, i-1);
	}
	
	return sortedArr;
}

/**
* Merge sort implementation
*/
function mergeSort(arrToSort) {
	let sortedArr = arrToSort.slice(0);
	
	// Merges sorted arrays
	function merge(arrA, arrB) {
		let merged = [];
		while(arrA.length >= 1 && arrB.length >= 1) {
			if(arrA[0] <= arrB[0])
				merged.push(arrA.shift());
			else if (arrB[0] < arrA[0])
				merged.push(arrB.shift());
		}
		
		if(arrA.length === 0 && arrB.length !== 0)
			merged = merged.concat(arrB);
			
		if(arrB.length === 0  && arrA.length !== 0)
			merged = merged.concat(arrA);
				
		return merged;
	}
	
	function mergeSortHelper(arr) {
		
		if(arr.length > 1) {
		
			let left = arr.slice(0, Math.floor(arr.length/2));
			let right = arr.slice(Math.floor(arr.length/2));
			return merge(mergeSortHelper(left), mergeSortHelper(right));
		
		}
		
		return arr;
	}
	
	sortedArr = mergeSortHelper(sortedArr);
	
	return sortedArr;
}

/**
* Sort exercises hub
*/
function sortType(type, arrToSort) {
	if(typeof arrToSort === 'undefined' || typeof arrToSort.length === 'undefined' || arrToSort.length === 0) 
		return;
	
	console.log ('Sorting:\n', arrToSort);
	
	switch(type) {
		case 0:
			console.log('Sorting with: Bubble Sort:');
			return bubbleSort(arrToSort);
			
		case 1: 
			console.log('Sorting with: Insertion Sort:');
			return insertionSort(arrToSort);
			
		case 2: 
			console.log('Sorting with: Selection Sort:');
			return selectionSort(arrToSort);
		
		case 3:
			console.log('Sorting with: Merge Sort:');
			return mergeSort(arrToSort);
		
		default:
			return arrToSort;
	}
}

console.log(sortType(0, generateFilledRandomArr(10)));
console.log(sortType(1, generateFilledRandomArr(10)));
console.log(sortType(2, generateFilledRandomArr(10)));
console.log(sortType(3, generateFilledRandomArr(10)));