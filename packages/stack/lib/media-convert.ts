import * as cdk from '@aws-cdk/core'
import * as s3 from '@aws-cdk/aws-s3'
import * as events from '@aws-cdk/aws-events'
import * as cloudfront from '@aws-cdk/aws-cloudfront'
import * as iam from '@aws-cdk/aws-iam'
import * as dynamodb from '@aws-cdk/aws-dynamodb'
import * as cfn from '@aws-cdk//aws-cloudformation'
import * as lambda from '@aws-cdk/aws-lambda'
import * as ec2 from '@aws-cdk/aws-ec2'
import * as targets from '@aws-cdk/aws-events-targets'
import * as cloudtrail from '@aws-cdk/aws-cloudtrail'
import * as sf from '@aws-cdk/aws-stepfunctions'
import * as tasks from '@aws-cdk/aws-stepfunctions-tasks'
import * as path from 'path'

export interface CustomResourceProps {
  name?: string
}

export class CustomResource extends cdk.Construct {
  public readonly role: iam.Role
  public readonly convertTemplates: cfn.CustomResource
  public readonly convertEndpoint: cfn.CustomResource
  public readonly customLambda: lambda.Function

  constructor(scope: cdk.Construct, id: string, props: CustomResourceProps) {
    super(scope, id)

    this.role = new iam.Role(this, 'functionRole', {
      roleName: `${props.name}-MediaConverCustomResource`,
      managedPolicies: [
        iam.ManagedPolicy.fromManagedPolicyArn(
          this,
          'mediaConvertCustomResourceFunctionRole',
          'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
        )
      ],
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com', {})
    })

    this.role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'mediaconvert:CreatePreset',
          'mediaconvert:CreateJobTemplate',
          'mediaconvert:DeletePreset',
          'mediaconvert:DeleteJobTemplate',
          'mediaconvert:DescribeEndpoints',
          'mediaconvert:ListJobTemplates'
        ],
        resources: ['*']
      })
    )

    this.customLambda = new lambda.Function(this, 'customLambda', {
      functionName: `${props.name}-custom-resource`, //overwrites the default generated one
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromAsset(
        path.join(__dirname, '../../custom-resource')
      ),
      role: this.role,
      handler: 'index.main',
      timeout: cdk.Duration.seconds(180)
    })

    this.convertEndpoint = new cfn.CustomResource(
      this,
      'mediaConvertEndpoint',
      {
        properties: { Resource: 'EndPoint' },
        provider: cfn.CustomResourceProvider.fromLambda(this.customLambda)
      }
    )

    this.convertTemplates = new cfn.CustomResource(
      this,
      'mediaConvertTemplate',
      {
        properties: {
          Resource: 'MediaConvertTemplates',
          StackName: props.name,
          EndPoint: this.convertEndpoint.getAttString('EndpointUrl')
        },
        provider: cfn.CustomResourceProvider.fromLambda(this.customLambda)
      }
    )
  }
}

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

    this.role.addToPolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetObject'],
        resources: [`${props.bucketArn}/*`],
        effect: iam.Effect.ALLOW
      })
    )

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

export interface MediaConvertProps {
  name?: string
  vpc?: ec2.Vpc
  isDevelopment?: boolean
}

export class MediaConvert extends cdk.Construct {
  public readonly customResource: CustomResource

  public readonly validateFunction: lambda.Function
  public readonly validateFunctionRole: FunctionRole

  public readonly mediaInfoFunction: lambda.Function
  public readonly mediaInfoFunctionRole: FunctionRole

  public readonly profilerFunction: lambda.Function
  public readonly profilerFunctionRole: FunctionRole

  public readonly convertBucket: s3.Bucket
  public readonly convertRole: iam.Role
  public readonly convertEventRule: events.Rule
  public readonly convertTable: dynamodb.Table
  public readonly convertFunction: lambda.Function
  public readonly convertFunctionRole: FunctionRole
  public readonly convertDistribution: cloudfront.CloudFrontWebDistribution
  public readonly convertDistributionOAI: cloudfront.OriginAccessIdentity

  public readonly eventRule: events.Rule
  public readonly uploadBucket: s3.Bucket
  public readonly uploadTrail: cloudtrail.Trail
  public readonly uploadDistribution: cloudfront.CloudFrontWebDistribution
  public readonly uploadDistributionOAI: cloudfront.OriginAccessIdentity

  public readonly stepFunctionsRole: iam.Role
  public readonly stepFunctionsProcessWorkflow: sf.StateMachine
  public readonly stepFunctionsInputWorkflow: sf.StateMachine
  public readonly stepFunctionsConvertJob: sf.Task
  public readonly stepFunctionsInputJob: sf.Task
  public readonly stepFunctionsMediaInfoJob: sf.Task
  public readonly stepFunctionsProfilerJob: sf.Task

  constructor(scope: cdk.Construct, id: string, props: MediaConvertProps = {}) {
    super(scope, id)

    this.customResource = new CustomResource(this, 'customResource', {
      name: props.name
    })

    this.uploadBucket = new s3.Bucket(this, 'uploadBucket', {
      encryption: s3.BucketEncryption.S3_MANAGED, // todo: move to KMS
      bucketName: `${props.name}-upload`,
      versioned: true,
      removalPolicy: props.isDevelopment
        ? cdk.RemovalPolicy.DESTROY
        : cdk.RemovalPolicy.RETAIN // not recommended for production
    })

    this.uploadTrail = new cloudtrail.Trail(this, 'uploadBucketTrail', {
      trailName: `${props.name}`,
      sendToCloudWatchLogs: true
    })

    this.uploadTrail.addS3EventSelector([`${this.uploadBucket.bucketArn}/`], {
      includeManagementEvents: false,
      readWriteType: cloudtrail.ReadWriteType.ALL
    })

    this.uploadDistributionOAI = new cloudfront.OriginAccessIdentity(
      this,
      'uploadDistributionOAI',
      {}
    )

    this.uploadBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetObject'],
        resources: [`${this.uploadBucket.bucketArn}/*`],
        effect: iam.Effect.ALLOW,
        principals: [
          new iam.CanonicalUserPrincipal(
            this.uploadDistributionOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId
          )
        ]
      })
    )

    this.uploadDistribution = new cloudfront.CloudFrontWebDistribution(
      this,
      'uploadDistributtion',
      {
        originConfigs: [
          // todo: add logging
          {
            s3OriginSource: {
              s3BucketSource: this.uploadBucket,
              originAccessIdentity: this.uploadDistributionOAI
            },
            behaviors: [
              {
                isDefaultBehavior: true,
                trustedSigners: [cdk.Stack.of(this).account]
              }
            ]
          }
        ]
      }
    )

    this.convertBucket = new s3.Bucket(this, 'convertBucket', {
      encryption: s3.BucketEncryption.S3_MANAGED, // todo: move to KMS
      bucketName: `${props.name}-media`,
      versioned: true,
      cors: [
        // todo: remove from production
        {
          allowedMethods: [s3.HttpMethods.GET],
          allowedOrigins: ['*']
        }
      ],
      removalPolicy: props.isDevelopment
        ? cdk.RemovalPolicy.DESTROY
        : cdk.RemovalPolicy.RETAIN // not recommended for production
    })

    this.convertDistributionOAI = new cloudfront.OriginAccessIdentity(
      this,
      'convertDistributionOAI',
      {}
    )

    this.convertBucket.grantRead(this.convertDistributionOAI)

    this.convertBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetObject'],
        resources: [`${this.convertBucket.bucketArn}/*`],
        effect: iam.Effect.ALLOW,
        principals: [
          new iam.CanonicalUserPrincipal(
            this.convertDistributionOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId
          )
        ]
      })
    )

    this.convertDistribution = new cloudfront.CloudFrontWebDistribution(
      this,
      'convertDistribution',
      {
        originConfigs: [
          // todo: add logging
          {
            s3OriginSource: {
              s3BucketSource: this.convertBucket,
              originAccessIdentity: this.convertDistributionOAI
            },
            behaviors: [
              {
                isDefaultBehavior: true
              }
            ]
          }
        ]
      }
    )

    this.convertRole = new iam.Role(this, 'role', {
      roleName: `${props.name}-MediaConvertRole`,
      assumedBy: new iam.ServicePrincipal('mediaconvert.amazonaws.com')
    })

    this.convertTable = new dynamodb.Table(this, 'convertTable', {
      tableName: `${props.name}-media`,
      partitionKey: { name: 'Id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      serverSideEncryption: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // not recommended for production
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES
    })

    this.convertRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['s3:*'],
        resources: [
          `${this.convertBucket.bucketArn}/*`,
          `${this.convertBucket.bucketArn}/`,
          `${this.uploadBucket?.bucketArn}/`,
          `${this.uploadBucket?.bucketArn}/*`
        ],
        effect: iam.Effect.ALLOW
      })
    )

    // Validate function validates the input from the upload bucket.
    this.validateFunctionRole = new FunctionRole(this, 'validateFunctionRole', {
      name: `${props.name}-validate`,
      passRoleArn: this.convertRole.roleArn,
      bucketArn: this.uploadBucket.bucketArn
    })

    this.validateFunction = new lambda.Function(this, 'validateFunction', {
      functionName: `${props.name}-validate`, //overwrites the default generated one
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromAsset(path.join(__dirname, '../../validate')),
      role: this.validateFunctionRole.role,
      handler: 'index.main',
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE },
      vpc: props.vpc,
      environment: {
        Destination: this.convertBucket.bucketName,
        IAMRole: this.convertRole.roleArn,
        Application: 'VOD',
        MediaConvert_Template_2160p: `${props.name}_Ott_2160p_Avc_Aac_16x9_qvbr`,
        MediaConvert_Template_1080p: `${props.name}_Ott_1080p_Avc_Aac_16x9_qvbr`,
        MediaConvert_Template_720p: `${props.name}_Ott_720p_Avc_Aac_16x9_qvbr`
      }
    })

    // Validate function validates the input from the upload bucket.
    this.mediaInfoFunctionRole = new FunctionRole(
      this,
      'mediaInfoFunctionRole',
      {
        name: `${props.name}-mediainfo`,
        passRoleArn: this.convertRole.roleArn,
        bucketArn: this.uploadBucket.bucketArn
      }
    )

    this.mediaInfoFunction = new lambda.Function(this, 'mediaInfoFunction', {
      functionName: `${props.name}-media-info`, //overwrites the default generated one
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromAsset(path.join(__dirname, '../../mediainfo')),
      role: this.mediaInfoFunctionRole.role,
      handler: 'index.main',
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE },
      vpc: props.vpc,
      environment: {
        DestinationBucket: this.convertBucket.bucketName,
        IAMRole: this.convertRole.roleArn,
        Application: 'VOD'
      },
      timeout: cdk.Duration.seconds(180)
    })

    // Profile the video outout ...
    this.profilerFunctionRole = new FunctionRole(this, 'profilerFunctionRole', {
      name: `${props.name}-profiler`,
      passRoleArn: this.convertRole.roleArn,
      bucketArn: this.uploadBucket.bucketArn
    })

    this.profilerFunction = new lambda.Function(this, 'profilerFunction', {
      functionName: `${props.name}-profiler`, //overwrites the default generated one
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromAsset(path.join(__dirname, '../../profiler')),
      role: this.profilerFunctionRole.role,
      handler: 'index.main',
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE },
      vpc: props.vpc
    })

    // Convert ...
    this.convertFunctionRole = new FunctionRole(this, 'convertFunctionRole', {
      name: `${props.name}-convert`,
      passRoleArn: this.convertRole.roleArn,
      bucketArn: this.convertBucket.bucketArn
    })

    this.convertFunction = new lambda.Function(this, 'convertFunction', {
      functionName: 'mediaConvert', //overwrites the default generated one
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromAsset(path.join(__dirname, '../../convert')),
      role: this.convertFunctionRole.role,
      handler: 'index.main',
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE },
      vpc: props.vpc,
      environment: {
        IAMRole: this.convertRole.roleArn,
        Application: 'VOD',
        EndPoint: this.customResource.convertEndpoint.getAttString(
          'EndpointUrl'
        )
      }
    })

    this.stepFunctionsInputJob = new sf.Task(this, 'inputJob', {
      task: new tasks.InvokeFunction(this.validateFunction)
    })

    this.stepFunctionsMediaInfoJob = new sf.Task(this, 'mediaInfoJob', {
      task: new tasks.InvokeFunction(this.mediaInfoFunction)
    })

    this.stepFunctionsProfilerJob = new sf.Task(this, 'profilerJob', {
      task: new tasks.InvokeFunction(this.profilerFunction)
    })

    this.stepFunctionsConvertJob = new sf.Task(this, 'convertJob', {
      task: new tasks.InvokeFunction(this.convertFunction)
    })

    const inputJobDefinition = this.stepFunctionsInputJob
      .next(this.stepFunctionsMediaInfoJob)
      .next(this.stepFunctionsProfilerJob)
      .next(this.stepFunctionsConvertJob)

    // Role for the step functions use to process the video here.
    // The role can invoke the functions created here.
    this.stepFunctionsRole = new iam.Role(this, 'stepFunctionsRole', {
      roleName: `${props.name}-StepFunctionsRole`,
      assumedBy: new iam.ServicePrincipal(
        `states.${cdk.Stack.of(this).region}.amazonaws.com`
      )
    })

    // Allow the role to start the execution of the state machines
    this.stepFunctionsRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['states:StartExecution'],
        effect: iam.Effect.ALLOW,
        resources: [
          `arn:aws:states:${cdk.Stack.of(this).region}:${
            cdk.Stack.of(this).account
          }:stateMachine:${cdk.Stack.of(this).stackName}-input`
        ]
      })
    )

    this.stepFunctionsRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents'
        ],
        effect: iam.Effect.ALLOW,
        resources: [
          `"arn:aws:logs:${cdk.Stack.of(this).region}:${
            cdk.Stack.of(this).account
          }:log-group:/aws/lambda/*"`
        ]
      })
    )

    this.stepFunctionsInputWorkflow = new sf.StateMachine(
      this,
      'stepFunctionsInputWorkflow',
      {
        role: this.stepFunctionsRole,
        stateMachineName: `${props.name}-input`,
        definition: inputJobDefinition
      }
    )

    this.convertEventRule = new events.Rule(this, 'uploadBucketEventRule', {
      eventPattern: {
        source: ['aws.s3'],
        detailType: ['AWS API Call via CloudTrail'],
        detail: {
          eventSource: ['s3.amazonaws.com'],
          eventName: [
            'PutObject',
            'CompleteMultipartUpload',
            'RestoreObject',
            'DeleteObject',
            'DeleteObjects'
          ]
        }
      }
    })
    this.convertEventRule.addTarget(
      new targets.SfnStateMachine(this.stepFunctionsInputWorkflow)
    )
  }
}
