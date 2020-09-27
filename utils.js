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

const automl = require("@google-cloud/automl");
const fs = require("fs");

// Create client for prediction service.
const client = new automl.PredictionServiceClient();

/**
 * TODO(developer): Uncomment the following line before running the sample.
 */
const projectId = `maximal-quanta-290705`;
const computeRegion = `us-central1`;
const modelId = `TCN7064549125437521920`;
// const filePath = `local text file path of content to be classified, e.g. "./resources/flower.png"`;
// const scoreThreshold = `value between 0.0 and 1.0, e.g. "0.5"`;

// Get the full path of the model.
const modelFullId = client.modelPath(projectId, computeRegion, modelId);


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
    return new Promise(async (resolve, reject) => {
        const [response] = await client.predict({
            name: modelFullId,
            payload: {
                textSnippet: {
                    content: message,
                    mime_type: "text/plain",
                },
            },
            params: {},
        });
        let payload = response.payload;
        payload.sort((s1, s2) => s1.classification.score > s2.classification.score)
        resolve([payload[0].displayName, payload[0].classification.score]);
    });
};

const sendMessageToChatbot = (message, sessionId, contexts) => {
    return new Promise(async (resolve, reject) => {
        // The path to identify the agent that owns the created intent.
        const sessionPath = sessionClient.projectAgentSessionPath(
            projectId,
            sessionId
        );
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
        getLatestTweet(user.name).then((latestTweet) => {
            if (latestTweet.id_str === user.latestTweet) {
                return;
            }
            // New tweet found!
            // Analyze sentiment

            getSentimentForTweet(latestTweet.text).then(
                ([sentiment, magnitude]) => {
                    switch (sentiment) {
                        case "happy":
                            if (magnitude >= 0.5) {
                                sendDM(
                                    latestTweet.user.id_str,
                                    `😃😃😃. Thanks for tweeting something positive! Here's an adorable GIF, you deserve it!: https://tenor.com/search/cute-animals-gifs.`
                                );
                            }
                            break;
                        case "angry":
                            if (magnitude >= 0.5) {
                                sendDM(
                                    latestTweet.user.id_str,
                                    `We noticed a bit of 😡 in your recent tweet. Here's an adorable GIF, just for you!: https://tenor.com/view/dogs-watermelon-hungry-nomnomnom-gif-3426752. Please try and take a deep breathe, and don't be afraid to share how you're feeling with people who can help so we can all keep promoting #HealthyConversations!`
                                );
                            }
                            break;
                        case "sad":
                            if (magnitude >= 0.9) {
                                sendDM(
                                    latestTweet.user.id_str,
                                    `We noticed some heavy 😞 in your recent tweet. Here's an adorable GIF, just for you!: https://giphy.com/gifs/4Zo41lhzKt6iZ8xff9. Remember that you are loved, and don't be afraid to share how you're feeling with people who can help so we can all keep promoting #HealthyConversations! If you would like, please call the free hotline 1-800-273-8255 to talk it out with someone who cares.`
                                );
                            } else if (magnitude >= 0.5) {
                                sendDM(
                                    latestTweet.user.id_str,
                                    `We noticed a bit of 😞 in your recent tweet. Here's an adorable GIF, just for you!: https://giphy.com/gifs/4Zo41lhzKt6iZ8xff9. We're also sending virtual some 🤗s right your way. Don't be afraid to share how you're feeling with people who can help so we can all keep promoting #HealthyConversations!`
                                );
                            }
                            break;
                        case "scared":
                            if (magnitude >= 0.5) {
                                sendDM(
                                    latestTweet.user.id_str,
                                    `We noticed a bit of 😨 in your recent tweet. Here's an adorable GIF, just for you!: https://giphy.com/explore/cute-animals-gif. We know you'll get through this. Don't be afraid to share how you're feeling with people who can help so we can all keep promoting #HealthyConversations!`
                                );
                            }
                            break;
                        default:
                            sendDM(
                                latestTweet.user.id_str,
                                `Error occurred. Awwkwaaaaaard...`
                            );
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
        db.get("users").push({
            name: screenName,
            latestTweet: ""
        }).write();
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

/**
 * TODO(developer): UPDATE these variables before running the sample.
 */
// projectId: ID of the GCP project where Dialogflow agent is deployed
// const projectId = "helpbot-ghec";
// sessionId: String representing a random number or hashed user identifier
// const sessionId = '123456';
// queries: A set of sequential queries to be send to Dialogflow agent for Intent Detection
// const queries = [
//   'Reserve a meeting room in Toronto office, there will be 5 of us',
//   'Next monday at 3pm for 1 hour, please', // Tell the bot when the meeting is taking place
//   'B'  // Rooms are defined on the Dialogflow agent, default options are A, B, or C
// ]
// languageCode: Indicates the language Dialogflow agent should use to detect intents
// const languageCode = "en";
// Imports the Dialogflow library
// const dialogflow = require("@google-cloud/dialogflow");
// // Instantiates a session client
// const sessionClient = new dialogflow.SessionsClient();