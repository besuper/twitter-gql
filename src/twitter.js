import fetch from "node-fetch";
import { GrapQLRequest } from "./graphql.js";
import { has_error } from "./error.js";

const gql_id = {
    "like": "lI07N6Otwv1PhnEgXILM7A",
    "retweet": "ojPdsZsimiJrUGLR1sjUtA"
};

const endpoints = {
    "follow": "https://api.twitter.com/1.1/friendships/create.json",
    "like": `https://api.twitter.com/graphql/${gql_id["like"]}/FavoriteTweet`,
    "retweet": `https://api.twitter.com/graphql/${gql_id["retweet"]}/CreateRetweet`
};

export class TwitterClient {
    constructor(authorization, auth_token) {
        this.auth_token = auth_token;
        this.authorization = authorization;
    }

    async connect() {
        const response = await fetch("https://twitter.com/home", {
            method: 'get',
            headers: { 'Cookie': `auth_token=${this.auth_token}; ct0=960eb16898ea5b715b54e54a8f58c172` }
        });

        if (!response.ok) {
            console.error(response);
            throw new Error("Can't generate csrf token!");
        }

        const cookie_header = response.headers.get("set-cookie");
        const cookies = cookie_header.split(" ");

        let ct0 = undefined;

        for (const index in cookies) {
            const cookie = cookies[index];

            if (cookie.startsWith("ct0=")) {
                ct0 = cookie.substring(0, cookie.length - 1);
                break;
            }
        }

        if (ct0 === undefined) {
            console.error(cookie_header);
            throw new Error("Can't find csrf token in twitter cookies header");
        }

        this.csrf = ct0.split("=")[1];

        this.header = {
            "Authorization": "Bearer " + this.authorization,
            "Cookie": `auth_token=${this.auth_token}; ct0=${this.csrf}; lang=en`,
            "x-csrf-token": this.csrf
        };
    }

    async like(tweet_id) {
        const like_request = new GrapQLRequest(gql_id["like"]);
        like_request.add("tweet_id", tweet_id);

        const response = await fetch(endpoints["like"], {
            method: 'POST',
            body: like_request.serialize(),
            headers: { ...this.header, 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(response);
        }

        const data = await response.json();

        if (has_error(data)) {
            throw new Error(data.errors[0].message);
        }
    }

    async retweet(tweet_id) {
        const retweet_request = new GrapQLRequest(gql_id["retweet"]);
        retweet_request.add("tweet_id", tweet_id);
        retweet_request.add("dark_request", false);

        const response = await fetch(endpoints["retweet"], {
            method: 'POST',
            body: retweet_request.serialize(),
            headers: { ...this.header, 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(response);
        }

        const data = await response.json();

        if (has_error(data)) {
            throw new Error(data.errors[0].message);
        }
    }

    async follow(user_id) {
        const formData = new FormData();
        formData.append("user_id", user_id);

        const response = await fetch(endpoints["follow"], {
            method: 'POST',
            body: formData,
            headers: this.header
        });

        if (!response.ok) {
            throw new Error(response);
        }

        const data = await response.json();

        if (has_error(data)) {
            throw new Error(data.errors[0].message);
        }
    }

    async search(keywords) {
        console.log(this.header);

        const response = await fetch(`https://api.twitter.com/2/search/adaptive.json?cards_platform=Web-12&tweet_mode=extended&simple_quoted_tweet=true&q=${keywords}&query_source=typed_query&count=20&requestContext=launch&pc=1&spelling_corrections=1`, {
            headers: this.header
        });

        if (!response.ok) {
            console.error(response);
            //throw new Error(response);
        }

        const data = await response.json();

        if (has_error(data)) {
            console.log(data);
            throw new Error(data.errors[0].message);
        }

        console.log(data);
    }
}