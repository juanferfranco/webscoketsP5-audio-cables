# Caso de estudio: envío de archivos binarios usando websockets.

El cliente en cables.gl está [aquí](https://cables.gl/edit/vfYmTr).

El patch se ve así:

![image](https://github.com/user-attachments/assets/cbf92517-00b6-426a-8d46-e1881a9821f2)

Hay dos operadores personalizados:

* WebSocketBlob: procesa el blob enviado por el server y lo convierte en un ArrayBuffer
* AudioBufferDecoder: lee el ArrayBuffer y lo decodifica para convertirlo en un AudioBuffer.

El código de cada operador es este:

<details>

<summary>Abrir para ver el código personalizado del WebSocketBlob </summary>

``` js
const
    inUrl = op.inString("URL"),
    outResult = op.outObject("Result"),
    outValidJson = op.outBoolNum("Valid JSON"),
    outConnection = op.outObject("Connection", null, "Websocket"),
    outConnected = op.outBoolNum("Connected"),
    outReceived = op.outTrigger("Received Data"),
    outRaw = op.outString("Raw Data"),
    outArrayBuffer = op.outObject("Audio Data", null, "ArrayBuffer");  // Nueva salida para los datos en formato ArrayBuffer

let connection = null;
let timeout = null;
let connectedTo = "";

inUrl.onChange = connect;
timeout = setTimeout(checkConnection, 2000);

inUrl.set();

let connecting = false;

function checkConnection() {
    if (!outConnected.get() && !connecting) {
        connect();
    }
    timeout = setTimeout(checkConnection, 2000);
}

op.onDelete = function () {
    if (outConnected.get()) connection.close();
    connecting = false;
    clearTimeout(timeout);
};

function connect() {
    op.setUiError("connection", null);
    op.setUiError("jsonvalid", null);

    if (outConnected.get() && connectedTo == inUrl.get()) return;

    if (inUrl.get() && inUrl.get().indexOf("ws://") == -1 && inUrl.get().indexOf("wss://") == -1) {
        op.setUiError("wrongproto", "only valid protocols are ws:// or wss:// ");
        return;
    } else {
        op.setUiError("wrongproto", null);
    }

    if (!inUrl.get() || inUrl.get() === "") {
        op.logWarn("websocket: invalid url ");
        outConnected.set(false);
        return;
    }

    window.WebSocket = window.WebSocket || window.MozWebSocket;

    if (!window.WebSocket)
        return op.logError("Sorry, but your browser doesn't support WebSockets.");

    op.setUiError("websocket", null);

    try {
        connecting = true;
        if (connection !== null) connection.close();
        connection = new WebSocket(inUrl.get());
    } catch (e) {
        if (e && e.message) op.setUiError("websocket", e.message);
        op.logWarn("could not connect to", inUrl.get());
        connecting = false;
    }

    if (connection) {
        connection.onerror = function (e) {
            connecting = false;
            outConnected.set(false);
            outConnection.set(null);
        };

        connection.onclose = function (message) {
            connecting = false;
            outConnected.set(false);
            outConnection.set(null);
        };

        connection.onopen = function (message) {
            connecting = false;
            outConnected.set(true);
            connectedTo = inUrl.get();
            outConnection.set(connection);
        };

        connection.onmessage = function (message) {
            if (message.data instanceof Blob) {
                // Leer el blob como ArrayBuffer
                let reader = new FileReader();
                reader.onloadend = function () {
                    let arrayBuffer = reader.result;
                    outArrayBuffer.setRef(arrayBuffer);  // Asignar el ArrayBuffer al puerto de salida
                    outReceived.trigger();  // Activar el trigger indicando que se recibió el mensaje
                };
                reader.readAsArrayBuffer(message.data);
            } else {
                // Asumir que es JSON y procesarlo como antes
                try {
                    const json = JSON.parse(message.data);
                    outResult.setRef(json);
                    outValidJson.set(true);
                } catch (e) {
                    op.log(e);
                    op.log("Este mensaje no parece ser un JSON válido: ", message.data);
                    op.setUiError("jsonvalid", "El mensaje recibido no era un JSON válido", 0);
                    outValidJson.set(false);
                }
                outReceived.trigger();
            }
        };
    }
}
```

</details>

<details>

  <summary> Abrir para ver el código personalizado del AudioBufferDecoder</summary>
  
  ``` js
const
    inArrayBuffer = op.inObject("Array Buffer", null, "ArrayBuffer"),  // Entrada para el ArrayBuffer
    outAudioBuffer = op.outObject("Audio Buffer", null, "audioBuffer"), // Salida para el AudioBuffer
    outLoading = op.outBool("Loading", false);

const audioCtx = CABLES.WEBAUDIO.createAudioContext(op);

inArrayBuffer.onChange = function () {
    const arrayBuffer = inArrayBuffer.get();

    // Verificar si la entrada es un ArrayBuffer antes de proceder
    if (arrayBuffer && arrayBuffer instanceof ArrayBuffer) {
        // Establecer estado de carga
        outLoading.set(true);

        // Decodificar el ArrayBuffer en un AudioBuffer
        audioCtx.decodeAudioData(arrayBuffer, function (audioBuffer) {
            outAudioBuffer.setRef(audioBuffer);  // Asignar el AudioBuffer al puerto de salida
            outLoading.set(false);  // Establecer estado de carga completado
        }, function (error) {
            op.logError("Error al decodificar audio: ", error);
            outLoading.set(false);
        });
    } else {
        // Solo mostrar el mensaje de error si el dato de entrada no es `null` ni `undefined`
        if (arrayBuffer !== null && arrayBuffer !== undefined) {
            op.setUiError("inputInvalid", "El dato de entrada no es un ArrayBuffer válido", 0);
        } else {
            op.setUiError("inputInvalid", null);  // Limpiar el error si la entrada es `null`
        }
    }
};

op.onDelete = function () {
    // Limpiar cualquier recurso si es necesario
    outAudioBuffer.set(null);
};
```
</details>

Todas las aplicaciones están configuradas para correr en la misma máquina, pero la aplicación hecha con cables.gl puede 
correr desde el editor sin reportar problemas de seguridad o comptabilidad del websocket con https.




## Ejecutar la aplicación

Una vez se descargue este repositorio:

* npm install
* npm start
* Abrir el cliente de cables.gl
* Verificar en el operador Websocket que esté conectado (el operador tiene una salida que
  lo indica).
* Servir con el live server de visual code el cliente p5.js

