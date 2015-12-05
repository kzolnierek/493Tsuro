var userChannel = 'user_channel2';
var pieceMovementChannel = 'piece_movement2';
var userInformationChannel = "user_info2";
var colorChannel = 'colorChannel2';
//color name, is taken, the uuid who has the color
var colors = ["navyPerson", true, 'none', "pinkPerson", true, 'none', "purplePerson", true, 'none',
             "grayPerson", true, 'none', "redPerson", true, 'none', "yellowPerson", true, 'none',
             "greenPerson", true, 'none', "bluePerson", true, 'none', "orangePerson", true, 'none',];
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
    heartbeat: 60 //this is wasteful but it is important to know timeouts at this point
});

function whenTimeExpires(){
    pubnub.publish({
                        channel: pieceMovementChannel,        
                        message: {uuidPass: myUUID, pname: playerName, colorPass: colorChosen, startPos: startSpot},
                        callback : function(m){},
                        error: function(e){console.log(e)}
                    });
}

function readyToPlayGame(){
    console.log("changing windows");
    //alert("yo");
    location.href = "node1.html";
}

function timerFunction(){
    setTimeout(readyToPlayGame, 30000);
    console.log("it made it here");
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

            if (message.toRemove != null && document.getElementById(message.toRemove) != null){
                                //flip through the color array and delete any color the player may have been associated with
                var lenOfCol = colors.length;
                for(var i = 2; i < lenOfCol; i += 3){
                    if(colors[i] == myUUID){
                        colors[i-1] = true;
                        colors[i] = 'none';
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
                if(document.getElementById("playerPerson") != null)
                    document.getElementById("playerPerson").src = 'personMarkers/'+ colorChosen + '.png';
                
            }
        }
        if(!found){
            alert("You did not select a color and name on the previous page.")
        }
        
     },
     count: 100, // 100 is the default
     reverse: false, // false is the default
    });


});

//pull the history names, colors, and uuids 
//and file them in an array for player turns


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
    //here the function gets called
    //testCardPosition(num, data);
}

// //changes how many users are present
// function updateUsers(numUsers){
//  document.getElementById("presenthead").innerHTML = numUsers + ' Users Present';
// }