export type WorkflowData = {
  uuid: string
  event: any
  media: any
  encode: any
  jobTemplate: string
  jobTemplate_2160p?: string
  jobTemplate_1080p?: string
  jobTemplate_720p?: string
}

export async function main(event: WorkflowData): Promise<WorkflowData> {
  console.log(`REQUEST:: ${JSON.stringify(event, null, 2)}`)

  try {
    const { media } = event
    const encode: any = {}
    const video = media.track.filter(track => track['@type'] === 'Video').pop()

    encode.height = video.Height
    encode.width = video.Width

    // Determine encoding by matching the srcHeight to the nearest profile.
    const profiles = [2160, 1080, 720]
    let lastProfile
    let encodeProfile

    profiles.some(p => {
      let profile = Math.abs(encode.height - p)
      if (profile > lastProfile) {
        return true
      }

      encodeProfile = p
      lastProfile = profile

      return false
    })

    encode.profile = encodeProfile

    // Match Height x Width with the encoding profile.
    const ratios = {
      '2160': 3840,
      '1080': 1920,
      '720': 1280
    }

    encode.frameCaptureHeight = encodeProfile
    encode.frameCaptureWidth = ratios[encodeProfile]

    event.encode = encode

    const jobTemplates = {
      '2160': event.jobTemplate_2160p,
      '1080': event.jobTemplate_1080p,
      '720': event.jobTemplate_720p
    }

    event.jobTemplate = jobTemplates[encodeProfile]
    console.log(`Chosen template:: ${event.jobTemplate}`)
  } catch (e) {
    throw e
  }

  return event
}
