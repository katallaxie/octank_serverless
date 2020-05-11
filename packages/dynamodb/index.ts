import {
  attribute,
  hashKey,
  rangeKey,
  table
} from '@aws/dynamodb-data-mapper-annotations'
import * as aws from 'aws-sdk'
import { DataMapper } from '@aws/dynamodb-data-mapper'
import * as url from 'url'

const _tableName = process.env.TableName as string

type Status = 'PROCESSING' | 'COMPLETE' | 'ERROR' | 'UNKNOWN'

@table(_tableName)
export class Video {
  @hashKey()
  id: String

  @rangeKey({ defaultProvider: () => new Date() })
  createdAt: Date

  @attribute({ defaultProvider: () => 'New Video' })
  title: String

  @attribute({ defaultProvider: () => 'A new video has been added' })
  description: String

  @attribute()
  published: boolean = false

  @attribute()
  status: Status = 'UNKNOWN'

  @attribute()
  votes: Number = 0

  @attribute()
  hlsUrl: String | null

  @attribute()
  dashUrl: String | null

  @attribute()
  thumbnailUrl: String | null
}

export interface UserMetadata {
  uuid: string
}

export interface Data {
  status: Status
  userMetadata: UserMetadata
  outputGroupDetails: OutputGroupDetails[]
}

export type OutputGroupDetailsType =
  | 'FILE_GROUP'
  | 'HLS_GROUP'
  | 'DASH_ISO_GROUP'

export interface VideoDetails {
  widthInPx: number
  heightInPx: number
}

export interface OutputDetails {
  outputFilePaths: string[]
}

export interface OutputGroupDetails {
  type: OutputGroupDetailsType
  outputDetails: OutputDetails[]
  playlistFilePaths: string[]
}

const filterHlsUrl = (details: OutputGroupDetails[]) =>
  details?.reduce(
    (prev, curr) =>
      curr.type !== 'HLS_GROUP' ? prev : curr.playlistFilePaths.pop() || prev,
    ''
  )

const filterThumbnailUrl = (details: OutputGroupDetails[]) =>
  details?.reduce(
    (prev, curr) =>
      curr.type !== 'FILE_GROUP'
        ? prev
        : curr.outputDetails.reduce(
            (prev, curr) =>
              curr.outputFilePaths.find(url => url.endsWith('jpg')) || prev,
            ''
          ) || prev,
    ''
  )

const cloudFrontUrl = (s3Url: string) => url.parse(s3Url || '').pathname

export async function main(data: Data) {
  console.log(`REQUEST:: ${JSON.stringify(data, null, 2)}`)

  try {
    // DynamoDB client ...
    const dynamodb = new aws.DynamoDB()
    const mapper = new DataMapper({
      client: dynamodb // the SDK client used to execute operations
    })

    const video = new Video()
    video.id = data?.userMetadata.uuid
    video.status = data?.status

    if (data.status === 'COMPLETE') {
      video.hlsUrl = cloudFrontUrl(filterHlsUrl(data?.outputGroupDetails))
      video.thumbnailUrl = cloudFrontUrl(
        filterThumbnailUrl(data?.outputGroupDetails)
      )
    }

    await mapper.put(video)
  } catch (e) {
    throw e
  }

  return { ...data }
}
