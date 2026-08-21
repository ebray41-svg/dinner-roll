import './style.css'
import { restaurants } from './restaurants.js'


const earthTexture = new Image()
earthTexture.src = '/earth-texture.jpg'

const cuisines = [
  'Mexican',
  'Italian',
  'Japanese',
  'Chinese',
  'Thai',
  'Indian',
  'Korean',
  'Vietnamese',
  'Mediterranean',
  'Steak & Grill',
  'American',
  'Pizza',
]


let selectedBudget = 25
let selectedDistance = 5
let partySize = 2
let selectedCuisine = null
let userLatitude = null
let userLongitude = null
let includeFastFood = false



function getFavoriteRestaurants() {
  const stored = JSON.parse(localStorage.getItem('favoriteRestaurants') || '[]')

  // Older versions stored just the name as a string; keep those readable.
  return stored.map((entry) =>
    typeof entry === 'string' ? { name: entry } : entry
  )
}

function saveFavoriteRestaurants(favorites) {
  localStorage.setItem(
    'favoriteRestaurants',
    JSON.stringify(favorites)
  )
}

function isFavoriteRestaurant(name) {
  return getFavoriteRestaurants().some(
    (restaurant) => restaurant.name === name
  )
}

function toggleFavoriteRestaurant(restaurant) {
  const favorites = getFavoriteRestaurants()

  if (favorites.some((favorite) => favorite.name === restaurant.name)) {
    saveFavoriteRestaurants(
      favorites.filter((favorite) => favorite.name !== restaurant.name)
    )

    return false
  }

  favorites.push(restaurant)
  saveFavoriteRestaurants(favorites)

  return true
}

function getRecentRestaurants() {
  return JSON.parse(localStorage.getItem('recentRestaurants') || '[]')
}

function saveRecentRestaurant(name) {
  const recentRestaurants = getRecentRestaurants()

  const updatedHistory = [
    name,
    ...recentRestaurants.filter(
      (restaurantName) => restaurantName !== name
    ),
  ].slice(0, 5)

  localStorage.setItem(
    'recentRestaurants',
    JSON.stringify(updatedHistory)
  )
}

function getUserLocation() {
  if (!navigator.geolocation) {
    console.log('Geolocation is not supported by this browser.')
    return
  }

  navigator.geolocation.getCurrentPosition(
    position => {
      userLatitude = position.coords.latitude
      userLongitude = position.coords.longitude

      console.log('Latitude:', userLatitude)
      console.log('Longitude:', userLongitude)

      renderHome()
    },

    error => {
      console.log('Location error:', error.message)
    },

    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000,
    }
  )
}

async function fetchLiveRestaurants(cuisine) {
  if (userLatitude === null || userLongitude === null) {
    console.log('[live-restaurants] no location yet, using static list')
    return null
  }

  const url = `/api/restaurants?lat=${userLatitude}&lng=${userLongitude}&radiusMiles=${selectedDistance}&cuisine=${encodeURIComponent(cuisine)}&excludeFastFood=${!includeFastFood}`

  try {
    const response = await fetch(url)

    if (!response.ok) {
      const body = await response.text()
      console.log(`[live-restaurants] API returned ${response.status}:`, body)
      return null
    }

    const data = await response.json()

    console.log(`[live-restaurants] got ${data.restaurants?.length ?? 0} results for ${cuisine} at`, url)

    return data.restaurants && data.restaurants.length > 0
      ? data.restaurants
      : null
  } catch (error) {
    console.log('[live-restaurants] fetch threw, falling back to static list:', error.message)
    return null
  }
}

function renderHome() {
  document.querySelector('#app').innerHTML = `
    <main class="app-shell">
      <section class="card">
        <div class="logo"></div>

        <h1>Dinner Roll</h1>
        <p class="subtitle">You've got a reservation with fate...</p>

        <div class="section">
          <h2>Budget</h2>
          <div class="button-grid" id="budget-options">
            ${[25, 50, 75, 100, 150, 200]
              .map(
                (amount) => `
                  <button
                    class="choice ${selectedBudget === amount ? 'selected' : ''}"
                    data-value="${amount}"
                  >
                    $${amount}
                  </button>
                `
              )
              .join('')}
          </div>
        </div>

        <div class="section">
          <h2>Distance</h2>
          <div class="button-grid distance-grid" id="distance-options">
            ${[1, 3, 5, 10, 15]
              .map(
                (distance) => `
                  <button
                    class="choice ${selectedDistance === distance ? 'selected' : ''}"
                    data-value="${distance}"
                  >
                    ${distance} mi
                  </button>
                `
              )
              .join('')}
          </div>
        </div>

        <div class="section party-and-toggle-row">
          <div class="party-size-block">
            <h2>Party Size</h2>

            <div class="party-control">
              <button id="minus">−</button>
              <span id="party-size">${partySize}</span>
              <button id="plus">+</button>
            </div>
          </div>

          <div class="fast-food-block">
            <h2>Fast Food</h2>

            <label class="switch">
              <input type="checkbox" id="fast-food-toggle" ${includeFastFood ? 'checked' : ''}>
              <span class="switch-track"><span class="switch-thumb"></span></span>
            </label>
          </div>
        </div>

        <button id="lets-eat" class="primary-button">
          Bon Appetit
        </button>

        <button id="view-favorites" class="secondary-button">
          ♥ Favorites
        </button>
      </section>
    </main>
  `

  document
    .querySelector('#budget-options')
    .addEventListener('click', (event) => {
      if (!event.target.matches('.choice')) return

      selectedBudget = Number(event.target.dataset.value)
      renderHome()
    })

  document
    .querySelector('#distance-options')
    .addEventListener('click', (event) => {
      if (!event.target.matches('.choice')) return

      selectedDistance = Number(event.target.dataset.value)
      renderHome()
    })

  document.querySelector('#minus').addEventListener('click', () => {
    if (partySize > 1) {
      partySize--
      renderHome()
    }
  })

  document.querySelector('#plus').addEventListener('click', () => {
    if (partySize < 20) {
      partySize++
      renderHome()
    }
  })

  document.querySelector('#fast-food-toggle').addEventListener('change', (event) => {
    includeFastFood = event.target.checked
    renderHome()
  })

  document.querySelector('#lets-eat').addEventListener('click', () => {
    renderCuisineScreen()
  })

  document.querySelector('#view-favorites').addEventListener('click', () => {
    renderFavoritesScreen()
  })
}

function renderCuisineScreen() {
  document.querySelector('#app').innerHTML = `
    <main class="app-shell">
      <section class="card">
        <div class="logo"></div>

        <h1 class="globe-title">The Internet Always Knows</h1>
        <p class="subtitle">Let's see what's cookin'...</p>

        <div class="summary-box">
          <span>Budget: $${selectedBudget}</span>
          <span>Distance: ${selectedDistance} mi</span>
          <span>Party: ${partySize}</span>
        </div>

        
        <div class="cycle-stage">
          <div class="cycle-circle" id="cuisine-cycle">
            <div class="cycle-label">Cuisine</div>
          </div>
        </div>

        <div class="cuisine-picker-row">
          <select id="cuisine-picker" class="cuisine-picker">
            <option value="">If you know what you want</option>
            ${cuisines
              .map((cuisine) => `<option value="${cuisine}">${cuisine}</option>`)
              .join('')}
          </select>
        </div>

        <button id="find-restaurant" class="primary-button hidden">
          Now Find a Good Place
        </button>

        <button id="back-home" class="secondary-button">
          ← Back
        </button>
      </section>
    </main>
  `

  


  document.querySelector('#back-home').addEventListener('click', () => {
    renderHome()
  })

  document.querySelector('#cuisine-cycle').addEventListener('click', () => {
    spinCuisine()
  })

  document.querySelector('#cuisine-picker').addEventListener('change', (event) => {
    const cuisine = event.target.value
    if (!cuisine) return

    const cycleCircle = document.querySelector('#cuisine-cycle')

    if (cycleCircle.classList.contains('spinning')) return

    selectedCuisine = cuisine
    cycleCircle.textContent = cuisine

    document.querySelector('#find-restaurant').classList.remove('hidden')
  })

  document.querySelector('#find-restaurant').addEventListener('click', () => {
    renderRestaurantScreen()
  })
}



function spinCuisine() {
  const cycleCircle = document.querySelector('#cuisine-cycle')
  const findRestaurantButton = document.querySelector('#find-restaurant')

  if (cycleCircle.classList.contains('spinning')) {
    return
  }

  cycleCircle.classList.add('spinning')

  
  findRestaurantButton.classList.add('hidden')

  const availableCuisines = cuisines.filter(
    (cuisine) => cuisine !== selectedCuisine
  )

  const winner =
    availableCuisines[Math.floor(Math.random() * availableCuisines.length)]

  selectedCuisine = winner

  let index = 0
  let delay = 55
  let cycles = 0

  function showNextCuisine() {
    cycleCircle.textContent = cuisines[index]

    index = (index + 1) % cuisines.length
    cycles += 1

    if (cycles < 40) {
      setTimeout(showNextCuisine, delay)
      return
    }

    delay *= 1.16

    if (delay < 420) {
      setTimeout(showNextCuisine, delay)
      return
    }

    cycleCircle.textContent = winner

    setTimeout(() => {
      
      findRestaurantButton.classList.remove('hidden')

      cycleCircle.classList.remove('spinning')
    }, 350)
  }

  showNextCuisine()
}


const loadingMessages = [
  '...getting hungry?',
  'Scouting the neighborhood...',
  'How about a stick of gum and a hotpocket...',
  'Asking around for good spots...',
  'Rolling the dice on dinner...',
  'We used to hunt and gather...now we do this',
  'Checking the hours at the VFW...',
  'Checking who’s still open...',
  'Consulting the food gods...',
  'Never drive hangry...',
  'Looking up local gas stations that serve taquitos...',
]

async function renderRestaurantScreen() {
  const loadingMessage =
    loadingMessages[Math.floor(Math.random() * loadingMessages.length)]

  const loadingOverlay = document.createElement('div')
  loadingOverlay.className = 'loading-overlay'
  loadingOverlay.innerHTML = `<div class="loading-modal">${loadingMessage}</div>`
  document.body.appendChild(loadingOverlay)

  const minLoadingTime = new Promise((resolve) => setTimeout(resolve, 2000))

  const [liveRestaurants] = await Promise.all([
    fetchLiveRestaurants(selectedCuisine),
    minLoadingTime,
  ])
  const restaurantSource = liveRestaurants ?? restaurants

  loadingOverlay.remove()

  const budgetPerPerson = selectedBudget / partySize

function getRestaurantTier(restaurant) {
  if (restaurant.tier) {
    return restaurant.tier
  }

  if (restaurant.pricePerPerson <= 20) {
    return 'casual'
  }

  if (restaurant.pricePerPerson <= 40) {
    return 'midrange'
  }

  return 'upscale'
}

function getTargetTier() {
  if (budgetPerPerson <= 25) {
    return 'casual'
  }

  if (budgetPerPerson <= 60) {
    return 'midrange'
  }

  return 'upscale'
}

const targetTier = getTargetTier()

const restaurantPool = restaurantSource.filter((restaurant) => {
  return (
    restaurant.cuisine === selectedCuisine &&
    restaurant.pricePerPerson <= budgetPerPerson &&
    restaurant.distance <= selectedDistance
  )
})

const displayRestaurantPool = restaurantSource.filter(
  restaurant =>
    restaurant.cuisine === selectedCuisine
)

  const recentRestaurants = getRecentRestaurants()

  const freshRestaurantPool = restaurantPool.filter((restaurant) => {
    return !recentRestaurants.includes(restaurant.name)
  })

  const finalRestaurantPool =
    freshRestaurantPool.length > 0
      ? freshRestaurantPool
      : restaurantPool

  let currentRestaurantPool = [...finalRestaurantPool]

  let restaurantContent = ''

  if (finalRestaurantPool.length === 0) {
    restaurantContent = `
      <div class="result-box">
        <h2>No dice, buddy</h2>
        <p>
          Nothing fits your current budget and distance except a couple vending machines. 
          Change those and try again.
        </p>
      </div>
    `
  } else {

restaurantContent = `
  <div class="cycle-stage">
    <div class="cycle-circle restaurant-cycle" id="restaurant-cycle">
      <div class="cycle-label">Restaurant</div>
    </div>
  </div>

  <div class="cycle-result hidden" id="restaurant-result"></div>

  

  <div id="restaurant-result"></div>
`
  }

  document.querySelector('#app').innerHTML = `
    <main class="app-shell">
      <section class="card">
        <div class="logo"></div>

        <h1 class="winner-title">
          <span>Winner Winner</span>
          <span>Chicken Dinner</span>
        </h1>

        ${restaurantContent}

        <button id="start-over" class="secondary-button">
          ← Start Over
        </button>
      </section>
    </main>
  `

  if (finalRestaurantPool.length > 0) {
    document.querySelector('#restaurant-cycle').addEventListener('click', () => {
      spinRestaurant(
        currentRestaurantPool,
        displayRestaurantPool
      )
    })

    spinRestaurant(
      currentRestaurantPool,
      displayRestaurantPool
    )
  }


  document.querySelector('#start-over').addEventListener('click', () => {
    renderHome()
  })
}

function buildRestaurantCardHtml(restaurant) {
  const summaryParts = []

  if (restaurant.rating != null) {
    summaryParts.push(`${restaurant.rating.toFixed(1)} ★ (${restaurant.ratingCount ?? 0})`)
  }

  if (restaurant.distance != null) {
    summaryParts.push(`${restaurant.distance} mi`)
  }

  if (restaurant.openNow === true) {
    summaryParts.push('Open now')
  } else if (restaurant.openNow === false) {
    summaryParts.push('Closed')
  }

  const summaryText = summaryParts.join(' · ')

  const directionsUrl =
    restaurant.lat != null && restaurant.lng != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${restaurant.lat},${restaurant.lng}`
      : restaurant.mapsUri ?? null

  const menuUrl = restaurant.websiteUri ?? null

  const detailsParts = []
  if (restaurant.cuisine) detailsParts.push(restaurant.cuisine)
  if (restaurant.pricePerPerson != null) detailsParts.push(`About $${restaurant.pricePerPerson} per person`)

  return `
    <div class="restaurant-info-card" data-restaurant-name="${restaurant.name}">

      <div class="restaurant-title-row">
        <div class="restaurant-name">
          ${restaurant.name}
        </div>

        <button
          class="favorite-heart ${isFavoriteRestaurant(restaurant.name) ? 'is-favorite' : ''}"
          data-favorite-toggle
          aria-label="Favorite ${restaurant.name}"
        >
          ${isFavoriteRestaurant(restaurant.name) ? '♥' : '♡'}
        </button>
      </div>

      ${detailsParts.length > 0 ? `<div class="restaurant-details">${detailsParts.join(' · ')}</div>` : ''}

      ${
        summaryText || restaurant.reviewSnippet
          ? `
        <div class="restaurant-future-details">
          ${summaryText ? `<div class="restaurant-summary">${summaryText}</div>` : ''}

          ${restaurant.reviewSnippet ? `<p class="restaurant-review">“${restaurant.reviewSnippet}”</p>` : ''}
        </div>
      `
          : ''
      }

      <div class="restaurant-actions">
        ${
          directionsUrl
            ? `<a class="restaurant-action-button" href="${directionsUrl}" target="_blank" rel="noopener noreferrer">Directions</a>`
            : `<button class="restaurant-action-button" disabled>Directions</button>`
        }

        ${
          menuUrl
            ? `<a class="restaurant-action-button" href="${menuUrl}" target="_blank" rel="noopener noreferrer">Menu</a>`
            : `<button class="restaurant-action-button" disabled>Menu</button>`
        }
      </div>

    </div>
  `
}

function renderFavoritesScreen() {
  const favorites = getFavoriteRestaurants()

  const favoritesContent =
    favorites.length === 0
      ? `
        <div class="result-box">
          <h2>No favorites yet</h2>
          <p>Heart a restaurant after a spin and it'll show up here.</p>
        </div>
      `
      : favorites.map((restaurant) => buildRestaurantCardHtml(restaurant)).join('')

  document.querySelector('#app').innerHTML = `
    <main class="app-shell">
      <section class="card">
        <div class="logo"></div>

        <h1 class="winner-title">
          <span>Your</span>
          <span>Favorites</span>
        </h1>

        <div class="favorites-list">${favoritesContent}</div>

        <button id="back-home" class="secondary-button">
          ← Back
        </button>
      </section>
    </main>
  `

  document.querySelector('#back-home').addEventListener('click', () => {
    renderHome()
  })

  document.querySelector('.favorites-list').addEventListener('click', (event) => {
    const toggleButton = event.target.closest('[data-favorite-toggle]')
    if (!toggleButton) return

    const card = toggleButton.closest('.restaurant-info-card')
    const name = card.dataset.restaurantName
    const restaurant = favorites.find((favorite) => favorite.name === name)
    if (!restaurant) return

    toggleFavoriteRestaurant(restaurant)
    renderFavoritesScreen()
  })
}

function spinRestaurant(
  restaurantPool,
  displayRestaurantPool
) {
  const cycleCircle = document.querySelector('#restaurant-cycle')
  const restaurantResult = document.querySelector('#restaurant-result')

  if (
    !cycleCircle ||
    cycleCircle.classList.contains('spinning') ||
    restaurantPool.length === 0
  ) {
    return
  }

  cycleCircle.classList.add('spinning')
  restaurantResult.classList.add('hidden')

  const budgetPerPerson =
    selectedBudget / partySize

  function tierFor(restaurant) {
    if (restaurant.tier) {
      return restaurant.tier
    }

    if (restaurant.pricePerPerson <= 20) {
      return 'casual'
    }

    if (restaurant.pricePerPerson <= 40) {
      return 'midrange'
    }

    return 'upscale'
  }

  let targetTier = 'casual'

  if (budgetPerPerson > 25 && budgetPerPerson <= 60) {
    targetTier = 'midrange'
  }

  if (budgetPerPerson > 60) {
    targetTier = 'upscale'
  }

  const weightedRestaurants =
    restaurantPool.map((restaurant) => {
      const restaurantTier = tierFor(restaurant)

      let tierWeight = 1

      if (restaurantTier === targetTier) {
        tierWeight = 5
      } else if (
        targetTier === 'upscale' &&
        restaurantTier === 'midrange'
      ) {
        tierWeight = 3
      } else if (
        targetTier === 'midrange' &&
        restaurantTier === 'casual'
      ) {
        tierWeight = 2
      }

      const budgetRatio =
        restaurant.pricePerPerson / budgetPerPerson

      const budgetWeight =
        1 + Math.min(budgetRatio, 1) * 3

      return {
        restaurant,
        weight: tierWeight * budgetWeight,
      }
    })

  const totalWeight =
    weightedRestaurants.reduce(
      (sum, item) => sum + item.weight,
      0
    )

  let randomValue =
    Math.random() * totalWeight

  let winner =
    weightedRestaurants[0].restaurant

  for (const item of weightedRestaurants) {
    randomValue -= item.weight

    if (randomValue <= 0) {
      winner = item.restaurant
      break
    }
  }

  let index = 0
  let delay = 55
  let cycles = 0

  function showNextRestaurant() {
    cycleCircle.textContent =
      displayRestaurantPool[index].name

    index =
      (index + 1) % displayRestaurantPool.length

    cycles += 1

    if (cycles < 40) {
      setTimeout(showNextRestaurant, delay)
      return
    }

    delay *= 1.16

    if (delay < 420) {
      setTimeout(showNextRestaurant, delay)
      return
    }

    cycleCircle.textContent = winner.name

    saveRecentRestaurant(winner.name)

    const winnerPosition =
      restaurantPool.findIndex(
        restaurant =>
          restaurant.name === winner.name
      )

    if (winnerPosition !== -1) {
      restaurantPool.splice(
        winnerPosition,
        1
      )
    }

    setTimeout(() => {
      restaurantResult.innerHTML = buildRestaurantCardHtml(winner)

      restaurantResult.classList.remove('hidden')

      const favoriteButton =
        restaurantResult.querySelector(
          '[data-favorite-toggle]'
        )

      if (favoriteButton) {
        favoriteButton.addEventListener(
          'click',
          () => {
            toggleFavoriteRestaurant(
              winner
            )

            const isFavorite =
              isFavoriteRestaurant(winner.name)

            favoriteButton.textContent =
              isFavorite ? '♥' : '♡'

            favoriteButton.classList.toggle(
              'is-favorite',
              isFavorite
            )
          }
        )
      }

      cycleCircle.classList.remove(
        'spinning'
      )

      if (restaurantPool.length === 0) {
        cycleCircle.classList.add('disabled')
      }
    }, 350)
  }

  showNextRestaurant()
}

renderHome()
getUserLocation ()

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
  })
}