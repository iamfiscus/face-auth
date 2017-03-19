
const el = {
  email: document.getElementById('email'),
  password: document.getElementById('password'),
  cameraToggleBtn: document.getElementById('enable-camera'),
  videoMirror: document.getElementById('video-mirror'),
  register: document.getElementById('register'),
  canvasContainer: document.getElementById('canvas-container')
}

let videoStream = false

const cameraEnable = () => {
  return navigator.mediaDevices.getUserMedia({ audio: false, video: true})
    .then((stream) => {
      videoStream = stream
      el.videoMirror.srcObject = videoStream
      el.videoMirror.play()
      console.log(stream)
    })
    .catch((err) => {
      console.log(err.name + ': ' + err.message)
    })
}

const cameraDisable = () => {
  videoStream.getTracks().forEach(track => {
    track.stop()
    videoStream.removeTrack(track)
  })
  el.videoMirror.srcObject = undefined
}

function capture(video, scaleFactor) {
  if (scaleFactor == null){
    scaleFactor = 1;
  }
  var w = video.videoWidth * scaleFactor;
  var h = video.videoHeight * scaleFactor;
  var canvas = document.createElement('canvas');
  canvas.width  = w;
  canvas.height = h;
  var ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, w, h);
  return canvas;
}

// EVENT - Enable or disable the camera
el.cameraToggleBtn.addEventListener('change', function (event) {
  event.preventDefault()
  if (el.cameraToggleBtn.checked) {
    console.info('Say cheese! Here we go, enabling the camera!')
    cameraEnable()
  } else {
    console.info('Had enough? Ok.. disabling the camera.')
    cameraDisable()
  }
  return false
}, false)

el.register.addEventListener('click', function (event) {
  event.preventDefault()
  // TODO check to make sure we can access the user camera
  // TODO release the users camera
  const canvas = capture(el.videoMirror)
  const payload = {
    email: el.email.value,
    password: el.password.value,
    image: canvas.toDataURL('image/png', 1.0)
  }

  Promise.resolve(navigator.mediaDevices.getUserMedia).then(function() {
    console.log('we have the correct permissions')
    console.log(payload)
  })


  // TODO release the dataURL and clear the canvas element
})
