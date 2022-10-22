const URL_BASE = 'http://localhost:8080'

module.exports = {
  URL_BASE,

  // Deprecated REST API ENDPOINT
  URL_GET_POSTS: `${URL_BASE}/feed/posts`,
  URL_CREATE_POST: `${URL_BASE}/feed/post`,
  URL_AUTH: `${URL_BASE}/auth`,
}
