export function groupCommunityPostsByCafe(cafes, posts) {
  const normalize = (value) => String(value || '').trim().toLocaleLowerCase()
  const postsByCafeId = new Map()

  cafes.forEach((cafe) => {
    const relatedPosts = posts.filter((post) => {
      if (post.cafe_id != null) {
        return String(post.cafe_id) === String(cafe.id)
      }

      const postCafeName = post.cafe?.name || post.cafe_name || post.title
      const postTownship = post.cafe?.township || post.township
      const matchesName = normalize(postCafeName) === normalize(cafe.name)
      const matchesTownship =
        !postTownship ||
        !cafe.township ||
        normalize(postTownship) === normalize(cafe.township)

      return matchesName && matchesTownship
    })

    postsByCafeId.set(cafe.id, relatedPosts)
  })

  return postsByCafeId
}
