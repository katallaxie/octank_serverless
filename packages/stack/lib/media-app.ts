import * as cdk from '@aws-cdk/core'
import * as ec2 from '@aws-cdk/aws-ec2'
import * as iam from '@aws-cdk/aws-iam'
import * as lambda from '@aws-cdk/aws-lambda'
import * as path from 'path'
import * as sf from '@aws-cdk/aws-stepfunctions'
import * as tasks from '@aws-cdk/aws-stepfunctions-tasks'
import * as events from '@aws-cdk/aws-events'
import * as targets from '@aws-cdk/aws-events-targets'
import { FunctionRole } from '../constructs/roles'

export interface MediaAppProps {
  name?: string
  vpc?: ec2.Vpc
  isDevelopment?: boolean
}

export class MediaApp extends cdk.Construct {
  public readonly processFunctionRole: FunctionRole
  public readonly processFunction: lambda.Function

  public readonly processRole: iam.Role
  public readonly processEventRule: events.Rule

  public readonly stepFunctionsProcessWorkflow: sf.StateMachine
  public readonly stepFunctionsRole: iam.Role
  public readonly stepFunctionsProcessJob: sf.Task

  constructor(scope: cdk.Construct, id: string, props: MediaAppProps = {}) {
    super(scope, id)

    this.processRole = new iam.Role(this, 'role', {
      roleName: `${props.name}-MediaProcessRolve`,
      assumedBy: new iam.ServicePrincipal('mediaconvert.amazonaws.com')
    })

    // Convert ...
    this.processFunctionRole = new FunctionRole(this, 'processFunctionRole', {
      name: `${props.name}-process`
    })

    this.processFunction = new lambda.Function(this, 'processFunction', {
      functionName: `${props.name}-process`, //overwrites the default generated one
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromAsset(path.join(__dirname, '../../process')),
      role: this.processFunctionRole.role,
      handler: 'index.main',
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE },
      vpc: props.vpc,
      environment: {
        Application: 'VOD'
      }
    })

    this.stepFunctionsProcessJob = new sf.Task(this, 'processJob', {
      task: new tasks.InvokeFunction(this.processFunction)
    })

    const inputJobDefinition = this.stepFunctionsProcessJob

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

    this.stepFunctionsProcessWorkflow = new sf.StateMachine(
      this,
      'stepFunctionsInputWorkflow',
      {
        role: this.stepFunctionsRole,
        stateMachineName: `${props.name}-input`,
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
