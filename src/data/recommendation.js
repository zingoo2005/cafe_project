
export function recommendCafes(
  cafes,
  { purpose = 'All', township = 'All', facilities = [] } = {},
) {
  return cafes
    .map((cafe) => {
      let score = 0

      if (
        purpose !== 'All' &&
        (cafe.purposes || []).includes(purpose)
      ) {
        score += 5
      }

      if (township !== 'All' && cafe.area === township) {
        score += 3
      }

      for (const facility of facilities) {
        if ((cafe.facilities || []).includes(facility)) {
          score += 2
        }
      }

      return { ...cafe, recommendationScore: score }
    })
    .sort(
      (a, b) =>
        b.recommendationScore - a.recommendationScore ||
        (b.rating || 0) - (a.rating || 0),
    )
}
