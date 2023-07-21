export class TwitterClient {
    constructor(authorization: string, auth_token: string);

    authorization: string;
    auth_token: string;

    connect(): Promise<void>;
    like(tweet_id: string): Promise<void>;
    retweet(tweet_id: string): Promise<void>;
    follow(user_id: string): Promise<void>;
    search(query: string, type?: string, count?: number): Promise<any[]>;
}