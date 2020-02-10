import { v4 as uuidv4 } from 'uuid'

export type WorkflowData = {
  uuid: string
  event: any
  destination?: string
  jobTemplate_2160p?: string
  jobTemplate_1080p?: string
  jobTemplate_720p?: string
}

export async function main(event: any): Promise<WorkflowData> {
  try {
    console.log(
      'ENVIRONMENT VARIABLES\n' + JSON.stringify(process.env, null, 2)
    )
    console.info('EVENT\n' + JSON.stringify(event, null, 2))
    console.warn('Event not processed.')

    const assetId = uuidv4()

    return {
      uuid: assetId,
      event,
      destination: process.env.Destination,
      jobTemplate_2160p: process.env.MediaConvert_Template_2160p,
      jobTemplate_1080p: process.env.MediaConvert_Template_1080p,
      jobTemplate_720p: process.env.MediaConvert_Template_720p
    }
  } catch (e) {
    throw e
  }
}
