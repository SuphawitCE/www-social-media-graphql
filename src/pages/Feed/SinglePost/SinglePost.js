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
    const SINGLE_POST_URL = `${URL_BASE}/feed/post`

    const httpOptions = {
      headers: {
        Authorization: `Bearer ${this.props.token}`,
      },
    }

    console.log({ 'single-post-url': SINGLE_POST_URL })
    fetch(`${SINGLE_POST_URL}/${postId}`, httpOptions)
      .then((res) => {
        if (res.status !== 200) {
          throw new Error('Failed to fetch status')
        }
        return res.json()
      })
      .then((resData) => {
        this.setState({
          title: resData.post.title,
          author: resData.post.creator.name,
          image: `${URL_BASE}/${resData.post.imageUrl}`,
          date: new Date(resData.post.createdAt).toLocaleDateString('en-US'),
          content: resData.post.content,
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
