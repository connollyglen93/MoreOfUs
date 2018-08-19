var vectorTesting = require('../models/test/vectorTesting');

var actUser = require('../models/users/activityUser');
var user = require('../models/users/user');
var activityType = require('../models/activity/activityType');

exports.testAlgorithm = function(req, res) {
  //  return res.send('hi'); var_dump
    vectorTesting.testBubbleSortDifference();
};

exports.loadUsers = function(req,res){
  /*
  let firstNames = ["Soledad","Leandro","Ramonita","Marica","Mirian","Virginia","Alease","Lore","Gilda","Angeles","Luanna","Mackenzie","Danyell","Geraldo","Viola","Ronda","Amber","Svetlana","Sylvie","Ashly","Madeleine","Lurlene","Vallie","Eura","Kasha","Riley","Kristina","Normand","Yvette","Linwood","Shiloh","Nova","Delsie","Avril","Noelle","Katheryn","Pamula","Melissa","August","Mary","Charisse","Mack","Rachal","Beckie","Madelaine","Jame","Cami","Tosha","Charolette","Malinda"];
  let lastNames = ["Handley","Gough","Bruhn","Crotts","Nalls","Frakes","Roderick","Kennerson","Munroe","Macgregor","Millis","Shorts","Pavel","Stobaugh","Russom","Cheadle","Burtt","Re","Camper","Kastner","Levron","Carbonell","Carte","Siggers","Jandreau","Corbitt","Weinstein","Ferra","Songer","Flores","Riesgo","Drolet","Fansler","Renolds","Johnsrud","Corrales","Rodgers","Leon","Rardin","Myles","Redden","Dolloff","Zalewski","Dreiling","Forsberg","Shinn","Brunn","Combest","Lazard","Schmeltzer"];
  for(let i = 0; i < 100; i++){
    let firstName = firstNames[Math.floor(Math.random() * 50)];
    let lastName = lastNames[Math.floor(Math.random() * 50)];
    let username = firstName+lastName;
    user.create({username: username, password: username, date_of_birth: "2001-02-02"}, function (err, userObj) {
      console.log(err);
      actUser.create({userId: userObj._id, typeId: "5a918766734d1d73798d5e08"}, function (err, actUserObj) {
        console.log("New User:");
        console.log("ID: " + userObj._id);
        console.log("Act User ID: " + actUserObj._id);
        console.log("Username: " + userObj.username);
      });
    });
  }
  res.send("Done");
  */
 actUser.find({typeId: "5a918766734d1d73798d5e08", attributeValues: []}, function (err, users) {
   for(let i = 0 ; i < users.length - 1; i++){
    update(users, i);
   }
   function update(users, i){
    users[i].setAttributeValues(function(err){
        if(err){
          update(users, i+1);
        }
    })
   }
   console.log(users.length);
      res.send("Done");
    });
}