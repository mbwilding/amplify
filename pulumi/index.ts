import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as synced_folder from "@pulumi/synced-folder";
import { Certificate } from "@pulumi/aws/acm";
import { GetZoneResult } from "@pulumi/aws/route53";

// Import the program's configuration settings.
const config = new pulumi.Config();
const path = config.get("path") || "../www";
const indexDocument = config.get("indexDocument") || "index.html";
const errorDocument = config.get("errorDocument") || "error.html";

// Create an S3 bucket and configure it as a website.
const bucket = new aws.s3.BucketV2("bucket");

const bucketWebsite = new aws.s3.BucketWebsiteConfigurationV2("bucketWebsite", {
    bucket: bucket.bucket,
    indexDocument: { suffix: indexDocument },
    errorDocument: { key: errorDocument },
});

// Configure ownership controls for the new S3 bucket
const ownershipControls = new aws.s3.BucketOwnershipControls("ownership-controls", {
    bucket: bucket.bucket,
    rule: {
        objectOwnership: "ObjectWriter",
    },
});

// Configure public ACL block on the new S3 bucket
const publicAccessBlock = new aws.s3.BucketPublicAccessBlock("public-access-block", {
    bucket: bucket.bucket,
    blockPublicAcls: false,
});

// Use a synced folder to manage the files of the website.
const bucketFolder = new synced_folder.S3BucketFolder("bucket-folder", {
    path: path,
    bucketName: bucket.bucket,
    acl: "public-read",
}, { dependsOn: [ownershipControls, publicAccessBlock] });

// Custom domain
const domain = config.get("domain");
const subDomain = config.get("subDomain");
const combinedDomain = subDomain && domain ? `${subDomain}.${domain}` : (subDomain || domain || undefined);
let certificate: Certificate | undefined;
let zone: pulumi.Output<GetZoneResult> | undefined;

if (combinedDomain) {
    // Look up your existing Route 53 hosted zone.
    zone = aws.route53.getZoneOutput({ name: domain });

    // Provision a new ACM certificate.
    certificate = new aws.acm.Certificate("certificate",
        {
            domainName: combinedDomain,
            validationMethod: "DNS",
        },
        {
            // ACM certificates must be created in the us-east-1 region.
            provider: new aws.Provider("us-east-provider", {
                region: "us-east-1",
            }),
        },
    );

    // Validate the ACM certificate with DNS.
    const validationOption = certificate.domainValidationOptions[0];
    const certificateValidation = new aws.route53.Record("certificate-validation", {
        name: validationOption.resourceRecordName,
        type: validationOption.resourceRecordType,
        records: [validationOption.resourceRecordValue],
        zoneId: zone.zoneId,
        ttl: 60,
    });
}

// Create a CloudFront CDN to distribute and cache the website.
const cdn = new aws.cloudfront.Distribution("cdn", {
    aliases: combinedDomain ? [combinedDomain] : [],
    viewerCertificate: certificate ? {
        cloudfrontDefaultCertificate: false,
        acmCertificateArn: certificate.arn,
        sslSupportMethod: "sni-only",
    } : {
        cloudfrontDefaultCertificate: true,
    },
    enabled: true,
    origins: [{
        originId: bucket.arn,
        domainName: bucketWebsite.websiteEndpoint,
        customOriginConfig: {
            originProtocolPolicy: "http-only",
            httpPort: 80,
            httpsPort: 443,
            originSslProtocols: ["TLSv1.2"],
        },
    }],
    defaultCacheBehavior: {
        targetOriginId: bucket.arn,
        viewerProtocolPolicy: "redirect-to-https",
        allowedMethods: [
            "GET",
            "HEAD",
            "OPTIONS",
        ],
        cachedMethods: [
            "GET",
            "HEAD",
            "OPTIONS",
        ],
        defaultTtl: 600,
        maxTtl: 600,
        minTtl: 600,
        forwardedValues: {
            queryString: true,
            cookies: {
                forward: "all",
            },
        },
    },
    priceClass: "PriceClass_100",
    customErrorResponses: [{
        errorCode: 404,
        responseCode: 404,
        responsePagePath: `/${errorDocument}`,
    }],
    restrictions: {
        geoRestriction: {
            restrictionType: "none",
        },
    },
});

// Create a DNS A record to point to the CDN.
if (combinedDomain && zone) {
    const record = new aws.route53.Record(combinedDomain, {
        name: combinedDomain,
        zoneId: zone.zoneId,
        type: "A",
        aliases: [
            {
                name: cdn.domainName,
                zoneId: cdn.hostedZoneId,
                evaluateTargetHealth: true,
            }
        ],
    }, { dependsOn: certificate });
}

// Export the URLs and hostnames of the bucket and distribution.
export const originURL = pulumi.interpolate`http://${bucketWebsite.websiteEndpoint}`;
export const originHostname = bucketWebsite.websiteEndpoint;
export const cdnURL = pulumi.interpolate`https://${cdn.domainName}`;
export const cdnHostname = cdn.domainName;
export const customUrl = pulumi.interpolate`https://${combinedDomain}`;
export const customHostname = pulumi.interpolate`${combinedDomain}`;
