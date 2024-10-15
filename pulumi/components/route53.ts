import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { Certificate } from "@pulumi/aws/acm";
import { GetZoneResult } from "@pulumi/aws/route53";
import { Distribution } from "@pulumi/aws/cloudfront";

export function createCustomDomains(
    domain?: string,
    subDomainWebsite?: string,
    subDomainApi?: string
) {
    const domainWebsite = subDomainWebsite && domain ? `${subDomainWebsite}.${domain}` : (subDomainWebsite || domain || undefined);
    const domainApi = subDomainApi && domain ? `${subDomainApi}.${domain}` : (subDomainApi || domain || undefined);

    let certificateWebsite: Certificate | undefined;
    let certificateApi: Certificate | undefined;
    let zone: pulumi.Output<GetZoneResult> | undefined;

    function createCertificateAndValidation(domainName: string, typeName: string) {
        const zone = aws.route53.getZoneOutput({ name: domain });

        const certificate = new aws.acm.Certificate(`certificate-${typeName}`,
            {
                domainName: domainName,
                validationMethod: "DNS",
            },
            {
                provider: new aws.Provider("us-east-provider", {
                    region: "us-east-1",
                }),
            },
        );

        const validationOption = certificate.domainValidationOptions[0];
        return new aws.route53.Record(`certificate-validation-${typeName}`, {
            name: validationOption.resourceRecordName,
            type: validationOption.resourceRecordType,
            records: [validationOption.resourceRecordValue],
            zoneId: zone.zoneId,
            ttl: 60,
        });
    }

    if (domainWebsite) {
        createCertificateAndValidation(domainWebsite, "website");
    }

    if (domainApi) {
        createCertificateAndValidation(domainApi, "api");
    }

    return {
        zone,
        certificateWebsite,
        domainWebsite,
        certificateApi,
        domainApi,
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
            type: "A",
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
