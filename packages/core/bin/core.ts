#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { CoreStack } from '../lib/core-stack';

const app = new cdk.App();
new CoreStack(app, 'CoreStack');
