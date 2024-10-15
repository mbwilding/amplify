import * as aws from "@pulumi/aws";

export function createWafAcl() {
    const webAcl = new aws.wafv2.WebAcl(`waf-acl`, {
        scope: "CLOUDFRONT",
        defaultAction: {
            allow: {},
        },
        rules: [{
            name: "rate-limit-rule",
            priority: 1,
            action: {
                block: {},
            },
            statement: {
                rateBasedStatement: {
                    limit: 1000,
                    aggregateKeyType: "IP",
                },
            },
            visibilityConfig: {
                sampledRequestsEnabled: true,
                cloudWatchMetricsEnabled: true,
                metricName: "rateLimitRule",
            },
        }],
        visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: "webAcl",
            sampledRequestsEnabled: true,
        },
    });

    return webAcl
}
