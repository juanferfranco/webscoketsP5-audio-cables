# Caso de estudio: websockets envío de imágenes.

## Consideraciones iniciales

En el código en p5.js solo está la parte de envío de imágenes, aunque está 
la función que envía datos de sensórica, esta característica no está implementada.

``` js
function sendSensorData(sensorData) {
  let data = {
    type: 'sensor',
    values: sensorData
  };
  ws.send(JSON.stringify(data));
}

function sendImage(img) {
  let base64Image = img.canvas.toDataURL();
  
  let imageData = {
    type: 'image',
    data: base64Image
  };
  
  ws.send(JSON.stringify(imageData));
}
```

De todas maneras, es interesante notar cómo se puede diferenciar la naturaleza de los datos.

Por otro lado en el servidor:

``` js
    let data = JSON.parse(message);

    if (data.type === 'sensor') {
      console.log('Datos de sensor:', data.values);
    } else if (data.type === 'image') {
      console.log('Imagen recibida');
      server.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(data.data);
        }
      });
    }
```

Se procesan los datos del cliente p5.js y en vez de enviar 
un JSON al cliente en cables.gl, se envía una cadena, la imagen 
codificada en base64.

El cliente en cables.gl está [aquí](https://cables.gl/p/EiV25q).

Todas las aplicaciones están configuradas para correr en la misma máquina. 

## Ejecutar la aplicación


Una vez se descargue este repositorio:

* npm install
* npm start
* Abrir el cliente de cables.gl
* Verificar en el operador Websocket que esté conectado (el operador tiene una salida que
  lo indica).
* Servir con el live server de visual code el cliente p5.js


