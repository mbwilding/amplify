import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { Certificate } from "@pulumi/aws/acm";
import { GetZoneResult } from "@pulumi/aws/route53";
import { Distribution } from "@pulumi/aws/cloudfront";

export function createCustomDomain(
    domain?: string,
    subDomain?: string
) {
    const combinedDomain = subDomain && domain ? `${subDomain}.${domain}` : (subDomain || domain || undefined);
    let certificate: Certificate | undefined;
    let zone: pulumi.Output<GetZoneResult> | undefined;

    if (combinedDomain) {
        zone = aws.route53.getZoneOutput({ name: domain });

        certificate = new aws.acm.Certificate("certificate",
            {
                domainName: combinedDomain,
                validationMethod: "DNS",
            },
            {
                provider: new aws.Provider("us-east-provider", {
                    region: "us-east-1",
                }),
            },
        );

        const validationOption = certificate.domainValidationOptions[0];
        const certificateValidation = new aws.route53.Record("certificate-validation", {
            name: validationOption.resourceRecordName,
            type: validationOption.resourceRecordType,
            records: [validationOption.resourceRecordValue],
            zoneId: zone.zoneId,
            ttl: 60,
        });
    }

    return {
        zone,
        certificate,
        combinedDomain
    }
}


export function createCustomDomainCdnRecord(
    cdn: Distribution,
    certificate?: Certificate,
    zone?: pulumi.Output<GetZoneResult>,
    combinedDomain?: string
) {
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

        return record
    }

    return undefined
}
