document.addEventListener('DOMContentLoaded', () => {

  const userBoard = document.querySelector('.grid-user')
  const computerBoard = document.querySelector('.grid-computer')
  const displayBoard = document.querySelector('.grid-display')

  let isHorizontal = true
  let isGameOver = false

  const ships = document.querySelectorAll('.ship')
  const ship1 = document.querySelector('.ship1-container')
  const ship2 = document.querySelector('.ship2-container')
  const ship3 = document.querySelector('.ship3-container')
  const ship4 = document.querySelector('.ship4-container')
  const ship5 = document.querySelector('.ship5-container')
  const start = document.querySelector('#start')

  let ready = false
  let enemyReady = false
  let allShipsPlaced = false
  let shotFired = -1

  const rotateButton = document.querySelector('#rotate')
  const turnDisplay = document.querySelector('#turn')
  const infoDisplay = document.querySelector('#info')
  const singlePlayerButton = document.querySelector('#singlePlayerButton')
  const multiPlayerButton = document.querySelector('#multiPlayerButton')
  const userSquares = []
  const computerSquares = []

  
  let currentPlayer = 'user'
  const width = 10
  let gameMode = ""
  let playerNum = 0
  
  // Different Player Mode
  singlePlayerButton.addEventListener('click', startSinglePlayer)
  multiPlayerButton.addEventListener('click', startMultiPlayer)

  // Multiplayer function used as a way to manage game state in client side
  function startMultiPlayer() {
    gameMode = 'multiPlayer'

    const ws = io();

    // Get your player number
    ws.on('player-number', num => {
      if (num === -1) {
        infoDisplay.innerHTML = "Server Full"
      } else {
        playerNum = parseInt(num)
        if(playerNum === 1) currentPlayer = "Enemy"

        console.log(playerNum)

        // check player state
        ws.emit('check-players')
      }
    })

    // Connection status of other player
    ws.on('player-connection', num => {
      console.log(`Player number ${num} has connected or disconnected`)
      playerConnectedOrDisconnected(num)
    })

    // Send signal of enemy ready
    ws.on('enemy-ready', num => {
      enemyReady = true
      playerReady(num)
      if (ready) playGameMulti(ws)
    })

    // Check player status
    ws.on('check-players', players => {
      players.forEach((p, i) => {
        if(p.connected) playerConnectedOrDisconnected(i)
        if(p.ready) {
          playerReady(i)
          if(i !== playerReady) enemyReady = true
        }
      })
    })

    // Ready button click
    start.addEventListener('click', () => {
      if(allShipsPlaced) playGameMulti(ws)
      else infoDisplay.innerHTML = "Place all ships"
    })

    // Setup event listeners for firing
    computerSquares.forEach(square => {
      square.addEventListener('click', () => {
        if(currentPlayer === 'user' && ready && enemyReady) {
          shotFired = square.dataset.id
          ws.emit('fire', shotFired)
        }
      })
    })

    // On click received game state
    ws.on('fire', id => {
      enemyGo(id)
      const square = userSquares[id]
      ws.emit('fire-reply', square.classList)
      playGameMulti(ws)
    })

    // On click reply game state
    ws.on('fire-reply', classList => {
      revealSquare(classList)
      playGameMulti(ws)
    })

    // function to show the green signal on UI
    function playerConnectedOrDisconnected(num) {
      let player = `.p${parseInt(num) + 1}`
      document.querySelector(`${player} .connected span`).classList.toggle('green')
      // Make the player name bold
      if(parseInt(num) === playerNum) document.querySelector(player).style.fontWeight = 'bold'
    }
  }

  // Single Player function
  function startSinglePlayer() {
    gameMode = "singlePlayer"

    generate(arrayShip[0])
    generate(arrayShip[1])
    generate(arrayShip[2])
    generate(arrayShip[3])
    generate(arrayShip[4])

    start.addEventListener('click', playGameSingle)
  }

  //Create Board
  function createBoard(grid, squares) {
    for (let i = 0; i < width*width; i++) {
      const square = document.createElement('div')
      square.dataset.id = i
      grid.appendChild(square)
      squares.push(square)
    }
  }
  createBoard(userBoard, userSquares)
  createBoard(computerBoard, computerSquares)

  //Ships
  const arrayShip = [
    {
      name: 'ship1',
      directions: [
        [0, 1],
        [0, width]
      ]
    },
    {
      name: 'ship2',
      directions: [
        [0, 1, 2],
        [0, width, width*2]
      ]
    },
    {
      name: 'ship3',
      directions: [
        [0, 1, 2],
        [0, width, width*2]
      ]
    },
    {
      name: 'ship4',
      directions: [
        [0, 1, 2, 3],
        [0, width, width*2, width*3]
      ]
    },
    {
      name: 'ship5',
      directions: [
        [0, 1, 2, 3, 4],
        [0, width, width*2, width*3, width*4]
      ]
    },
  ]

  //Draw the computers ships in random locations
  function generate(ship) {
    let randomDirection = Math.floor(Math.random() * ship.directions.length)
    let current = ship.directions[randomDirection]
    if (randomDirection === 0) direction = 1
    if (randomDirection === 1) direction = 10
    let randomStart = Math.abs(Math.floor(Math.random() * computerSquares.length - (ship.directions[0].length * direction)))

    const isTaken = current.some(index => computerSquares[randomStart + index].classList.contains('taken'))
    const isAtRightEdge = current.some(index => (randomStart + index) % width === width - 1)
    const isAtLeftEdge = current.some(index => (randomStart + index) % width === 0)

    if (!isTaken && !isAtRightEdge && !isAtLeftEdge) current.forEach(index => computerSquares[randomStart + index].classList.add('taken', ship.name))

    else generate(ship)
  }
  

  //Rotate the ships
  function rotate() {
    if (isHorizontal) {
      ship1.classList.toggle('ship1-container-vertical')
      ship2.classList.toggle('ship2-container-vertical')
      ship3.classList.toggle('ship3-container-vertical')
      ship4.classList.toggle('ship4-container-vertical')
      ship5.classList.toggle('ship5-container-vertical')
      isHorizontal = false
      // console.log(isHorizontal)
      return
    }
    if (!isHorizontal) {
      ship1.classList.toggle('ship1-container-vertical')
      ship2.classList.toggle('ship2-container-vertical')
      ship3.classList.toggle('ship3-container-vertical')
      ship4.classList.toggle('ship4-container-vertical')
      ship5.classList.toggle('ship5-container-vertical')
      isHorizontal = true
      // console.log(isHorizontal)
      return
    }
  }
  rotateButton.addEventListener('click', rotate)

  //move around user ship
  ships.forEach(ship => ship.addEventListener('dragstart', dragStart))
  userSquares.forEach(square => square.addEventListener('dragstart', dragStart))
  userSquares.forEach(square => square.addEventListener('dragover', dragOver))
  userSquares.forEach(square => square.addEventListener('dragenter', dragEnter))
  userSquares.forEach(square => square.addEventListener('dragleave', dragLeave))
  userSquares.forEach(square => square.addEventListener('drop', dragDrop))
  userSquares.forEach(square => square.addEventListener('dragend', dragEnd))

  let selectedShipNameWithIndex
  let draggedShip
  let draggedShipLength

  ships.forEach(ship => ship.addEventListener('mousedown', (e) => {
    selectedShipNameWithIndex = e.target.id
  }))

  function dragStart() {
    draggedShip = this
    draggedShipLength = this.childNodes.length
  }

  function dragDrop() {
    let shipNameWithLastId = draggedShip.lastChild.id
    let shipClass = shipNameWithLastId.slice(0, -2)
    // console.log(shipClass)
    let lastShipIndex = parseInt(shipNameWithLastId.substr(-1))
    let shipLastId = lastShipIndex + parseInt(this.dataset.id)
    // console.log(shipLastId)
    const notAllowedHorizontal = [0,10,20,30,40,50,60,70,80,90,1,11,21,31,41,51,61,71,81,91,2,22,32,42,52,62,72,82,92,3,13,23,33,43,53,63,73,83,93]
    const notAllowedVertical = [99,98,97,96,95,94,93,92,91,90,89,88,87,86,85,84,83,82,81,80,79,78,77,76,75,74,73,72,71,70,69,68,67,66,65,64,63,62,61,60]
    
    let newNotAllowedHorizontal = notAllowedHorizontal.splice(0, 10 * lastShipIndex)
    let newNotAllowedVertical = notAllowedVertical.splice(0, 10 * lastShipIndex)

    selectedShipIndex = parseInt(selectedShipNameWithIndex.substr(-1))

    shipLastId = shipLastId - selectedShipIndex
    // console.log(shipLastId)

    if (isHorizontal && !newNotAllowedHorizontal.includes(shipLastId)) {
      for (let i=0; i < draggedShipLength; i++) {
        userSquares[parseInt(this.dataset.id) - selectedShipIndex + i].classList.add('taken', shipClass)
      }
    //As long as the index of the ship you are dragging is not in the newNotAllowedVertical array! This means that sometimes if you drag the ship by its
    //index-1 , index-2 and so on, the ship will rebound back to the displayBoard.
    } else if (!isHorizontal && !newNotAllowedVertical.includes(shipLastId)) {
      for (let i=0; i < draggedShipLength; i++) {
        userSquares[parseInt(this.dataset.id) - selectedShipIndex + width*i].classList.add('taken', shipClass)
      }
    } else return

    displayBoard.removeChild(draggedShip)
    if(!displayBoard.querySelector('.ship')) allShipsPlaced = true
  }

  function dragLeave() {
  }

  function dragEnd() {
  }

  function dragOver(e) {
    e.preventDefault()
  }

  function dragEnter(e) {
    e.preventDefault()
  }

    // Game Logic for Single Player
    function playGameSingle() {
      if (isGameOver) return
      if (currentPlayer === 'user') {
        turnDisplay.innerHTML = 'Your Go'
        computerSquares.forEach(square => square.addEventListener('click', function(e) {
          shotFired = square.dataset.id
          revealSquare(square.classList)
        }))
      }
      if (currentPlayer === 'enemy') {
        turnDisplay.innerHTML = `Computer's Turn`
        setTimeout(enemyGo, 1000)
      }
    }
  
  // Game Logic for MultiPlayer
  function playGameMulti(ws) {
    if(isGameOver) return
    if(!ready) {
      ws.emit('player-ready')
      ready = true
      playerReady(playerNum)
    }

    if(enemyReady) {
      if(currentPlayer === 'user') {
        turnDisplay.innerHTML = 'Your Turn'
      }
      if(currentPlayer === 'enemy') {
        turnDisplay.innerHTML = "Enemy's Turn"
      }
    }
  }

  function playerReady(num) {
    let player = `.p${parseInt(num) + 1}`
    document.querySelector(`${player} .ready span`).classList.toggle('green')
  }


  let ship1Count = 0
  let ship2Count = 0
  let ship3Count = 0
  let ship4Count = 0
  let ship5Count = 0
  let cpuShip1Count = 0
  let cpuShip2Count = 0
  let cpuShip3Count = 0
  let cpuShip4Count = 0
  let cpuShip5Count = 0

  function enemyGo(square) {
    if (gameMode === 'singlePlayer') square = Math.floor(Math.random() * userSquares.length)
    if (!userSquares[square].classList.contains('boom')) {
      userSquares[square].classList.add('boom')
      if (userSquares[square].classList.contains('ship1')) cpuShip1Count++
      if (userSquares[square].classList.contains('ship2')) cpuShip2Count++
      if (userSquares[square].classList.contains('ship3')) cpuShip3Count++
      if (userSquares[square].classList.contains('ship4')) cpuShip4Count++
      if (userSquares[square].classList.contains('ship5')) cpuShip5Count++
      checkForWins()
    } else if (gameMode === 'singlePlayer') enemyGo()
    currentPlayer = 'user'
    turnDisplay.innerHTML = 'Your Go'
  }

  function checkForWins() {
    let enemy = 'computer'
    if(gameMode === 'multiPlayer') enemy = 'enemy'
    if (ship1Count === 2) {
      infoDisplay.innerHTML = `You sunk the ${enemy}'s ship1`
      ship1Count = 10
    }
    if (ship2Count === 3) {
      infoDisplay.innerHTML = `You sunk the ${enemy}'s ship2`
      ship2Count = 10
    }
    if (ship3Count === 3) {
      infoDisplay.innerHTML = `You sunk the ${enemy}'s ship3`
      ship3Count = 10
    }
    if (ship4Count === 4) {
      infoDisplay.innerHTML = `You sunk the ${enemy}'s ship4`
      ship4Count = 10
    }
    if (ship5Count === 5) {
      infoDisplay.innerHTML = `You sunk the ${enemy}'s ship5`
      ship5Count = 10
    }
    if (cpuship1Count === 2) {
      infoDisplay.innerHTML = `${enemy} sunk your ship1`
      cpuship1Count = 10
    }
    if (cpuship2Count === 3) {
      infoDisplay.innerHTML = `${enemy} sunk your ship2`
      cpuship2Count = 10
    }
    if (cpuship3Count === 3) {
      infoDisplay.innerHTML = `${enemy} sunk your ship3`
      cpuship3Count = 10
    }
    if (cpuship4Count === 4) {
      infoDisplay.innerHTML = `${enemy} sunk your ship4`
      cpuship4Count = 10
    }
    if (cpuship5Count === 5) {
      infoDisplay.innerHTML = `${enemy} sunk your ship5`
      cpuship5Count = 10
    }

    if ((ship1Count + ship2Count + ship3Count + ship4Count + ship5Count) === 50) {
      infoDisplay.innerHTML = "YOU WIN"
      gameOver()
    }
    if ((cpuship1Count + cpuship2Count + cpuship3Count + cpuship4Count + cpuship5Count) === 50) {
      infoDisplay.innerHTML = `${enemy.toUpperCase()} WINS`
      gameOver()
    }
  }

  function revealSquare(classList) {
    const enemySquare = computerBoard.querySelector(`div[data-id='${shotFired}']`)
    const obj = Object.values(classList)
    if (!enemySquare.classList.contains('boom') && currentPlayer === 'user' && !isGameOver) {
      if (obj.includes('ship1')) ship1Count++
      if (obj.includes('ship2')) ship2Count++
      if (obj.includes('ship3')) ship3Count++
      if (obj.includes('ship4')) ship4Count++
      if (obj.includes('ship5')) ship5Count++
    }
    if (obj.includes('taken')) {
      enemySquare.classList.add('boom')
    } else {
      enemySquare.classList.add('miss')
    }
    checkForWins()
    currentPlayer = 'enemy'
    if(gameMode === 'singlePlayer') playGameSingle()
  }

  function gameOver() {
    isGameOver = true
    start.removeEventListener('click', playGameSingle)
  }
})