const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");

const adapter = new FileSync("db.json");
const db = low(adapter);

const Twit = require("twit");
var T = new Twit({
	consumer_key: process.env.CONSUMER_KEY,
	consumer_secret: process.env.CONSUMER_SECRET,
	access_token: process.env.ACCESS_TOKEN,
	access_token_secret: process.env.ACCESS_TOKEN_SECRET,
	timeout_ms: 60 * 1000, // optional HTTP request timeout to apply to all requests.
	strictSSL: true, // optional - requires SSL certificates to be valid.
});

/**
 * TODO(developer): UPDATE these variables before running the sample.
 */
// projectId: ID of the GCP project where Dialogflow agent is deployed
const projectId = "helpbot-ghec";
// sessionId: String representing a random number or hashed user identifier
// const sessionId = '123456';
// queries: A set of sequential queries to be send to Dialogflow agent for Intent Detection
// const queries = [
//   'Reserve a meeting room in Toronto office, there will be 5 of us',
//   'Next monday at 3pm for 1 hour, please', // Tell the bot when the meeting is taking place
//   'B'  // Rooms are defined on the Dialogflow agent, default options are A, B, or C
// ]
// languageCode: Indicates the language Dialogflow agent should use to detect intents
const languageCode = "en";
// Imports the Dialogflow library
// const dialogflow = require("@google-cloud/dialogflow");
// // Instantiates a session client
// const sessionClient = new dialogflow.SessionsClient();

const sendDM = (userId, message) => {
	return new Promise((resolve, reject) => {
		const params = {
			event: {
				type: "message_create",
				message_create: {
					target: {
						recipient_id: userId,
					},
					message_data: {
						text: message,
					},
				},
			},
		};

		T.post("direct_messages/events/new", params)
			.then((result) => {
				resolve();
			})
			.catch((err) => {
				console.log(err);
				reject(err);
			});
	});
};

const getLatestTweet = (screenName) => {
	return new Promise((resolve, reject) => {
		T.get("statuses/user_timeline", {
			screen_name: screenName,
			count: 1,
			include_rts: false,
		})
			.then((result) => {
				resolve(result.data[0]);
			})
			.catch((err) => {
				reject(err);
			});
	});
};

const getLatestNTweets = (screenName, numberOfTweets) => {
	return new Promise((resolve, reject) => {
		T.get("statuses/user_timeline", {
			screen_name: screenName,
			count: numberOfTweets,
			include_rts: false,
		})
			.then((result) => {
				resolve(result.data);
			})
			.catch((err) => {
				reject(err);
			});
	});
};

const getUserInfo = (screenName) => {
	return new Promise((resolve, reject) => {
		T.post("users/lookup", {
			screen_name: screenName,
		})
			.then((result) => {
				resolve(result.data);
			})
			.catch((err) => {
				reject(err);
			});
	});
};

const getSentimentForTweet = (message) => {
	return new Promise((resolve, reject) => {
		resolve(["sad", 1]);
	});
};

const sendMessageToChatbot = (message, sessionId, contexts) => {
	return new Promise(async (resolve, reject) => {
		// The path to identify the agent that owns the created intent.
		const sessionPath = sessionClient.projectAgentSessionPath(
			projectId,
			sessionId
		);

		console.log(message);

		const request = {
			session: sessionPath,
			queryInput: {
				text: {
					text: message,
					languageCode: languageCode,
				},
			},
		};

		if (contexts && contexts.length > 0) {
			request.queryParams = {
				contexts: contexts,
			};
		}

		const responses = await sessionClient
			.detectIntent(request)
			.catch((err) => reject(err));
		console.log(responses[0]);
		resolve(responses[0]);
	});
};

const analyzeUserTweets = () => {
	let users = db.get("users").value();
	users.forEach((user) => {
		console.log(user);
		getLatestTweet(user.name).then((latestTweet) => {
			if (latestTweet.id_str === user.latestTweet) {
				return;
			}
			// New tweet found!
			// Analyze sentiment

			getSentimentForTweet(latestTweet.text).then(
				([sentiment, magnitude]) => {
					switch (sentiment) {
						case "joy":
							sendDM(
								latestTweet.user.id_str,
								"Well done tweeting something positive and promoting #HealthyConversations !"
							);
							break;
						default:
							if (magnitude >= 0.9) {
								sendDM(
									latestTweet.user.id_str,
									`Hi friend! We noticed you were feeling a bit ${sentiment}, here's a cat GIF to cheer you up! https://giphy.com/gifs/4WSkQQjJPQoRq Share it with you friends and keep promoting #HealthyConversations ! If you want to talk to someone, make sure to call 1-800-662-HELP (4357) for a free, confidential way of sharing your thoughts!`
								);
							} else {
								sendDM(
									latestTweet.user.id_str,
									`Hi friend! We noticed you were feeling a bit ${sentiment}, here's a cat GIF to cheer you up! https://giphy.com/gifs/4WSkQQjJPQoRq Share it with you friends and keep promoting #HealthyConversations !`
								);
							}
							break;
					}
				}
			);

			// update user latest message id

			db.get("users")
				.find({
					name: user.name,
				})
				.assign({
					latestTweet: latestTweet.id_str,
				})
				.write();
		});
	});
};

const verifyUserIsAdded = (screenName) => {
	let userIsAdded = db
		.get("users")
		.find({
			name: screenName,
		})
		.value();
	if (!userIsAdded) {
		db.get("users").push({ name: screenName, latestTweet: "" }).write();
	}
};

const getLatestTweetsWithSentiment = (screenName) => {
	return new Promise(async (resolve, reject) => {
		let tweets = [];

		await getLatestNTweets(screenName, 10).then(async (latestTweets) => {
			for (let i = 0; i < latestTweets.length; i++) {
				let sentiment = await getSentimentForTweet(
					latestTweets[i].text
				);
				tweets.push({
					text: latestTweets[i].text,
					sentiment: sentiment,
				});
			}
		});
		resolve(tweets);
	});
};

module.exports = {
	sendDM,
	getLatestTweet,
	getUserInfo,
	getLatestNTweets,
	sendMessageToChatbot,
	analyzeUserTweets,
	verifyUserIsAdded,
	getLatestTweetsWithSentiment,
};
