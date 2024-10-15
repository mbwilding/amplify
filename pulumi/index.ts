import * as pulumi from "@pulumi/pulumi";
import { getConfig } from "./config"
import { createWebsiteBucket } from "./components/s3";
import { createCustomDomain, createCustomDomainCdnRecord } from "./components/route53";
import { createCdn } from "./components/cloudfront";

const { path, indexDocument, errorDocument, domain, subDomain, priceClass } = getConfig();

const { bucket, bucketWebsite } = createWebsiteBucket(path, indexDocument, errorDocument);
const { zone, certificate, combinedDomain } = createCustomDomain(domain, subDomain);
const cdn = createCdn(bucket, bucketWebsite, certificate, priceClass, combinedDomain, errorDocument);
const record = createCustomDomainCdnRecord(cdn, certificate, zone, combinedDomain);

export const originURL = pulumi.interpolate`http://${bucketWebsite.websiteEndpoint}`;
export const originHostname = bucketWebsite.websiteEndpoint;
export const cdnURL = pulumi.interpolate`https://${cdn.domainName}`;
export const cdnHostname = cdn.domainName;
export const customUrl = pulumi.interpolate`https://${combinedDomain}`;
export const customHostname = combinedDomain;
export const zoneId = record?.zoneId;
