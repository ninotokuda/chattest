var net = require('net'); //TCP Server 
//var user_object = require('./user');

var userState =  { 'UserStateNotLogedIn' : 0, 
					'UserStateLogedInMenu' : 1, 
					'UserStateInRoom' : 2,
					'UserStateJoinRoom' : 3,
					'UserStateCreateRoom' : 4 };
 
var sockets = []; //empty array for ppl who connect to server
var users = [];
var rooms = [];

var chat_status;

function User(socket){

	this.user_status = userState.UserStateNotLogedIn;
	this.socket = socket;
	this.user_name = '';

}

function Room(room_name){

	this.room_name = room_name;
	this.users = [];

}


function register_user_name(user, name){

	var userNameIsAvailable = true;
	for(var i = 0; i < users.length; i++){
		if(users[i].user_name == name){
			userNameIsAvailable = false;
			break;
		}
	}

	if(userNameIsAvailable){

		user.user_status = userState.UserStateLogedIn;
		user.user_name = data;
		user.socket.write('success# your username is ' + name + '\r\n');
		socket.write('to create a room type create to see all the rooms type peak \r\n');

	}else{

		user.socket.write('fail#this username is already taken');
	}
}
 
var server = net.createServer(function(socket){
	sockets.push(socket); //add person to socket

	// create user object
	user = new User(socket);
	users.push(user);

	// return welcom message
	socket.write('welcome to my simple chat server \r\n');
	socket.write('what is you username? \r\n');

	socket.on('data', function(data){

		for(var i = 0; i<users.length; i++){
			if(users[i].socket == socket){

				data = data.toString('utf-8').trim();
				

				// ----- login ----- //
				if(users[i].user_status == userState.UserStateNotLogedIn){

					register_user_name(users[i], data);

					data = data.toString('utf-8').trim();
					
					console.log('connect');
				}

				// ----- menu ---- //
				else if(users[i].user_status == userState.UserStateInMenu){

					// convert data to comparable string
					data = data.toString('utf-8').trim();

					if(data.toString() == 'create'){
						users[i].user_status = userState.UserStateCreateRoom;
						socket.write('enter the room name \r\n');

					}

					else if(data.toString() == 'peak'){
						users[i].user_status = userState.UserStateJoinRoom;
						socket.write('room list: \r\n');
						for(var r = 0; r < rooms.length; r++){
							socket.write(rooms[r].room_name + '\r\n');
						}
						socket.write('type room name to join room \r\n');
					}
				}

				// ----- create room ---- //
				else if(users[i].user_status == userState.UserStateCreateRoom){

					// convert data to comparable string
					data = data.toString('utf-8').trim();
					room = new Room(data);
					room.users.push(users[i]);
					rooms.push(room);
					users[i].user_status = userState.UserStateInRoom;
					socket.write('you have created and joined the room: ' + data + '\r\n');
					socket.write('type /leave to leave the room \r\n');

				}

				// ----- join room ----- //
				else if(users[i].user_status == userState.UserStateJoinRoom){

					data = data.toString('utf-8').trim();
					//var isValidRoom = false;
					//var room;
					var room_index = -1
					for(var r = 0; r < rooms.length; r++){
						if(rooms[r].room_name == data){
							room_index = r;
							//isValidRoom = true;
							//room = rooms[r];
							break;
						}
					}

					if(room_index >= 0){
						users[i].user_status = userState.UserStateInRoom;
						for(var ru = 0; ru < room.users.length; ru++){
							rooms[room_index].users[ru].socket.write(users[i].user_name + ' hast joined the room \r\n');
						}
						rooms[room_index].users.push(users[i]);
						socket.write('you joined the room ' + data + '\r\n');

					}else{
						socket.write('the room ' + data + ' does not exist, try again \r\n');
					}
				}

				// ----- in room ----- //
				else if(users[i].user_status == userState.UserStateInRoom){
					data = data.toString('utf-8').trim();
					var room_index = -1;
					for(var r = 0; r < rooms.length; r++){
						if(rooms[r].users.indexOf(users[i])){
							room_index = r;
							break;
						}
					}

					if(room_index >= 0){
						for(var ru = 0; ru < room.users.length; ru++){
						if(room.users[ru] == users[i]) continue;
							room.users[ru].socket.write(data + '\r\n');
						}
					}
				}
			}
		}
	});

 
	//remove socket from arary
	socket.on('end', function(){
		var i = sockets.indexOf(socket);
		sockets.splice(i,1); //remove person from array
		//could also do-- delete socket.[0]
	});
});
 
server.listen(8080);