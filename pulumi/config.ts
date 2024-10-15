import * as pulumi from "@pulumi/pulumi";

export function getConfig() {
    const config = new pulumi.Config();

    const path = config.require("path");
    const indexDocument = config.get("indexDocument");
    const errorDocument = config.get("errorDocument");
    const domain = config.get("domain");
    const subDomainWebsite = config.get("subDomainWebsite");
    const subDomainApi = config.get("subDomainApi");
    const priceClass = config.get("priceClass");

    return {
        path,
        indexDocument,
        errorDocument,
        domain,
        subDomainWebsite,
        subDomainApi,
        priceClass
    };
}
