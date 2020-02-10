import React from 'react'
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'
import './App.css'
import '@aws-amplify/ui/dist/style.css'

// AppSync and Apollo
import { createAuthLink } from 'aws-appsync-auth-link'
import { createSubscriptionHandshakeLink } from 'aws-appsync-subscription-link'
import { ApolloProvider } from '@apollo/react-common'
import { ApolloLink } from 'apollo-link'
import ApolloClient from 'apollo-client'
import { InMemoryCache } from 'apollo-cache-inmemory'

// Amplify
import Amplify, { Auth } from 'aws-amplify'
import { withAuthenticator } from 'aws-amplify-react'

// UI
import Home from './pages/home'
import Header from './components/header'

// Config
import awsconfig from './aws-exports'

// Amplify init
Amplify.configure(awsconfig)

const GRAPHQL_API_REGION = awsconfig.aws_appsync_region
const GRAPHQL_API_ENDPOINT_URL = awsconfig.aws_appsync_graphqlEndpoint
const AUTH_TYPE: any = awsconfig.aws_appsync_authenticationType

// Apollo client ...
const config = {
  url: GRAPHQL_API_ENDPOINT_URL,
  region: GRAPHQL_API_REGION,
  auth: {
    type: AUTH_TYPE,
    apiKey: awsconfig.aws_appsync_apiKey,
    jwtToken: async () =>
      (await Auth.currentSession()).getIdToken().getJwtToken()
  }
}

const client = new ApolloClient({
  link: ApolloLink.from([
    createAuthLink(config),
    createSubscriptionHandshakeLink(config)
  ]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network'
    }
  }
})

function App() {
  return (
    <Router>
      <Header></Header>
      <Switch>
        <Route path="/">
          <Home />
        </Route>
      </Switch>
    </Router>
  )
}

const AppWithAuth =
  awsconfig.aws_appsync_authenticationType === 'API_KEY'
    ? App
    : withAuthenticator(App, true)

export default () => (
  <ApolloProvider client={client}>
    <AppWithAuth />
  </ApolloProvider>
)
