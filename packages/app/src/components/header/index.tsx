import React from 'react'
import { Helmet } from 'react-helmet'
import { Heading, Pane } from 'evergreen-ui'
import awsmobile from '../../aws-exports'

export function Header() {
  return (
    <Pane borderBottom display="flex" padding={22}>
      <Helmet>
        <meta charSet="utf-8" />
        <title>Octank Videos</title>
        <link rel="canonical" href={`https://${awsmobile}`} />
      </Helmet>
      <Heading size={800}>Octank Videos</Heading>
    </Pane>
  )
}

export default Header
