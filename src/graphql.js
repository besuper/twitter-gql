import fetch from "node-fetch";

export class GrapQLRequest {
    constructor(url, id, features = false) {
        this.url = url;
        this.id = id;
        this.enable_features = features;

        this.variables = {};
        this.features = {};
    }

    add(key, value) {
        this.variables[key] = value;
    }

    add_feature(key, value) {
        this.features[key] = value;
    }

    serialize() {
        const obj = { query_id: this.id };

        if (this.enable_features || this.features.length > 0) {
            obj["features"] = this.features;
        }

        obj["variables"] = this.variables;

        return JSON.stringify(obj);
    }

    async request() {
        const response = await fetch(this.url, {
            method: 'POST',
            body: this.serialize(),
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
}