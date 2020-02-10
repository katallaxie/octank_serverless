#!/usr/bin/env node
import * as cdk from '@aws-cdk/core'
import { CoreStack, AppStack, MediaStack } from '../lib'

const app = new cdk.App()

// extract context variables for the stacks ...
const projectName = app.node.tryGetContext('projectName')
const operatorEmail = app.node.tryGetContext('operatorEmail')

// the stack with the VPC ...
const coreStack = new CoreStack(app, 'CoreStack', {
  stackName: `${projectName}-core`,
  projectName,
  operatorEmail
})

// the stack with the video conversion ...
const mediaStack = new MediaStack(coreStack, 'MediaStack', {
  projectName,
  vpc: coreStack.vpc
})

const appStack = new AppStack(coreStack, 'AppStack', {
  projectName,
  vpc: coreStack.vpc
})

app.synth()
