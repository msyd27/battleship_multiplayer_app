const express = require('express')
const path = require('path')
const http = require('http')
const PORT = process.env.PORT || 3000
const WebSocket = require('socket.io')
const app = express()
const server = http.createServer(app)
const io = WebSocket(server)

// Set static folder
app.use(express.static(path.join(__dirname, "public")))

// Start server
server.listen(PORT, () => console.log(`Server running on port ${PORT}`))

// Handle a socket connection request from web client
const connections = [null, null]

io.on('connection', ws => {
  // console.log('New WS Connection')

  // Find an available player number
  let playerIndex = -1;
  for (const i in connections) {
    if (connections[i] === null) {
      playerIndex = i
      break
    }
  }

  
  ws.emit('player-number', playerIndex)

  console.log(`Player ${playerIndex} has connected`)

  // Ignore player 3
  if (playerIndex === -1) return

  connections[playerIndex] = false

  // Tell eveyone what player number just connected
  ws.broadcast.emit('player-connection', playerIndex)

  // Handle Diconnect
  ws.on('disconnect', () => {
    console.log(`Player ${playerIndex} disconnected`)
    connections[playerIndex] = null
    ws.broadcast.emit('player-connection', playerIndex)
  })

  // On Ready
  ws.on('player-ready', () => {
    ws.broadcast.emit('enemy-ready', playerIndex)
    connections[playerIndex] = true
  })

  // Check player connections
  ws.on('check-players', () => {
    const players = []
    for (const i in connections) {
      connections[i] === null ? players.push({connected: false, ready: false}) : players.push({connected: true, ready: connections[i]})
    }
    ws.emit('check-players', players)
  })

  // On Fire Received
  ws.on('fire', id => {
    console.log(`Shot fired from ${playerIndex}`, id)

    // Emit the move to the other player
    ws.broadcast.emit('fire', id)
  })

  // on Fire Reply
  ws.on('fire-reply', square => {
    console.log(square)

    // Forward the reply to the other player
    ws.broadcast.emit('fire-reply', square)
  })

})