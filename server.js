const WebSocket = require('ws');
const server = new WebSocket.Server({ port: 3000 });

server.on('connection', (ws) => {
  console.log('Cliente conectado');
  
  ws.on('message', (message) => {
    console.log('Audio recibido');
    
    // Reenviar el audio a otros clientes conectados, como cables.gl u otros consumidores
    server.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message); // Reenviar el audio recibido a otros clientes conectados
      }
    });
  });

  ws.on('close', () => {
    console.log('Cliente desconectado');
  });
});
