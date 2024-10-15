import * as pulumi from "@pulumi/pulumi";
import { getConfig } from "./config"
import { createWebsiteBucket } from "./components/s3";
import { createCustomDomain, createCustomDomainCdnRecord } from "./components/route53";
import { createCdn } from "./components/cloudfront";
import { createLambda } from "./components/lambda";
import { createRestApi } from "./components/api-gateway";

const { path, indexDocument, errorDocument, domain, subDomain, priceClass } = getConfig();

const { bucket, bucketWebsite } = createWebsiteBucket(path, indexDocument, errorDocument);
const { zone, certificate, combinedDomain } = createCustomDomain(domain, subDomain);
const cdn = createCdn(bucket, bucketWebsite, certificate, priceClass, combinedDomain, errorDocument);
const record = createCustomDomainCdnRecord(cdn, certificate, zone, combinedDomain);

const lambda = createLambda();
const { api, deployment } = createRestApi(lambda);

export const originURL = pulumi.interpolate`http://${bucketWebsite.websiteEndpoint}`;
export const originHostname = bucketWebsite.websiteEndpoint;
export const cdnURL = pulumi.interpolate`https://${cdn.domainName}`;
export const cdnHostname = cdn.domainName;
export const customUrl = pulumi.interpolate`https://${combinedDomain}`;
export const customHostname = combinedDomain;
export const zoneId = record?.zoneId;
export const apiArn = api.arn;
export const apiDeploymentInvokeUrl = deployment.invokeUrl;
export const apiRest = deployment.restApi;
