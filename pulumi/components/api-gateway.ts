import * as aws from "@pulumi/aws";
import { Function } from "@pulumi/aws/lambda";

export function createRestApi(
    lambda: Function
) {
    const api = new aws.apigateway.RestApi("rustApiGateway", {
        description: "API Gateway for Rust Lambda",
    });

    const resource = new aws.apigateway.Resource("apiResource", {
        restApi: api.id,
        parentId: api.rootResourceId,
        pathPart: "rustapi",
    });

    const method = new aws.apigateway.Method("apiMethod", {
        restApi: api.id,
        resourceId: resource.id,
        httpMethod: "GET",
        authorization: "NONE",
    });

    const integration = new aws.apigateway.Integration("apiIntegration", {
        restApi: api.id,
        resourceId: resource.id,
        httpMethod: method.httpMethod,
        integrationHttpMethod: "POST",
        type: "AWS_PROXY",
        uri: lambda.invokeArn,
    });

    const deployment = new aws.apigateway.Deployment("apiDeployment", {
        restApi: api.id,
        stageName: "v1",
    }, { dependsOn: [integration] });

    return {
        api,
        deployment
    }
}
