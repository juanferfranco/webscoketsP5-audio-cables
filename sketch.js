let ws;
let mediaRecorder;
let recordedChunks = [];
let recordingStatus;
let fileInput

function setup() {
  noCanvas();

  ws = new WebSocket('ws://localhost:3000');

  let startMicBtn = createButton('Iniciar grabación de audio');
  startMicBtn.position(10, 10);
  startMicBtn.mousePressed(startMicRecording);

  let stopMicBtn = createButton('Detener grabación de audio');
  stopMicBtn.position(10, 50);
  stopMicBtn.mousePressed(stopMicRecording);

  fileInput = createFileInput(handleFile);
  fileInput.position(10, 130);
  fileInput.elt.addEventListener('click', () => {
    fileInput.elt.value = ""; 
  });

  recordingStatus = createP('Estado: Inactivo');
  recordingStatus.position(10, 170);
}

function startMicRecording() {
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
      mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = function(event) {
        if (event.data.size > 0) {
          recordedChunks.push(event.data);
        }
      };

      mediaRecorder.onstart = function() {
        recordingStatus.html('Estado: Grabando...');
      };

      mediaRecorder.start();
    })
    .catch(err => {
      console.error('Error al acceder al micrófono:', err);
      recordingStatus.html('Error al acceder al micrófono');
    });
}

function stopMicRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
    mediaRecorder.onstop = function() {
      recordingStatus.html('Estado: Grabación detenida');
      let blob = new Blob(recordedChunks, { type: 'audio/wav' });
      recordedChunks = [];

      let url = URL.createObjectURL(blob);
      let a = createA(url, 'Descargar audio grabado', '_blank');
      a.position(10, 210);
      a.elt.download = 'grabacion.wav';
      ws.send(blob);
    };
  }
}

function handleFile(file) {
  if (file.type === 'audio') {
    ws.send(file.file);
  } else {
    console.log('Por favor, selecciona un archivo de audio.');
  }
}
