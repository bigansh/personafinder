require('dotenv').config()

const { ETwitterStreamEvent, TwitterApi } = require('twitter-api-v2'),
	{ TwitterApiRateLimitPlugin } = require('@twitter-api-v2/plugin-rate-limit')

const rateLimitPlugin = new TwitterApiRateLimitPlugin()

const userClient = new TwitterApi(
	{
		appKey: process.env.CLIENT_ID,
		appSecret: process.env.CLIENT_SECRET,
		accessToken: process.env.ACCESS_TOKEN,
		accessSecret: process.env.ACCESS_TOKEN_SECRET,
	},
	{ plugins: [rateLimitPlugin] }
)

const streamClient = new TwitterApi(process.env.BEARER_TOKEN, {
	plugins: [rateLimitPlugin],
})

;(async () => {
	try {
		await streamClient.v2.updateStreamRules({
			add: [
				{ value: '@personafinder has:mentions' },
				{ value: 'application to @personafinder has:mentions' },
				{ value: 'application for @personafinder has:mentions' },
			],
		})

		const stream = await streamClient.v2.searchStream()

		console.log('Tweet stream online!')

		stream.autoReconnect = true
		stream.keepAliveTimeoutMs = Infinity

		stream.on(
			ETwitterStreamEvent.Data,
			async ({ data }) =>
				await userClient.v2.retweet('1521077435478908928', data.id)
		)
	} catch (error) {
		console.log(error)
	}
})()
