require('dotenv').config()

const {
		ETwitterStreamEvent,
		TweetV2SingleStreamResult,
		TweetStream,
		TwitterApi,
	} = require('twitter-api-v2'),
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
			add: [{ value: '@personafinder has:mentions' }],
		})

		/**
		 * @type {TweetStream<TweetV2SingleStreamResult>}
		 */
		const stream = await streamClient.v2.getStream('tweets/search/stream', {
			'tweet.fields': 'entities',
			expansions: ['referenced_tweets.id'],
		})

		console.log('Tweet stream online!')

		stream.autoReconnect = true
		stream.keepAliveTimeoutMs = Infinity

		stream.on(ETwitterStreamEvent.Data, async ({ data, includes }) => {
			if (
				[
					'skills',
					'skillsets',
					'skill sets',
					'application',
					'looking for',
					'includes',
				].some((string) =>
					(data.text || includes.tweets[0].text).includes(string)
				)
			) {
				data.id &&
					(await userClient.v2.retweet(process.env.TWITTER_ID, data.id))
				includes.tweets.length &&
					(await userClient.v2.retweet(
						process.env.TWITTER_ID,
						includes.tweets[0].id
					))
			}
		})
	} catch (error) {
		console.log(error)
	}
})()
