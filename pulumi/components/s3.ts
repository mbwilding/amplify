import * as aws from "@pulumi/aws";
import * as synced_folder from "@pulumi/synced-folder";

export function createWebsiteBucket(
    path: string,
    indexDocument?: string,
    errorDocument?: string
) {
    const bucket = new aws.s3.BucketV2("bucket");

    const bucketWebsite = new aws.s3.BucketWebsiteConfigurationV2("bucketWebsite", {
        bucket: bucket.bucket,
        indexDocument: indexDocument ? { suffix: indexDocument } : undefined,
        errorDocument: errorDocument ? { key: errorDocument } : undefined,
    });

    const ownershipControls = new aws.s3.BucketOwnershipControls("ownership-controls", {
        bucket: bucket.bucket,
        rule: {
            objectOwnership: "ObjectWriter",
        },
    });

    const publicAccessBlock = new aws.s3.BucketPublicAccessBlock("public-access-block", {
        bucket: bucket.bucket,
        blockPublicAcls: false,
    });

    const bucketFolder = new synced_folder.S3BucketFolder("bucket-folder", {
        path: path,
        bucketName: bucket.bucket,
        acl: "public-read",
    }, { dependsOn: [ownershipControls, publicAccessBlock] });

    return {
        bucket,
        bucketWebsite
    }
}

