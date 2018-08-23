var ActivityUser = require('../users/activityUser');
var fs = require('fs');
let moment = require('moment');

var Calculator = function (comparatorLocation) {
    if(comparatorLocation === undefined){
        this.location = './var/comparator.json';
    }
    this.halfRating = 2.5*1.0;
    this.fullRating = 5;
    this.vectorLength = 0;
};

Calculator.prototype.calcComparator = function(){
    var attributeValues = [];
    self = this;
    ActivityUser.find({}, function(err, users) {
        users.forEach(function (user) {
            user.attributeValues.forEach(function (attribute){
                attributeValues.push(attribute);
            })
        });
        //calc mean
        var mean;
        var total = 0;
        attributeValues.forEach(function(attribute){
            total += attribute;
        });
        mean = total / attributeValues.length;

        //calc squared mean
        var squaredDifferenceTotal = 0;
        var difference;
        attributeValues.forEach(function(attribute){
            difference = attribute - mean;
            difference = Math.pow(difference, 2);
            squaredDifferenceTotal += difference;
        });

        var variance = squaredDifferenceTotal / attributeValues.length;

        var standardDeviation = Math.sqrt(variance);

        if(standardDeviation === 0){ //cover base stats
            standardDeviation = 1;
        }

        var dateTime = moment().format();

        var json = "{comparator: "+standardDeviation+", timestamp: '"+dateTime+"'}";
        fs.writeFile(self.location, json, function(err) {
            if(err) {
                return console.log(err);
            }
            console.log("Comparator Updated!");
        });
        return standardDeviation;
    });
};

Calculator.prototype.refreshComparator = function(){
    self = this;
    fs.readFile(self.location, function read(err, data) {
        if (err) {
            throw err;
        }
        if(!data){
            console.log('Failed to read comparator file');
        }

        var content = data;
        var dateWritten = moment(content.timestamp);
        if(dateWritten < moment().add(-1, 'days').format()){
            return self.calcComparator();
        }
        return false;
    });
};

Calculator.prototype.getComparator = function(_callback){
    self = this;
    fs.readFile(self.location, function read(err, data) {
        if (err) {
            throw err;
        }
        if(!data){
            console.log('Failed to read comparator file');
        }
        data = JSON.parse(data);

        _callback(data.comparator);
    });
};

function compareVectors(a, b, selection){
        let length = a.length;
      
        let higher = 0;
        let equal = 0;
        let lower = 0;
        let compare = 0;
        
        if(a.length < this.vectorLength){
            for(let i = (a.length - 1); i < this.vectorLength; i++){
                a[i] = 0;
            }
        }
        if(b.length < this.vectorLength){
            for(let i = (b.length - 1); i < this.vectorLength; i++){
                b[i] = 0;
            }
        }

        if(selection.length > 0 && selection && selection !== "undefined"){
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
        if (compare > -1) {// if pivot vector is greater than or equal to vectors[keys[i]]
            left.push(keys[i]);
        } else {
            right.push(keys[i]);
        }
    }
    

    return newArray.concat(quickSortKeys(left, vectors, selection), pivot, quickSortKeys(right, vectors, selection));
}

function quickSortVectors(vectors, selection){
    let keys = Object.keys(vectors);
    for(let key in vectors){
        if(vectors[key].length !== 0){
            this.vectorLength = vectors[key].length; //set vector length to be used in the event of two vectors being empty
            break;
        }
    }
    if(this.vectorLength === 0){
        return vectors;
    }
    console.log("Original Keys");
    console.log(keys);
    let sortedKeys = quickSortKeys(keys, vectors, selection);

    let sortedVectors = [];
    for(let i = 0 ; i < sortedKeys.length; i++){
        sortedVectors[" " + sortedKeys[i]] = vectors[sortedKeys[i]]; //convert to original format
    }
    console.log("Sorted Vectors");
    console.log(sortedVectors);
    return sortedVectors;
}

function quicksortCosine(cosineObjs){
    if (cosineObjs.length <= 1) { 
        return cosineObjs;
    }	
    var left = [];
    var right = [];
    var newArray = [];
    var pivot = cosineObjs.pop();
    var length = cosineObjs.length;

    for (let i = 0; i < cosineObjs.length; i++) {
        if (pivot.cosine >= cosineObjs[i].cosine) {// if cosine similarity of pivot vector is greater than or equal cosine similarity to vectors[keys[i]]
            left.push(cosineObjs[i]);
        } else {
            right.push(cosineObjs[i]);
        }
    }
    

    return newArray.concat(quicksortCosine(left), pivot, quicksortCosine(right));
}

function convertToCosine(keys, vectors, comparator){
    let newVectors = [];
    for(let i = 0; i < keys.length; i++){
        let cosine = similarity(vectors[keys[i]], comparator);
        newVectors.push({key : keys[i], attributes :vectors[keys[i]], cosine: cosine });
    }
    return newVectors;
}

function cosineSimilarity(vectors, currentUser){
    let keys = Object.keys(vectors);
    let comparator = currentUser.attributeValues;
    let convertedObjs = convertToCosine(keys, vectors, comparator);
    console.log("converted");
    for(let i = 0; i < convertedObjs.length; i++){
        console.log(convertedObjs[i].attributes + "-" + convertedObjs[i].cosine);
    }
    let sortedConvertedObjs = quicksortCosine(convertedObjs);
    console.log("Sorted");
    for(let i = 0; i < sortedConvertedObjs.length; i++){
        if(JSON.stringify(sortedConvertedObjs[i].attributes) === JSON.stringify(comparator)){
            console.log(sortedConvertedObjs[i].attributes + "-" + sortedConvertedObjs[i].cosine + "- Current");
        }else{
            console.log(sortedConvertedObjs[i].attributes + "-" + sortedConvertedObjs[i].cosine);
        }
    }
    let revertedObjs = [];

    for(let i = 0 ; i < sortedConvertedObjs.length; i++){
        revertedObjs[" " + sortedConvertedObjs[i].key] = sortedConvertedObjs[i].attributes; //convert to original format
    }
 //   console.log("Sorted Vectors");
  //  console.log(revertedObjs);
    return revertedObjs;
}

Calculator.prototype.sortVectors = function(...parameters){
    let _callback = parameters.pop();
    let vectors = parameters[0];
    let selection = false;
    if(parameters.length > 1){
        if(typeof parameters[1] !== "undefined" && parameters[1].length > 0){
            selection = parameters[1];
        }else{
            selection = false;
        }
    }else{
        selection = false;
    }
    
    let sortedVectors = quickSortVectors(vectors, selection);
    let vectorResult = [];
    for(let key in sortedVectors){
        vectorResult.push({key: key, value: sortedVectors[key]});
    }
    _callback(vectorResult);
};

Calculator.prototype.calcCosineSimilarity = function(...parameters){
    let _callback = parameters.pop();
    let vectors = parameters[0];
    let currentUser = parameters[1];
    let sortedVectors = cosineSimilarity(vectors, currentUser);
    let vectorResult = [];
    for(let key in sortedVectors){
        vectorResult.push({key: key, value: sortedVectors[key]});
    }
    _callback(vectorResult);
};

Calculator.prototype.findNotParticipating = function(...parameters){
    let _callback = parameters.pop();
    let sortedVectors = parameters[0];
    let currentUser = parameters[1];
    console.log(currentUser);
    let participants = parameters[2];
    let index = 0;
    for(let sortedVectorKey in sortedVectors){
        let currentVector = sortedVectors[sortedVectorKey];
        let ids = currentVector.key.split("|");
        let userIdFound = ids[0].trim();
        let actUserIdFound = ids[1].trim();
        console.log(sortedVectorKey + " - " + userIdFound + " - " + currentVector.value);
/*         participants.filter(function(participant){
            return participant.equals(actUserIdFound);
        }); */
        participants.forEach(function(participant){
            if(participant.equals(actUserIdFound)){
                delete sortedVectors[sortedVectorKey];
            }
        })
/*         for(let i in participants){
            if(participants[i].equals(actUserIdFound)){
                delete sortedVectors[sortedVectorKey];
            }
        } */
        if (currentUser.userId.equals(userIdFound)) {
            index = sortedVectorKey;
            console.log(sortedVectors[index]);
            delete sortedVectors[sortedVectorKey];
        }
        
    }
    console.log("Index");
    console.log(index);
    let freshSortedVectors= [];
    sortedVectors.forEach(function(sortedVector){
        freshSortedVectors.push(sortedVector);
    });

    _callback(freshSortedVectors, index);

}

Calculator.prototype.generateUpdatedAttributeValue = function(ratingObj, callback){
    let totalRating = 0;
    let self = this;
    console.log({Attr_Index: ratingObj.attrIndex});
    console.log({Rating_Values: ratingObj.values});
    ratingObj.values.forEach(function(rating){
        //ratings range between 0 and 5
        // 5 == 1 and 0 == -1
        if(rating !== self.halfRating){
            rating = rating - self.halfRating; // value between -2.5 and 2.5
            rating = rating/self.halfRating ; //floating point between -1 and 1
        }else{
            rating = 0.1; //prevent no rating from occuring on selection on 2.5(halfRating) rating 
        }
        totalRating += rating;
    });
    if(totalRating < 0){ //total rating cannot be less than 0
        callback(false, 0);
    }else{
        let x = totalRating;
        let y = 0;
        //x always greater than 1 to make y land between 0 and 1
        y = x+1;
        //increase the rate at which y decreases against x
        y = Math.pow(y, 0.5);
        //multiplicative inverse
        y = 1/y;
        //reverse the direction of the approach (y approaches 1 instead of 0)
        y = 1 - y;
        //increase the range from 0->1 to 0->100
        y = y * 100;
        console.log({x : x, y: y});
        callback(false, y);
    }
}


function dotproduct(a,b) {
    var n = 0, lim = Math.min(a.length,b.length);
    for (var i = 0; i < lim; i++) n += a[i] * b[i];
    return n;
 }

function norm2(a) {var sumsqr = 0; for (var i = 0; i < a.length; i++) sumsqr += a[i]*a[i]; return Math.sqrt(sumsqr);}


function similarity(a, b) {return dotproduct(a,b)/norm2(a)/norm2(b);}

function cosine_sim(x, y) {
    xnorm = norm2(x);
    if(!xnorm) return 0;
    ynorm = norm2(y);
    if(!ynorm) return 0;
    return dotproduct(x, y) / (xnorm * ynorm);
}

Calculator.prototype.altSortVectors = function(...parameters){
    let _callback = parameters.pop();
    let vectors = parameters[0];
    let currentUser = parameters[1];
    let selection = false;
    if(parameters.length > 2){
        if(typeof parameters[2] !== "undefined" && parameters[2].length > 0){
            selection = parameters[2];
        }else{
            selection = false;
        }
    }else{
        selection = false;
    }
    let comparator = currentUser.attributeValues;
    let sortedVectors = altQuickSortVectors(vectors, comparator, selection);
    let vectorResult = [];
    for(let key in sortedVectors){
    //    revertedObjs[" " + sortedConvertedObjs[i].key] = sortedConvertedObjs[i].attributes; //convert to original format

        vectorResult.push({key: key, value: sortedVectors[key]});
    }
    _callback(vectorResult);
};

function altQuickSortVectors(vectors, comparator, selection){
    let keys = Object.keys(vectors);
    console.log("Original Keys");
    console.log(keys);
 //   let sortedKeys = quickSortKeys(keys, vectors, selection);

    let convertedObjs = convertToRepresentatives(keys, vectors, comparator, selection);
    console.log("converted");
    for(let i = 0; i < convertedObjs.length; i++){
        console.log(convertedObjs[i].attributes + "-" + convertedObjs[i].representative);
    }
    let sortedConvertedObjs = quicksortRepresentatives(convertedObjs);
    console.log("Sorted");
    for(let i = 0; i < sortedConvertedObjs.length; i++){
        if(JSON.stringify(sortedConvertedObjs[i].attributes) === JSON.stringify(comparator)){
            console.log(sortedConvertedObjs[i].attributes + "-" + sortedConvertedObjs[i].representative + "- Current");
        }else{
            console.log(sortedConvertedObjs[i].attributes + "-" + sortedConvertedObjs[i].representative);
        }
    }
  //  let sortedVectors = quickSortVectors(vectors, selection);
    let sortedVectors = [];
    for(let i = 0 ; i < sortedConvertedObjs.length; i++){
        sortedVectors[" " + sortedConvertedObjs[i].key] = sortedConvertedObjs[i].attributes; //convert to original format
    }

    console.log("Sorted Vectors");
    console.log(sortedVectors);
    return sortedVectors;
}

function quicksortRepresentatives(repObjs){
    if (repObjs.length <= 1) { 
        return repObjs;
    }	
    var left = [];
    var right = [];
    var newArray = [];
    var pivot = repObjs.pop();
    var length = repObjs.length;

    for (let i = 0; i < repObjs.length; i++) {
        if (pivot.representative >= repObjs[i].representative) {// if representative of pivot vector is greater than or equal representative to vectors[keys[i]]
            left.push(repObjs[i]);
        } else {
            right.push(repObjs[i]);
        }
    }
    

    return newArray.concat(quicksortRepresentatives(left), pivot, quicksortRepresentatives(right));
}

function convertToRepresentatives(keys, vectors, comparator, selection){
    let newVectors = [];
    for(let i = 0; i < keys.length; i++){
    //    let representative = compareVectors(vectors[keys[i]], comparator, selection);
        let representative = convertToAverage(vectors[keys[i]]);
        newVectors.push({key : keys[i], attributes :vectors[keys[i]], representative: representative });
    }
    return newVectors;
}

function convertToAverage(vector){
    let total = 0;
    for(let i = 0; i < vector.length; i++){
        total += vector[i];
    }
    let average = total / vector.length;
    return average;
}


module.exports = new Calculator();