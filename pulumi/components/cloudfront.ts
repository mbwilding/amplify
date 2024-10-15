import * as aws from "@pulumi/aws";
import { Certificate } from "@pulumi/aws/acm";
import { BucketV2, BucketWebsiteConfigurationV2 } from "@pulumi/aws/s3";
import { WebAcl } from "@pulumi/aws/wafv2";

export function createWebsiteCdn(
    bucket: BucketV2,
    bucketWebsite: BucketWebsiteConfigurationV2,
    certificate?: Certificate,
    priceClass?: string,
    domain?: string,
    errorDocument?: string,
) {
    const cdn = new aws.cloudfront.Distribution("cdn", {
        aliases: domain ? [domain] : [],
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
                headers: ["*"],
            },
        },
        priceClass: priceClass,
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
        // webAclId: webAcl.id
    });

    return cdn
}
