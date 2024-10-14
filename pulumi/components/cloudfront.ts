import * as aws from "@pulumi/aws";
import { Certificate } from "@pulumi/aws/acm";
import { BucketV2, BucketWebsiteConfigurationV2 } from "@pulumi/aws/s3";

export function createCdn(
    bucket: BucketV2,
    bucketWebsite: BucketWebsiteConfigurationV2,
    certificate?: Certificate,
    combinedDomain?: string,
    errorDocument?: string,
) {
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
        customErrorResponses: errorDocument ? [{
            errorCode: 404,
            responseCode: 404,
            responsePagePath: `/${errorDocument}`,
        }] : undefined,
        restrictions: {
            geoRestriction: {
                restrictionType: "none",
            },
        },
    });

    return cdn
}
