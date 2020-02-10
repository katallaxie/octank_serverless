import * as fs from 'fs'
import * as aws from 'aws-sdk'

const CATEGORY = 'VOD'
const DESCRIPTION = 'video on demand on aws'

const qvbrPresets = [
  {
    name: '_Mp4_Avc_Aac_16x9_1280x720p_24Hz_4.5Mbps_qvbr',
    file:
      './lib/mediaconvert/presets/_Mp4_Avc_Aac_16x9_1280x720p_24Hz_4.5Mbps_qvbr.json'
  },
  {
    name: '_Mp4_Avc_Aac_16x9_1920x1080p_24Hz_6Mbps_qvbr',
    file:
      './lib/mediaconvert/presets/_Mp4_Avc_Aac_16x9_1920x1080p_24Hz_6Mbps_qvbr.json'
  },
  {
    name: '_Mp4_Hevc_Aac_16x9_3840x2160p_24Hz_20Mbps_qvbr',
    file:
      './lib/mediaconvert/presets/_Mp4_Hevc_Aac_16x9_3840x2160p_24Hz_20Mbps_qvbr.json'
  },
  {
    name: '_Ott_Dash_Mp4_Avc_16x9_1280x720p_30Hz_6.5Mbps_qvbr',
    file:
      './lib/mediaconvert/presets/_Ott_Dash_Mp4_Avc_16x9_1280x720p_30Hz_6.5Mbps_qvbr.json'
  },
  {
    name: '_Ott_Dash_Mp4_Avc_16x9_480x270p_15Hz_0.4Mbps_qvbr',
    file:
      './lib/mediaconvert/presets/_Ott_Dash_Mp4_Avc_16x9_480x270p_15Hz_0.4Mbps_qvbr.json'
  },
  {
    name: '_Ott_Dash_Mp4_Avc_16x9_1920x1080p_30Hz_8.5Mbps_qvbr',
    file:
      './lib/mediaconvert/presets/_Ott_Dash_Mp4_Avc_16x9_1920x1080p_30Hz_8.5Mbps_qvbr.json'
  },
  {
    name: '_Ott_Dash_Mp4_Avc_16x9_640x360p_30Hz_0.6Mbps_qvbr',
    file:
      './lib/mediaconvert/presets/_Ott_Dash_Mp4_Avc_16x9_640x360p_30Hz_0.6Mbps_qvbr.json'
  },
  {
    name: '_Ott_Dash_Mp4_Avc_16x9_1280x720p_30Hz_3.5Mbps_qvbr',
    file:
      './lib/mediaconvert/presets/_Ott_Dash_Mp4_Avc_16x9_1280x720p_30Hz_3.5Mbps_qvbr.json'
  },
  {
    name: '_Ott_Dash_Mp4_Avc_16x9_640x360p_30Hz_1.2Mbps_qvbr',
    file:
      './lib/mediaconvert/presets/_Ott_Dash_Mp4_Avc_16x9_640x360p_30Hz_1.2Mbps_qvbr.json'
  },
  {
    name: '_Ott_Dash_Mp4_Avc_16x9_1280x720p_30Hz_5.0Mbps_qvbr',
    file:
      './lib/mediaconvert/presets/_Ott_Dash_Mp4_Avc_16x9_1280x720p_30Hz_5.0Mbps_qvbr.json'
  },
  {
    name: '_Ott_Dash_Mp4_Avc_16x9_960x540p_30Hz_3.5Mbps_qvbr',
    file:
      './lib/mediaconvert/presets/_Ott_Dash_Mp4_Avc_16x9_960x540p_30Hz_3.5Mbps_qvbr.json'
  },
  {
    name: '_Ott_Hls_Ts_Avc_Aac_16x9_1280x720p_30Hz_3.5Mbps_qvbr',
    file:
      './lib/mediaconvert/presets/_Ott_Hls_Ts_Avc_Aac_16x9_1280x720p_30Hz_3.5Mbps_qvbr.json'
  },
  {
    name: '_Ott_Hls_Ts_Avc_Aac_16x9_480x270p_15Hz_0.4Mbps_qvbr',
    file:
      './lib/mediaconvert/presets/_Ott_Hls_Ts_Avc_Aac_16x9_480x270p_15Hz_0.4Mbps_qvbr.json'
  },
  {
    name: '_Ott_Hls_Ts_Avc_Aac_16x9_1280x720p_30Hz_5.0Mbps_qvbr',
    file:
      './lib/mediaconvert/presets/_Ott_Hls_Ts_Avc_Aac_16x9_1280x720p_30Hz_5.0Mbps_qvbr.json'
  },
  {
    name: '_Ott_Hls_Ts_Avc_Aac_16x9_640x360p_30Hz_0.6Mbps_qvbr',
    file:
      './lib/mediaconvert/presets/_Ott_Hls_Ts_Avc_Aac_16x9_640x360p_30Hz_0.6Mbps_qvbr.json'
  },
  {
    name: '_Ott_Hls_Ts_Avc_Aac_16x9_1280x720p_30Hz_6.5Mbps_qvbr',
    file:
      './lib/mediaconvert/presets/_Ott_Hls_Ts_Avc_Aac_16x9_1280x720p_30Hz_6.5Mbps_qvbr.json'
  },
  {
    name: '_Ott_Hls_Ts_Avc_Aac_16x9_640x360p_30Hz_1.2Mbps_qvbr',
    file:
      './lib/mediaconvert/presets/_Ott_Hls_Ts_Avc_Aac_16x9_640x360p_30Hz_1.2Mbps_qvbr.json'
  },
  {
    name: '_Ott_Hls_Ts_Avc_Aac_16x9_1920x1080p_30Hz_8.5Mbps_qvbr',
    file:
      './lib/mediaconvert/presets/_Ott_Hls_Ts_Avc_Aac_16x9_1920x1080p_30Hz_8.5Mbps_qvbr.json'
  },
  {
    name: '_Ott_Hls_Ts_Avc_Aac_16x9_960x540p_30Hz_3.5Mbps_qvbr',
    file:
      './lib/mediaconvert/presets/_Ott_Hls_Ts_Avc_Aac_16x9_960x540p_30Hz_3.5Mbps_qvbr.json'
  }
]

const qvbrTemplates = [
  {
    name: '_Ott_2160p_Avc_Aac_16x9_qvbr',
    file: './lib/mediaconvert/templates/2160p_avc_aac_16x9_qvbr.json'
  },
  {
    name: '_Ott_1080p_Avc_Aac_16x9_qvbr',
    file: './lib/mediaconvert/templates/1080p_avc_aac_16x9_qvbr.json'
  },
  {
    name: '_Ott_720p_Avc_Aac_16x9_qvbr',
    file: './lib/mediaconvert/templates/720p_avc_aac_16x9_qvbr.json'
  }
]

const mediaPackageTemplates = [
  {
    name: '_Ott_2160p_Avc_Aac_16x9_mvod',
    file: './lib/mediaconvert/templates/2160p_avc_aac_16x9_mvod.json'
  },
  {
    name: '_Ott_1080p_Avc_Aac_16x9_mvod',
    file: './lib/mediaconvert/templates/1080p_avc_aac_16x9_mvod.json'
  },
  {
    name: '_Ott_720p_Avc_Aac_16x9_mvod',
    file: './lib/mediaconvert/templates/720p_avc_aac_16x9_mvod.json'
  }
]

export const getEndpoints = async () => {
  const mediaconvert = new aws.MediaConvert({ apiVersion: '2017-08-29' })
  const data = await mediaconvert.describeEndpoints({ MaxResults: 0 }).promise()

  return {
    EndpointUrl: data.Endpoints?.shift()?.Url
  }
}

const _createPresets = async (instance, presets, stackName) => {
  for (let preset of presets) {
    // Add stack name to the preset name to ensure it is unique
    let name = stackName + preset.name
    let params = {
      Name: name,
      Category: CATEGORY,
      Description: DESCRIPTION,
      Settings: JSON.parse(fs.readFileSync(preset.file, 'utf8'))
    }

    await instance.createPreset(params).promise()
    console.log(`preset created:: ${name}`)
  }
}

const _createTemplates = async (instance, templates, stackName) => {
  for (let tmpl of templates) {
    // Load template and set unique template name
    let params = JSON.parse(fs.readFileSync(tmpl.file, 'utf8'))
    params.Name = stackName + params.Name

    // Update preset names unless system presets
    params.Settings.OutputGroups.forEach(group => {
      group.Outputs.forEach(output => {
        if (!output.Preset.startsWith('System')) {
          output.Preset = stackName + output.Preset
        }
      })
    })

    await instance.createJobTemplate(params).promise()
    console.log(`template created:: ${params.Name}`)
  }
}

export const create = async config => {
  const mediaconvert = new aws.MediaConvert({
    endpoint: config.EndPoint,
    region: process.env.AWS_REGION
  })

  let presets = qvbrPresets
  let templates = qvbrTemplates

  await _createPresets(mediaconvert, presets, config.StackName)
  await _createTemplates(mediaconvert, templates, config.StackName)

  return 'success'
}

export const update = async config => {
  const mediaconvert = new aws.MediaConvert({
    endpoint: config.EndPoint,
    region: process.env.AWS_REGION
  })

  console.log('No changes to the MediaConvert templates')

  return 'success'
}

const _deletePresets = async (instance, presets, stackName) => {
  for (let preset of presets) {
    let name = stackName + preset.name

    await instance.deletePreset({ Name: name }).promise()
    console.log(`preset deleted:: ${name}`)
  }
}

const _deleteTemplates = async (instance, templates, stackName) => {
  for (let tmpl of templates) {
    let name = stackName + tmpl.name

    await instance.deleteJobTemplate({ Name: name }).promise()
    console.log(`template deleted:: ${name}`)
  }
}

export const remove = async config => {
  const mediaconvert = new aws.MediaConvert({
    endpoint: config.EndPoint,
    region: process.env.AWS_REGION
  })

  try {
    let presets = qvbrPresets
    let templates = mediaPackageTemplates

    await _deletePresets(mediaconvert, presets, config.StackName)
    await _deleteTemplates(mediaconvert, templates, config.StackName)
  } catch (err) {
    console.log(err)
    throw err
  }

  return 'success'
}
