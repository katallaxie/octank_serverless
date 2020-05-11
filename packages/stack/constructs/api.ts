import * as cdk from '@aws-cdk/core'
import * as appsync from '@aws-cdk/aws-appsync'
import * as cognito from '@aws-cdk/aws-cognito'
import * as dynamodb from '@aws-cdk/aws-dynamodb'
import * as path from 'path'

export interface ApiProps {
  name?: string
  schemaDefinitionFile?: string
  userPool?: cognito.UserPool
  isDevelopment?: boolean
}

export class Api extends cdk.Construct {
  public readonly api: appsync.GraphQLApi
  public readonly noneDS: appsync.NoneDataSource
  public readonly videoDS: appsync.DynamoDbDataSource
  public readonly videoTable: dynamodb.Table

  constructor(scope: cdk.Construct, id: string, props: ApiProps) {
    super(scope, id)

    this.api = new appsync.GraphQLApi(this, 'Api', {
      name: `${props.name}`,
      logConfig: {
        fieldLogLevel: appsync.FieldLogLevel.ALL
      },
      authorizationConfig: {
        defaultAuthorization: {
          userPool: props.userPool,
          defaultAction: appsync.UserPoolDefaultAction.ALLOW
        },
        additionalAuthorizationModes: [
          {
            apiKeyDesc: 'My API Key'
          }
        ]
      },
      schemaDefinitionFile: props.schemaDefinitionFile
    })

    this.noneDS = this.api.addNoneDataSource('None', 'Dummy data source')
    this.noneDS.createResolver({
      typeName: 'Query',
      fieldName: 'getServiceVersion',
      requestMappingTemplate: appsync.MappingTemplate.fromString(
        JSON.stringify({
          version: '2017-02-28'
        })
      ),
      responseMappingTemplate: appsync.MappingTemplate.fromString(
        JSON.stringify({
          version: 'v1'
        })
      )
    })

    this.videoTable = new dynamodb.Table(this, 'VideoTable', {
      tableName: `${props.name}`,
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: props.isDevelopment
        ? cdk.RemovalPolicy.DESTROY
        : cdk.RemovalPolicy.RETAIN,
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING
      }
    })

    this.videoDS = this.api.addDynamoDbDataSource(
      'Video',
      'The videos',
      this.videoTable
    )
    this.videoDS.createResolver({
      typeName: 'Query',
      fieldName: 'getVideos',
      requestMappingTemplate: appsync.MappingTemplate.fromFile(
        path.join(__dirname, './mappings/getVideos.tmpl')
      ),
      responseMappingTemplate: appsync.MappingTemplate.fromFile(
        path.join(__dirname, './mappings/videos.tmpl')
      )
    })
    this.videoDS.createResolver({
      typeName: 'Query',
      fieldName: 'getVideo',
      requestMappingTemplate: appsync.MappingTemplate.dynamoDbGetItem(
        'id',
        'id'
      ),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem()
    })
    this.videoDS.createResolver({
      typeName: 'Mutation',
      fieldName: 'saveVote',
      requestMappingTemplate: appsync.MappingTemplate.fromFile(
        path.join(__dirname, './mappings/saveVote.tmpl')
      ),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem()
    })
  }
}
