const Twit = require("twit");
var T = new Twit({
    consumer_key: "",
    consumer_secret: "",
    access_token: "",
    access_token_secret: "",
    timeout_ms: 60 * 1000, // optional HTTP request timeout to apply to all requests.
    strictSSL: true, // optional - requires SSL certificates to be valid.
});


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
                reject(err)
            });
    })
}

const getLatestTweet = (screenName) => {
    return new Promise((resolve, reject) => {
        T.post("statuses/user_timeline", {
                screen_name: screenName,
                count: 1
            })
            .then((result) => {
                resolve(result);
            })
            .catch((err) => {
                reject(err)
            });
    })
}

const getUserInfo = (screenName) => {
    return new Promise((resolve, reject) => {
        T.post("users/lookup", {
                screen_name: screenName
            })
            .then((result) => {
                resolve(result.data)
            })
            .catch((err) => {
                reject(err)
            });
    })

}

module.exports = {
    sendDM,
    getLatestTweet,
    getUserInfo
}
