import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export function createLambda(
) {
    const role = new aws.iam.Role("lambdaRole", {
        assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({ Service: "lambda.amazonaws.com" }),
    });

    new aws.iam.RolePolicyAttachment("lambdaRolePolicy", {
        role: role,
        policyArn: aws.iam.ManagedPolicy.AWSLambdaBasicExecutionRole,
    });

    const lambda = new aws.lambda.Function("rustApiLambda", {
        runtime: "provided.al2023",
        role: role.arn,
        handler: "bootstrap",
        code: new pulumi.asset.FileArchive("./backend/bootstrap.zip"),
        architectures: ["arm64"],
        timeout: 5,
        environment: {
            variables: {
                RUST_BACKTRACE: "1",
            },
        },
    });

    const functionUrl = new aws.lambda.FunctionUrl("rustApiUrl", {
        functionName: lambda.name,
        authorizationType: "NONE",
        cors: {
            allowOrigins: ["*"],
            allowMethods: ["*"],
            allowHeaders: ["*"],
            exposeHeaders: ["*"],
            maxAge: 300,
        },
    });

    return {
        lambda,
        functionUrl
    }
}
