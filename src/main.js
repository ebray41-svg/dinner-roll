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
        <div class="logo"></div>

        <h1>Dinner Roll</h1>
        <p class="subtitle">We used to hunt and gather...now we do this</p>

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
          Bon Appetit
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

        <h1 class="globe-title">The Internet Always Knows</h1>
        <p class="subtitle">Let's see what it decides...</p>

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

  const winner =
    cuisines[Math.floor(Math.random() * cuisines.length)]

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

const displayRestaurantPool = restaurants.filter(
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
  }
  

  document.querySelector('#start-over').addEventListener('click', () => {
    renderHome()
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
      restaurantResult.innerHTML = `
        <div class="restaurant-info-card">

          <div class="restaurant-title-row">
            <div class="restaurant-name">
              ${winner.name}
            </div>

            <button
              class="favorite-heart ${
                isFavoriteRestaurant(winner.name)
                  ? 'is-favorite'
                  : ''
              }"
              id="favorite-button"
              aria-label="Favorite ${winner.name}"
            >
              ${
                isFavoriteRestaurant(winner.name)
                  ? '♥'
                  : '♡'
              }
            </button>
          </div>

          <div class="restaurant-details">
            ${winner.cuisine} · About $${winner.pricePerPerson} per person
          </div>

          <div class="restaurant-future-details">

            <div class="detail-row">
              <span>Rating</span>
              <span>Coming soon</span>
            </div>

            <div class="detail-row">
              <span>Distance</span>
              <span>${winner.distance} mi</span>
            </div>

            <div class="detail-row">
              <span>Open</span>
              <span>Coming soon</span>
            </div>

            <div class="detail-row">
              <span>Address</span>
              <span>Coming soon</span>
            </div>

          </div>

          <div class="restaurant-actions">
            <button class="restaurant-action-button" disabled>
              Directions
            </button>

            <button class="restaurant-action-button" disabled>
              Menu
            </button>
          </div>

        </div>
      `

      restaurantResult.classList.remove('hidden')

      const favoriteButton =
        document.querySelector(
          '#favorite-button'
        )

      if (favoriteButton) {
        favoriteButton.addEventListener(
          'click',
          () => {
            toggleFavoriteRestaurant(
              winner.name
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

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
  })
}