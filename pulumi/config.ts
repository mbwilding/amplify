import * as pulumi from "@pulumi/pulumi";

export function getConfig() {
    const config = new pulumi.Config();

    const path = config.require("path");
    const indexDocument = config.require("indexDocument");
    const errorDocument = config.require("errorDocument");
    const domain = config.get("domain");
    const subDomain = config.get("subDomain");

    return {
        path,
        indexDocument,
        errorDocument,
        domain,
        subDomain
    };
}
