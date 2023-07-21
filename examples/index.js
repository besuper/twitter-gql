import { TwitterClient } from 'twitter-gql';

(async () => {
    const client = new TwitterClient(
        "AUTHORIZATION",
        "AUTH_TOKEN",
    );

    await client.connect();

    const tweets = await client.search("hello");
    const firstTweet = tweets[0];

    console.log(firstTweet);

    await client.like(firstTweet.id_str);

    // Follow the user
    // await client.follow(firstTweet.user_id_str);
})();