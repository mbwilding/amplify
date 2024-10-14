import * as pulumi from "@pulumi/pulumi";
import { createWebsiteBucket } from "./components/s3";
import { createCustomDomain, createCustomDomainCdnRecord } from "./components/route53";
import { createCdn } from "./components/cloudfront";

const config = new pulumi.Config();
const path = config.get("path") || "../www";
const indexDocument = config.get("indexDocument") || "index.html";
const errorDocument = config.get("errorDocument") || "error.html";
const domain = config.get("domain");
const subDomain = config.get("subDomain");

const { bucket, bucketWebsite } = createWebsiteBucket(path, indexDocument, errorDocument);
const { zone, certificate, combinedDomain } = createCustomDomain(domain, subDomain);
const cdn = createCdn(bucket, bucketWebsite, certificate, combinedDomain, errorDocument);
const record = createCustomDomainCdnRecord(cdn, certificate, zone, combinedDomain);

export const originURL = pulumi.interpolate`http://${bucketWebsite.websiteEndpoint}`;
export const originHostname = bucketWebsite.websiteEndpoint;
export const cdnURL = pulumi.interpolate`https://${cdn.domainName}`;
export const cdnHostname = cdn.domainName;
export const customUrl = pulumi.interpolate`https://${combinedDomain}`;
export const customHostname = pulumi.interpolate`${combinedDomain}`;
