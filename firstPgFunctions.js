var tiles = ["tiles/piece1.png", "tiles/piece2.png", "tiles/piece3.png", "tiles/piece4.png",
             "tiles/piece5.png", "tiles/piece6.png", "tiles/piece7.png", "tiles/piece8.png",
             "tiles/piece9.png", "tiles/piece10.png", "tiles/piece11.png", "tiles/piece12.png",
             "tiles/piece13.png", "tiles/piece14.png", "tiles/piece15.png", "tiles/piece16.png",
             "tiles/piece17.png", "tiles/piece18.png", "tiles/piece19.png", "tiles/piece20.png",
             "tiles/piece21.png", "tiles/piece22.png", "tiles/piece23.png", "tiles/piece23.png",
             "tiles/piece25.png", "tiles/piece26.png", "tiles/piece27.png", "tiles/piece28.png",
             "tiles/piece29.png", "tiles/piece30.png", "tiles/piece31.png", "tiles/piece32.png",
             "tiles/piece33.png", "tiles/piece34.png", "tiles/piece35.png"];
var userChannel = 'user_channel01'; //THESE NEED TO MATCH SECOND PG CHANNEL NAMES
var pieceMovementChannel = 'piece_movement01';
var userInformationChannel = "user_info01";
var cardsChannel = 'send_cards01';
var colorChannel = 'colorChannel01';
var blockChannel = 'block_channel01';
//color name, is taken, the uuid who has the color
var colors = ["navyPerson", true, 'none', "pinkPerson", true, 'none', "grayPerson", true, 'none', 
			"redPerson", true, 'none', "yellowPerson", true, 'none', "greenPerson", true, 'none', 
			"bluePerson", true, 'none', "orangePerson", true, 'none'];
var playerName = 'none';
var colorChosen = 'none';
var startSpot = -1;
var myUUID =  PUBNUB.db.get('session') || (function(){ 
    var uuid = PUBNUB.uuid(); 
    PUBNUB.db.set('session', uuid); 
    return uuid; 
})();
var pubnub = PUBNUB({
	subscribe_key: 'sub-c-b1b8b6c8-8b1c-11e5-84ee-0619f8945a4f', // always required
	publish_key: 'pub-c-178c8c90-9ea7-46e3-8982-32615dadbba0',    // only required if publishing
	uuid: myUUID,
	heartbeat: 30 //this is wasteful but it is important to know timeouts at this point
});

function shuffle() {
  var currentIndex = tiles.length, temporaryValue, temporaryValue2, randomIndex ;
  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    // temporaryValue = array[currentIndex];
    temporaryValue2 = tiles[currentIndex];
    // array[currentIndex] = array[randomIndex];
    tiles[currentIndex] = tiles[randomIndex];
    // array[randomIndex] = temporaryValue;
    tiles[randomIndex] = temporaryValue2;
  }
  	pubnub.publish({
		channel: cardsChannel,        
		message: {thedeck: tiles},
		callback : function(m){},
		error: function(e){console.log(e)}
	});
	console.log("this is the correct one");
	console.log(tiles);
}

function colorIsAvaliable(colorIn){
	if(colorIn == 'none')
		return true;
	var arrLen = colors.length;
	for(var i = 0; i + 3 <= arrLen; i += 3){
		if(colors[i] == colorIn){
			console.log("here with: " + colors[i]);
			if(colors[i + 2] == myUUID){
				console.log(colors [i+2]);
				console.log(myUUID);
				return true;
			}
			else
				return colors[i + 1];
		}

	}
	//if it makes it here your color was invalid
	console.log("error in isColorAvaliable function!!!!!!!!!!!!!");
}

function colorTileAppearance(){
	var lengthofarr = colors.length;
	for(var i = 0; i + 3 <= lengthofarr; i += 3){
		var temp = colors[i];
 		//if the color is free, display it
 		if(colors[i + 1] == true && colorChosen == 'none'){
 			document.getElementById(colors[i]).style.visibility = 'visible';
 			document.getElementById(colors[i]).style.height = '15%';
 			document.getElementById(colors[i]).style.width = '30%';
 		}
 		else{
			document.getElementById(colors[i]).style.visibility = 'hidden';
			document.getElementById(colors[i]).style.height = '2%';
 		}
 	}
 	if(colorChosen != 'none'){
 			document.getElementById(colorChosen).style.visibility = 'visible';
 			document.getElementById(colorChosen).style.width = '60%';
 			document.getElementById(colorChosen).style.height = '60%';
 			document.getElementById(colorChosen).style.border = '0px';
 			document.getElementById("namesubmit").value = 'Change Selection';
 	}
}
function refreshColorsDisplayed(){
	pubnub.history({
	     channel: colorChannel,
	     callback: function(m){
	     	if(m[0][0] != null) //it should only be null the very first time and at beginning of day
	     		colors = m[0][0].colorArray;
	     	else
	     		console.log("its just using the hardcoded array");
	     	console.log(colors);
	     	colorTileAppearance();
		 },
	     count: 1, // 100 is the default
	     reverse: false, // false is the default
	});
}

function selectColor(colorIn){
	for(var i = 0; i < colors.length; i += 3){
		if(colors[i] == colorIn){
			//hopefully this error wont occur
			if(colors[i + 1] == false && colors[i + 2] != myUUID){
				alert("this color has already been selected. Please choose another.");
				refreshColorsDisplayed();
				break;
			}
			else{
				colors[i + 1] = false;
				colors[i + 2] = myUUID;
				break;
			}
		}
	}
	pubnub.publish({
	    channel: colorChannel,        
	    message: {colorArray: colors},
	    callback : function(m){},
	    error: function(e){console.log(e)}
	});
}

function letsPlay() {
	shuffle();
	pubnub.publish({
	    channel: blockChannel,        
	    message: {gameStatus: "started"},
	    callback : function(m){},
	    error: function(e){console.log(e)}
	});
    pubnub.publish({
	    channel: userChannel,        
	    message: {letsPlay: true},
	    callback : function(m){},
	    error: function(e){console.log(e)}
	});

};

function resetColorSelector(){
	colorChosen = 'none';
	playerName = 'none';
	//restore old html
}

function checkForColorRepeats(){
	pubnub.history({
	     channel: colorChannel,
	     callback: function(m){
	     	console.log("in check for color repeats");
	     	//console.log(JSON.stringify(m));
	     	console.log(colors);
	     	if(m[0][0] != null){
	     		colors = m[0][0].colorArray;
	     	}
			if(colorIsAvaliable(colorChosen) == false){
				alert("Your previously chosen color has been selected by another user. Please resubmit your information.");
				resetColorSelector();
				colorTileAppearance();
			}
			else
				selectColor(colorChosen);	
		 },
	     count: 1, // 100 is the default
	     reverse: false, // false is the default
	});
}

function nameSubmit() {
	if(document.getElementById("namesubmit").value == 'Submit'){
	    if(colorChosen == 'none'){
	    	if(document.getElementById("username").value == '')
	    		alert("Please enter your name and select a color for your marker.");
	    	else
	    		alert("Please select a color for your marker.");
	    }
	    else if(document.getElementById("username").value == '')
	    	alert("Please enter your name.");
	    else if(document.getElementById(myUUID) == null){
			//this will add their name to the list
			pubnub.publish({
						    channel: userChannel,        
						    message: {entryNumber: myUUID, entryName: document.getElementById("username").value, personColor: colorChosen},
						    callback : function(m){},
						    error: function(e){console.log(e)}
			});
			if(document.getElementById("playNameTxt") == null)
				console.log("problem found");
			playerName = document.getElementById("username").value;
			console.log("this is the current color chosen: " + colorChosen);
			selectColor(colorChosen);
			document.getElementById("namesubmit").value = 'Change Selection';
		}
	}
	//theyre asking for a refresh
	else {
		document.getElementById("namesubmit").value = 'Submit';
		//remove their name from the list
		pubnub.publish({
						    channel: userChannel,        
						    message: {toRemove: myUUID},
						    callback : function(m){},
						    error: function(e){console.log(e)}
		});
		//find their color and unreserve it
		var len = colors.length;
		for(var i = 0; i + 3 < len; i += 3){
			if(colors[i] == colorChosen){
				colors[i + 1] = true;
				colors[i + 2] = 'none';
				break;
			}
		}
		colorChosen = 'none';
		playerName = 'none';
		pubnub.publish({
		    channel: colorChannel,        
		    message: {colorArray: colors},
		    callback : function(m){},
		    error: function(e){console.log(e)}
		});
		pubnub.publish({
			    channel: userChannel,        
			    message: {entryNumber: myUUID, entryName: 'none', personColor: 'none'},
			    callback : function(m){},
			    error: function(e){console.log(e)}
		});

	}
	//this is so that color selection will be tied with uuid
	pubnub.publish({
			    channel: userInformationChannel,        
			    message: {uuidPass: myUUID, pname: playerName, colorPass: colorChosen},
			    callback : function(m){},
			    error: function(e){console.log(e)}
	});
};


function addName(usernumber, usernameIN){
	var list = document.getElementById('demo');
    var entry = document.createElement('li');
    entry.setAttribute("id", usernumber);
	entry.appendChild(document.createTextNode(usernameIN));
	list.appendChild(entry);


}

function highlightColor(color){
	if(colorChosen == 'none')
	{
		colorChosen = color;
		document.getElementById(color).style.border = "5px solid blue";
	}
	if(color != colorChosen && colorChosen != 'none')
	{
		document.getElementById(colorChosen).style.border = "0px solid white";
		colorChosen = color;
		document.getElementById(color).style.border = "5px solid blue";

	}

}


$(document).ready(function() {
	console.log("my id: " + myUUID); //uuids are now persistant
	//used for letsplay, and the list of names (removal/addition etc)
	pubnub.subscribe({
		channel: userChannel,
		message: function(m){console.log("I'm listening:" + m)},
		error: function (error) {
		// Handle error here
			console.log("error occured");
			console.log(JSON.stringify(error));
		},
		presence: function(m){
			console.log(m);
			// updateUsers(m.occupancy);
			if(m.action == 'leave' || m.action == 'timeout'){
				if(document.getElementById(m.uuid) != null){		
					pubnub.publish({
						    channel: userChannel,        
						    message: {toRemove: m.uuid},
						    callback : function(m){},
						    error: function(e){console.log(e)}
					});
				}
			}
		},
		connect: function(){console.log("connected")},
		disconnect: function(){console.log("disconnected")},
		callback: function(message, envelope, channel){
			console.log(message);
			if(message.entryNumber != null && message.entryName != null && message.personColor != null 
				&& message.entryName != 'none' && message.personColor != 'none'){
				addName(message.entryNumber, message.entryName);
				if( document.getElementById(message.personColor) != null && message.entryNumber != myUUID)
					document.getElementById(message.personColor).style.visibility = 'hidden';
			}
			else if (message.letsPlay != null){
				//just for good measure
				pubnub.publish({
				    channel: colorChannel,        
				    message: {colorArray: colors},
				    callback : function(m){},
				    error: function(e){console.log(e)}
				});
				location.href = "gamePg.html";

			}
			else if (message.toRemove != null && document.getElementById(message.toRemove) != null){
                var lenOfCol = colors.length;
                for(var i = 2; i < lenOfCol; i += 3){
                    if(colors[i] == message.toRemove){
                        console.log(colors[i]);
                        console.log(colors[i-1]);
                        colors[i-1] = true;
                        break;
                    }
                }
				document.getElementById(message.toRemove).remove();
				//publish results so everyone gets them
                pubnub.publish({
                    channel: colorChannel,        
                    message: {colorArray: colors},
                    callback : function(m){},
                    error: function(e){console.log(e)}
                });
			}
		}
	});

	//restores the list of names
	pubnub.history({
     channel: userChannel,
     callback: function(m){
     	//console.log(JSON.stringify(m));
     	var newArr = m[0];
     	var arrayLength = newArr.length;
		for (var i = 0; i < arrayLength; i++) {
         	if(newArr[i].entryNumber != null && newArr[i].entryName != null
         		&& newArr[i].entryName != 'none' && newArr[i].personColor != 'none'){
				addName(newArr[i].entryNumber, newArr[i].entryName );
			}
			else if(newArr[i].toRemove != null && document.getElementById(newArr[i].toRemove) != null){
				document.getElementById(newArr[i].toRemove).remove();
			}
		}
	 },
     count: 100, // 100 is the default
     reverse: false, // false is the default
    });

	//deals with passing the color array
	pubnub.subscribe({
		channel: colorChannel,
		message: function(m){console.log("I'm listening:" + m)},
		error: function (error) {
		// Handle error here
			console.log("error occured");
			console.log(JSON.stringify(error));
		},
		connect: function(){console.log("connected")},
		disconnect: function(){console.log("disconnected")},
		callback: function(message, envelope, channel){
			console.log(message);
			if(message.colorArray != null ){
				colors = message.colorArray;
				colorTileAppearance();
			}
		}
	});

	//this is so that it remembers the user and their previous color selection
	pubnub.history({
     channel: userInformationChannel,
     callback: function(m){
     	//console.log(JSON.stringify(m));
   		refreshColorsDisplayed();
   		var url = location.href;
		var filename = url.substring(url.lastIndexOf('/')+1)
     	var newArr = m[0];
     	console.log("hist arr");
     	console.log(newArr);
     	//console.log(newArr);
     	var arrayLength = newArr.length;
		for (var i = 0; i < arrayLength; i++) {
	        if(newArr[i].uuidPass != null && newArr[i].uuidPass == myUUID
	        	&& newArr[i].pname != null && newArr[i].colorPass != null 
	        	){
					playerName = newArr[i].pname; 
					colorChosen = newArr[i].colorPass;
					console.log(playerName + "    " + colorChosen);
					if(newArr[i].colorPass != 'none' && newArr[i].pname!= 'none')
						checkForColorRepeats(); //incase your color is taken

			}
			
			
		}
		
	 },
     count: 100, // 100 is the default
     reverse: false, // false is the default
 	});

 	pubnub.history({
     channel: blockChannel,
     callback: function(m){
     	console.log("history");
     	console.log(JSON.stringify(m));
     	var newArr = m[0];
     	var arrayLength = newArr.length;
     	var statusFound = false;
		for (var i = arrayLength - 1; i >= 0 && !statusFound; i--) {
			var temp = newArr[i];
         	if(newArr[i].gameStatus != null ){
         		statusFound = true;
				if(newArr[i].gameStatus == 'started')
					alert("A game is in progress, please exit and try again later.");
				else if(newArr[i].gameStatus =='finished')
					break;
			}
		}
	 },
     count: 50, // 100 is the default
     reverse: false, // false is the default
    });

});
