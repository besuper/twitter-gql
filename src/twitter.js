import fetch from "node-fetch";
import { GrapQLRequest } from "./graphql.js";
import { has_error } from "./error.js";
import { parse } from 'cookie';

const gql_id = {
    "like": "lI07N6Otwv1PhnEgXILM7A",
    "retweet": "ojPdsZsimiJrUGLR1sjUtA"
};

const endpoints = {
    "follow": "https://api.twitter.com/1.1/friendships/create.json",
    "like": `https://api.twitter.com/graphql/${gql_id["like"]}/FavoriteTweet`,
    "retweet": `https://api.twitter.com/graphql/${gql_id["retweet"]}/CreateRetweet`
};

function getOrDefault(dict, name, def) {
    if (name in dict) {
        return name + '=' + dict[name] + ";";
    }

    if (def === undefined) {
        return '';
    }

    return name + '=' + def + ";";
}

export class TwitterClient {
    constructor(authorization, auth_token) {
        this.authorization = authorization;
        this.auth_token = auth_token;
    }

    async connect() {
        const response = await fetch("https://twitter.com/home", {
            method: 'GET',
            headers: {
                'Cookie': `auth_token=${this.auth_token}; guest_id=v1%9999;`
            }
        });

        if (!response.ok) {
            console.error(response);
            throw new Error("Can't generate csrf token!");
        }

        const cookie_header = response.headers.get("set-cookie");
        const cookiesArray = cookie_header.split(',');

        const parsedCookies = cookiesArray.reduce((cookies, cookieString) => {
            const parsedCookie = parse(cookieString);
            return { ...cookies, ...parsedCookie };
        }, {});

        let ct0 = parsedCookies['ct0'];

        if (ct0 === undefined) {
            console.error(cookie_header);
            throw new Error("Can't find csrf token in twitter cookies header");
        }

        this.csrf = ct0;

        this.header = {
            "Authorization": "Bearer " + this.authorization,
            "Cookie": `auth_token=${this.auth_token}; ct0=${this.csrf}; ${getOrDefault(parsedCookies, 'lang', 'en')} ${getOrDefault(parsedCookies, 'gest_id', undefined)}${getOrDefault(parsedCookies, 'twid', undefined)}`,
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