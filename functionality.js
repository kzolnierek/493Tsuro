
var tiles =["piece1.png", "piece2.png", "piece3.png", "piece4.png", "dog.png", "michigan.png", "icecream.png"];
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

$(document).ready(function() {

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
		console.log("add" + cardin + " called with " + spot);
		document.getElementById(spot).src = cardin; 
	}

//see my note in the read me about this
function movePiece(xcord, ycord, pieceToMove){
	console.log("add card fn called with " + xcord + " "+ ycord +pieceToMove);
}

function dealCards(){
	document.getElementById('lowerButton1').style.visibility = 'visible';
	document.getElementById('lowerButton2').style.visibility = 'visible';
	document.getElementById('lowerButton3').style.visibility = 'visible';
	displayHand(tiles[0], tiles[1], tiles[2]);
	pubnub.publish({
	    channel: cardsChannel,        
	    message: {replacement: 3},
	    callback : function(m){console.log("I'm publishing: " + m)},
	    error: function(e){console.log(e)}
	});

}

function displayHand(left, middle, right){
	console.log("display hand successfully called with: " 
					+ left + " " + middle + " " + right);
	document.getElementById('left').src = left;
	document.getElementById('middle').src = middle;
	document.getElementById('right').src = right;
}

function flip(side){
	console.log("flip successfully called with: " + side);
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
   		tileSpotNumber = numberIn;
   		tilePath = document.getElementById(side).src;
   		curSide = side;
   		var filename = tilePath.replace(/^.*[\\\/]/, '')
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
	}
}

function submitCard(){
	if(tileSpotNumber == null){
		console.log("CARD IS NULL");
	}
	else{
   		filename = tilePath.replace(/^.*[\\\/]/, '')
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

	document.getElementById(curSide).src = tilePath;
	console.log("before: " + document.getElementById(tileSpotNumber).src)
	document.getElementById(tileSpotNumber).src = transparentCard;
	//document.getElementById(tileSpotNumber).removeAttribute('src');
	console.log("after: " + document.getElementById(tileSpotNumber).src)
	document.getElementById("submitButton").style.visibility = 'hidden';
    document.getElementById("undoButton").style.visibility = 'hidden';
	//reset globals
	tileSpotNumber = -1;
	tilePath = "not Valid!";
	curSide = "not valid";
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