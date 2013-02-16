var http	= require ('http'),
	app		= http.createServer(handler),
	io 		= require ('socket.io').listen (app),
	fs 		= require ('fs'),
	users	= {};

app.listen (8080);

function handler (req, res)
{
	fs.readFile (__dirname + '/chat.html', function (err, data)
	{
		if (err)
		{
			res.writeHead (500);
		}

		res.writeHead(200);
		res.end (data);
	});
}
/**
 * Client may recieve:
 * list users			Returns a list of all users
 * update chat			Returns a message to be inserted in HTML
 * user connected		Returns a user name which just connected
 * user disconnected	Returns a user name which just disconnected
 *
 * Client may send:
 * user connect			The user name which he selected
 * send message			A message to be sent
 */
io.sockets.on ('connection', function (socket)
{
	socket.on ('user connect', function (data, callback)
	{
		if ( users[data.name] )
		{
			callback (false);
			return;
		}
		
		users[data.name] = data.name;
		socket.name = data.name;
		// notify all clients except the sender
		socket.broadcast.emit ("user connected", {name: data.name});
		// notify all clients
		io.sockets.emit ('list users', users);
		
		// tell the client the name is ok
		callback(true);
	});

	socket.on ('send message', function (data)
	{
		// tell all clients to update
		io.sockets.emit ('update chat', {
			name: socket.name,
			message: data.message
		});
	});

	socket.on ('disconnect', function ()
	{
		if ( ! socket.name || ! users[socket.name])
			return;

		delete users[socket.name];
		
		socket.broadcast.emit ('user disconnected', {
			name: socket.name
		});
		socket.broadcast.emit ('list users', users);
	});
});
