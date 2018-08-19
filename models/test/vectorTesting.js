
var VectorTester = function(){};

function compareVectors(a, b, selection){
    let length = a.length;
  
    let higher = 0;
    let equal = 0;
    let lower = 0;
    let compare = 0;
    if(selection){
      for(let i = 0; i < selection.length; i++){
          compare += (a[selection[i]] - b[selection[i]]);
      }
      return compare;
    }else{
      for(let i = 0; i < length; i++){
          compare += (a[i] - b[i]);
      }
      return compare;
    } 
  }
  
  function compareVectorsOld(a, b){
    let length = a.length;
  
    let higher = 0;
    let equal = 0;
    let lower = 0;
    let compare = 0;
      for(let i = 0; i < length; i++){
          if(a[i] > b[i]){
              higher++;
          }else if(a[i] < b[i]){
              lower++;
          }else{
              equal++;
          }
      }
    
  if(higher > lower && higher > equal){
      return 1; //more higher numbers
    }else if(lower > higher && lower > equal){
      return -1; //more lower numbers
    }else if(equal >= higher && equal >= lower){ //more equal numbers, so check which is better, higher or lower (tie breaker)
      if(higher > lower){
        return 1;
      }else if(lower > higher){
        return -1;
      }else{
        return 0; //equal number of higher and lower, but more equal numbers overall
      }
    } else if (higher > lower){
      return 1;
    }	else if (lower > higher){
      return -1;
    }
    return 0; //equal number of higher, lower and equal
    
  }
  
  function bubbleSortVectors(vectors, selection){
  
    let keys = Object.keys(vectors);
    let keySorting = keys;
    console.log("keys");
    console.log(keys);
    for(let i = 0; i < keys.length - 1; i++){
      let compare = compareVectors(vectors[keys[i]], vectors[keys[i+1]], selection);
      if(compare > -1){
        let tmp = keySorting[i];  //Temporary variable to hold the current number
        keySorting[i] = keySorting[i+1];  //Replace current number with adjacent number
        keySorting[i+1] = tmp; //Replace adjacent number with current number
      }
    }
  
    console.log("Sorted Keys");
    console.log(keySorting);
    let sortedVectors = [];
    for(let i = 0 ; i < keySorting.length; i++){
      sortedVectors[" " + keySorting[i]] = vectors[keySorting[i]]; //convert to original format
    }
    return sortedVectors;
  }
  
  function bubbleSortVectorsOld(vectors, selection){
  
    let keys = Object.keys(vectors);
    let keySorting = keys;
    console.log("keys");
    console.log(keys);
    for(let i = 0; i < keys.length - 1; i++){
      let compare = compareVectorsOld(vectors[keys[i]], vectors[keys[i+1]], selection);
      if(compare > -1){
        let tmp = keySorting[i];  //Temporary variable to hold the current number
        keySorting[i] = keySorting[i+1];  //Replace current number with adjacent number
        keySorting[i+1] = tmp; //Replace adjacent number with current number
      }
    }
  
    console.log("Sorted Keys");
    console.log(keySorting);
    let sortedVectors = [];
    for(let i = 0 ; i < keySorting.length; i++){
      sortedVectors[" " + keySorting[i]] = vectors[keySorting[i]]; //convert to original format
    }
    return sortedVectors;
  }
  
  function quickSortKeys(keys, vectors, selection) {
      if (keys.length <= 1) { 
          return keys;
      }	
      var left = [];
      var right = [];
      var newArray = [];
      var pivot = keys.pop();
      var length = keys.length;
  
      for (let i = 0; i < keys.length; i++) {
          let compare = compareVectors(vectors[pivot], vectors[keys[i]], selection);
          console.log(pivot + "<=>" + keys[i] + " Compare: " + compare);
          if (compare > -1) {// if pivot vector is greater than or equal to vectors[keys[i]]
              left.push(keys[i]);
          } else {
              right.push(keys[i]);
          }
      }
      
  
      return newArray.concat(quickSortKeys(left, vectors, selection), pivot, quickSortKeys(right, vectors, selection));
  }
  
  function quickSortKeysOld(keys, vectors, selection) {
      if (keys.length <= 1) { 
          return keys;
      }	
      var left = [];
      var right = [];
      var newArray = [];
      var pivot = keys.pop();
      var length = keys.length;
  
      for (let i = 0; i < keys.length; i++) {
          let compare = compareVectorsOld(vectors[pivot], vectors[keys[i]], selection);
          if (compare > -1) {// if pivot vector is greater than or equal to vectors[keys[i]]
              left.push(keys[i]);
          } else {
              right.push(keys[i]);
          }
      }
      
  
      return newArray.concat(quickSortKeysOld(left, vectors, selection), pivot, quickSortKeysOld(right, vectors, selection));
  }
  
  function quickSortVectorsOld(vectors, selection){
      let keys = Object.keys(vectors);
      console.log("Original Keys");
      console.log(keys);
      let sortedKeys = quickSortKeysOld(keys, vectors, selection);
      console.log("Sorted Keys");
      console.log(sortedKeys);
      let sortedVectors = [];
      for(let i = 0 ; i < sortedKeys.length; i++){
          sortedVectors[" " + sortedKeys[i]] = vectors[sortedKeys[i]]; //convert to original format
      }
      return sortedVectors;
  }
  
  function quickSortVectors(vectors, selection){
      let keys = Object.keys(vectors);
      console.log("Original Keys");
      console.log(keys);
      let sortedKeys = quickSortKeys(keys, vectors, selection);
      console.log("Sorted Keys");
      console.log(sortedKeys);
      let sortedVectors = [];
      for(let i = 0 ; i < sortedKeys.length; i++){
          sortedVectors[" " + sortedKeys[i]] = vectors[sortedKeys[i]]; //convert to original format
      }
      return sortedVectors;
  }
  
  VectorTester.prototype.testBubbleSort = function(...selection){        
      //problems faced: Objects auto sorting keys, comparing 2 vectors to find a higher vector
      //problems present: User with one extremely low attribute would still be paired
      //Testing Implemented: Manually checked small sample result (10 vectors). All vectors are in the correct order
      //Testing required: Hard code vectors with larger size and compare both sorts. Use accuracy to make graphs?
      //Solution: Compare highest and lowest value in each vector against higher/lower vector? Implement single value sorting
      //next step: Draw graphs and consider other sorting algorithm to improve efficiency/accuracy. Create vector order testing suite. OPTIONAL MULTI VALUE SEARCHING?
  
    let vectors = {};
  
    for(i = 0; i < 10; i++){
      let vector = [];
      for(j = 0; j < 10; j++){
        vector.push(Math.floor(Math.random() * 100));
      }
      vectors[Math.floor(Math.random() * 10000)] = vector;
    }
  
  
    console.log("Original Vectors");
    for(let key in vectors){
      console.log(key);
      console.log(vectors[key]);
    }
    let sortedVectors = bubbleSortVectorsOld(vectors);
    console.log("Sorted Vectors");
    for(let key in sortedVectors){
      console.log(key);
      console.log(sortedVectors[key]);
    }
  };

  VectorTester.prototype.testQuickSort = function(...selection){    
    let vectors = {};
      console.log(selection);
    
    for(i = 0; i < 10; i++){
      let vector = [];
      for(j = 0; j < 10; j++){
        vector.push(Math.floor(Math.random() * 100));
      }
      vectors[Math.floor(Math.random() * 10000)] = vector;
    }
  
  
    console.log("Original Vectors");
    for(let key in vectors){
      console.log(key);
      console.log(vectors[key]);
    }
    let sortedVectors = quickSortVectorsOld(vectors, selection);
    console.log("Sorted Vectors");
    for(let key in sortedVectors){
      console.log(key);
      console.log(sortedVectors[key]);
    }
      
  };
  
  VectorTester.prototype.testBubbleSortDifference = function(...selection){    
      let vectors = {};
      for(i = 0; i < 10; i++){
        let vector = [];
        for(j = 0; j < 10; j++){
          vector.push(Math.floor(Math.random() * 100));
        }
        vectors[Math.floor(Math.random() * 10000)] = vector;
      }
      
       console.log("Original Vectors");
        for(let key in vectors){
          console.log(key);
          console.log(vectors[key]);
        }
        let sortedVectors = bubbleSortVectors(vectors, selection);
        console.log("Sorted Vectors");
        for(let key in sortedVectors){
          console.log(key);
          console.log(sortedVectors[key]);
        }
      
  };
  
  VectorTester.prototype.testQuickSortDifference = function(...selection){
      let vectors = {};
      for(i = 0; i < 10; i++){
        let vector = [];
        for(j = 0; j < 10; j++){
          vector.push(Math.floor(Math.random() * 100));
        }
        vectors[Math.floor(Math.random() * 10000)] = vector;
      }
      
       console.log("Original Vectors");
        for(let key in vectors){
          console.log(key);
          console.log(vectors[key]);
        }
        let sortedVectors = quickSortVectors(vectors, selection);
        console.log("Sorted Vectors");
        for(let key in sortedVectors){
          console.log(key);
          console.log(sortedVectors[key]);
        }
  };
  
  module.exports = new VectorTester();