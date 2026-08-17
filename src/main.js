import './style.css'
import { restaurants } from './restaurants.js'
import Globe from 'globe.gl'

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
const cuisineTargets = {
  Mexican: { lat: 23.6, lng: -102.5 },
  Italian: { lat: 41.9, lng: 12.6 },
  Japanese: { lat: 36.2, lng: 138.3 },
  Chinese: { lat: 35.9, lng: 104.2 },
  Thai: { lat: 15.9, lng: 100.9 },
  Indian: { lat: 20.6, lng: 78.9 },
  Korean: { lat: 36.5, lng: 127.9 },
  Vietnamese: { lat: 14.1, lng: 108.3 },
  Mediterranean: { lat: 38.5, lng: 23.5 },
  "Steak & Grill": { lat: 39.8, lng: -98.6 },
  American: { lat: 39.8, lng: -98.6 },
  Pizza: { lat: 41.9, lng: 12.6 },
}

let selectedBudget = 25
let selectedDistance = 5
let partySize = 2
let selectedCuisine = null
let cuisineWheelRotation = 0
let restaurantWheelRotation = 0

let activeGlobe = null
let globeIsSpinning = false

function getFavoriteRestaurants() {
  return JSON.parse(localStorage.getItem('favoriteRestaurants') || '[]')
}

function saveFavoriteRestaurants(favorites) {
  localStorage.setItem(
    'favoriteRestaurants',
    JSON.stringify(favorites)
  )
}

function isFavoriteRestaurant(name) {
  return getFavoriteRestaurants().includes(name)
}

function toggleFavoriteRestaurant(name) {
  const favorites = getFavoriteRestaurants()

  if (favorites.includes(name)) {
    saveFavoriteRestaurants(
      favorites.filter((restaurantName) => restaurantName !== name)
    )

    return false
  }

  favorites.push(name)
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

function renderHome() {
  document.querySelector('#app').innerHTML = `
    <main class="app-shell">
      <section class="card">
        <div class="logo">🍽️</div>

        <h1>Dinner Roll</h1>
        <p class="subtitle">What are we eating tonight?</p>

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

        <div class="section">
          <h2>Party Size</h2>

          <div class="party-control">
            <button id="minus">−</button>
            <span id="party-size">${partySize}</span>
            <button id="plus">+</button>
          </div>
        </div>

        <button id="lets-eat" class="primary-button">
          🎲 Let's Eat!
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

  document.querySelector('#lets-eat').addEventListener('click', () => {
    renderCuisineScreen()
  })
}

function renderCuisineScreen() {
  document.querySelector('#app').innerHTML = `
    <main class="app-shell">
      <section class="card">
        <div class="logo"></div>

        <h1 class="globe-title">Spin Around the World</h1>
        <p class="subtitle">Let's see what it decides...</p>

        <div class="summary-box">
          <span>Budget: $${selectedBudget}</span>
          <span>Distance: ${selectedDistance} mi</span>
          <span>Party: ${partySize}</span>
        </div>

        
        <div class="globe-stage">
          <div
            class="real-globe-container clickable-globe"
            id="globe"
          ></div>
        </div>

        <div
          class="globe-result hidden"
          id="cuisine-result"
        ></div>


        <button id="find-restaurant" class="primary-button hidden">
          Now Find a Good Place
        </button>

        <button id="back-home" class="secondary-button">
          ← Back
        </button>
      </section>
    </main>
  `

  const globeElement = document.querySelector('#globe')

  activeGlobe = Globe()(globeElement)
    .width(380)
    .height(380)
    .backgroundColor('rgba(0,0,0,0)')
    .globeImageUrl('/earth-texture.jpg')
    .showAtmosphere(true)
    .atmosphereColor('#d0a85f')
    .atmosphereAltitude(0.12)

  activeGlobe.pointOfView(
    {
      lat: 20,
      lng: 0,
      altitude: 2.1,
    },
    0
  )

  const controls = activeGlobe.controls()

  controls.enableZoom = false
  controls.enablePan = false
  controls.autoRotate = false


  document.querySelector('#back-home').addEventListener('click', () => {
    renderHome()
  })

  globeElement.addEventListener('click', () => {
    spinCuisine()
  })

  document.querySelector('#find-restaurant').addEventListener('click', () => {
    renderRestaurantScreen()
  })
}

function spinCuisine() {
  if (!activeGlobe || globeIsSpinning) {
    return
  }

  globeIsSpinning = true

  activeGlobe.htmlElementsData([])

  const cuisineResult =
    document.querySelector('#cuisine-result')

  const findRestaurantButton =
    document.querySelector('#find-restaurant')

  cuisineResult.classList.add('hidden')
  findRestaurantButton.classList.add('hidden')

  const winner =
    cuisines[Math.floor(Math.random() * cuisines.length)]

  selectedCuisine = winner

  const target = cuisineTargets[winner]

  const startingView = activeGlobe.pointOfView()

  const startLng = startingView.lng
  const startLat = startingView.lat

  let finalLng = target.lng

  // Force the globe to keep traveling in the same direction
  // instead of taking Globe.GL's shortest route.
  while (finalLng >= startLng) {
    finalLng -= 360
  }

  // Add three more complete revolutions.
  finalLng -= 1400

  const totalDuration = 5400
  const startTime = performance.now()

  const controls = activeGlobe.controls()
  controls.enabled = false

  function animateSpin(currentTime) {
    const elapsed = currentTime - startTime

    const progress = Math.min(
      elapsed / totalDuration,
      1
    )

    // Starts fast and slows down gradually.
    const easedProgress =
      1 - Math.pow(1 - progress, 3.4)

    const rawLng =
      startLng +
      (finalLng - startLng) * easedProgress

    const currentLng =
      ((rawLng + 180) % 360 + 360) % 360 - 180

    let currentLat = startLat

    // Keep the globe fairly level for most of the spin.
    // Only move toward the winning location near the end.
    if (progress > 0.76) {
      const latitudeProgress =
        (progress - 0.76) / 0.24

      const easedLatitude =
        1 - Math.pow(1 - latitudeProgress, 3)

      currentLat =
        startLat +
        (target.lat - startLat) * easedLatitude
    }

    activeGlobe.pointOfView(
      {
        lat: currentLat,
        lng: currentLng,
        altitude: 2.1,
      },
      0
    )

    if (progress < 1) {
      requestAnimationFrame(animateSpin)
      return
    }

    activeGlobe.pointOfView(
      {
        lat: target.lat,
        lng: target.lng,
        altitude: 2.1,
      },
      0
    )

    
    dropCuisinePin(
      target,
      winner,
      cuisineResult,
      findRestaurantButton,
      controls
    )
  }

  requestAnimationFrame(animateSpin)
}

function dropCuisinePin(
  target,
  winner,
  cuisineResult,
  findRestaurantButton,
  controls
) {
  const pinData = {
    lat: target.lat,
    lng: target.lng,
  }

  activeGlobe
    .htmlElementsData([pinData])
    .htmlLat(d => d.lat)
    .htmlLng(d => d.lng)
    .htmlAltitude(0.015)
    .htmlElement(() => {
      const anchor = document.createElement('div')
      anchor.className = 'pin-anchor'

      const pin = document.createElement('div')
      pin.className = 'globe-pin'

      anchor.appendChild(pin)

      setTimeout(() => {
        pin.classList.add('drop')
      }, 100)

      return anchor
    })

  setTimeout(() => {
    cuisineResult.textContent = winner
    cuisineResult.classList.remove('hidden')

    findRestaurantButton.classList.remove('hidden')

    controls.enabled = true
    globeIsSpinning = false
  }, 1200)
}

function renderRestaurantScreen() {
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

const restaurantPool = restaurants.filter((restaurant) => {
  return (
    restaurant.cuisine === selectedCuisine &&
    restaurant.pricePerPerson <= budgetPerPerson &&
    restaurant.distance <= selectedDistance
  )
})

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
        <h2>No matches found 😬</h2>
        <p>
          We couldn't find a ${selectedCuisine} restaurant that fits your
          current budget and distance.
        </p>
      </div>
    `
  } else {

restaurantContent = `
  <div class="wheel-wrap">
    <div class="wheel-pointer">▼</div>

    <div
      class="visual-wheel restaurant-visual-wheel"
      id="restaurant-wheel"
      style="background: conic-gradient(
        from 90deg,
        ${finalRestaurantPool
          .map((restaurant, index) => {
            const sliceAngle = 360 / finalRestaurantPool.length
            const start = index * sliceAngle
            const end = (index + 1) * sliceAngle
            const color = index % 2 === 0 ? '#2b2d29' : '#1f211f'

            return `${color} ${start}deg ${end}deg`
          })
          .join(',')}
      )"
    >
        ${finalRestaurantPool
          .map((restaurant, index) => {
            const sliceAngle = 360 / finalRestaurantPool.length
            const centerAngle =
              index * sliceAngle + sliceAngle / 2

            return `
              <div
                class="wheel-label restaurant-wheel-label"
                style="transform: rotate(${centerAngle}deg)"
              >
                <span>${restaurant.name}</span>
            </div>
          `
        })
        .join('')}
    </div>
  </div>

  <div class="wheel-result" id="restaurant-wheel-text">
    Ready?
  </div>

  <button id="spin-restaurant" class="primary-button">
    🎡 Spin Restaurant
  </button>

  <div id="restaurant-result"></div>
`
  }

  document.querySelector('#app').innerHTML = `
    <main class="app-shell">
      <section class="card">
        <div class="logo">🎉</div>

        <h1>Dinner!</h1>
        <p class="subtitle">
          Cuisine: ${selectedCuisine}
        </p>

        ${restaurantContent}

        <button id="start-over" class="secondary-button">
          ← Start Over
        </button>
      </section>
    </main>
  `

  if (finalRestaurantPool.length > 0) {
  document.querySelector('#spin-restaurant').addEventListener('click', () => {
    spinRestaurant(
      currentRestaurantPool,
      budgetPerPerson,
      targetTier
    )
  })
}

  document.querySelector('#start-over').addEventListener('click', () => {
    renderHome()
  })
}

function spinRestaurant(
  restaurantPool,
  budgetPerPerson,
  targetTier
) {
  const wheel = document.querySelector('#restaurant-wheel')
  const wheelText = document.querySelector('#restaurant-wheel-text')
  const spinButton = document.querySelector('#spin-restaurant')
  const resultBox = document.querySelector('#restaurant-result')

  spinButton.disabled = true
  spinButton.textContent = 'Spinning...'
  resultBox.innerHTML = ''

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

const weightedRestaurants = restaurantPool.map((restaurant) => {
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

const totalWeight = weightedRestaurants.reduce(
  (total, item) => total + item.weight,
  0
)

let randomWeight = Math.random() * totalWeight
let winner = weightedRestaurants[0].restaurant

for (const item of weightedRestaurants) {
  randomWeight -= item.weight

  if (randomWeight <= 0) {
    winner = item.restaurant
    break
  }
}

const winnerIndex = restaurantPool.indexOf(winner)

  const sliceAngle = 360 / restaurantPool.length

  const winnerCenterAngle =
    winnerIndex * sliceAngle + sliceAngle / 2

  const fullSpins =
    5 + Math.floor(Math.random() * 3)

  const currentNormalized =
    ((restaurantWheelRotation % 360) + 360) % 360

  // 270 degrees corresponds to our pointer at 12 o'clock.
  const targetNormalized =
    (270 - winnerCenterAngle + 360) % 360

  let additionalRotation =
    targetNormalized - currentNormalized

  if (additionalRotation < 0) {
    additionalRotation += 360
  }

  additionalRotation += fullSpins * 360

  restaurantWheelRotation += additionalRotation

  wheel.style.transform =
    `rotate(${restaurantWheelRotation}deg)`

  setTimeout(() => {
    wheelText.textContent = winner.name

    saveRecentRestaurant(winner.name)

    const winnerPosition = restaurantPool.findIndex(
      (restaurant) => restaurant.name === winner.name
    )

    if (winnerPosition !== -1) {
      restaurantPool.splice(winnerPosition, 1)
    }

    const favorite = isFavoriteRestaurant(winner.name)

    resultBox.innerHTML = `
      <div class="result-box">
        <p class="result-label">You're going to...</p>

        <h2>${winner.name}</h2>

        <p>${winner.cuisine}</p>
        <p>💰 About $${winner.pricePerPerson}/person</p>
        <p>📍 ${winner.distance} miles away</p>

        <button
          id="favorite-button"
          class="favorite-button ${favorite ? 'is-favorite' : ''}"
        >
          ${favorite ? '❤️ Favorite' : '♡ Add to Favorites'}
        </button>
      </div>
    `
    const favoriteButton =
      document.querySelector('#favorite-button')

    favoriteButton.addEventListener('click', () => {
      const nowFavorite =
        toggleFavoriteRestaurant(winner.name)

      favoriteButton.textContent =
        nowFavorite
          ? '❤️ Favorite'
          : '♡ Add to Favorites'

      favoriteButton.classList.toggle(
        'is-favorite',
        nowFavorite
      )
    })
    if (restaurantPool.length > 0) {
      spinButton.disabled = false
      spinButton.textContent = '🎡 Spin Again'
    } else {
      spinButton.disabled = true
      spinButton.textContent = 'No More Options'
    }
  }, 3000)
}

renderHome()

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
  })
}