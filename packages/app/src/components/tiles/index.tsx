import React from 'react'
import { Pane } from 'evergreen-ui'
import { Maybe, Video } from '../../generated/graphql'
import Tile from '../tile'

type TilesProps = {
  videos:
    | Maybe<
        {
          __typename?: 'Video' | undefined
        } & Pick<
          Video,
          'id' | 'title' | 'description' | 'hlsUrl' | 'thumbnailUrl' | 'votes'
        >
      >[]
    | null
    | undefined
}

export function Tiles({ videos }: TilesProps) {
  console.log(videos)
  return (
    <Pane>
      {videos?.map(video =>
        video ? <Tile key={video.id} video={video} /> : null
      )}
    </Pane>
  )
}

export default Tiles
