var userChannel = 'user_channel';
var userID = 'unknown';
var myUUID = PUBNUB.uuid();
var pubnub = PUBNUB({
	subscribe_key: 'sub-c-b1b8b6c8-8b1c-11e5-84ee-0619f8945a4f', // always required
	publish_key: 'pub-c-178c8c90-9ea7-46e3-8982-32615dadbba0',    // only required if publishing
	uuid: myUUID
});

document.getElementById("letsplay").onclick = function () {
	console.log(location.href);
    location.href = "file:///Users/Keleigh/Desktop/493Site/node1.html";
};

document.getElementById("namesubmit").onclick = function () {
    if(document.getElementById(myUUID) == null){
		pubnub.publish({
					    channel: userChannel,        
					    message: {entryNumber: myUUID, entryName: document.getElementById("username").value},
					    callback : function(m){console.log("publishing in subcard: " + m)},
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
			userId = "user " + m.occupancy;
			// updateUsers(m.occupancy);
			if(m.action == 'leave' || m.action == 'timeout'){
				if(document.getElementById("myUUID") != null){
					document.getElementById("myUUID").remove();
					pubnub.publish({
						    channel: userChannel,        
						    message: {toRemove: myUUID},
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

	
		}
	});

	pubnub.history({
     channel: userChannel,
     callback: function(m){
     	var newArr = m[0];
     	//console.log(JSON.stringify(m));
     	var arrayLength = newArr.length;
		for (var i = 0; i < arrayLength; i++) {
         	if(newArr[i].entryNumber != null && newArr[i].entryName != null){
				addName(newArr[i].entryNumber, newArr[i].entryName );
			}
			if(newArr[i].toRemove != null && document.getElementById("myUUID") != null)
				document.getElementById("myUUID").remove();
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