import React, { Component, Fragment } from 'react'

import Post from '../../components/Feed/Post/Post'
import Button from '../../components/Button/Button'
import FeedEdit from '../../components/Feed/FeedEdit/FeedEdit'
import Input from '../../components/Form/Input/Input'
import Paginator from '../../components/Paginator/Paginator'
import Loader from '../../components/Loader/Loader'
import ErrorHandler from '../../components/ErrorHandler/ErrorHandler'
import {
  URL_GET_POSTS,
  URL_CREATE_POST,
  URL_BASE,
  URL_AUTH,
} from '../../util/api'
import './Feed.css'

class Feed extends Component {
  state = {
    isEditing: false,
    posts: [],
    totalPosts: 0,
    editPost: null,
    status: '',
    postPage: 1,
    postsLoading: true,
    editLoading: false,
  }

  componentDidMount() {
    const httpOptions = {
      headers: {
        Authorization: `Bearer ${this.props.token}`,
      },
    }

    fetch(`${URL_AUTH}/status`, httpOptions)
      .then((res) => {
        if (res.status !== 200) {
          throw new Error('Failed to fetch user status.')
        }
        return res.json()
      })
      .then((resData) => {
        console.log({ 'component-did-mount': resData })
        this.setState({ status: resData.status })
      })
      .catch(this.catchError)

    this.loadPosts()
  }

  loadPosts = (direction) => {
    if (direction) {
      this.setState({ postsLoading: true, posts: [] })
    }
    let page = this.state.postPage
    if (direction === 'next') {
      page++
      this.setState({ postPage: page })
    }
    if (direction === 'previous') {
      page--
      this.setState({ postPage: page })
    }

    const httpOptions = {
      headers: {
        Authorization: `Bearer ${this.props.token}`,
      },
    }

    fetch(`${URL_GET_POSTS}?page=${page}`, httpOptions)
      .then((res) => {
        if (res.status !== 200) {
          throw new Error('Failed to fetch posts.')
        }
        return res.json()
      })
      .then((resData) => {
        console.log({ 'load-post': resData })
        this.setState({
          posts: resData.posts.map((post) => ({
            ...post,
            imagePath: post.imageUrl,
          })),
          totalPosts: resData.totalItems,
          postsLoading: false,
        })
      })
      .catch(this.catchError)
  }

  statusUpdateHandler = (event) => {
    event.preventDefault()
    const httpOptions = {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${this.props.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: this.state.status }),
    }

    fetch(`${URL_AUTH}/status`, httpOptions)
      .then((res) => {
        if (res.status !== 200 && res.status !== 201) {
          throw new Error("Can't update status!")
        }
        return res.json()
      })
      .then((resData) => {
        console.log({ 'status-update': resData })
      })
      .catch(this.catchError)
  }

  newPostHandler = () => {
    this.setState({ isEditing: true })
  }

  startEditPostHandler = (postId) => {
    this.setState((prevState) => {
      const loadedPost = { ...prevState.posts.find((p) => p._id === postId) }

      return {
        isEditing: true,
        editPost: loadedPost,
      }
    })
  }

  cancelEditHandler = () => {
    this.setState({ isEditing: false, editPost: null })
  }

  finishEditHandler = (postData) => {
    this.setState({
      editLoading: true,
    })
    // Set up data (with image!)
    const formData = new FormData()
    formData.append('title', postData.title)
    formData.append('content', postData.content)
    formData.append('image', postData.image)

    // Query create post function
    let graphqlQuery = {
      query: `
        mutation {
          createPost(postInput: {title: "${postData.title}", content: "${postData.content}", imageUrl: "Some url"}) {
            _id
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
    }

    const httpOptions = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.props.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(graphqlQuery),
    }

    console.log({
      'finish-edit-handler': {
        URL_CREATE_POST,
        httpOptions,
      },
    })

    fetch(`${URL_BASE}/graphql`, httpOptions)
      .then((res) => {
        return res.json()
      })
      .then((resData) => {
        console.log('log: ', resData)
        if (resData.errors && resData.errors[0].status === 422) {
          throw new Error(
            "Validation failed. Make sure the email address isn't used yet!",
          )
        }

        if (resData.errors) {
          throw new Error('User create post failed')
        }

        const post = {
          _id: resData.post._id,
          title: resData.post.title,
          content: resData.post.content,
          creator: resData.post.creator,
          createdAt: resData.post.createdAt,
        }
        this.setState((prevState) => {
          return {
            isEditing: false,
            editPost: null,
            editLoading: false,
          }
        })
      })
      .catch((err) => {
        console.log(err)
        this.setState({
          isEditing: false,
          editPost: null,
          editLoading: false,
          error: err,
        })
      })
  }

  statusInputChangeHandler = (input, value) => {
    this.setState({ status: value })
  }

  deletePostHandler = (postId) => {
    this.setState({ postsLoading: true })

    const httpOptions = {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${this.props.token}`,
      },
    }

    const DELETE_POST_URL = `${URL_BASE}/feed/post/${postId}`

    fetch(DELETE_POST_URL, httpOptions)
      .then((res) => {
        if (res.status !== 200 && res.status !== 201) {
          throw new Error('Deleting a post failed!')
        }
        return res.json()
      })
      .then((resData) => {
        console.log('delete:', resData)
        this.loadPosts()
      })
      .catch((err) => {
        console.log(err)
        this.setState({ postsLoading: false })
      })
  }

  errorHandler = () => {
    this.setState({ error: null })
  }

  catchError = (error) => {
    this.setState({ error: error })
  }

  render() {
    return (
      <Fragment>
        <ErrorHandler error={this.state.error} onHandle={this.errorHandler} />
        <FeedEdit
          editing={this.state.isEditing}
          selectedPost={this.state.editPost}
          loading={this.state.editLoading}
          onCancelEdit={this.cancelEditHandler}
          onFinishEdit={this.finishEditHandler}
        />
        <section className="feed__status">
          <form onSubmit={this.statusUpdateHandler}>
            <Input
              type="text"
              placeholder="Your status"
              control="input"
              onChange={this.statusInputChangeHandler}
              value={this.state.status}
            />
            <Button mode="flat" type="submit">
              Update
            </Button>
          </form>
        </section>
        <section className="feed__control">
          <Button mode="raised" design="accent" onClick={this.newPostHandler}>
            New Post
          </Button>
        </section>
        <section className="feed">
          {this.state.postsLoading && (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <Loader />
            </div>
          )}
          {this.state.posts.length <= 0 && !this.state.postsLoading ? (
            <p style={{ textAlign: 'center' }}>No posts found.</p>
          ) : null}
          {!this.state.postsLoading && (
            <Paginator
              onPrevious={this.loadPosts.bind(this, 'previous')}
              onNext={this.loadPosts.bind(this, 'next')}
              lastPage={Math.ceil(this.state.totalPosts / 2)}
              currentPage={this.state.postPage}
            >
              {this.state.posts.map((post) => (
                <Post
                  key={post._id}
                  id={post._id}
                  author={post.creator.name}
                  date={new Date(post.createdAt).toLocaleDateString('en-US')}
                  title={post.title}
                  image={post.imageUrl}
                  content={post.content}
                  onStartEdit={this.startEditPostHandler.bind(this, post._id)}
                  onDelete={this.deletePostHandler.bind(this, post._id)}
                />
              ))}
            </Paginator>
          )}
        </section>
      </Fragment>
    )
  }
}

export default Feed
