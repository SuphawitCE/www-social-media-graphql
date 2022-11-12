import React, { Component } from 'react'

import Image from '../../../components/Image/Image'
import { URL_BASE } from '../../../util/api'
import './SinglePost.css'

class SinglePost extends Component {
  state = {
    title: '',
    author: '',
    date: '',
    image: '',
    content: '',
  }

  componentDidMount() {
    const postId = this.props.match.params.postId

    const graphqlQuery = {
      query: `
        query FetchSinglePost($postId: ID!) {
          getPostById(id: $postId) {
            title
            content
            imageUrl
            creator {
              name
            }
            createdAt
          }
        }
      `,
      variables: {
        postId,
      },
    }

    const httpOptions = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.props.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(graphqlQuery),
    }

    fetch(`${URL_BASE}/graphql`, httpOptions)
      .then((res) => {
        return res.json()
      })
      .then((resData) => {
        console.log('single-post: ', resData)
        if (resData.errors) {
          throw new Error('Failed to single post')
        }

        this.setState({
          title: resData.data.getPostById.title,
          author: resData.data.getPostById.creator.name,
          image: `${URL_BASE}/${resData.data.getPostById.imageUrl}`,
          date: new Date(resData.data.getPostById.createdAt).toLocaleDateString(
            'en-US',
          ),
          content: resData.data.getPostById.content,
        })
      })
      .catch((err) => {
        console.log(err)
      })
  }

  render() {
    return (
      <section className="single-post">
        <h1>{this.state.title}</h1>
        <h2>
          Created by {this.state.author} on {this.state.date}
        </h2>
        <div className="single-post__image">
          <Image contain imageUrl={this.state.image} />
        </div>
        <p>{this.state.content}</p>
      </section>
    )
  }
}

export default SinglePost
