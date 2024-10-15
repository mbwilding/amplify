import * as pulumi from "@pulumi/pulumi";
import { getConfig } from "./config"
import { createWebsiteBucket } from "./components/s3";
import { createCustomDomains, createCustomDomainCdnRecord } from "./components/route53";
import { createCdn } from "./components/cloudfront";
import { createLambda } from "./components/lambda";

const { path, indexDocument, errorDocument, domain, subDomain, priceClass } = getConfig();

const { bucket, bucketWebsite } = createWebsiteBucket(path, indexDocument, errorDocument);
const { zone, certificateWebsite, domainWebsite } = createCustomDomains(domain, subDomain);
const cdn = createCdn(bucket, bucketWebsite, certificateWebsite, priceClass, domainWebsite, errorDocument);
const recordCdn = createCustomDomainCdnRecord(cdn, certificateWebsite, zone, domainWebsite);

const { lambda, functionUrl } = createLambda();

export const originURL = pulumi.interpolate`http://${bucketWebsite.websiteEndpoint}`;
export const originHostname = bucketWebsite.websiteEndpoint;
export const cdnHostname = cdn.domainName;
export const cdnURL = pulumi.interpolate`https://${cdn.domainName}`;
export const lambdaFunctionUrl = functionUrl.functionUrl;
export const customUrlWebsite = pulumi.interpolate`https://${domainWebsite}`;
