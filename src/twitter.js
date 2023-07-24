import fetch from "node-fetch";
import { GrapQLRequest } from "./graphql.js";
import { has_error } from "./error.js";
import { parse } from 'cookie';
import { endpoints } from './endpoints.js';

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
        const like_request = new GrapQLRequest(endpoints["like"]);

        like_request.add("tweet_id", tweet_id);

        await like_request.request(this.header);
    }

    async retweet(tweet_id) {
        const retweet_request = new GrapQLRequest(endpoints["retweet"]);

        retweet_request.add("tweet_id", tweet_id);
        retweet_request.add("dark_request", false);

        await retweet_request.request(this.header);
    }

    async follow(user_id) {
        const formData = new FormData();
        formData.append("user_id", user_id);

        const response = await fetch(endpoints["follow"].url, {
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

    async search(query, type = "Latest", count = 20) {
        let variables = encodeURI(JSON.stringify({ "rawQuery": query, "count": count, "querySource": "typed_query", "product": type }));
        variables = variables.replaceAll("#", "%23");

        const features = encodeURI(JSON.stringify({ "rweb_lists_timeline_redesign_enabled": true, "responsive_web_graphql_exclude_directive_enabled": true, "verified_phone_label_enabled": false, "creator_subscriptions_tweet_preview_api_enabled": true, "responsive_web_graphql_timeline_navigation_enabled": true, "responsive_web_graphql_skip_user_profile_image_extensions_enabled": false, "tweetypie_unmention_optimization_enabled": true, "responsive_web_edit_tweet_api_enabled": true, "graphql_is_translatable_rweb_tweet_is_translatable_enabled": true, "view_counts_everywhere_api_enabled": true, "longform_notetweets_consumption_enabled": true, "responsive_web_twitter_article_tweet_consumption_enabled": false, "tweet_awards_web_tipping_enabled": false, "freedom_of_speech_not_reach_fetch_enabled": true, "standardized_nudges_misinfo": true, "tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled": true, "longform_notetweets_rich_text_read_enabled": true, "longform_notetweets_inline_media_enabled": true, "responsive_web_media_download_video_enabled": false, "responsive_web_enhance_cards_enabled": false }));
        const fieldToggles = encodeURI(JSON.stringify({ "withAuxiliaryUserLabels": false, "withArticleRichContentState": false }));

        const response = await fetch(`${endpoints["search"].url}?variables=${variables}&features=${features}&fieldToggles=${fieldToggles}`, {
            "headers": this.header,
            "body": null,
            "method": "GET"
        });

        if (!response.ok) {
            throw new Error(response.statusText);
        }

        const data = await response.json();

        if (has_error(data)) {
            throw new Error(data.errors[0].message);
        }

        const instructions = data.data.search_by_raw_query.search_timeline.timeline.instructions;
        const timelineInstruction = instructions.find(element => element.type === "TimelineAddEntries");
        const entries = timelineInstruction.entries.filter(element => {
            if (element.content.entryType !== "TimelineTimelineItem") {
                return false;
            }

            return element.content.itemContent.itemType === "TimelineTweet";
        }).map(element => {
            const result = element.content.itemContent.tweet_results.result;
            result.user = result.core.user_results.result;

            return result;
        });

        if (entries.length === 0) {
            throw new Error("Entries empty");
        }

        return entries;
    }

    async timeline(type = "for_you") {
        const timelineRequest = new GrapQLRequest(endpoints["timeline"][type]);

        timelineRequest.add("count", 20);
        timelineRequest.add("includePromotedContent", true);
        timelineRequest.add("latestControlAvailable", true);
        timelineRequest.add("requestContext", "launch");
        timelineRequest.add("withCommunity", true);
        timelineRequest.add("seenTweetIds", []);

        timelineRequest.add_feature("rweb_lists_timeline_redesign_enabled", true);
        timelineRequest.add_feature("responsive_web_graphql_exclude_directive_enabled", true);
        timelineRequest.add_feature("verified_phone_label_enabled", false);
        timelineRequest.add_feature("creator_subscriptions_tweet_preview_api_enabled", true);
        timelineRequest.add_feature("responsive_web_graphql_timeline_navigation_enabled", true);
        timelineRequest.add_feature("responsive_web_graphql_skip_user_profile_image_extensions_enabled", false);
        timelineRequest.add_feature("tweetypie_unmention_optimization_enabled", true);
        timelineRequest.add_feature("responsive_web_edit_tweet_api_enabled", true);
        timelineRequest.add_feature("graphql_is_translatable_rweb_tweet_is_translatable_enabled", true);
        timelineRequest.add_feature("view_counts_everywhere_api_enabled", true);
        timelineRequest.add_feature("longform_notetweets_consumption_enabled", true);
        timelineRequest.add_feature("responsive_web_twitter_article_tweet_consumption_enabled", false);
        timelineRequest.add_feature("tweet_awards_web_tipping_enabled", false);
        timelineRequest.add_feature("freedom_of_speech_not_reach_fetch_enabled", true);
        timelineRequest.add_feature("standardized_nudges_misinfo", true);
        timelineRequest.add_feature("tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled", true);
        timelineRequest.add_feature("longform_notetweets_rich_text_read_enabled", true);
        timelineRequest.add_feature("longform_notetweets_inline_media_enabled", true);
        timelineRequest.add_feature("responsive_web_media_download_video_enabled", false);
        timelineRequest.add_feature("responsive_web_enhance_cards_enabled", false);

        timelineRequest.add_field("withArticleRichContentState", false);
        timelineRequest.add_field("withAuxiliaryUserLabels", false);

        const data = await timelineRequest.request(this.header);

        const instructions = data.data.home.home_timeline_urt.instructions;
        const timelineInstruction = instructions.find(element => element.type === "TimelineAddEntries");
        const entries = timelineInstruction.entries.filter(element => {
            if (element.content.entryType !== "TimelineTimelineItem") {
                return false;
            }

            return element.content.itemContent.itemType === "TimelineTweet";
        }).map(element => {
            const result = element.content.itemContent.tweet_results.result;
            result.user = result.core.user_results.result;

            return result;
        });

        if (entries.length === 0) {
            throw new Error("Entries empty");
        }

        return entries;
    }
}