/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable no-underscore-dangle */
import React from 'react';
import { Query } from 'react-apollo';
import gql from 'graphql-tag';
import propTypes from 'prop-types';
import SingleLink from './Link';
import { LINKS_PER_PAGE } from '../constants';

export const FEED_QUERY = gql`
  query FeedQuery($first: Int, $skip: Int, $orderBy: LinkOrderByInput) {
    feed(first: $first, skip: $skip, orderBy: $orderBy) {
      links {
        id
        createdAt
        url
        description
        postedBy {
          id
          name
        }
        votes {
          id
          user {
            id
          }
        }
      }
      count
    }
  }
`;

const NEW_LINKS_SUBSCRIPTION = gql`
  subscription {
    newLink {
      id
      url
      description
      createdAt
      postedBy {
        id
        name
      }
      votes {
        id
        user {
          id
        }
      }
    }
  }
`;

const NEW_VOTES_SUBSCRIPTION = gql`
  subscription {
    newVote {
      id
      link {
        id
        url
        description
        createdAt
        postedBy {
          id
          name
        }
        votes {
          id
          user {
            id
          }
        }
      }
      user {
        id
      }
    }
  }
`;

export const LinkList = (props) => {
  const updateCacheAfterVote = (store, createVote, linkId) => {
    const isNewPage = props.location.pathname.includes('new');
    const page = parseInt(props.match.params.page, 10);

    const skip = isNewPage ? (page - 1) * LINKS_PER_PAGE : 0;
    const first = isNewPage ? LINKS_PER_PAGE : 100;
    const orderBy = isNewPage ? 'createdAt_DESC' : null;
    const data = store.readQuery({
      query: FEED_QUERY,
      variables: { first, skip, orderBy },
    });

    const votedLink = data.feed.links.find((link) => link.id === linkId);
    votedLink.votes = createVote.link.votes;

    store.writeQuery({ query: FEED_QUERY, data });
  };

  const subscribeToNewLinks = (subscribeToMore) => {
    subscribeToMore({
      document: NEW_LINKS_SUBSCRIPTION,
      updateQuery: (prev, { subscriptionData }) => {
        if (!subscriptionData.data) return prev;
        const { newLink } = subscriptionData.data;
        const exists = prev.feed.links.find(({ id }) => id === newLink.id);
        if (exists) return prev;

        return {
          ...prev,
          feed: {
            links: [newLink, ...prev.feed.links],
            count: prev.feed.links.length + 1,
            __typename: prev.feed.__typename,
          },
        };
      },
    });
  };

  const subscribeToNewVotes = (subscribeToMore) => {
    subscribeToMore({
      document: NEW_VOTES_SUBSCRIPTION,
    });
  };

  const getQueryVariables = () => {
    const isNewPage = props.location.pathname.includes('new');
    const page = parseInt(props.match.params.page, 10);

    const skip = isNewPage ? (page - 1) * LINKS_PER_PAGE : 0;
    const first = isNewPage ? LINKS_PER_PAGE : 100;
    const orderBy = isNewPage ? 'createdAt_DESC' : null;
    return { first, skip, orderBy };
  };

  const getLinksToRender = (data) => {
    const isNewPage = props.location.pathname.includes('new');
    if (isNewPage) {
      return data.feed.links;
    }
    let rankedLinks = data.feed.links.slice();
    rankedLinks.sort((l1, l2) => l2.votes.length - l1.votes.length);
    rankedLinks = rankedLinks.slice(0, 10);
    return rankedLinks;
  };

  const nextPage = (data) => {
    const page = parseInt(props.match.params.page, 10);
    if (data.feed.count / LINKS_PER_PAGE > 1) {
      const nextPageVar = page + 1;
      props.history.push(`/new/${nextPageVar}`);
    }
  };

  const previousPage = () => {
    const page = parseInt(props.match.params.page, 10);
    if (page > 1) {
      const previousPageVar = page - 1;
      props.history.push(`/new/${previousPageVar}`);
    }
  };

  return (
    <Query query={FEED_QUERY} variables={getQueryVariables()}>
      {({
        loading, error, data, subscribeToMore,
      }) => {
        if (loading) return <div>Fetching</div>;
        if (error) return <div>Error</div>;

        subscribeToNewLinks(subscribeToMore);
        subscribeToNewVotes(subscribeToMore);

        const linksToRender = getLinksToRender(data);
        const isNewPage = props.location.pathname.includes('new');
        const pageIndex = props.match.params.page
          ? (props.match.params.page - 1) * LINKS_PER_PAGE
          : 0;

        return (
          <>
            {linksToRender.map((link, index) => (
              <SingleLink
                key={link.id}
                link={link}
                index={index + pageIndex}
                updateStoreAfterVote={updateCacheAfterVote}
              />
            ))}
            {isNewPage && (
            <div className="flex ml4 mv3 gray">
              <div className="pointer mr2" onClick={previousPage}>
                Previous
              </div>
              <div className="pointer" onClick={() => nextPage(data)}>
                Next
              </div>
            </div>
            )}
          </>
        );
      }}
    </Query>
  );
};

LinkList.propTypes = {
  location: propTypes.objectOf(propTypes.any),
  match: propTypes.objectOf(propTypes.any),
  history: propTypes.objectOf(propTypes.any),
};

LinkList.defaultProps = {
  location: null,
  match: null,
  history: null,
};
