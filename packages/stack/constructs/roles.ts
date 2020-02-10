import * as cdk from '@aws-cdk/core'
import * as iam from '@aws-cdk/aws-iam'

export interface FunctionRoleProps {
  name?: string
  bucketArn?: string
  passRoleArn?: string
}

export class FunctionRole extends cdk.Construct {
  public readonly role: iam.Role

  constructor(scope: cdk.Construct, id: string, props: FunctionRoleProps) {
    super(scope, id)

    this.role = new iam.Role(this, 'functionRole', {
      roleName: `${props.name}-MediaConvertFunctionRole`,
      managedPolicies: [
        iam.ManagedPolicy.fromManagedPolicyArn(
          this,
          'mediaConvertFunctionRole',
          'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
        )
      ],
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com', {})
    })

    this.role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['ec2:DetachNetworkInterface'],
        resources: ['*']
      })
    )

    this.role.addToPolicy(
      new iam.PolicyStatement({
        actions: ['mediaconvert:*'],
        resources: ['*'],
        effect: iam.Effect.ALLOW
      })
    )

    this.role.addToPolicy(
      new iam.PolicyStatement({
        actions: ['ec2:DetachNetworkInterface'],
        resources: ['*'],
        effect: iam.Effect.ALLOW
      })
    )

    if (props.bucketArn) {
      this.role.addToPolicy(
        new iam.PolicyStatement({
          actions: ['s3:GetObject'],
          resources: [`${props.bucketArn}/*`],
          effect: iam.Effect.ALLOW
        })
      )
    }

    if (props.passRoleArn) {
      this.role.addToPolicy(
        new iam.PolicyStatement({
          actions: ['iam:PassRole'],
          resources: [props.passRoleArn],
          effect: iam.Effect.ALLOW
        })
      )
    }
  }
}
