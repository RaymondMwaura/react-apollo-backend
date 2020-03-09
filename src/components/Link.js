/* eslint-disable max-len */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import React from 'react';
import propTypes from 'prop-types';
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import { AUTH_TOKEN } from '../constants';
import timeDifferenceForDate from '../utils';

const VOTE_MUTATION = gql`
  mutation VoteMutation($linkId: ID!) {
    vote(linkId: $linkId) {
      id
      link {
       id
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

const SingleLink = (props) => {
  const authToken = localStorage.getItem(AUTH_TOKEN);
  const { link, index } = props;

  return (
    <div className="flex mt2 items-start">
      <div className="flex items-center">
        <span className="gray">
          {index + 1}
          .
        </span>
        {authToken && (
        <Mutation
          mutation={VOTE_MUTATION}
          variables={{ linkId: link.id }}
          update={(store, { data: { vote } }) => props.updateStoreAfterVote(store, vote, props.link.id)}
        >
          {(voteMutation) => (
            <div className="ml1 gray f11" onClick={voteMutation}>
              ▲
            </div>
          )}
        </Mutation>
        )}
      </div>
      <div className="ml1">
        <div>
          {link.description}
          {' '}
          (
          {link.url}
          )
        </div>
        <div className="f6 lh-copy gray">
          {link.votes.length}
          {' '}
          votes | by
          {' '}
          {link.postedBy
            ? link.postedBy.name
            : 'Unknown'}
          {' '}
          {timeDifferenceForDate(link.createdAt)}
        </div>
      </div>
    </div>
  );
};

SingleLink.propTypes = {
  link: propTypes.objectOf(propTypes.any),
  index: propTypes.number,
  updateStoreAfterVote: propTypes.func,
};

SingleLink.defaultProps = {
  link: null,
  index: null,
  updateStoreAfterVote: null,
};

export default SingleLink;
