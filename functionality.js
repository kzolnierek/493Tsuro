
var tiles =["tiles/piece1.png", "tiles/piece2.png", "tiles/piece3.png", "tiles/red.png",
             "tiles/piece4.png", "tiles/dog.png", "tiles/michigan.png", "tiles/icecream.png"];
var thisPlayerColor;
var allTileInfo;
var thisPlayerColor;
var gameChannel = 'game_channel';
var cardsChannel = 'send_cards';
//you can also store this locally which helpful for refreshs
//in the tutorial I went through it seemed important
//for refresh but I am not really sure what else it helps with
var myUUID = PUBNUB.uuid();

var tileSpotNumber = -1;
var tilePath = "not Valid!";
var curSide = "not valid";
//because otherwise the image wont disappear
// in safari when you just remove the attribute - idk why but this
//creates a transparent image 
var transparentCard = "data:image/gif;base64,R0lGODlhAQABAIAAAP///////yH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

var pubnub = PUBNUB({
subscribe_key: 'sub-c-b1b8b6c8-8b1c-11e5-84ee-0619f8945a4f', // always required
publish_key: 'pub-c-178c8c90-9ea7-46e3-8982-32615dadbba0',    // only required if publishing
uuid: myUUID
});

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

//this is so that you will know where the paths go on each tile
function setUpTileArray(){
	var one   = new tileInfo("tiles/piece1.png", 2, 1, 4, 3, 6, 5, 8, 7);
	var two   = new tileInfo("tiles/piece2.png", 6, 5, 8, 7, 2, 1, 4, 3);
	var three = new tileInfo("tiles/piece3.png", 2, 1, 7, 8, 6, 5, 4, 3);
    var four  = new tileInfo("tiles/piece4.png", 6, 4, 8, 2, 7, 1, 5, 3);
    var five  = new tileInfo("tiles/dog.png", 6, 5, 8, 7, 2, 1, 4, 3);
    var six   = new tileInfo("tiles/michigan.png", 6, 5, 8, 7, 2, 1, 4, 3);
    var seven = new tileInfo("tiles/icecream.png", 6, 5, 8, 7, 2, 1, 4, 3);
    allTilesInfo = [one, two, three, four, five, six, seven];
}

$(document).ready(function() {
	setUpTileArray();

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
			if(message.spot != undefined && message.card != undefined)
				addCard(message.spot, message.card);
			//from initPerson
			if(message.xcord != undefined && message.ycord != undefined 
				&& message.pcolor != undefined)
				movePiece(message.xcord, message.ycord, message.pcolor);
			console.log(message.from);
		}
	});

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
				console.log("before: " + tiles);
				tiles.splice(0, message.replacement);
				console.log("after: " + tiles);
			}
			else
				console.log("prob with cards");
		}
	});

});

function addCard(spot, cardin){
	document.getElementById(spot).src = cardin; 
}

function dealCards(){
	document.getElementById('lowerButton1').style.visibility = 'visible';
	document.getElementById('lowerButton2').style.visibility = 'visible';
	document.getElementById('lowerButton3').style.visibility = 'visible';
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

function flip(side){
	var temp = document.getElementById('middle').src
	if(side == 'r'){
		document.getElementById('middle').src = document.getElementById('right').src;
		document.getElementById('right').src = temp;

	}
	//the side is left
	else{
		document.getElementById('middle').src = document.getElementById('left').src;
		document.getElementById('left').src = temp;
	}

}

function rotate(){

	//this will have to be done through document.getElementById('middle').style.... because css seems to be the best option
	//transform: rotate(7deg);

	// console.log("rotate successfully called");
	// var curRotation = document.getElementById('middle').rotate;
	// console.log("cur ro " + curRotation);
	// switch(curRotation){
	// 	case "90":
	// 		document.getElementById('middle').rotate = "180";
	// 	case "180":
	// 		document.getElementById('middle').rotate = "-90";
	// 	case "-90":
	// 		document.getElementById('middle').rotate = "0";
	// 	case "0":
	// 		document.getElementById('middle').rotate = "90";

	// }
	// document.getElementById('middle').rotate="90";

}


function testCardPosition(numberIn, side){
	if(numberIn == null){
		console.log("CARD IS NULL");
	}
	//theyre already testing a spot - dont allow 2 tests
	else if(tileSpotNumber != -1){
		alert("You can only test one card at a time");
	}
	else{
		console.log("vector here: " + tiles);
   		tileSpotNumber = numberIn;
   		tilePath = document.getElementById(side).src;
   		curSide = side;
   		var filename = "tiles/" + tilePath.replace(/^.*[\\\/]/, '')
   		//check to see if a card is already there
   		if(document.getElementById(tileSpotNumber).src != ""
   			&& document.getElementById(tileSpotNumber).src != transparentCard)
   			alert("There is already a card in the spot you selected");
   		else{
       		if(filename != "holder.png"){	
	      		addCard(tileSpotNumber, filename);
	      		document.getElementById(curSide).src = "holder.png";
	      		document.getElementById("submitButton").style.visibility = 'visible';
	      		document.getElementById("undoButton").style.visibility = 'visible';
			}
			else{
				alert("Please put a card in the center spot");
			}
		}
		console.log("vector here at end: " + tiles);
	}
}

function submitCard(){
	if(tileSpotNumber == null){
		console.log("CARD IS NULL");
	}
	else{
   		filename = "tiles/" + tilePath.replace(/^.*[\\\/]/, '')
   		//check to see if a card is already there
   		if(document.getElementById(tileSpotNumber).src != "" 
   			&& document.getElementById(tileSpotNumber).src != tilePath
   			&& document.getElementById(tileSpotNumber).src != transparentCard)
   			alert("There is already a card in the spot you selected");
   		else{
       		if(filename != "holder.png"){
	       		pubnub.publish({
				    channel: gameChannel,        
				    message: {from: "keleigh", card: tilePath, spot: tileSpotNumber},
				    callback : function(m){console.log("publishing in subcard: " + m)},
				    error: function(e){console.log(e)}
				});
				//hide the option buttons
				document.getElementById("submitButton").style.visibility = 'hidden';
	      		document.getElementById("undoButton").style.visibility = 'hidden';
				//put new card in hand
				if(tiles.length >=1){
					document.getElementById(curSide).src = tiles[0];
					 pubnub.publish({
					    channel: cardsChannel,        
					    message: {replacement: 1},
					    callback : function(m){console.log("publishing in submitcard: " + m)},
					    error: function(e){console.log(e)}
					});
				}
				else{
					document.getElementById(curSide).src = "holder.png";
					console.log("NO TILES LEFT");
					//WE NEED TO SET THE LAST PERSON TO GET A CARD HERE TOO -DRAGON TILE
				}
				//reset globals
				tileSpotNumber = -1;
				tilePath = "not Valid!";
				curSide = "not valid";

			}
			else{
				console.log("trying to submit the card holder is illegal");
				alert("Please put a card in the center spot");
			}
		}
	}
}

function undoCardPlacement(){
	console.log("vector here1: " + tiles);
	document.getElementById(curSide).src = tilePath;
	document.getElementById(tileSpotNumber).src = transparentCard;
	//document.getElementById(tileSpotNumber).removeAttribute('src');
	document.getElementById("submitButton").style.visibility = 'hidden';
    document.getElementById("undoButton").style.visibility = 'hidden';
	//reset globals
	tileSpotNumber = -1;
	tilePath = "not Valid!";
	curSide = "not valid";
	console.log("vector here1 at end: " + tiles);
}

function initPerson(color){
		console.log("called the initperson!!" + color);
		thisPlayerColor = color;
		var xnum = document.getElementById('startXSpot').value;
		var ynum = document.getElementById('startYSpot').value;
		console.log("here is what number was retrieved " + xnum + " " +ynum );
		pubnub.publish({
	    channel: gameChannel,        
	    message: {xcord: xnum, ycord: ynum, pcolor: color},
	    callback : function(m){console.log("publishing in initperson: " + m)},
	    error: function(e){console.log(e)}
	});
}

function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.id);
}

function drop(ev, num) {
    ev.preventDefault();
    //data says what position the card is : left,right, middle
    var data = ev.dataTransfer.getData("text");
    testCardPosition(num, data);
}