var userChannel = 'user_channel5';
var colorChosen = 'none';
var myUUID = PUBNUB.uuid();
var pubnub = PUBNUB({
	subscribe_key: 'sub-c-b1b8b6c8-8b1c-11e5-84ee-0619f8945a4f', // always required
	publish_key: 'pub-c-178c8c90-9ea7-46e3-8982-32615dadbba0',    // only required if publishing
	uuid: myUUID
});

document.getElementById("letsplay").onclick = function () {
    pubnub.publish({
					    channel: userChannel,        
					    message: {letsPlay: true},
					    callback : function(m){},
					    error: function(e){console.log(e)}
					});
};

document.getElementById("namesubmit").onclick = function () {
    if(colorChosen == 'none'){
    	if(document.getElementById("username").value == '')
    		alert("Please enter your name and select a color for your marker.");
    	else
    		alert("Please select a color for your marker.");
    }
    else if(document.getElementById("username").value == '')
    	alert("Please enter your name.");
    else if(document.getElementById(myUUID) == null){
		pubnub.publish({
					    channel: userChannel,        
					    message: {entryNumber: myUUID, entryName: document.getElementById("username").value, personColor: colorChosen},
					    callback : function(m){},
					    error: function(e){console.log(e)}
		});
		if(colorChosen != 'greenPerson')
			document.getElementById('greenPerson').remove();
		if(colorChosen != 'yellowPerson')
			document.getElementById('yellowPerson').remove();
		if(colorChosen != 'pinkPerson')
			document.getElementById('pinkPerson').remove();
		if(colorChosen != 'grayPerson')
			document.getElementById('grayPerson').remove();
		if(colorChosen != 'navyPerson')
			document.getElementById('navyPerson').remove();
		if(colorChosen != 'bluePerson')
			document.getElementById('bluePerson').remove();
		if(colorChosen != 'redPerson')
			document.getElementById('redPerson').remove();
		if(colorChosen != 'purplePerson')
			document.getElementById('purplePerson').remove();
		if(document.getElementById("playNameTxt") == null)
			console.log("problem found");
		document.getElementById("playNameTxt").innerHTML 
					= document.getElementById("username").value;
		document.getElementById("playNameTxt").style.fontSize = '40px';
		document.getElementById("username").remove();
		document.getElementById("namesubmit").remove();
		document.getElementById(colorChosen).style.width = '100%';


	}
	else
		alert ("You have already submitted your name and color.");

};


function addName(usernumber, usernameIN){
	var list = document.getElementById('demo');
    var entry = document.createElement('li');
    entry.setAttribute("id", usernumber);
	entry.appendChild(document.createTextNode(usernameIN));
	list.appendChild(entry);
}

function highlightColor(color){
	if(colorChosen != 'none')
		document.getElementById(colorChosen).style.width='25%';
	colorChosen = color;
	document.getElementById(color).style.width='35%'; 
}

$(document).ready(function() {

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
			if(message.entryNumber != null && message.entryName != null && message.personColor != null){
				addName(message.entryNumber, message.entryName);
				if( document.getElementById(message.personColor) != null && message.entryNumber != myUUID)
					document.getElementById(message.personColor).style.visibility = 'hidden';
			}
			else if (message.letsPlay != null)
				location.href = "file:///Users/Keleigh/Desktop/493Site/node1.html";
			else if (message.toRemove != null && document.getElementById(message.toRemove) != null){
				document.getElementById(message.toRemove).remove();
			}
		}
	});

	pubnub.history({
     channel: userChannel,
     callback: function(m){
     	var newArr = m[0];
     	var arrayLength = newArr.length;
		for (var i = 0; i < arrayLength; i++) {
         	if(newArr[i].entryNumber != null && newArr[i].entryName != null){
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


});

// //changes how many users are present
// function updateUsers(numUsers){
// 	document.getElementById("presenthead").innerHTML = numUsers + ' Users Present';
// }