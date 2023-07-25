export type LegacyUser = {
    description: string;
    name: string;
    screen_name: string;
};

export type User = {
    rest_id: string;
    legacy: LegacyUser;
};

export type LegacyTweet = {
    bookmark_count: number;
    bookmarked: boolean;
    created_at: string;
    entities: any;
    favorite_count: number;
    favorited: boolean;
    full_text: string;
    is_quote_status: boolean;
    lang: string;
    quote_count: number;
    reply_count: number;
    retweet_count: number;
    retweeted: boolean;
    user_id_str: string;
};

export type Tweet = {
    rest_id: string;
    views: any;
    source: string;
    legacy: LegacyTweet;
    user: User;
};

export class TwitterClient {
    constructor(authorization: string, auth_token: string);

    authorization: string;
    auth_token: string;

    connect(): Promise<void>;
    like(tweet_id: string): Promise<void>;
    retweet(tweet_id: string): Promise<void>;
    follow(user_id: string): Promise<void>;
    search(query: string, type?: string, count?: number): Promise<Tweet[]>;
    timeline(type?: string): Promise<Tweet[]>;
    followers(user_id: string): Promise<User[]>;
}