import React from 'react'
import { Heading, Pane } from 'evergreen-ui'

export function Header() {
  return (
    <Pane borderBottom display="flex" padding={22}>
      <Heading size={800}>Octank Videos</Heading>
    </Pane>
  )
}

export default Header
