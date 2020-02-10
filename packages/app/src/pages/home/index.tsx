import React from 'react'
import { Tiles } from '../../components/tiles'
import { useHomeQuery } from '../../generated/graphql'
import { Spinner, Heading, Pane, toaster } from 'evergreen-ui'

export function Home() {
  const { loading, error, data } = useHomeQuery()

  const showError = () => {
    toaster.danger('Argh, could not fetch new videos')
  }

  if (loading) {
    return (
      <Pane
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <Spinner />
      </Pane>
    )
  }

  if (error) {
    showError()

    return (
      <Pane
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <Heading>Upps! There was an error fetching new articles.</Heading>
      </Pane>
    )
  }

  if (!data?.getVideos?.length) {
    return (
      <Pane
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <Heading>Get a coffee. No new videos.</Heading>
      </Pane>
    )
  }

  return <Tiles data={data} />
}

export default Home
