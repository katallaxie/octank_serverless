import * as mediaconvert from './lib/mediaconvert'
import * as cfn from './lib/cfn'
import * as aws from 'aws-sdk'

export async function main(event, context) {
  console.log(`REQUEST:: ${JSON.stringify(event, null, 2)}`)

  let config = event.ResourceProperties
  let responseData = {}

  // Each resource returns a promise with a json object to return cloudformation.
  try {
    console.log(`RESOURCE:: ${config.Resource}`)

    if (event.RequestType === 'Create') {
      switch (config.Resource) {
        case 'EndPoint':
          responseData = await mediaconvert.getEndpoints()
          break

        case 'MediaConvertTemplates':
          await mediaconvert.create(config)
          break

        default:
          console.log(
            config.Resource,
            ': not defined as a custom resource, sending success response'
          )
      }
    }

    if (event.RequestType === 'Update') {
      switch (config.Resource) {
        case 'MediaConvertTemplates':
          await mediaconvert.update(config)
          break

        case 'EndPoint':
          responseData = await mediaconvert.getEndpoints()
          break

        default:
          console.log(
            config.Resource,
            ': update not supported, sending success response'
          )
      }
    }
    if (event.RequestType === 'Delete') {
      switch (config.Resource) {
        case 'MediaConvertTemplates':
          await mediaconvert.remove(config)
          break

        default:
          console.log(
            config.Resource,
            ': delete not required, sending success response'
          )
      }
    }

    const response = await cfn.send(event, context, 'SUCCESS', responseData)
    console.log(`RESPONSE:: ${JSON.stringify(responseData, null, 2)}`)
    console.log(`CFN STATUS:: ${response}`)
  } catch (err) {
    console.error(JSON.stringify(err, null, 2))
    await cfn.send(event, context, 'FAILED')
  }
}
