var userChannel = 'user_channel5';
var myUUID = PUBNUB.uuid();
var pubnub = PUBNUB({
	subscribe_key: 'sub-c-b1b8b6c8-8b1c-11e5-84ee-0619f8945a4f', // always required
	publish_key: 'pub-c-178c8c90-9ea7-46e3-8982-32615dadbba0',    // only required if publishing
	uuid: myUUID,
	heartbeat: 60
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
    if(document.getElementById(myUUID) == null){
		pubnub.publish({
					    channel: userChannel,        
					    message: {entryNumber: myUUID, entryName: document.getElementById("username").value},
					    callback : function(m){},
					    error: function(e){console.log(e)}
					});
	}
	else
		alert ("you already submitted your name");

};

function addName(usernumber, usernameIN){
	var list = document.getElementById('demo');
    var entry = document.createElement('li');
    entry.setAttribute("id", usernumber);
	entry.appendChild(document.createTextNode(usernameIN));
	list.appendChild(entry);
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
			if(message.entryNumber != null && message.entryName != null)
				addName(message.entryNumber, message.entryName);
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
			else{
				console.log(newArr[i]);
				console.log("the above was not caught");
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