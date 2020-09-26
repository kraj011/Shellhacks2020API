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
const dialogflow = require("@google-cloud/dialogflow");
// Instantiates a session client
const sessionClient = new dialogflow.SessionsClient();

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
				reject(err);
			});
	});
};

const getLatestTweet = (screenName) => {
	return new Promise((resolve, reject) => {
		T.post("statuses/user_timeline", {
			screen_name: screenName,
			count: 1,
		})
			.then((result) => {
				resolve(result);
			})
			.catch((err) => {
				reject(err);
			});
	});
};

const getLatestNTweets = (screenName, numberOfTweets) => {
	return new Promise((resolve, reject) => {
		T.post("statuses/user_timeline", {
			screen_name: screenName,
			count: numberOfTweets,
		})
			.then((result) => {
				resolve(result);
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

const getSentimentForTweet = (message, sessionId) => {};

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

module.exports = {
	sendDM,
	getLatestTweet,
	getUserInfo,
	getLatestNTweets,
	sendMessageToChatbot,
};
