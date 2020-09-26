const express = require("express");
const bodyParser = require("body-parser");
var cors = require("cors");
require("dotenv").config();

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

app.use(bodyParser.json());

app.use(cors());

const port = 3001;

const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");

const adapter = new FileSync("db.json");
const db = low(adapter);

const { sendDM, getLatestTweet, getUserInfo } = require("./utils");

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

app.listen(port, () => {
	console.log(`Example app listening at http://localhost:${port}`);
	// let users = db.get("users").value();
});
