import * as pulumi from "@pulumi/pulumi";
import { getConfig } from "./config"
import { createWebsiteBucket } from "./components/s3";
import { createCustomDomains, createCustomDomainCdnRecord } from "./components/route53";
import { createCdn } from "./components/cloudfront";
import { createLambda } from "./components/lambda";
import { createRestApi } from "./components/api-gateway";

const { path, indexDocument, errorDocument, domain, subDomainWebsite, subDomainApi, priceClass } = getConfig();

const { bucket, bucketWebsite } = createWebsiteBucket(path, indexDocument, errorDocument);
const { zone, certificateWebsite, domainWebsite, certificateApi, domainApi } = createCustomDomains(domain, subDomainWebsite, subDomainApi);
const cdn = createCdn(bucket, bucketWebsite, certificateWebsite, priceClass, domainWebsite, errorDocument);
const record = createCustomDomainCdnRecord(cdn, certificateWebsite, zone, domainWebsite);

const { lambda, functionUrl } = createLambda();

export const originURL = pulumi.interpolate`http://${bucketWebsite.websiteEndpoint}`;
export const originHostname = bucketWebsite.websiteEndpoint;
export const cdnHostname = cdn.domainName;
export const cdnURL = pulumi.interpolate`https://${cdn.domainName}`;
export const lambdaFunctionUrl = functionUrl.functionUrl;
export const customUrlWebsite = pulumi.interpolate`https://${domainWebsite}`;
export const customUrlApi = pulumi.interpolate`https://${domainApi}`;
