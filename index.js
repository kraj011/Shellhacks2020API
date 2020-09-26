const express = require("express");
const bodyParser = require("body-parser");
var cors = require("cors");
require("dotenv").config();

const app = express();
app.use(
	bodyParser.urlencoded({
		extended: true,
	})
);

app.use(bodyParser.json());

app.use(cors());

const port = process.env.PORT || 8080;

const {
	sendDM,
	getLatestTweet,
	getUserInfo,
	sendMessageToChatbot,
	analyzeUserTweets,
	verifyUserIsAdded,
} = require("./utils");

app.get("/", async (req, res) => {
	res.send("EMPATWEET");
});

app.post("/getLatestTweet", async (req, res) => {
	let screenName = req.body.screenName;
	if (!screenName) {
		res.set("Access-Control-Allow-Origin", "*").send({
			error: "Please send a screen name",
		});
		return;
	}
	getUserInfo(screenName)
		.then((response) => {
			res.set("Access-Control-Allow-Origin", "*").send({
				response: response,
			});
		})
		.catch((err) => {
			res.set("Access-Control-Allow-Origin", "*").send({
				error: "There was an error retrieving your user information.",
			});
		});
});

app.post("/getUserInfo", async (req, res) => {
	let screenName = req.body.screenName;
	if (!screenName) {
		res.set("Access-Control-Allow-Origin", "*").send({
			error: "Please send a screen name",
		});
		return;
	}
	verifyUserIsAdded(screenName);
	getUserInfo(screenName)
		.then((response) => {
			res.set("Access-Control-Allow-Origin", "*").send({
				response: response,
			});
		})
		.catch((err) => {
			res.set("Access-Control-Allow-Origin", "*").send({
				error: "There was an error retrieving your user information.",
			});
		});
});

// app.post("/sendMessage", async (req, res) => {
// 	let message = req.body.message;
// 	let sessionId = req.body.sessionId;
// 	if (!sessionId || !message) {
// 		res.set("Access-Control-Allow-Origin", "*").send({
// 			error: "Please send a session ID and message",
// 		});
// 		return;
// 	}
// 	sendMessageToChatbot(message, sessionId)
// 		.then((response) => {
// 			res.set("Access-Control-Allow-Origin", "*").send({
// 				response: response,
// 			});
// 		})
// 		.catch((err) => {
// 			res.set("Access-Control-Allow-Origin", "*").send({
// 				error: "There was an error sending your message.",
// 			});
// 		});
// });

app.listen(port, () => {
	console.log(`EMPATWEET app listening at http://localhost:${port}`);
	setInterval(() => {
		analyzeUserTweets();
	}, 300000);
	analyzeUserTweets();
});
