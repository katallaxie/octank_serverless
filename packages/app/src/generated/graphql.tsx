import gql from 'graphql-tag'
import * as ApolloReactCommon from '@apollo/react-common'
import * as React from 'react'
import * as ApolloReactComponents from '@apollo/react-components'
import * as ApolloReactHoc from '@apollo/react-hoc'
import * as ApolloReactHooks from '@apollo/react-hooks'
export type Maybe<T> = T | null
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string
  String: string
  Boolean: boolean
  Int: number
  Float: number
}

export type Mutation = {
  __typename?: 'Mutation'
  saveVote?: Maybe<Video>
}

export type MutationSaveVoteArgs = {
  id: Scalars['String']
}

export type Query = {
  __typename?: 'Query'
  getServiceVersion?: Maybe<ServiceVersion>
  getVideos?: Maybe<Videos>
  getVideo?: Maybe<Video>
}

export type QueryGetVideosArgs = {
  limit?: Maybe<Scalars['Int']>
  nextToken?: Maybe<Scalars['String']>
}

export type QueryGetVideoArgs = {
  id?: Maybe<Scalars['String']>
}

export type SaveVoteInput = {
  id: Scalars['String']
}

export type ServiceVersion = {
  __typename?: 'ServiceVersion'
  version: Scalars['String']
}

export type Subscription = {
  __typename?: 'Subscription'
  onSaveVote?: Maybe<Video>
}

export type Video = {
  __typename?: 'Video'
  id: Scalars['String']
  title: Scalars['String']
  votes: Scalars['Int']
  description?: Maybe<Scalars['String']>
  hlsUrl?: Maybe<Scalars['String']>
  dashUrl?: Maybe<Scalars['String']>
  thumbnailUrl?: Maybe<Scalars['String']>
}

export type Videos = {
  __typename?: 'Videos'
  videos?: Maybe<Array<Maybe<Video>>>
  nextToken?: Maybe<Scalars['String']>
}

export type PutVoteMutationVariables = {
  video: Scalars['String']
}

export type PutVoteMutation = { __typename?: 'Mutation' } & {
  saveVote?: Maybe<{ __typename?: 'Video' } & Pick<Video, 'votes'>>
}

export type HomeQueryVariables = {}

export type HomeQuery = { __typename?: 'Query' } & {
  getVideos?: Maybe<
    { __typename?: 'Videos' } & Pick<Videos, 'nextToken'> & {
        videos?: Maybe<
          Array<
            Maybe<
              { __typename?: 'Video' } & Pick<
                Video,
                | 'id'
                | 'title'
                | 'description'
                | 'hlsUrl'
                | 'thumbnailUrl'
                | 'votes'
              >
            >
          >
        >
      }
  >
}

export const PutVoteDocument = gql`
  mutation PutVote($video: String!) {
    saveVote(id: $video) {
      votes
    }
  }
`
export type PutVoteMutationFn = ApolloReactCommon.MutationFunction<
  PutVoteMutation,
  PutVoteMutationVariables
>
export type PutVoteComponentProps = Omit<
  ApolloReactComponents.MutationComponentOptions<
    PutVoteMutation,
    PutVoteMutationVariables
  >,
  'mutation'
>

export const PutVoteComponent = (props: PutVoteComponentProps) => (
  <ApolloReactComponents.Mutation<PutVoteMutation, PutVoteMutationVariables>
    mutation={PutVoteDocument}
    {...props}
  />
)

export type PutVoteProps<
  TChildProps = {},
  TDataName extends string = 'mutate'
> = {
  [key in TDataName]: ApolloReactCommon.MutationFunction<
    PutVoteMutation,
    PutVoteMutationVariables
  >
} &
  TChildProps
export function withPutVote<
  TProps,
  TChildProps = {},
  TDataName extends string = 'mutate'
>(
  operationOptions?: ApolloReactHoc.OperationOption<
    TProps,
    PutVoteMutation,
    PutVoteMutationVariables,
    PutVoteProps<TChildProps, TDataName>
  >
) {
  return ApolloReactHoc.withMutation<
    TProps,
    PutVoteMutation,
    PutVoteMutationVariables,
    PutVoteProps<TChildProps, TDataName>
  >(PutVoteDocument, {
    alias: 'putVote',
    ...operationOptions
  })
}

/**
 * __usePutVoteMutation__
 *
 * To run a mutation, you first call `usePutVoteMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePutVoteMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [putVoteMutation, { data, loading, error }] = usePutVoteMutation({
 *   variables: {
 *      video: // value for 'video'
 *   },
 * });
 */
export function usePutVoteMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    PutVoteMutation,
    PutVoteMutationVariables
  >
) {
  return ApolloReactHooks.useMutation<
    PutVoteMutation,
    PutVoteMutationVariables
  >(PutVoteDocument, baseOptions)
}
export type PutVoteMutationHookResult = ReturnType<typeof usePutVoteMutation>
export type PutVoteMutationResult = ApolloReactCommon.MutationResult<
  PutVoteMutation
>
export type PutVoteMutationOptions = ApolloReactCommon.BaseMutationOptions<
  PutVoteMutation,
  PutVoteMutationVariables
>
export const HomeDocument = gql`
  query Home {
    getVideos {
      videos {
        id
        title
        description
        hlsUrl
        thumbnailUrl
        votes
      }
      nextToken
    }
  }
`
export type HomeComponentProps = Omit<
  ApolloReactComponents.QueryComponentOptions<HomeQuery, HomeQueryVariables>,
  'query'
>

export const HomeComponent = (props: HomeComponentProps) => (
  <ApolloReactComponents.Query<HomeQuery, HomeQueryVariables>
    query={HomeDocument}
    {...props}
  />
)

export type HomeProps<TChildProps = {}, TDataName extends string = 'data'> = {
  [key in TDataName]: ApolloReactHoc.DataValue<HomeQuery, HomeQueryVariables>
} &
  TChildProps
export function withHome<
  TProps,
  TChildProps = {},
  TDataName extends string = 'data'
>(
  operationOptions?: ApolloReactHoc.OperationOption<
    TProps,
    HomeQuery,
    HomeQueryVariables,
    HomeProps<TChildProps, TDataName>
  >
) {
  return ApolloReactHoc.withQuery<
    TProps,
    HomeQuery,
    HomeQueryVariables,
    HomeProps<TChildProps, TDataName>
  >(HomeDocument, {
    alias: 'home',
    ...operationOptions
  })
}

/**
 * __useHomeQuery__
 *
 * To run a query within a React component, call `useHomeQuery` and pass it any options that fit your needs.
 * When your component renders, `useHomeQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useHomeQuery({
 *   variables: {
 *   },
 * });
 */
export function useHomeQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<HomeQuery, HomeQueryVariables>
) {
  return ApolloReactHooks.useQuery<HomeQuery, HomeQueryVariables>(
    HomeDocument,
    baseOptions
  )
}
export function useHomeLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    HomeQuery,
    HomeQueryVariables
  >
) {
  return ApolloReactHooks.useLazyQuery<HomeQuery, HomeQueryVariables>(
    HomeDocument,
    baseOptions
  )
}
export type HomeQueryHookResult = ReturnType<typeof useHomeQuery>
export type HomeLazyQueryHookResult = ReturnType<typeof useHomeLazyQuery>
export type HomeQueryResult = ApolloReactCommon.QueryResult<
  HomeQuery,
  HomeQueryVariables
>
