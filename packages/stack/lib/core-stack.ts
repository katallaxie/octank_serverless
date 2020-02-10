import * as cdk from '@aws-cdk/core'
import * as ec2 from '@aws-cdk/aws-ec2'

enum SubnetName {
  Public = 'Public',
  Application = 'Application',
  Database = 'Database'
}

interface CoreStackProps extends cdk.StackProps {
  projectName: string
  operatorEmail: string
}

export class CoreStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc

  constructor(stack: cdk.App, id: string, props?: CoreStackProps) {
    super(stack, id, props)

    // VPC ...
    this.vpc = new ec2.Vpc(this, 'VPC', {
      cidr: '10.0.0.0/16',
      natGatewaySubnets: {
        subnetName: SubnetName.Public
      },
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: SubnetName.Public,
          subnetType: ec2.SubnetType.PUBLIC
        },
        {
          cidrMask: 24,
          name: SubnetName.Application,
          subnetType: ec2.SubnetType.PRIVATE
        },
        {
          cidrMask: 28,
          name: SubnetName.Database,
          subnetType: ec2.SubnetType.ISOLATED
        }
      ]
    })
  }
}
