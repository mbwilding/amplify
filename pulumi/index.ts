import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as fs from 'fs';
import * as path from 'path';

import { getConfig } from "./config"
import { createWebsiteBucket } from "./components/s3";
import { createCustomDomains, createCustomDomainCdnRecord } from "./components/route53";
import { createWebsiteCdn } from "./components/cloudfront";
import { createLambda } from "./components/lambda";

const { distPath, indexDocument, errorDocument, domain, subDomain, priceClass } = getConfig();
const zone = aws.route53.getZoneOutput({ name: domain });

// Frontend
const { bucket, bucketWebsite } = createWebsiteBucket(distPath, indexDocument, errorDocument);
const { certificateWebsite, domainWebsite } = createCustomDomains(zone, domain, subDomain);
const cdn = createWebsiteCdn(bucket, bucketWebsite, certificateWebsite, priceClass, domainWebsite, errorDocument);
const recordCdn = createCustomDomainCdnRecord(cdn, certificateWebsite, zone, domainWebsite);

// Backend
const { lambda, functionUrl } = createLambda();

export const originURL = pulumi.interpolate`http://${bucketWebsite.websiteEndpoint}`;
export const originHostname = bucketWebsite.websiteEndpoint;
export const cdnHostname = cdn.domainName;
export const cdnURL = pulumi.interpolate`https://${cdn.domainName}`;
export const lambdaFunctionUrl = functionUrl.functionUrl;
export const customUrlWebsite = pulumi.interpolate`https://${domainWebsite}`;
