var tiles = ["tiles/piece1.png", "tiles/piece2.png", "tiles/piece3.png", "tiles/piece4.png",
             "tiles/piece5.png", "tiles/piece6.png", "tiles/piece7.png", "tiles/piece8.png",
             "tiles/piece9.png", "tiles/piece10.png", "tiles/piece11.png", "tiles/piece12.png",
             "tiles/piece13.png", "tiles/piece14.png", "tiles/piece15.png", "tiles/piece16.png",
             "tiles/piece17.png", "tiles/piece18.png", "tiles/piece19.png", "tiles/piece20.png",
             "tiles/piece21.png", "tiles/piece22.png", "tiles/piece23.png", "tiles/piece23.png",
             "tiles/piece25.png", "tiles/piece26.png", "tiles/piece27.png", "tiles/piece28.png",
             "tiles/piece29.png", "tiles/piece30.png", "tiles/piece31.png", "tiles/piece32.png",
             "tiles/piece33.png", "tiles/piece34.png", "tiles/piece35.png"];


//color name, is taken, the uuid who has the color
var colors = ["navyPerson", true, 'none', "pinkPerson", true, 'none', "grayPerson", true, 'none', 
			"redPerson", true, 'none', "yellowPerson", true, 'none', "greenPerson", true, 'none', 
			"bluePerson", true, 'none', "orangePerson", true, 'none'];
var playerName = 'none';
var colorChosen = 'none';
var cardsChannel = 'send_cardsaa';
var userChannel = 'user_channelaa';
var nameChannel = 'name_channelaa';
var colorChannel = 'colorChannelaa';

var myUUID =  PUBNUB.db.get('session') || (function(){ 
    var uuid = PUBNUB.uuid(); 
    PUBNUB.db.set('session', uuid); 
    return uuid; 
})();
var pubnub = PUBNUB({
	subscribe_key: 'sub-c-b1b8b6c8-8b1c-11e5-84ee-0619f8945a4f', // always required
	publish_key: 'pub-c-178c8c90-9ea7-46e3-8982-32615dadbba0',    // only required if publishing
	uuid: myUUID,
	heartbeat: 60 //this is wasteful but it is important to know timeouts at this point
});

function shuffle() {
  var currentIndex = tiles.length, temporaryValue, temporaryValue2, randomIndex ;
  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue2 = tiles[currentIndex];
    tiles[currentIndex] = tiles[randomIndex];
    tiles[randomIndex] = temporaryValue2;
  }
  	pubnub.publish({
		channel: cardsChannel,        
		message: {thedeck: tiles},
		callback : function(m){},
		error: function(e){console.log(e)}
	});
}


function colorIsAvaliable(colorIn){
	if(colorIn == 'none')
		return true;
	var arrLen = colors.length;
	for(var i = 0; i + 3 <= arrLen; i += 3){
		if(colors[i] == colorIn){
			if(colors[i + 2] == myUUID){
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

function selectColor(colorIn){
	for(var i = 0; i < colors.length; i += 3){
		if(colors[i] == colorIn){
			//hopefully this error wont occur
			if(colors[i + 1] == false && colors[i + 2] != myUUID){
				alert("this color has already been selected. Please choose another.");
				colorTileAppearance();
				break;
			}
			else{
				colors[i + 1] = false;
				colors[i + 2] = myUUID;
				break;
			}
		}
	}
}

function letsPlay() {
	shuffle();
	// pubnub.publish({
	//     channel: blockChannel,        
	//     message: {gameStatus: "started"},
	//     callback : function(m){},
	//     error: function(e){console.log(e)}
	// });
    pubnub.publish({
	    channel: userChannel,        
	    message: {letsPlay: true},
	    callback : function(m){},
	    error: function(e){console.log(e)}
	});

};
function nameSubmit() {
	//if theyre submitting a new name and color
	if(document.getElementById("namesubmit").value == 'Submit'){
	    if(colorChosen == 'none'){
	    	if(document.getElementById("username").value == '')
	    		alert("Please enter your name and select a color for your marker.");
	    	else
	    		alert("Please select a color for your marker.");
	    }
	    else if(document.getElementById("username").value == '')
	    	alert("Please enter your name.");
	    //makes sure they dont alredy have a color on the screen
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
			pubnub.publish({
			    channel: nameChannel,        
			    message: {namePass: playerName, uuidPass: myUUID},
			    callback : function(m){},
			    error: function(e){console.log(e)}
			});
			console.log("this is the current color chosen: " + colorChosen);
			selectColor(colorChosen);
			document.getElementById("namesubmit").value = 'Change Selection';
		}
		else{
			alert("You had an old value stored. Please try submitting again.");

			pubnub.publish({
			    channel: userChannel,        
			    message: {toRemove: myUUID},
			    callback : function(m){},
			    error: function(e){console.log(e)}
			});
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
		colorChosen = 'none';
		playerName = 'none';
	
		pubnub.publish({
			    channel: userChannel,        
			    message: {entryNumber: myUUID, entryName: 'none', personColor: 'none'},
			    callback : function(m){},
			    error: function(e){console.log(e)}
		});

	}
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
	else if(color != colorChosen && colorChosen != 'none')
	{
		document.getElementById(colorChosen).style.border = "0px solid white";
		colorChosen = color;
		document.getElementById(color).style.border = "5px solid blue";

	}

}

function updateColorArray(colorIn, uuidIn){
	if(colorIn == 'none'){
		for (var i = 2; i < colors.length; i+=3){
			if(colors[i] == uuidIn){
				colors[i - 1] = true;
				colors[i] = 'none';
			}
		}
	}
	else{
		for (var i = 0; i < colors.length; i+=3){
			if(colors[i] == colorIn){
				colors[i + 1] = false;
				colors[i+ 2] = uuidIn;
			}
		}
	}
}

$(document).ready(function() {
	pubnub.subscribe({
		channel: userChannel,
		message: function(m){console.log("I'm listening:" + m)},
		error: function (error) {
			// Handle error here
			console.log("error occured");
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
				updateColorArray(message.personColor, message.entryNumber);
				colorTileAppearance();
				if( document.getElementById(message.personColor) != null 
					&& message.entryNumber != myUUID && message.entryNumber != myUUID)
					document.getElementById(message.personColor).style.visibility = 'hidden';

			
			}
			else if(message.entryNumber != null && message.entryName != null && message.personColor != null 
				&& message.entryName == 'none' && message.personColor == 'none'){
				//user asked for a refresh
				updateColorArray('none', message.entryNumber);

				colorTileAppearance();
			}
			else if (message.letsPlay != null){
				//I actually dont know if this ever gets sent because of the page switch
				pubnub.publish({
				    channel: colorChannel,        
				    message: {colorArray: colors},
				    callback : function(m){},
				    error: function(e){console.log(e)}
				});
				location.href = "gamePg.html";

			}
			else if (message.toRemove != null && document.getElementById(message.toRemove) != null){
                updateColorArray('none', message.toRemove);
				document.getElementById(message.toRemove).remove();
				if(colorChosen != 'none' && document.getElementById(colorChosen) != null)
					document.getElementById(colorChosen).style.border = "0px solid white";
				if(message.toRemove == myUUID){
					colorChosen = 'none';
					playerName = 'none';
				}

				colorTileAppearance();

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
				addName(newArr[i].entryNumber, newArr[i].entryName);
				updateColorArray(newArr[i].personColor, newArr[i].entryNumber);
			}
			else if(newArr[i].toRemove != null && document.getElementById(newArr[i].toRemove) != null){
				document.getElementById(newArr[i].toRemove).remove();
				updateColorArray("none", newArr[i].toRemove);

			}
		}
		colorTileAppearance();
	 },
	 count: 100, // 100 is the default
	 reverse: false, // false is the default
	});
