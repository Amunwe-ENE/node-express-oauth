const express = require("express")
const bodyParser = require("body-parser")
const fs = require("fs")
const jwt = require("jsonwebtoken")
const { timeout } = require("./utils")

const config = {
	port: 9002,
	publicKey: fs.readFileSync("assets/public_key.pem"),
}

const users = {
	user1: {
		username: "user1",
		name: "User 1",
		date_of_birth: "7th October 1990",
		weight: 57,
	},
	john: {
		username: "john",
		name: "John Appleseed",
		date_of_birth: "12th September 1998",
		weight: 87,
	},
}

const app = express()
app.use(timeout)
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

/*
Your code here
*/
app.get("/user-info", (req, res) => {
	if(!req.headers.authorization)
		return res.status(401).end()

	const token = req.headers.authorization.slice(7)
	let decoded ;
	try {
		decoded = jwt.verify(token, config.publicKey, { algorithms: ["RS256"]})
		
	} catch (error) {
		return res.status(401).end()
	}

	const scopes = decoded.scope.split(" ")
	const userInfo = {}
	scopes.forEach(element => {
		let propertyName = element.slice(12)
		userInfo[propertyName] = users[decoded.userName][propertyName]
	});
	res.status(200).json(userInfo)
})

const server = app.listen(config.port, "localhost", function () {
	var host = server.address().address
	var port = server.address().port
})

// for testing purposes
module.exports = {
	app,
	server,
}
