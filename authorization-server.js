const fs = require("fs")
const express = require("express")
const bodyParser = require("body-parser")
const jwt = require("jsonwebtoken")
const {
	randomString,
	containsAll,
	decodeAuthCredentials,
	timeout,
} = require("./utils")

const config = {
	port: 9001,
	privateKey: fs.readFileSync("assets/private_key.pem"),

	clientId: "my-client",
	clientSecret: "zETqHgl0d7ThysUqPnaFuLOmG1E=",
	redirectUri: "http://localhost:9000/callback",

	authorizationEndpoint: "http://localhost:9001/authorize",
}

const clients = {
	"my-client": {
		name: "Sample Client",
		clientSecret: "zETqHgl0d7ThysUqPnaFuLOmG1E=",
		scopes: ["permission:name", "permission:date_of_birth"],
	},
	"test-client": {
		name: "Test Client",
		clientSecret: "TestSecret",
		scopes: ["permission:name"],
	},
}

const users = {
	user1: "password1",
	john: "appleseed",
}

const requests = {}
const authorizationCodes = {}

let state = ""

const app = express()
app.set("view engine", "ejs")
app.set("views", "assets/authorization-server")
app.use(timeout)
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

/*
Your code here
*/
app.get('/authorize', (req, res) =>{
	const { client_id } = req.query.client_id;

	if (!clients[client_id]) 
		return res.status(401)
		
	const scopes  = req.query.scopes.split(' ')
	if (!containsAll(clients[client_id].scopes, scopes)) 
		return res.status(401)
		
	const requestId = randomString();
	requests[requestId] = req.query;
	res.render('login', { 
		client: clients[client_id],
		scope: req.query.scope,
		requestId 
	})
})

app.post('/approve', (req, res) =>{
	const { userName, password, requestId } = req.body;
	if (!users[userName] && ! (users[userName] == password)) 
		return res.status(401)

	if (!requests[requestId]) 
		return res.status(401)
		
	const r = requests[requestId];
	delete requests[requestId];

	const randomStr = randomString();
	authorizationCodes[randomStr] = { clientReq: r, userName }
	res.redirect(r.redirect_uri + "?code=" + randomStr + "&state=" +r.state)

	
})

app.post('/token', async (req, res) => {
	if (!req.headers.authorization)
		return res.status(401)

	const decodedClient = decodeAuthCredentials(req.headers.authorization)
	if(!clients[decodedClient.clientId] && 
		!( clients[decodedClient.clientId].clientSecret === decodedClient.clientSecret ) )
		return res.status(401).end()
	const { code } = req.body;

	if(!authorizationCodes[code])
		return res.status(401).end()
	
	const obj = authorizationCodes[code];
	delete authorizationCodes[code];
	const privateKey = fs.readFileSync("assets/private_key.pem")
	const token = jwt.sign({ userName: obj.userName, scope: obj.clientReq.scope }, privateKey, { algorithm: 'RS256' });
	
	return res.status(200).json({ token })
})

const server = app.listen(config.port, "localhost", function () {
	var host = server.address().address
	var port = server.address().port
})

// for testing purposes

module.exports = { app, requests, authorizationCodes, server }
