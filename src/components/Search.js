import React, { Component } from 'react';
import { withApollo } from 'react-apollo';
import gql from 'graphql-tag';
import propTypes from 'prop-types';
import SingleLink from './Link';

const FEED_SEARCH_QUERY = gql`
  query FeedSearchQuery($filter: String!) {
    feed(filter: $filter) {
      links {
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
  }
`;

class Search extends Component {
  constructor(props) {
    super(props);
    this.state = {
      links: [],
      filter: '',
    };
  }

  async executeSearch() {
    const { filter } = this.state;
    const { props } = this;
    const result = await props.client.query({
      query: FEED_SEARCH_QUERY,
      variables: { filter },
    });
    const { links } = result.data.feed;
    this.setState({ links });
  }

  render() {
    const { state } = this;
    return (
      <div>
        <div>
          Search
          <input
            type="text"
            onChange={(e) => this.setState({ filter: e.target.value })}
          />
          <button type="button" onClick={() => this.executeSearch()}>OK</button>
        </div>
        {state.links.map((link, index) => (
          <SingleLink key={link.id} link={link} index={index} />
        ))}
      </div>
    );
  }
}

Search.propTypes = {
  client: propTypes.objectOf(propTypes.any),
};

Search.defaultProps = {
  client: null,
};

export default withApollo(Search);
