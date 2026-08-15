import './style.css'
import { restaurants } from './restaurants.js'

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
let cuisineWheelRotation = 0
let restaurantWheelRotation = 0

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
        <div class="logo">🎡</div>

        <h1>Cuisine Wheel</h1>
        <p class="subtitle">Let's see what you're eating tonight.</p>

        <div class="summary-box">
          <span>Budget: $${selectedBudget}</span>
          <span>Distance: ${selectedDistance} mi</span>
          <span>Party: ${partySize}</span>
        </div>

        <div class="wheel-wrap">
          <div class="wheel-pointer">▼</div>

          <div class="visual-wheel" id="wheel">
            ${cuisines
              .map(
                (cuisine, index) => `
                  <div
                    class="wheel-label"
                    style="transform: rotate(${index * (360 / cuisines.length)}deg)"
                  >
                    <span>${cuisine}</span>
                  </div>
                `
              )
              .join('')}
            </div>
          </div>

          <div class="wheel-result" id="wheel-text">
            Ready?
          </div>

        <button id="spin-cuisine" class="primary-button">
          🎡 Spin Cuisine
        </button>
        <button id="find-restaurant" class="primary-button hidden">
          🍽️ Find My Restaurant
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

  document.querySelector('#spin-cuisine').addEventListener('click', () => {
    spinCuisine()
  })
  document.querySelector('#find-restaurant').addEventListener('click', () => {
    renderRestaurantScreen()
  })
}

function spinCuisine() {
  const wheel = document.querySelector('#wheel')
  const wheelText = document.querySelector('#wheel-text')
  const spinButton = document.querySelector('#spin-cuisine')

  spinButton.disabled = true
  spinButton.textContent = 'Spinning...'

  const sliceAngle = 360 / cuisines.length

  // Randomly choose the winning cuisine.
  const winnerIndex = Math.floor(Math.random() * cuisines.length)
  const winner = cuisines[winnerIndex]

  selectedCuisine = winner

  // Each slice starts at index * sliceAngle.
  // We want the CENTER of the winning slice under the pointer at 12 o'clock.
  const winnerCenterAngle =
    winnerIndex * sliceAngle + sliceAngle / 2

  // Add several complete clockwise rotations every time.
  const fullSpins = 5 + Math.floor(Math.random() * 3)

  // Current normalized wheel position.
  const currentNormalized =
    ((cuisineWheelRotation % 360) + 360) % 360

  // Rotation needed from the current position so the winning slice center
  // ends at the pointer.
  const targetNormalized =
    (270 - winnerCenterAngle + 360) % 360

  let additionalRotation =
    targetNormalized - currentNormalized

  // Force clockwise movement.
  if (additionalRotation < 0) {
    additionalRotation += 360
  }

  // Always give it several full turns.
  additionalRotation += fullSpins * 360

  cuisineWheelRotation += additionalRotation

  wheel.style.transform =
    `rotate(${cuisineWheelRotation}deg)`

  setTimeout(() => {
    wheelText.textContent = winner

    spinButton.disabled = false
    spinButton.textContent = '🎡 Spin Again'

    document
      .querySelector('#find-restaurant')
      .classList.remove('hidden')
  }, 3000)
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
            const color = index % 2 === 0 ? '#f6b73c' : '#2f3542'

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