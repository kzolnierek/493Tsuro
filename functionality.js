
var tiles = ["tiles/piece1.png", "tiles/piece2.png", "tiles/piece3.png", "tiles/piece4.png",
             "tiles/piece5.png", "tiles/piece6.png", "tiles/piece7.png", "tiles/piece8.png",
             "tiles/piece9.png", "tiles/piece10.png", "tiles/piece11.png", "tiles/piece12.png",
             "tiles/piece13.png", "tiles/piece14.png", "tiles/piece15.png", "tiles/piece16.png",
             "tiles/piece17.png", "tiles/piece18.png", "tiles/piece19.png", "tiles/piece20.png",
             "tiles/piece21.png", "tiles/piece22.png", "tiles/piece23.png", "tiles/piece23.png",
             "tiles/piece25.png", "tiles/piece26.png", "tiles/piece27.png", "tiles/piece28.png",
             "tiles/piece29.png", "tiles/piece30.png", "tiles/piece31.png", "tiles/piece32.png",
             "tiles/piece33.png", "tiles/piece34.png", "tiles/piece35.png"];
var colors = ["navyPerson", true, 'none', "pinkPerson", true, 'none', "grayPerson", true, 'none', 
			"redPerson", true, 'none', "yellowPerson", true, 'none', "greenPerson", true, 'none', 
			"bluePerson", true, 'none', "orangePerson", true, 'none'];
var playerName = 'none';
var colorChosen = 'none';
var lastCard = "none";
var nextSquareForTile = 0;
var thisPlayersTurn = 'none'; //this gets set in playerTurns with their player id
var startSpot = -1;
var dead = false; //tells if the player is dead
var piecePlacement = true; //the time when players pick their start spots 
var allTileInfo;
var gameChannel = 'game_channel391';
var userChannel = 'user_channel391';
var cardsChannel = 'send_cards391';
var colorChannel = 'colorChannel391';
var blockChannel = 'block_channel391';
var userInformationChannel = "user_info391";

var turnoBlanca=true;



var myUUID =  PUBNUB.db.get('session') || (function(){ 
    var uuid = PUBNUB.uuid(); 
    PUBNUB.db.set('session', uuid); 
    return uuid; 
})();
var tileSpotNumber = -1;
var angle = 0;

var pubnub = PUBNUB({
subscribe_key: 'sub-c-b1b8b6c8-8b1c-11e5-84ee-0619f8945a4f', // always required
publish_key: 'pub-c-178c8c90-9ea7-46e3-8982-32615dadbba0',    // only required if publishing
uuid: myUUID,
heartbeat: 30 //kind of wasteful so we can increase it if you want but it is used for presence in the game
});

$(document).ready(main);

//sets that brown banner thing
function main(){
    organizarTablero();
    $("#turnos").css("background","url(holder.png)"); //this sets up the weird banner
    controlarFlujo();
    setUpTileArray();

    //SHUFFLE CARDS GOES HERE (dont forget to publish the array after--unless they will all shuffle the same -- and also if theyre all publishing make sure only the last one is registered for all users)

    //set up subscriptions
    pubnub.subscribe({
		channel: gameChannel,
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
			//from submitCard
			if(message.spot != undefined && message.card != undefined){
				addCard(message.spot, message.card);
				movePlayerPiece();
				//THIS IS WHERE YOU WILL MOVE THE PLAYER'S PIECE (have it call a diff fn)
				//IT WILL NEED TO CHECK IF THE INDIVIDUAL USER IS NEXT TO THE SPOT AND
				//IF IT IS THEN IT WILL MOVE IT AND UPDATE ALL LOCAL RELEVANT VARS
				// EX IT SHOULD UPDATE NEXT SQUARE FOR TILE
				// ALSO CHECK FOR DEATH
			}
			//this is for the player spot movement
			if(message.colorPassed != undefined && message.fileN != undefined 
				&& message.tileN != undefined && message.beginning != undefined){
				if(message.tileN == -1 || message.fileN == -1){
					if(message.colorPassed != colorChosen){
						$("#" + message.colorPassed).remove();
						console.log(colorChosen + " has died.");
					}
					//get next player's turn/ check for win
					var colLen = colors.length;
					for(var i = 0; i < colLen; i += 3){
						if(i > colLen) //because these loops suck
							break;
						var tempp = colors[i];
						if(colors[i] == message.colorPassed){ //you found the dead one
							var infiniteLoopProof = 0;
							var k = i + 5; //start at next color id
							while(infiniteLoopProof < 16 && thisPlayersTurn == colors[i + 2]){
								var testvariable = colors[k];
								if(colors[k] != 'none' && colors[k] != thisPlayersTurn){ //there is another player avaliable
									thisPlayersTurn = colors[k];
								}
								if(k > colLen) //start at beginning of list
									k = 2;
								else
									k += 3;
								++infiniteLoopProof;
							}
							colors[i + 2] = 'none';
							colors[i + 1] = true;
							//check for a third player - if not then it is a win
							var playersLeftCount = 0;
							for(var j = 0; j < colLen; j++){
								if (colors[j] == 'none')
									playersLeftCount++;
							}
							if(8 - playersLeftCount <= 1)
								win();

						}
					}
				}
				else{
					placePersonMarker(message.colorPassed, message.fileN, message.tileN);
					if(message.beginning == false)
						playerTurns();
				}


			}
		}
	});
	
	//this just removes cards from the tiles array
	pubnub.subscribe({
		channel: cardsChannel,
		message: function(m){console.log("send cards listening:" + m)},
		error: function (error) {
		// Handle error here
			console.log("error occured");
			console.log(JSON.stringify(error));
		},
		connect: function(){console.log("connected")},
		disconnect: function(){console.log("disconnected")},
		callback: function(message, envelope, channel){

			//just add another tile
			if(message.replacement != undefined && tiles.length >= message.replacement){
				//console.log("removing " + message.replacement + "cards from the deck");
				//console.log("before: " + tiles);
				tiles.splice(0, message.replacement);
				//console.log("after: " + tiles);
			}
			else
				console.log("prob with cards");
		}
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
            }
        }
    });
    //get color array from first pg
    pubnub.history({
	     channel: colorChannel,
	     callback: function(m){
	     	if(m[0][0] != null) //it should only be null the very first time and at beginning of day
	     		colors = m[0][0].colorArray;
	     	else
	     		console.log("its just using the hardcoded array");
	     	console.log("in the color history channel");
	     	console.log(colors);
		 },
	     count: 1, // 100 is the default
	     reverse: false, // false is the default
	});

    //this is so that it remembers the user and their previous color selection
    pubnub.history({
     channel: userInformationChannel,
     callback: function(m){
        //console.log(JSON.stringify(m));
        var url = location.href;
        var filename = url.substring(url.lastIndexOf('/')+1)
        var newArr = m[0];
        var found = false;
        var arrayLength = newArr.length;
        for (var i = 0; i < arrayLength; i++) {
            if(newArr[i].uuidPass != null && newArr[i].uuidPass == myUUID
                && newArr[i].pname != 'none' && newArr[i].colorPass != 'none'){
                found = true;
                playerName = newArr[i].pname; 
                colorChosen = newArr[i].colorPass; 
                //put the player's color at the top
                console.log("the player selected: " + colorChosen);
                if($("#lgPlayerPiece").length > 0)
                    $("#lgPlayerPiece").attr("src", 'personMarkers/'+ colorChosen + '.png');
                
            }
        }
        if(!found){
            alert("You did not select a color and name on the previous page.")
        }
        
     },
     count: 100, // 100 is the default
     reverse: false, // false is the default
    });
	
	//used for registering when people leave
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
				pubnub.publish({
					    channel: userChannel,        
					    message: {toRemove: m.uuid},
					    callback : function(m){},
					    error: function(e){console.log(e)}
				});
			}
		},
		connect: function(){console.log("connected")},
		disconnect: function(){console.log("disconnected")},
		callback: function(message, envelope, channel){
			console.log(message);
			// if(message.entryNumber != null && message.entryName != null && message.personColor != null 
			// 	&& message.entryName != 'none' && message.personColor != 'none'){
			// 	addName(message.entryNumber, message.entryName);
			// 	if( document.getElementById(message.personColor) != null && message.entryNumber != myUUID)
			// 		document.getElementById(message.personColor).style.visibility = 'hidden';
			
			if (message.toRemove != null){
				//THIS COULD EVENTUALLY ALSO REMOVE THEIR COLOR PIECE AND NOTIFY THE OTHER PLAYERS IF SOMEONE JUST EXITS
                var lenOfCol = colors.length;
                for(var i = 2; i < lenOfCol; i += 3){
                    if(colors[i] == message.toRemove){
                        console.log(colors[i]);
                        console.log(colors[i-1]);
                        colors[i-1] = true;
                        break;
                    }
                }
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

	//restore any previous players place settings
	pubnub.history({
    	 channel: blockChannel,
     	callback: function(m){
     	console.log("block history");
     	console.log(JSON.stringify(m));
     	console.log("done with block history");
     	var newArr = m[0];
     	var arrayLength = newArr.length;
     	var startFound = false;
		for (var i = arrayLength - 1; i >= 0 && !startFound; i--) {
         	if(newArr[i].gameStatus != null ){
         		startFound = true;
			}
			else if(newArr[i].colorPassed != undefined && 
				newArr[i].fileN != undefined && newArr[i].tileN != undefined 
				&& newArr[i].beginning != undefined){
				//you just want the newest ones -not ones that they updated
				var isItInGame = $("#" + newArr[i].colorPassed);
				if(isItInGame.length <= 0)
					placePersonMarker(newArr[i].colorPassed, newArr[i].fileN, newArr[i].tileN);
			}

		}
	 },
     count: 50, // 100 is the default
     reverse: false, // false is the default
    });

	timerFunction();

} //end of main

//setup turns and change turn
function playerTurns(){
	var i = 2;
	var overallCount = 0; //just so it is not endless
	var set = false;
	var oldFound = false;
	var colorLen = colors.length;
	while(!set && overallCount <= 16){
		var whoisthis  = colors[i];
		if(thisPlayersTurn == 'none' && colors[i] != 'none'){
			thisPlayersTurn = colors[i];
			break;
		}
		else if(colors[i] == thisPlayersTurn){
			oldFound = true;
		}
		else if(oldFound && colors[i] != 'none'){
			thisPlayersTurn = colors[i];
			set = true;
		}
		if(i + 3 <= colorLen)
			i += 3;
		else
			i = 2;
		++overallCount;
	}
	if(oldFound && overallCount >= 16){
		win();
	}
	controlarFlujo();
	console.log(colors);
	console.log("up next: " + thisPlayersTurn);
}


//the paths start at the top left corner being called spot oneTo so that it
//reads like " one goes to four"
function tileInfo(fileName, one, two, three, four, five, six, seven, eight){
	this.fileName = fileName;
	this.oneTo = one; 
	this.twoTo = two;
	this.threeTo = three;
	this.fourTo = four;
	this.fiveTo = five;
	this.sixTo = six;
	this.sevenTo = seven;
	this.eightTo = eight;
}

function setUpTileArray(){
	////////////// spots ////////////  1  2  3  4  5  6  7  8
	var one    = ["tiles/piece1.png" , 2, 1, 4, 3, 6, 5, 8, 7];
	var two    = ["tiles/piece2.png" , 8, 7, 4, 3, 6, 5, 2, 1];
	var three  = ["tiles/piece3.png" , 8, 3, 2, 7, 6, 5, 4, 1];
    var four   = ["tiles/piece4.png" , 6, 4, 8, 2, 7, 1, 5, 3];
    var five   = ["tiles/piece5.png" , 7, 8, 4, 3, 6, 5, 1, 2];
    var six    = ["tiles/piece6.png" , 2, 1, 8, 7, 6, 5, 4, 3];
    var seven  = ["tiles/piece7.png" , 2, 1, 7, 8, 6, 5, 3, 4];
    var eight  = ["tiles/piece8.png" , 7, 3, 2, 8, 6, 5, 1, 4];
    var nine   = ["tiles/piece9.png" , 2, 1, 7, 5, 4, 8, 3, 6];
    var ten    = ["tiles/piece10.png", 7, 3, 2, 5, 4, 8, 1, 6];
    var eleven = ["tiles/piece11.png", 3, 7, 1, 5, 4, 8, 2, 6];
    var twelve = ["tiles/piece12.png", 3, 7, 1, 8, 6, 5, 2, 4];
    var thirtn = ["tiles/piece13.png", 3, 8, 1, 7, 6, 5, 4, 2];
    var fourtn = ["tiles/piece14.png", 4, 8, 7, 1, 6, 5, 3, 2];
    var fiftn  = ["tiles/piece15.png", 4, 7, 8, 1, 6, 5, 2, 3];
    var sixtn  = ["tiles/piece16.png", 4, 3, 2, 1, 8, 7, 6, 5];
    var sevntn = ["tiles/piece17.png", 4, 3, 2, 1, 7, 8, 5, 6];
    var eightn = ["tiles/piece18.png", 5, 3, 2, 7, 1, 8, 4, 6];
    var ninetn = ["tiles/piece19.png", 5, 3, 2, 8, 1, 7, 6, 4];
    var twenty = ["tiles/piece20.png", 6, 8, 4, 3, 7, 1, 5, 2];
    var twent1 = ["tiles/piece21.png", 6, 7, 8, 5, 4, 1, 2, 3];
    var twent2 = ["tiles/piece22.png", 6, 3, 2, 8, 7, 1, 5, 8];
    var twent3 = ["tiles/piece23.png", 6, 4, 8, 3, 7, 1, 5, 3];
    var twent4 = ["tiles/piece24.png", 6, 4, 7, 2, 8, 1, 3, 5];
    var twent5 = ["tiles/piece25.png", 5, 4, 7, 2, 1, 8, 3, 6];
    var twent6 = ["tiles/piece26.png", 3, 4, 1, 2, 7, 8, 5, 6];
    var twent7 = ["tiles/piece27.png", 6, 5, 8, 7, 2, 1, 4, 3];
    var twent8 = ["tiles/piece28.png", 6, 5, 7, 8, 2, 1, 3, 4];
    var twent9 = ["tiles/piece29.png", 5, 6, 7, 8, 1, 2, 3, 4];
    var thirty = ["tiles/piece30.png", 4, 6, 7, 1, 8, 2, 3, 5];
    var thirt1 = ["tiles/piece31.png", 4, 6, 8, 1, 7, 2, 5, 3];
    var thirt2 = ["tiles/piece32.png", 3, 6, 1, 8, 7, 2, 5, 4];
    var thirt3 = ["tiles/piece33.png", 4, 7, 5, 1, 3, 8, 2, 6];
    var thirt4 = ["tiles/piece34.png", 7, 4, 5, 2, 3, 8, 1, 6];
    var thirt5 = ["tiles/piece35.png", 4, 7, 6, 1, 8, 3, 2, 5];
    allTileInfo = [one, two, three, four, five, six, seven, eight, nine, 
    ten, eleven, twelve, thirtn, fourtn, fiftn, sixtn, sevntn, eightn, ninetn, twenty,
    twent1, twent2, twent3, twent4, twent5, twent6, twent7, twent8, twent9,
    thirty, thirt1, thirt2, thirt3, thirt4, thirt5];

}

//this takes in the spot that the user is at and 
//returns the spot that corrosponds to on the new tile 
function sideSquare(oldSpot){
	switch(oldSpot){
		case "1":
			return 6;
			break;
		case "2":
			return 5;
			break;
		case "3":
			return 8;
			break;
		case "4":
			return 7;
			break;
		case  "5":
			return 2;
			break;
		case "6":
			return 1;
			break;
		case "7":
			return 4;
			break;
		case "8":
			return 3;
			break;
	}
}

//this will return false if not or top, right, left, corner, bottom if it is
function tileIsEdgePiece(num){
	if (num == 1)
		return "TL corner";
	else if(num == 6)
		return "TR corner";
	else if(num == 31)
		return "BL corner";
	else if(num == 36)
		return "BR corner";
	else if (num < 6)
		return "top";
	else if (num > 31)
		return "bottom";
	else if( num % 6 == 0)
		return "right";
	else if ((num - 1) % 6 == 0)
		return "left";
	else
		return "false";
}

//go to ajacent card
function jumpCard(index){
	console.log("jump card!!!!!!!!!");
	var currentOverlay = $("#" + colorChosen).attr("src");
	currentOverlay = currentOverlay[currentOverlay.indexOf(".") - 1];
	var positionOnAjacentCard = sideSquare(currentOverlay);
	var newOverlayFile = "img/" + colorChosen + positionOnAjacentCard + ".png";
	//since the publish isnt recieved until after the follow path function do this manually
	placePersonMarker(colorChosen , newOverlayFile, nextSquareForTile);

}

//WHAT SHOULD HAPPEN WHEN A USER DIES
function death(){
	dead = true;
	alert("You just died :(");
	nextSquareForTile = -1;
	//remove player piece and add cards back tile pile
	$("#" + colorChosen).remove();
	var left = $("#left");
	var middle = $("#middle");
	var right = $("#right");
	if(left.attr("src") != "holder.png")
		tiles.push(left.attr("src"));
	if(middle.attr("src") != "holder.png")
		tiles.push(middle.attr("src"));
	if(right.attr("src") != "holder.png")
		tiles.push(right.attr("src"));
}

function win(){
	var colLen = colors.length;
	for(var i = 2; i < colLen; i += 3){
		if(colors[i] != 'none'){
			if(colors[i] == myUUID){
				alert("Congrats! You won the game!");
				break;
			}
			else{
				alert(colors[i-2] + " won the game!");
				break;
			}
			
		}
	}

	 pubnub.publish({
        channel: blockChannel,        
        message: {status: "finished"},
        callback : function(m){},
        error: function(e){console.log(e)}
    });
}

//this will return false if not or top, right, left, corner, bottom if it is
function calculateNewNextSpot(overlaySpot){
	var position = tileIsEdgePiece(nextSquareForTile);
	//die if you go up
	if((overlaySpot == 1 || overlaySpot == 2) && 
		(position == "TL corner" || position == "TR corner" || position == "top"))
		death();
	
	//die if you go right
	else if((overlaySpot == 3 || overlaySpot == 4) && 
		(position == "BR corner" || position == "TR corner" || position == "right"))
		death();
	//die if you go left
	else if((overlaySpot == 7 || overlaySpot == 8) && 
		(position == "BL corner" || position == "TL corner" || position == "left"))
		death();
	//die if you go down
	else if((overlaySpot == 5 || overlaySpot == 6) && 
		(position == "BR corner" || position == "BL corner" || position == "bottom"))
		death();
	//go right
	else if(overlaySpot == 3 || overlaySpot == 4){
		var num = Number(nextSquareForTile) + 1;
		nextSquareForTile = num.toString();
	}
	//go left
	else if(overlaySpot == 7 || overlaySpot == 8){
		var num = Number(nextSquareForTile) - 1;
		nextSquareForTile = num.toString();
	}
	//go up 
	else if(overlaySpot == 1 || overlaySpot == 2){
		var num = Number(nextSquareForTile) - 6;
		nextSquareForTile = num.toString();
	}
	//go down
	else if(overlaySpot == 5 || overlaySpot == 6){
		var num = Number(nextSquareForTile) + 6;
		nextSquareForTile = num.toString();
	}
}

//follow the card on the path
function followPath(index){
	console.log("follow path");
	var currentOverlay = $("#" + colorChosen).attr("src");
	currentOverlay = currentOverlay[currentOverlay.indexOf(".") - 1];
	// var positionOnAjacentCard = sideSquare(currentOverlay);
	var newOverlayFile = "img/" + colorChosen + allTileInfo[index][currentOverlay] + ".png";
	placePersonMarker(colorChosen , newOverlayFile, nextSquareForTile);
	//update nextSquareForTile
	calculateNewNextSpot(allTileInfo[index][currentOverlay]);

}

function movePlayerPiece(){
	//do a check if you are on the ajacent card ,if you arent then jump, if you are then follow path
	console.log("move player piece function");
	if(!dead){
		var backgpicture = $("#" + nextSquareForTile).css('background-image');
		backgpicture = backgpicture.replace(/^.*[\\\/]/, '');
		backgpicture = (backgpicture.split('"'))[0];
		backgpicture = (backgpicture.split(')'))[0];
		var found = false;
		//do this stuff while there are still tiles you need to navigate across
		while(!dead && backgpicture != "purpleSquare.png"){
			var leng = allTileInfo.length;
			var tileToLookFor = $("#" + nextSquareForTile).css('background-image');
			tileToLookFor = tileToLookFor.replace(/^.*[\\\/]/, '');
			tileToLookFor = (tileToLookFor.split('"'))[0];
			tileToLookFor = (tileToLookFor.split(')'))[0];
			var test = ($("#" + colorChosen).parent());
			var playerCurrentLocation = test.attr("id");
			for(var i = 0; i < leng; i++){
				var name = allTileInfo[i][0];
				if(allTileInfo[i][0] == "tiles/" + tileToLookFor){
					//if you are not on the current card then jump
					//if there is a card in your next spot and you are not on it
					if(nextSquareForTile != playerCurrentLocation)
						jumpCard(i);
					//then follow the path
					followPath(i);
					found = true;
					if(dead)
						break;
					backgpicture = $("#" + nextSquareForTile).css('background-image');
					backgpicture = backgpicture.replace(/^.*[\\\/]/, '');
					backgpicture = (backgpicture.split('"'))[0];
					backgpicture = (backgpicture.split(')'))[0];
					break;
				}
			}
		}
		if(found){
			var whereAreYouNow = $("#" + colorChosen);
			var whereSrc = whereAreYouNow.attr("src");
			var whereLoc = whereAreYouNow.parent().attr("id");
			if(dead){
				whereSrc = -1;
				whereLoc = "dead";
			}
			publishPlayerMovement(colorChosen , whereSrc, whereLoc, false);
		}
	}

}

function dealCards(){
	displayHand(tiles[0], tiles[1], tiles[2]);
	pubnub.publish({
	    channel: cardsChannel,        
	    message: {replacement: 3},
	    callback : function(m){ console.log("just publishing delt cards")},
	    error: function(e){console.log("ERROR: " + e)}
	});

}

function displayHand(left, middle, right){
	document.getElementById('left').src = left;
	document.getElementById('middle').src = middle;
	document.getElementById('right').src = right;
}

function rotate(number){
	angle += 90;
	var string = '#' + number;
	$(string).css('transform','rotate(' + angle + 'deg)');
}

function readyToPlayGame(){
    piecePlacement = false;
     $("#lgPlayerPiece").remove();
    playerTurns();
    dealCards();

   
}

function timerFunction(){
    setTimeout(readyToPlayGame, 10000); //10 s for testing, but 30 sec for real
    console.log("timer has started");
}

//------------------------------------------------------------------------------------------------------------------
//-----este parte esta una mezcla de funciones espanoles y funciones en ingles que trabajan con los espanoles ------
//---------------------cuando tengo tiempo al fin, voy a cambiarlos, pero para ahora estan bien---------------------
//------------si quieres hacerlo, cuidado porque parece muy complicado y da errores cuando se quitarlos-------------
//------------------------------------------------------------------------------------------------------------------

function organizarTablero(){
	//casillas = boxes
	var casillas=$(".blanca,.negra").droppable({drop:dropCasillas}); //makes boxes droppable
	establecerEventos();
}

function controlarFlujo(){
	console.log("controlarFlujo");
	//$(".tile").draggable("enable");
	if(thisPlayersTurn == 'none'){
		$("#turnos p").fadeOut("fast",function(){$("#turnos p").html("");
		$("#turnos p").fadeIn("slow");
	 	});

	}
	else{
		var len = colors.length;
		var stringofwords = 'error';
		for(var i = 0; i  <= len; i += 3){
			if(i + 2 > colors.length)
				break;
			var temp = colors[i];
			var temp2 = colors[i + 2];
			if(colors[i + 2] == myUUID && myUUID == thisPlayersTurn){
				stringofwords = "You are up now."
				break;
			}
			else if(colors[i + 2] == thisPlayersTurn){
				stringofwords = colors[i] + " is up now.";
				break;
			}
		}
		
	 	$("#turnos p").fadeOut("fast",function(){$("#turnos p").html(stringofwords);
		$("#turnos p").fadeIn("slow");
	 	});
	
	}
}

function establecerEventos(){
	console.log("establecerEventos");
	var ficha = $(".tile");
	ficha.draggable();
	ficha.mousedown(downTile);
	ficha.mouseover(overTile);

	ficha = $(".blanca");
	ficha.mousedown(selectSquare);

}

function downFicha(){
	console.log("downFicha");
	$(".ficha").css("z-index","100");
	$(this).css("z-index","1000");

}



function edgeOrCorner(num){
	if (num == 1 ||num == 6 || num == 31 || num == 36){
		return "corner";
	}
	else if (num < 6 || num > 31 ||
			 num % 6 == 0 ||(num - 1) % 6 == 0){
		return "edge";
	}
}

function cornerCheck(alreadySetVal, arr, spot){
	var count = 0;
	//I think the most it can loop is logically 2x 
	//worst case: falls into last if and it is full
	while(count < 2){
		if(arr[0] == alreadySetVal){
			alreadySetVal = arr[1];
			//check to see if it is free
			if(spot.children(".overlay" + alreadySetVal).length <= 0)
				return alreadySetVal + ".png";
		}
		if(arr[1] == alreadySetVal){
			alreadySetVal = arr[2];
			if(spot.children(".overlay" + alreadySetVal).length <= 0)
				return alreadySetVal + ".png";
		}
		if(arr[2] == alreadySetVal){
			alreadySetVal = arr[3]
			if(spot.children(".overlay" + alreadySetVal).length <= 0)
				return alreadySetVal + ".png";
		}
		if(arr[3] == alreadySetVal){
			alreadySetVal = arr[0]
			if(spot.children(".overlay" + alreadySetVal).length <= 0)
				return alreadySetVal + ".png";
		}
		++count;
	}
}

function edgeCheck(alreadySetVal, arr, spot){
	var count = 0;
	//I think the most it can loop is logically 2x 
	//worst case: falls into last if and it is full
	//if the person cant move it will just stay in its spot--i think?..maybe not
	while(count < 2){
		if(arr[0] == alreadySetVal){
			alreadySetVal = arr[1];
			//check to see if it is free
			if(spot.children(".overlay" + alreadySetVal).length <= 0)
				return alreadySetVal + ".png";
		}
		if(arr[1] == alreadySetVal){
			alreadySetVal = arr[0];
			if(spot.children(".overlay" + alreadySetVal).length <= 0)
				return alreadySetVal + ".png";
		}
		++count;
	}
}

//this could prob be made more concise
//return filename of next pic avaliable
function getPersonStartFileName(num, alreadySetVal){
	var filename = "img/" + colorChosen;
	var spot = $("#" + num);
	console.log(spot);
	var top = [1, 2];
	var right = [3, 4];
	var bottom = [5, 6];
	var left = [7, 8];
	var leftTC = [ 7, 8, 1, 2];
	var rightTC = [1, 2, 3, 4];
	var leftBC = [5, 6, 7, 8];
	var rightBC = [3, 4, 5, 6];
	//if no preset just start trying at beginning
	if(alreadySetVal == -1){
		if (num == 1)
			alreadySetVal = leftTC[3];
		else if(num == 6)
			alreadySetVal = rightTC[3];
		else if(num == 31)
			alreadySetVal = leftBC[3];
		else if(num == 36)
			alreadySetVal = rightBC[3];
		else if (num < 6)
			alreadySetVal = top[1];
		else if (num > 31)
			alreadySetVal = bottom[1];
		else if( num % 6 == 0)
			alreadySetVal = right[1];
		else if ((num - 1) % 6 == 0)
			alreadySetVal = left[1];
	}
	if (num == 1)
		return filename + cornerCheck(alreadySetVal, leftTC, spot);
	else if(num == 6)
		return filename + cornerCheck(alreadySetVal, rightTC, spot);
	else if(num == 31)
		return filename + cornerCheck(alreadySetVal, leftBC, spot);
	else if(num == 36)
		return filename + cornerCheck(alreadySetVal, rightBC, spot);
	else if (num < 6)
		return filename + edgeCheck(alreadySetVal, top, spot);
	else if (num > 31)
		return filename + edgeCheck(alreadySetVal, bottom, spot);
	else if( num % 6 == 0)
		return filename + edgeCheck(alreadySetVal, right, spot);
	else if ((num - 1) % 6 == 0)
		return filename + edgeCheck(alreadySetVal, left, spot);

}

//pass in the color, filename, and tile number
function placePersonMarker(colorIn, filename, tileNum){
	console.log("placePersonMarker");
	// if(colorIn != colorChosen){
		if($("#" + colorIn).length > 0) //if old pic remove it
			$("#" + colorIn).remove();
		var htmlImgLine = $(document.createElement('img'));
		htmlImgLine.attr("src", filename);
		var overlayNum = filename[filename.indexOf(".") - 1];
		var zaxisCss = "ficha " + "overlay" + overlayNum;
		htmlImgLine.attr("class", zaxisCss);
		htmlImgLine.attr("id", colorIn);
		$("#" + tileNum).append(htmlImgLine);
		if(colorIn == colorChosen)
			nextSquareForTile = tileNum;


	//}
}

function publishPlayerMovement(col , file, tile, beginningIN){
	console.log("publish player start movement " + col + " " + file + " " + tile);
	pubnub.publish({
	    channel: gameChannel,        
	    message: {colorPassed: col, fileN: file, tileN: tile, beginning: beginningIN},
	    callback : function(m){console.log("publishing in subcard: " + m)},
	    error: function(e){console.log(e)}
	});
	if(beginningIN){
		console.log("publishing the spot")
		//publishing start spots because some browser are slow at loading
        pubnub.publish({
            channel: blockChannel,        
            message: {colorPassed: col, fileN: file, tileN: tile, beginning: beginningIN},
            callback : function(m){},
            error: function(e){console.log(e)}
        });
	}
}
function piecePlacementFn(square){	
	//check to see if the person's piece is already on the board 
	if($("#" + colorChosen).length > 0){
		var personMover = $("#" + colorChosen);
		//if it is the same spot then move to the other tic
		if(square.has("#" + colorChosen).length > 0){
			if(square.children().length < 2 || 
				(edgeOrCorner(square.attr("id")) == "corner" 
					&& square.children().length < 4)){
				var currentNumber = personMover.attr("src")[personMover.attr("src").indexOf(".") - 1];
				var filename = getPersonStartFileName(square.attr("id"), currentNumber);
				publishPlayerMovement(colorChosen, filename, square.attr("id"), true);
			}
			else
				alert("Someone is on the other spot....");
		}
		//else delete their old spot bcz they want a new one
		else{
			$("#" + colorChosen).remove();
		}
	}
	//if it is now null (they wanted delete not rotate)
	if($("#" + colorChosen).length <= 0 && (square.children().length  < 2 
								|| (edgeOrCorner(square.attr("id")) == "corner" 
								&& square.children().length < 4))){
		//var personMover = $(document.createElement('img'));
		var filename = getPersonStartFileName(square.attr("id"), -1);
		publishPlayerMovement(colorChosen, filename, square.attr("id"), true);
	}
}

function selectSquare(){
	var square = $(this);
	if(piecePlacement == true){
		piecePlacementFn(square);
		nextSquareForTile = square.attr("id");
		console.log("next square for tile = " + nextSquareForTile);
	}
}

function addCard(spot, cardin){
	$("#" + spot).css('background-image', 'url(' + cardin + ')');
}

//test the card with this
function downTile(){
	console.log("downTile");
	if(myUUID == thisPlayersTurn){
		if(nextSquareForTile == 0){
			//it just wasnt registered
			var theColorHtml = $("#" + colorChosen);
			if($("#" + colorChosen).length > 0){
				nextSquareForTile = theColorHtml.parent().attr("id");
			}

			alert("you did not select a start spot"); //MAYBE WE COULD HAVE AUTOMATIC SELECTION THEN -- SO IF YOU HAVE TIME WRITE A FN FOR THIS
		}
		var filename = $("#" + nextSquareForTile).css('background-image');
		filename = filename.replace(/^.*[\\\/]/, '');
		filename = (filename.split('.'))[0];
		//CHECK THAT IT IS THIS PLAYER'S TURN so we dont have to do removal & etc. ADD THIS AFTER IMPLEMENTING TURN FUNCTION
		//check that there is not already a card there
		var ficha = $(this); //this is the piece in player's hand that they selected
		if(filename == "purpleSquare" && ficha.attr('src') != undefined){
			//make sure they arent trying to place a holder square
			filename = ficha.attr('src');
			filename = filename.replace(/^.*[\\\/]/, '')
			if(filename != 'holder)'){
				habilitada=$("#" + nextSquareForTile); 
				addCard(nextSquareForTile, ficha.attr('src'));
				$("#submitButton").css("visibility", "visible");
				$("#undoButton").css("visibility", "visible");
				ficha.css("visibility","hidden");
				lastCard = ficha;
			}
		}
		else
			alert("please remove old tile before placing a new one"); //WE COULD MAYBE AUTOMATE THIS TOO (AT THE END)
	}
	else
		alert("Please wait for your turn before trying a piece.");
}


function undoCardPlacement(){
	console.log("undoCardPlacement");
	$("#" + nextSquareForTile).css('background-image', 'url(purpleSquare.png)');
	lastCard.css("visibility","visible");
	$("#submitButton").css("visibility", "hidden");
	$("#undoButton").css("visibility", "hidden");
	lastCard = "none";
}

function submitCard(){
	console.log("submitCard");
	var filename = lastCard.attr('src');
	//publish the change so it is updated on all player's screens
	pubnub.publish({
	    channel: gameChannel,        
	    message: {spot: nextSquareForTile, card: filename},
	    callback : function(m){console.log("publishing in submit card: " + m)},
	    error: function(e){console.log(e)}
	});
	//add another card to user's hand to replace empty if possible
	if(tiles.length > 0){
		//add the next card in array to your hand
		lastCard.attr("src", tiles[0]);
		lastCard.css("visibility", "visible");
		 pubnub.publish({
		    channel: cardsChannel,        
		    message: {replacement: 1},
		    callback : function(m){console.log("publishing in submit card (2nd): " + m)},
		    error: function(e){console.log(e)}
		});

	}
	else{
		lastCard.attr("src", "holder.png");
		lastCard.css("visibility", "visible");
		console.log("NO TILES LEFT");
		//WE NEED TO SET THE LAST PERSON TO GET A CARD HERE TOO -DRAGON TILE or just add it regularly?? - this might cause probs though
	}
	movePlayerPiece();
	$("#submitButton").css("visibility", "hidden");
	$("#undoButton").css("visibility", "hidden");
	lastCard = "none";
}

function dropCasillas(event,ui){
	console.log("dropCasillas");
	var  fic = ui.draggable;
	fic.css("position","absolute");
	fic.css("left","0");
	fic.css("top","0");
}


function overTile(){
	console.log("overtile");
	var ficha = $(this);
	ficha.draggable();

}



function ennrrocar(habilitada,fil){
		//Enrrocar
			console.log("ennrrocar");
	var anterior=$("#"+6+fil);
	if(anterior.attr("value")=="vacia"){
		habilitada=$("#"+7+fil);
		var torre = $("#"+8+fil);
		torre = $("#"+torre.attr("id")+" img");
		if(habilitada.attr("value")=="vacia"&&torre.hasClass("torre")){
			habilitada.css("background","pink");
			if(torre.hasClass("torreB")){
				habilitada.droppable({drop:dropEnrroqueDer});	
				habilitada.droppable({accept:".reyB"});
			}
			else if(torre.hasClass("torreN")){
				habilitada.droppable({drop:dropEnrroqueDer});	
				habilitada.droppable({accept:".reyN"});
			}

		}
	}

	anterior=$("#"+4+fil);
	if(anterior.attr("value")=="vacia"){
		anterior=$("#"+2+fil);
		if(anterior.attr("value")=="vacia"){
			habilitada=$("#"+3+fil);
			var torre = $("#"+1+fil);
			torre = $("#"+torre.attr("id")+" img");
			if(habilitada.attr("value")=="vacia"&&torre.hasClass("torre")){
				habilitada.css("background","pink");
				if(torre.hasClass("torreB")){
					habilitada.droppable({drop:dropEnrroqueIzq});	
					habilitada.droppable({accept:".reyB"});
				}
				else if(torre.hasClass("torreN")){
					habilitada.droppable({drop:dropEnrroqueIzq});	
					habilitada.droppable({accept:".reyN"});
				}
		}
		}
	}
}



function dropEnrroqueDer(event,ui){
	console.log("dropEnrroqueDer");
	var cuadro = $(this);
	var ficha = ui.draggable;
	var cuadroProc = ficha.parent();
	dropGeneric(cuadro,ficha,cuadroProc);
	ficha.mousedown(downRey);
	if(ficha.hasClass("fBlanca")){
		var torre = $("#"+8+1);
		torre.attr("value","vacia");
		torre = $("#"+torre.attr("id")+" img");
	    var casTorre=$("#"+6+1);
	    casTorre.html(torre);
		preguntaFlujo(ficha);
		casTorre.attr("value","vacia");	
	}
	else if (ficha.hasClass("fNegra")){
		var torre = $("#"+8+8);
		torre.attr("value","vacia");
		torre = $("#"+torre.attr("id")+" img");
	    var casTorre=$("#"+6+8);
	    casTorre.html(torre);
		preguntaFlujo(ficha);	
		casTorre.attr("value","vacia");
	}

}
function dropEnrroqueIzq(event,ui){
	console.log("dropEnrroqueIzq");
	var cuadro = $(this);
	var ficha = ui.draggable;
	var cuadroProc = ficha.parent();
	dropGeneric(cuadro,ficha,cuadroProc);
	ficha.mousedown(downRey);
	if(ficha.hasClass("fBlanca")){
	var torre = $("#"+1+1);
	torre.attr("value","vacia");
	torre = $("#"+torre.attr("id")+" img");
    var casTorre=$("#"+4+1);
    casTorre.html(torre);
	preguntaFlujo(ficha);
	}
	else if (ficha.hasClass("fNegra")){
		var torre = $("#"+1+8);
		torre.attr("value","vacia");
		torre = $("#"+torre.attr("id")+" img");
	    var casTorre=$("#"+4+8);
	    casTorre.html(torre);
		preguntaFlujo(ficha);
	}

}










