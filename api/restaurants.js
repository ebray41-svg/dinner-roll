const CUISINE_TYPE_MAP = {
  Mexican: ['mexican_restaurant'],
  Italian: ['italian_restaurant'],
  Japanese: ['japanese_restaurant', 'sushi_restaurant', 'ramen_restaurant'],
  Chinese: ['chinese_restaurant'],
  Thai: ['thai_restaurant'],
  Indian: ['indian_restaurant'],
  Korean: ['korean_restaurant'],
  Vietnamese: ['vietnamese_restaurant'],
  Mediterranean: [
    'mediterranean_restaurant',
    'greek_restaurant',
    'middle_eastern_restaurant',
    'lebanese_restaurant',
    'turkish_restaurant',
  ],
  'Steak & Grill': ['steak_house', 'barbecue_restaurant'],
  American: [
    'american_restaurant',
    'hamburger_restaurant',
    'breakfast_restaurant',
    'brunch_restaurant',
    'fast_food_restaurant',
    'sandwich_shop',
    'diner',
  ],
  Pizza: ['pizza_restaurant'],
}

const TYPE_TO_CUISINE = Object.fromEntries(
  Object.entries(CUISINE_TYPE_MAP).flatMap(([cuisine, types]) =>
    types.map((type) => [type, cuisine])
  )
)

const PRICE_LEVEL_TO_ESTIMATE = {
  PRICE_LEVEL_FREE: 10,
  PRICE_LEVEL_INEXPENSIVE: 15,
  PRICE_LEVEL_MODERATE: 30,
  PRICE_LEVEL_EXPENSIVE: 55,
  PRICE_LEVEL_VERY_EXPENSIVE: 90,
}

const PRICE_LEVEL_TO_TIER = {
  PRICE_LEVEL_FREE: 'casual',
  PRICE_LEVEL_INEXPENSIVE: 'casual',
  PRICE_LEVEL_MODERATE: 'midrange',
  PRICE_LEVEL_EXPENSIVE: 'upscale',
  PRICE_LEVEL_VERY_EXPENSIVE: 'upscale',
}

const ALWAYS_EXCLUDED_TYPES = [
  'gas_station',
  'convenience_store',
  'grocery_store',
  'supermarket',
]

const EARTH_RADIUS_MILES = 3958.8

function milesBetween(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return EARTH_RADIUS_MILES * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function cuisineForTypes(types) {
  for (const type of types || []) {
    if (TYPE_TO_CUISINE[type]) return TYPE_TO_CUISINE[type]
  }
  return null
}

const REVIEW_SNIPPET_MAX_LENGTH = 140

function pickReviewSnippet(reviews) {
  if (!reviews || reviews.length === 0) return null

  const goodReviews = reviews.filter((review) => (review.rating ?? 0) >= 4)
  const source = goodReviews.length > 0 ? goodReviews : reviews

  const text = source[0]?.text?.text
  if (!text) return null

  return text.length > REVIEW_SNIPPET_MAX_LENGTH
    ? `${text.slice(0, REVIEW_SNIPPET_MAX_LENGTH).trim()}…`
    : text
}

function normalizePlace(place, userLat, userLng, forcedCuisine) {
  const cuisine = forcedCuisine ?? cuisineForTypes(place.types)
  if (!cuisine) return null

  const location = place.location || {}
  const distance =
    typeof location.latitude === 'number' && typeof location.longitude === 'number'
      ? Math.round(milesBetween(userLat, userLng, location.latitude, location.longitude) * 10) / 10
      : null

  const priceLevel = place.priceLevel
  const pricePerPerson = PRICE_LEVEL_TO_ESTIMATE[priceLevel] ?? 30
  const tier = PRICE_LEVEL_TO_TIER[priceLevel] ?? 'midrange'

  return {
    name: place.displayName?.text ?? 'Unknown',
    cuisine,
    pricePerPerson,
    tier,
    distance,
    address: place.formattedAddress ?? null,
    rating: place.rating ?? null,
    ratingCount: place.userRatingCount ?? null,
    openNow: place.currentOpeningHours?.openNow ?? null,
    websiteUri: place.websiteUri ?? null,
    mapsUri: place.googleMapsUri ?? null,
    lat: typeof location.latitude === 'number' ? location.latitude : null,
    lng: typeof location.longitude === 'number' ? location.longitude : null,
    reviewSnippet: pickReviewSnippet(place.reviews),
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'Server missing GOOGLE_PLACES_API_KEY' })
    return
  }

  const lat = parseFloat(req.query.lat)
  const lng = parseFloat(req.query.lng)
  const radiusMiles = parseFloat(req.query.radiusMiles) || 5

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    res.status(400).json({ error: 'lat and lng query params are required' })
    return
  }

  const radiusMeters = Math.min(Math.max(radiusMiles * 1609.34, 1), 50000)

  const requestedCuisine = typeof req.query.cuisine === 'string' ? req.query.cuisine : null
  let includedTypes =
    requestedCuisine && CUISINE_TYPE_MAP[requestedCuisine]
      ? CUISINE_TYPE_MAP[requestedCuisine]
      : ['restaurant']

  const excludeFastFood = req.query.excludeFastFood === 'true'
  const excludedTypes = excludeFastFood
    ? [...ALWAYS_EXCLUDED_TYPES, 'fast_food_restaurant']
    : ALWAYS_EXCLUDED_TYPES

  if (excludeFastFood) {
    // Google rejects a type appearing in both included and excluded lists,
    // and American's includedTypes carries fast_food_restaurant.
    includedTypes = includedTypes.filter((type) => type !== 'fast_food_restaurant')
  }

  try {
    const placesResponse = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': [
          'places.displayName',
          'places.formattedAddress',
          'places.location',
          'places.priceLevel',
          'places.rating',
          'places.userRatingCount',
          'places.types',
          'places.websiteUri',
          'places.googleMapsUri',
          'places.currentOpeningHours.openNow',
          'places.reviews',
        ].join(','),
      },
      body: JSON.stringify({
        includedTypes,
        excludedTypes,
        maxResultCount: 20,
        locationRestriction: {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius: radiusMeters,
          },
        },
      }),
    })

    if (!placesResponse.ok) {
      const errorBody = await placesResponse.text()
      res.status(502).json({ error: 'Places API request failed', detail: errorBody })
      return
    }

    const data = await placesResponse.json()
    const forcedCuisine = requestedCuisine && CUISINE_TYPE_MAP[requestedCuisine] ? requestedCuisine : null
    const restaurants = (data.places || [])
      .map((place) => normalizePlace(place, lat, lng, forcedCuisine))
      .filter(Boolean)

    res.status(200).json({ restaurants })
  } catch (err) {
    res.status(502).json({ error: 'Places API request failed', detail: err.message })
  }
}
