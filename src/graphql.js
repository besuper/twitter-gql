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

    add(variables) {
        this.variables = variables;
    }

    add_feature(features) {
        this.features = features;
    }

    add_field(fields) {
        this.fieldToggles = fields;
    }

    serialize() {
        const obj = { query_id: this.id };

        if (this.enable_features || Object.keys(this.features).length > 0) {
            obj["features"] = this.features;
        }

        if (Object.keys(this.fieldToggles).length > 0) {
            obj["fieldToggles"] = this.fieldToggles;
        }

        obj["variables"] = this.variables;

        return JSON.stringify(obj);
    }

    serialize_query() {
        this.variables = encodeURI(JSON.stringify(this.variables)).replaceAll("#", "%23");
        this.features = encodeURI(JSON.stringify(this.features));
        this.fieldToggles = encodeURI(JSON.stringify(this.fieldToggles));
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

    async request_query(header) {
        this.serialize_query();

        const response = await fetch(`${this.url}?variables=${this.variables}&features=${this.features}&fieldToggles=${this.fieldToggles}`, {
            "headers": header,
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

        return data;
    }
}