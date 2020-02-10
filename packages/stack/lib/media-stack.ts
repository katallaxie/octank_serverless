import * as cdk from '@aws-cdk/core'
import * as ec2 from '@aws-cdk/aws-ec2'
import * as cfn from '@aws-cdk/aws-cloudformation'
import { MediaConvert } from './media-convert'

export interface MediaStackProps extends cfn.NestedStackProps {
  vpc: ec2.Vpc
  projectName: string
}

export class MediaStack extends cfn.NestedStack {
  public readonly mediaConvert: MediaConvert

  constructor(scope: cdk.Construct, id: string, props: MediaStackProps) {
    super(scope, id)

    // Media conversion ...
    this.mediaConvert = new MediaConvert(this, 'mediaConvert', {
      name: `${props.projectName}`,
      isDevelopment: true,
      vpc: props.vpc
    })
  }
}
