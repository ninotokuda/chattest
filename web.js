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

		user.user_status = userState.UserStateInMenu;
		user.user_name = name;
		user.socket.write('success# your username is ' + name + '\r\n');
		user.socket.write('to create a room type create to see all the rooms type peak \r\n');

	}else{

		user.socket.write('fail# this username is already taken, try again\r\n');
	}
}


function choose_menue(user, menu_choise){

	console.log('menu_choise' + menu_choise);

	if(menu_choise == 'create'){

		user.user_status = userState.UserStateCreateRoom;
		user.socket.write('success# enter the room name or /back for to return \r\n');

	}else if(menu_choise == 'peak'){

		user.user_status = userState.UserStateJoinRoom;
		user.socket.write('success# rooms list \r\n');
		for(var r = 0; r < rooms.length; r++){
			user.socket.write(rooms[r].room_name + '\r\n');
		}
		user.socket.write('success# rooms list \r\n');
		user.socket.write('enter room name to join room or /back to return \r\n');

	}else{

		user.socket.write('fail# invalide command \r\n');

	}
}

function create_room(user, name){

	if(name == '/back'){
		user.user_status = userState.UserStateInMenu;
		user.socket.write('success# to create a room type create to see all the rooms type peak \r\n');
		return;
	}

	var canCreateRoom = true;
	for(var r = 0; r < rooms.length; r++){

		if(rooms[r].room_name == name){
			canCreateRoom = false;
			break;
		}
	}

	if(canCreateRoom){

		room = new Room(name);
		room.users.push(user);
		rooms.push(room);
		user.user_status = userState.UserStateInRoom;
		user.socket.write('success# you have created and joined the room: ' + name + ' type /leave to leave the room \r\n');

	}else{

		user.socket.write('fail# cannot create room, enter other name \r\n');

	}
}

function join_room(user, name){

	if(name == '/back'){
		user.user_status = userState.UserStateInMenu;
		return;
	}

	var roomIndex = -1;
	for(var r = 0; r < rooms.length; r++){

		if(rooms[r].room_name == name){
			roomIndex = r;
			break;
		}
	}

	if(roomIndex >= 0){
		user.user_status = userState.UserStateInRoom;
		for(var ru = 0; ru < room.users.length; ru++){
			rooms[roomIndex].users[ru].socket.write(user.user_name + ' hast joined the room \r\n');
		}
		rooms[roomIndex].users.push(user);
		console.log(rooms);
		user.socket.write('success# you joined the room ' + name + ' type /leave to leave \r\n');
	}else{
		user.socket.write('fail# this room does not exist, enter a different room name\r\n');
	}
}

function in_room(user, data){

	if('/leave' == data){
		var room;
		for (var r = 0; r < rooms.length; r++){
			for(var ru = 0; ru < rooms[r].users.length; ru++){
				if(rooms[r].users[ru] == user){
					rooms[r].users.splice(ru,1);
				}
			}
		}

		user.user_status = userState.UserStateInMenu;
		user.socket.write('success# to create a room type create to see all the rooms type peak \r\n');
		return;
	}

	var room_index = -1;
	for (var r = 0; r < rooms.length; r++){
		for(var ru = 0; ru < rooms[r].users.length; ru++){
			if(rooms[r].users[ru] == user){
				room_index = r;
				break;
			}
		}
	}

	if (room_index >= 0){
		for(var ru = 0; ru < rooms[room_index].users.length; ru++){
			if(rooms[room_index].users[ru] == user) continue;
			rooms[room_index].users[ru].socket.write(user.user_name + '# ' + data + '\r\n');
		}
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
				data = data.replace('#', '');
				
				// ----- login ----- //
				if(users[i].user_status == userState.UserStateNotLogedIn){
					register_user_name(users[i], data);
				}

				// ----- menu ---- //
				else if(users[i].user_status == userState.UserStateInMenu){
					choose_menue(users[i], data);
				}

				// ----- create room ---- //
				else if(users[i].user_status == userState.UserStateCreateRoom){
					create_room(users[i], data);
				}

				// ----- join room ----- //
				else if(users[i].user_status == userState.UserStateJoinRoom){
					join_room(users[i], data);
				}

				// ----- in room ----- //
				else if(users[i].user_status == userState.UserStateInRoom){
					in_room(users[i], data);
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