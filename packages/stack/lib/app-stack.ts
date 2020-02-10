import * as cdk from '@aws-cdk/core'
import * as ec2 from '@aws-cdk/aws-ec2'
import * as iam from '@aws-cdk/aws-iam'
import * as lambda from '@aws-cdk/aws-lambda'
import * as path from 'path'
import * as sf from '@aws-cdk/aws-stepfunctions'
import * as tasks from '@aws-cdk/aws-stepfunctions-tasks'
import * as events from '@aws-cdk/aws-events'
import * as targets from '@aws-cdk/aws-events-targets'
import * as cfn from '@aws-cdk/aws-cloudformation'
import { FunctionRole, App } from '../constructs'
import * as cognito from '@aws-cdk/aws-cognito'
import { Api } from '../constructs'
import * as s3deploy from '@aws-cdk/aws-s3-deployment'

export interface AppStackProps extends cfn.NestedStackProps {
  projectName?: string
  vpc?: ec2.Vpc
  isDevelopment?: boolean
}

export class AppStack extends cfn.NestedStack {
  public readonly userPool: cognito.UserPool
  public readonly api: Api
  public readonly app: App

  public readonly processFunctionRole: FunctionRole
  public readonly processFunction: lambda.Function

  public readonly dynamoDBFunctionRole: FunctionRole
  public readonly dynamoDBFunction: lambda.Function

  public readonly processRole: iam.Role
  public readonly processEventRule: events.Rule

  public readonly stepFunctionsProcessWorkflow: sf.StateMachine
  public readonly stepFunctionsRole: iam.Role
  public readonly stepFunctionsProcessJob: sf.Task
  public readonly stepFunctionsDynamoDBJob: sf.Task

  constructor(scope: cdk.Construct, id: string, props: AppStackProps) {
    super(scope, id)

    this.userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: `${props.projectName}`,
      selfSignUpEnabled: true
    })

    this.api = new Api(this, 'Api', {
      name: props.projectName,
      userPool: this.userPool,
      schemaDefinitionFile: path.join(
        __dirname,
        '../../app/src/schema.graphql'
      ),
      isDevelopment: props.isDevelopment
    })

    this.app = new App(this, 'App', {
      name: props?.projectName,
      sources: [s3deploy.Source.asset(path.join(__dirname, '../../app/build'))],
      isDevelopment: props.isDevelopment
    })

    this.processRole = new iam.Role(this, 'role', {
      roleName: `${props.projectName}-MediaProcessRolve`,
      assumedBy: new iam.ServicePrincipal('mediaconvert.amazonaws.com')
    })

    // Process ...
    this.processFunctionRole = new FunctionRole(this, 'processFunctionRole', {
      name: `${props.projectName}-process`
    })

    this.processFunction = new lambda.Function(this, 'processFunction', {
      functionName: `${props.projectName}-process`, //overwrites the default generated one
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromAsset(path.join(__dirname, '../../process')),
      role: this.processFunctionRole.role,
      handler: 'index.main',
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE },
      vpc: props.vpc,
      environment: {}
    })

    // DynamoDB ...
    this.dynamoDBFunctionRole = new FunctionRole(this, 'dynamoDBFunctionRole', {
      name: `${props.projectName}-dynamodb`
    })
    this.dynamoDBFunctionRole.role.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'dynamodb:BatchGetItem',
          'dynamodb:GetItem',
          'dynamodb:Query',
          'dynamodb:Scan',
          'dynamodb:BatchWriteItem',
          'dynamodb:PutItem',
          'dynamodb:UpdateItem'
        ],
        resources: [this.api.videoTable.tableArn],
        effect: iam.Effect.ALLOW
      })
    )

    this.dynamoDBFunction = new lambda.Function(this, 'dynamoDBFunction', {
      functionName: `${props.projectName}-dynamodb`, //overwrites the default generated one
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromAsset(path.join(__dirname, '../../dynamodb')),
      role: this.dynamoDBFunctionRole.role,
      handler: 'index.main',
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE },
      vpc: props.vpc,
      environment: {
        TableName: `${this.api.videoTable.tableName}`
      }
    })

    this.stepFunctionsProcessJob = new sf.Task(this, 'processJob', {
      task: new tasks.InvokeFunction(this.processFunction)
    })

    this.stepFunctionsDynamoDBJob = new sf.Task(this, 'dynamoDBJob', {
      task: new tasks.InvokeFunction(this.dynamoDBFunction)
    })

    const inputJobDefinition = this.stepFunctionsProcessJob.next(
      this.stepFunctionsDynamoDBJob
    )

    // Role for the step functions use to process the video here.
    // The role can invoke the functions created here.
    this.stepFunctionsRole = new iam.Role(this, 'stepFunctionsRole', {
      roleName: `${props.projectName}-ProcessStepFunctionsRole`,
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
          }:stateMachine:${cdk.Stack.of(this).stackName}-process`
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

    this.stepFunctionsProcessWorkflow = new sf.StateMachine(
      this,
      'stepFunctionsInputWorkflow',
      {
        role: this.stepFunctionsRole,
        stateMachineName: `${props.projectName}-process`,
        definition: inputJobDefinition
      }
    )

    this.processEventRule = new events.Rule(this, 'mediaConvertEventRule', {
      eventPattern: {
        source: ['aws.mediaconvert'],
        detailType: ['MediaConvert Job State Change'],
        detail: {
          status: ['COMPLETE', 'PROGRESSING', 'ERROR']
        }
      }
    })

    this.processEventRule.addTarget(
      new targets.SfnStateMachine(this.stepFunctionsProcessWorkflow)
    )
  }
}
