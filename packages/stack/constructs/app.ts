import * as cdk from '@aws-cdk/core'
import * as cloudfront from '@aws-cdk/aws-cloudfront'
import * as s3 from '@aws-cdk/aws-s3'
import * as s3deploy from '@aws-cdk/aws-s3-deployment'
import * as iam from '@aws-cdk/aws-iam'

export interface AppProps {
  name?: string
  isDevelopment?: boolean
  sources: s3deploy.ISource[]
}

export class App extends cdk.Construct {
  public readonly distributionBucket: s3.Bucket
  public readonly distribution: cloudfront.CloudFrontWebDistribution
  public readonly distributionOAI: cloudfront.OriginAccessIdentity
  public readonly distributionBucketDeployment: s3deploy.BucketDeployment

  constructor(scope: cdk.Construct, id: string, props: AppProps) {
    super(scope, id)

    this.distributionBucket = new s3.Bucket(this, 'distributionBucket', {
      encryption: s3.BucketEncryption.S3_MANAGED, // todo: move to KMS
      bucketName: `${props?.name}-distribution`,
      versioned: true,
      removalPolicy: props?.isDevelopment
        ? cdk.RemovalPolicy.DESTROY
        : cdk.RemovalPolicy.RETAIN // not recommended for production
    })

    this.distributionBucketDeployment = new s3deploy.BucketDeployment(
      this,
      'distributionBucketDeployment',
      {
        sources: [...props.sources],
        destinationBucket: this.distributionBucket
      }
    )

    this.distributionOAI = new cloudfront.OriginAccessIdentity(
      this,
      'distributionOAI',
      {}
    )

    this.distributionBucket.grantRead(this.distributionOAI)
    this.distributionBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetObject'],
        resources: [`${this.distributionBucket.bucketArn}/*`],
        effect: iam.Effect.ALLOW,
        principals: [
          new iam.CanonicalUserPrincipal(
            this.distributionOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId
          )
        ]
      })
    )

    this.distribution = new cloudfront.CloudFrontWebDistribution(
      this,
      'distribution',
      {
        originConfigs: [
          // todo: add logging
          {
            s3OriginSource: {
              s3BucketSource: this.distributionBucket,
              originAccessIdentity: this.distributionOAI
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
  }
}
