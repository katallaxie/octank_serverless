import * as aws from 'aws-sdk'
import * as child from 'child_process'
import * as util from 'util'
import * as fs from 'fs'
import * as path from 'path'

export type CloudTrailEvent = {
  detail: CloudTrailEventDetail
}

export type CloudTrailEventDetail = {
  requestParameters: CloudTrailRequestParams
}

export type CloudTrailRequestParams = {
  bucketName: string
  key: string
}

export type WorkflowData = {
  uuid: string
  event: CloudTrailEvent
  media: any
}

export async function main(data: WorkflowData): Promise<WorkflowData> {
  try {
    const params = {
      Bucket: data.event.detail.requestParameters.bucketName,
      Key: data.event.detail.requestParameters.key
    }

    // client
    const s3 = new aws.S3()
    const url = await s3.getSignedUrlPromise('getObject', params)

    // execute mediainfo
    const execFile = util.promisify(child.execFile)
    const { stdout } = await execFile(
      path.join(__dirname, 'bin', 'mediainfo'),
      ['--Output=JSON', url]
    )

    const { media } = JSON.parse(stdout)

    console.log(media, { ...data, media })

    return { ...data, media }
  } catch (e) {
    throw e
  }
}
