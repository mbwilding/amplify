import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { getConfig } from "./config"
import { createWebsiteBucket } from "./components/s3";
import { createCustomDomains, createCustomDomainCdnRecord } from "./components/route53";
import { createWebsiteCdn } from "./components/cloudfront";
import { createLambda } from "./components/lambda";

const { path, indexDocument, errorDocument, domain, subDomain, priceClass } = getConfig();
const zone = aws.route53.getZoneOutput({ name: domain });

const { lambda, functionUrl } = createLambda();

const { bucket, bucketWebsite } = createWebsiteBucket(path, indexDocument, errorDocument);
const websiteConfig = new aws.s3.BucketObject("website-config", {
    bucket: bucket.bucket,
    content: pulumi.interpolate`export const apiUrl = "${functionUrl.functionUrl}";`,
    key: "config.js",
});
const { certificateWebsite, domainWebsite } = createCustomDomains(zone, domain, subDomain);
const cdn = createWebsiteCdn(bucket, bucketWebsite, certificateWebsite, priceClass, domainWebsite, errorDocument);
const recordCdn = createCustomDomainCdnRecord(cdn, certificateWebsite, zone, domainWebsite);

export const originURL = pulumi.interpolate`http://${bucketWebsite.websiteEndpoint}`;
export const originHostname = bucketWebsite.websiteEndpoint;
export const cdnHostname = cdn.domainName;
export const cdnURL = pulumi.interpolate`https://${cdn.domainName}`;
export const lambdaFunctionUrl = functionUrl.functionUrl;
export const customUrlWebsite = pulumi.interpolate`https://${domainWebsite}`;
