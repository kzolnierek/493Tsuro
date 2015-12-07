
var tiles = ["tiles/piece1.png", "tiles/piece2.png", "tiles/piece3.png", "tiles/piece4.png",
             "tiles/piece5.png", "tiles/piece6.png", "tiles/piece7.png", "tiles/piece8.png",
             "tiles/piece9.png", "tiles/piece10.png", "tiles/piece11.png", "tiles/piece12.png",
             "tiles/piece13.png", "tiles/piece14.png", "tiles/piece15.png", "tiles/piece16.png",
             "tiles/piece17.png", "tiles/piece18.png", "tiles/piece19.png", "tiles/piece20.png",
             "tiles/piece21.png", "tiles/piece22.png", "tiles/piece23.png", "tiles/piece23.png",
             "tiles/piece25.png", "tiles/piece26.png", "tiles/piece27.png", "tiles/piece28.png",
             "tiles/piece29.png", "tiles/piece30.png", "tiles/piece31.png", "tiles/piece32.png",
             "tiles/piece33.png", "tiles/piece34.png", "tiles/piece35.png"];
var colors = ["navyPerson", true, 'none', "pinkPerson", true, 'none', "purplePerson", true, 'none',
             "grayPerson", true, 'none', "redPerson", true, 'none', "yellowPerson", true, 'none',
             "greenPerson", true, 'none', "bluePerson", true, 'none', "orangePerson", true, 'none',];
var playerName = 'none';
var colorChosen = 'none';
var lastCard = "none";
var nextSquareForTile = 0;
var startSpot = -1;
var piecePlacement = true; //the time when players pick their start spots 
var allTileInfo;
var gameChannel = 'game_channel';
var cardsChannel = 'send_cards';
var colorChannel = 'colorChannel14';
var userInformationChannel = "user_info14";
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
uuid: myUUID
});

$(document).ready(main);

//sets that brown banner thing
function main(){
    organizarTablero();
    $("#turnos").css("background","url(img/pergamino.png)"); //this sets up the weird banner
    $("#turnos").css("background-repeat","no-repeat");
    controlarFlujo();
    setUpTileArray();

    //SHUFFLE CARDS GOES HERE

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
				//THIS IS WHERE YOU WILL MOVE THE PLAYER'S PIECE (have it call a diff fn)
				//IT WILL NEED TO CHECK IF THE INDIVIDUAL USER IS NEXT TO THE SPOT AND
				//IF IT IS THEN IT WILL MOVE IT AND UPDATE ALL LOCAL RELEVANT VARS
				// EX IT SHOULD UPDATE NEXT SQUARE FOR TILE
				// ALSO CHECK FOR DEATH
			}
			//this is for the player start spot selection
			if(message.colorPassed != undefined && message.fileN != undefined && message.tileN != undefined)
				placePersonMarker(message.colorPassed, message.fileN, message.tileN);
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

	timerFunction();

} //end of main

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
//THIS NEEDS TO BE UPDATED WITH ALL OF THE NEW TILES
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



function dealCards(){
	displayHand(tiles[0], tiles[1], tiles[2]);
	pubnub.publish({
	    channel: cardsChannel,        
	    message: {replacement: 3},
	    callback : function(m){ console.log("just publishing delt cards")},
	    error: function(e){console.log("ERROR: " + e)}
	});
	$("#deal").css("visibility", "hidden");

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
    console.log("now start up the turns and deal");
    piecePlacement = false;
     $("#lgPlayerPiece").remove();
    //GET RID OF DEAL BUTTON AND MAKE IT AUTOMATIC
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

var turnoBlanca=true; //THIS CHANGES THE UGLY BANNER (AND DOES THE FADING) MAKE IT A BOX OR SOEMTHING BETTER
					//THAT WILL TELL WHICH PLAYER IS UP - IT WILL HAVE TO BE INT USING COLOR ARRAY PROB


function controlarFlujo(){
	console.log("controlarFlujo");
	$(".tile").draggable("enable");
	if(turnoBlanca==false){
	$(".fNegra,.fBlanca").draggable();	
	$(".fNegra").draggable("disable");
	$(".fBlanca").draggable("enable");
	$("#turnos p").fadeOut("fast",function(){$("#turnos p").html("Move the white pieces");
		$("#turnos p").fadeIn("slow");
	 });

	}
	else{
	$(".fNegra,.fBlanca").draggable();	
	$(".fBlanca").draggable("disable");	
	$(".fNegra").draggable("enable");
		$("#turnos p").fadeOut("fast",function(){$("#turnos p").html("Move the black pieces");
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
	//if it is not your color (because you would have already added it)
	if(colorIn != colorChosen){
		if($("#" + colorIn).length > 0) //if old pic remove it
			$("#" + colorIn).remove();
		var htmlImgLine = $(document.createElement('img'));
		htmlImgLine.attr("src", filename);
		var overlayNum = filename[filename.indexOf(".") - 1];
		console.log("this is the overlay num: " + overlayNum);
		var zaxisCss = "ficha " + "overlay" + overlayNum;
		htmlImgLine.attr("class", zaxisCss);
		htmlImgLine.attr("id", colorIn);
		$("#" + tileNum).append(htmlImgLine);

	}
}

function publishPlayerStartMovement(col , file, tile){
	console.log("publish player start movement " + col + " " + file + " " + tile);
	pubnub.publish({
	    channel: gameChannel,        
	    message: {colorPassed: col, fileN: file, tileN: tile},
	    callback : function(m){console.log("publishing in subcard: " + m)},
	    error: function(e){console.log(e)}
	});
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
				var classnames = "ficha " + "overlay" + filename[filename.indexOf(".") - 1];
				personMover.removeClass().addClass(classnames);
				personMover.attr("src", filename);
				publishPlayerStartMovement(colorChosen, filename, square.attr("id"));
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
		var personMover = $(document.createElement('img'));
		var filename = getPersonStartFileName(square.attr("id"), -1);
		console.log(filename);
		personMover.attr("src", filename);
		var zaxisCss = "ficha " + "overlay" + filename[filename.indexOf(".") - 1];
		personMover.attr("class", zaxisCss);
		personMover.attr("id", colorChosen);
		square.append(personMover);
		publishPlayerStartMovement(colorChosen, filename, square.attr("id"));
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

//returns string of next avaliable overlay
//pass in the tile number
function nextAvaliableOverlay(num){

}


function addCard(spot, cardin){
	$("#" + spot).css('background-image', 'url(' + cardin + ')');
}

//test the card with this
function downTile(){
	console.log("downTile");
	if(nextSquareForTile == 0)
		alert("you did not select a start spot"); //MAYBE WE COULD HAVE AUTOMATIC SELECTION THEN -- SO IF YOU HAVE TIME WRITE A FN FOR THIS
	var filename = $("#" + nextSquareForTile).css('background-image');
	filename = filename.replace(/^.*[\\\/]/, '');
	//CHECK THAT IT IS THIS PLAYER'S TURN so we dont have to do removal & etc. ADD THIS AFTER IMPLEMENTING TURN FUNCTION
	//check that there is not already a card there
	var ficha = $(this); //this is the piece in player's hand that they selected
	if(filename == "purpleSquare.png)" && ficha.attr('src') != undefined){
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
	//CALCULATE NEXT CARD!!! (its global var called nextSquareForTile and is local to user) 
	//----this will just loop through the detailed card array till it finds the right one then index the spot + 1
	nextSquareForTile = 0;
	lastCard = "none";
}

function dropCasillas(event,ui){
	console.log("dropCasillas");
	var  fic = ui.draggable;
	fic.css("position","absolute");
	fic.css("left","0");
	fic.css("top","0");
}

function mostrarInfo(ficha){
	console.log("monstrar Info");
	var imagen = $("#info img");
	var nombre = $("#info span");
	var info=$("#info");
	if(ficha.hasClass("tile")){
		console.log("you got here!");
		//THIS IS JUST FOR THE DUMB SHOW THING ON THE RIGHT
	}
	if(ficha.hasClass("peonB")||ficha.hasClass("peonN")){
		imagen.attr("src","img/peon.png");
		nombre.html("Pawn");
		info.css("background","-moz-linear-gradient(#BD1D49, #DE5076)");
		info.css("background","-webkit-linear-gradient(#BD1D49, #DE5076)");
	}
	if(ficha.hasClass("torre")){
		imagen.attr("src","img/torre.png");
		nombre.html("Rook");
		info.css("background","-moz-linear-gradient(#001941, #69A3FF)");
		info.css("background","-webkit-linear-gradient(#001941, #69A3FF)");
	}
	if(ficha.hasClass("caballo")){
		imagen.attr("src","img/caballo.png");
		nombre.html("Knigth");
		info.css("background","-moz-linear-gradient(#009916, #2EFF4D)");
		info.css("background","-webkit-linear-gradient(#009916, #2EFF4D)");

	}
	if(ficha.hasClass("alfil")){
		imagen.attr("src","img/alfil.png");
		nombre.html("Bishop");
		info.css("background","-moz-linear-gradient(#F5B301, #F7D062)");
		info.css("background","-webkit-linear-gradient(#F5B301, #F7D062)");
	}
	if(ficha.hasClass("reina")){
		imagen.attr("src","img/reina.png");
		nombre.html("Queen");
		info.css("background","-moz-linear-gradient(#016BC1, #A8D8FF)");
		info.css("background","-webkit-linear-gradient(#016BC1, #A8D8FF)");
	}
	if(ficha.hasClass("rey")){
		imagen.attr("src","img/rey.png");
		nombre.html("King");
		info.css("background","-moz-linear-gradient(#603CBA, #976EFF)");
		info.css("background","-webkit-linear-gradient(#603CBA, #976EFF)");
	}
}
function overFicha(){
	console.log("overficha");
	var ficha = $(this);
	ficha.draggable();

}

function overTile(){
	console.log("overtile");
	var ficha = $(this);
	ficha.draggable();

}


function dropGeneric(cuadro,ficha,cuadroProc){
	console.log("dropGeneric");
	ficha.remove();
	ficha.attr("value","true");
	cuadro.html(ficha);
	cuadro.attr("value","ocupada");
	cuadroProc.attr("value","vacia");
	ficha.draggable();
	ficha.mouseup(upFicha);
	ficha.mousedown(downFicha);
	unDroppable();
}


var corAux;
function pregCoronaBlanco(cuadro){
	console.log("pregCoronaBlanco with something passed in");
	var id = cuadro.attr("id");
	corAux=id;
	id = id.split("");
	var fil = id[1];
	if(fil=="8"){
		coronaBlanco();
		$("#tablero").css("opacity","0.4");
	}
}
function coronaBlanco(){
	console.log("coronaBlanco");
	var cor=$("#coronadaB");
	cor.show("slow");
	$("#coronadaB img").mousedown(downCoronaBlanco);

	
}

function downCoronaBlanco(){
	console.log("downCoronaBlanco");
	 var c =$("#"+corAux);
	var f = $(this);
	c.html(f);
	establecerEventos();
	$("#coronadaB").hide("slow");
	$("#coronadaB").append("<img src='"+f.attr("src")+"' class='"+f.attr("class")+"'>");
	$("#tablero").css("opacity","1");
	turnoBlanca=true;
}


var corAux2;
function pregCoronaNegro(cuadro){
	console.log("pregCoronaNegro");
	var id = cuadro.attr("id");
	corAux2=id;
	id = id.split("");
	var fil = id[1];
	if(fil=="1"){
		coronaNegro();
		$("#tablero").css("opacity","0.4");
	}
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


//this changes the board to gray
function unDroppable(){
	// console.log("undropable");
	// for(var i=1;i<=8;i++){
	// 	for(var k=1;k<=8;k++){	
	// 		var cas=$("#"+i+k);
	// 		cas.droppable({accept:"none"});
	// 	}	
	// }

	// $(".blanca").css("background","#AAA");
	// $(".negra").css("background","#555");
}


function upFicha(){
	console.log("upFicha");
	var fic=$(this);
	fic.css("position","absolute");
	fic.css("left",".2em");
	fic.css("top",".2em");

}





