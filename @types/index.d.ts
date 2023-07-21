export class TwitterClient {
    constructor(authorization: string, auth_token: string);

    authorization: string;
    auth_token: string;

    async connect(): Promise<void>;
    async like(tweet_id: string): Promise<void>;
    async retweet(tweet_id: string): Promise<void>;
    async follow(user_id: string): Promise<void>;
    async search(query: string, type: string = "Latest", count: number = 20): Promise<any[]>;
}