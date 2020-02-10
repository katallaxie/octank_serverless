import React from 'react'
import { Card, Text, Heading, Button, Pane } from 'evergreen-ui'
import { Video, usePutVoteMutation } from '../../generated/graphql'
import ReactPlayer from 'react-player'
import config from '../../aws-exports'

export type TileProps = {
  video: Video
}

export function Tile({ video }: TileProps) {
  const [putVoteMutation, { data, loading, error }] = usePutVoteMutation({
    variables: {
      video: video.id || ''
    }
  })

  return (
    <Card
      elevation={1}
      margin={24}
      display="flex"
      justifyContent="center"
      alignItems="center"
      flexDirection="column"
    >
      {video?.hlsUrl && (
        <Pane display="flex" height="100%" width="100%">
          <ReactPlayer
            url={`https://${config.cloudfront_domain}${video?.hlsUrl}`}
            controls={true}
            max-height="480"
            width="100%"
            playing={true}
            light={`https://${config.cloudfront_domain}${video?.thumbnailUrl}`}
          />
        </Pane>
      )}
      <Pane
        width="100%"
        display="flex"
        flexDirection="row"
        justifyContent="space-between"
        padding={24}
        alignItems="center"
      >
        <Pane display="flex" flexDirection="column">
          <Heading size={500}>{video?.title}</Heading>
          <Text>{video?.description}</Text>
        </Pane>
        <Pane>
          <Button
            appearance="primary"
            disabled={loading || data?.saveVote?.votes !== undefined}
            onClick={putVoteMutation}
            {...{ intent: !error ? 'none' : 'danger' }}
          >{`Vote (${data?.saveVote?.votes || video?.votes})`}</Button>
        </Pane>
      </Pane>
    </Card>
  )
}

export default Tile
