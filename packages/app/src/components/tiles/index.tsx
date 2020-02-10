import React from 'react'
import { Pane } from 'evergreen-ui'
import { HomeQuery } from '../../generated/graphql'
import Tile from '../tile'

type TilesProps = {
  data: HomeQuery | undefined
}

export function Tiles({ data }: TilesProps) {
  return (
    <Pane>
      {data?.getVideos?.map(video =>
        video ? <Tile key={video.id} video={video} /> : null
      )}
    </Pane>
  )
}

export default Tiles
