export class GrapQLRequest {
    constructor(id, features = false) {
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

        if (this.enable_features) {
            obj["features"] = this.features;
        }

        obj["variables"] = this.variables;

        return JSON.stringify(obj);
    }
}