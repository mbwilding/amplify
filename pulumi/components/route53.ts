import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { Certificate } from "@pulumi/aws/acm";
import { GetZoneResult } from "@pulumi/aws/route53";
import { Distribution } from "@pulumi/aws/cloudfront";

export function createCustomDomains(
    zone: pulumi.Output<GetZoneResult>,
    domain?: string,
    subDomain?: string
) {
    const domainWebsite = subDomain && domain ? `${subDomain}.${domain}` : (subDomain || domain || undefined);

    function createCertificateAndValidation(domainName: string, typeName: string): Certificate {
        const certificate = new Certificate(`certificate-${typeName}`,
            {
                domainName: domainName,
                validationMethod: "DNS",
            },
            {
                provider: new aws.Provider(`us-east-provider-${typeName}`, {
                    region: "us-east-1",
                }),
            },
        );

        const validationOption = certificate.domainValidationOptions[0];

        const validation = new aws.route53.Record(`certificate-validation-${typeName}`, {
            name: validationOption.resourceRecordName,
            type: validationOption.resourceRecordType,
            records: [validationOption.resourceRecordValue],
            zoneId: zone.zoneId,
            ttl: 60,
        });

        return certificate
    }

    let certificateWebsite: Certificate | undefined;
    if (domainWebsite) {
        certificateWebsite = createCertificateAndValidation(domainWebsite, "website");
    }

    return {
        certificateWebsite,
        domainWebsite,
    }
}


export function createCustomDomainCdnRecord(
    cdn: Distribution,
    certificate?: Certificate,
    zone?: pulumi.Output<GetZoneResult>,
    domain?: string
) {
    if (domain && zone) {
        const record = new aws.route53.Record(domain, {
            name: domain,
            zoneId: zone.zoneId,
            type: aws.route53.RecordType.A,
            aliases: [
                {
                    name: cdn.domainName,
                    zoneId: cdn.hostedZoneId,
                    evaluateTargetHealth: true,
                }
            ],
        }, { dependsOn: certificate });

        return record
    }

    return undefined
}
