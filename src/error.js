export function has_error(response) {
    return "errors" in response;
}