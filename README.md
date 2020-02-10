# Octank Videoz Solutions

> The project is setup as a mono repository.

## Setup

Setup the packages to be build.

```
lerna bootstrap
```

Build the packages.

```
lerna run build
```

Only remove the development dependencies from the packages and make it ready for deployment.

```
lerna run clean && lerna bootstrap -- --production --no-optional
```

Bootstrap your account with the core [AWS CDK](https://docs.aws.amazon.com/cdk/latest/guide/home.html) Toolkit.

```
lerna run --scope stack cdk -- bootstrap --stream
```

Deploy the video solution to your account.

```
lerna run --scope stack cdk -- deploy --stream
```

## Packages

The solution consists of various packages that contain the CloudFormation Stack, the app and the Lambda Functions.

- app - application
- convert - trigger the conversion
- custom-resource - create the conversion templates
- dynamodb - write the video information for the app
- mediainfo - extract the video meta information
- process - ingest the video after conversion
- profiler - determine the conversion template
- stack - CloudFormation Stack
- tools - tooling
- validate - ingest the video after upload
