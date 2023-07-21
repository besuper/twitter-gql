import fetch from "node-fetch";
import { has_error } from "./error.js";

export class GrapQLRequest {
    constructor(endpoint, features = false) {
        this.url = endpoint.url;
        this.id = endpoint.id;
        this.enable_features = features;

        this.variables = {};
        this.features = {};
        this.fieldToggles = {};
    }

    add(key, value) {
        this.variables[key] = value;
    }

    add_feature(key, value) {
        this.features[key] = value;
    }

    add_field(key, value) {
        this.fieldToggles[key] = value;
    }

    serialize() {
        const obj = { query_id: this.id };

        if (this.enable_features || Object.keys(this.features).length > 0) {
            obj["features"] = this.features;
        }

        if(Object.keys(this.fieldToggles).length > 0) {
            obj["fieldToggles"] = this.fieldToggles;
        }

        obj["variables"] = this.variables;

        return JSON.stringify(obj);
    }

    async request(header) {
        const response = await fetch(this.url, {
            method: 'POST',
            body: this.serialize(),
            headers: { ...header, 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(response.statusText);
        }

        const data = await response.json();

        if (has_error(data)) {
            throw new Error(data.errors[0].message);
        }

        return data;
    }
}