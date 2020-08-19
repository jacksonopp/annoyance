// Global Control Variables
const MIN_FACE_WIDTH = 180;
const MAX_FACE_WIDTH = 210;

const video = document.getElementById('video');

let isCountdownTimerRunning = false;

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.faceExpressionNet.loadFromUri('/models'),
]).then(startVideo);

/* This version of the startVideo function worked for Chrome on Mac, 
but not firefox or safari on Mac. */
// function startVideo() {
//     navigator.mediaDevices.getUserMedia(
//         { video: {} },
//         stream => video.srcObject = stream,
//         err => console.error(err)
//     )
// }

/* This version works on Chrome, Safari, and Firefox on Mac */
async function startVideo() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
  video.srcObject = stream;
}

video.addEventListener('play', () => {
  const { width, height } = video.srcObject.getVideoTracks()[0].getSettings();
  console.log(width, height);
  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);
  const displaySize = {
    width,
    height,
  };
  const closerOverlay = document.getElementById('closer');
  const missingOverlay = document.getElementById('missing');
  const headOutline = document.getElementById('head_outline');
  const goodOverlay = document.getElementById('good');
  const dirOverlay = document.getElementById('direction');
  const angle = document.getElementById('angle');
  const vlOverlay = document.getElementById('vl');
  const eyeLOverlay = document.getElementById('eye-l');
  const eyeROverlay = document.getElementById('eye-r');
  const calculatingOverlay = document.getElementById('calculating');
  const colors = {
    good: '#277FA3',
    gray: 'gray',
    bad: 'red',
  };

  const MISSING_FACE_COUNT_LIMIT = 2;

  var missingFaceCount = 0;
  var photoCount = 3;
  var speed = 333;

  // COUNT start:
  let howLongDidTheyWait = 0;
  const waitingInterval = setInterval(() => {
    howLongDidTheyWait++;
    console.log(howLongDidTheyWait);
  }, 1000);
  let canTakePhoto = true;
  let isCalculating = false;

  faceapi.matchDimensions(canvas, displaySize);
  // faceapi.matchDimensions(canvas, displaySize);
  var timer = setInterval(async () => {
    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks();
    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    const context = canvas.getContext('2d');

    context.clearRect(0, 0, canvas.width, canvas.height);

    if (!checkDetection(resizedDetections)) {
      /* Face detection intermittently fails to detect a face, so below missingFaceCount
            counter allows for a buffer so we don't fail the validation unless a face isn't 
            detected multiple times in a row */
      missingFaceCount++;
      if (missingFaceCount > MISSING_FACE_COUNT_LIMIT) {
        missingOverlay.style.display = 'flex';
        closerOverlay.style.display = 'none';
        angle.style.display = 'none';
        headOutline.style.borderColor = colors.bad;
        vlOverlay.style.borderColor = colors.bad;
        eyeLOverlay.style.borderColor = colors.bad;
        eyeROverlay.style.borderColor = colors.bad;

        // console.log('missingFaceCount: ' + missingFaceCount);
      }
    } else {
      missingOverlay.style.display = 'none';
      missingFaceCount = 0;
      var isFaceAligned = checkFaceAlignment(resizedDetections, dirOverlay, width, height);
      var isFaceCloseEnough = checkDistance(resizedDetections);
      var isFaceAngle = faceAngle(resizedDetections);
      closerOverlay.style.display = isFaceCloseEnough.isGood ? 'none' : 'flex';
      if (isFaceCloseEnough.why === 'far') {
        closerOverlay.innerHTML = `<h1>
          Move closer to the camera
        </h1>`;
      } else if (isFaceCloseEnough.why === 'close') {
        closerOverlay.innerHTML = `<h1>
          Move away from the camera
        </h1>`;
      } else {
        closerOverlay.innerHTML = '';
      }

      if (isFaceCloseEnough.isGood) {
        angle.style.display = isFaceAngle ? 'none' : 'flex';
      } else {
        angle.style.display = 'none';
      }

      if (!isFaceAligned || !isFaceCloseEnough.isGood || !isFaceAngle) {
        isCountdownTimerRunning = false;
        console.log(isCountdownTimerRunning);
        calculatingOverlay.style.display = 'none';
      }

      if (isFaceAligned && isFaceCloseEnough.isGood && isFaceAngle) {
        headOutline.style.borderColor = colors.good;
        vlOverlay.style.borderColor = colors.gray;
        eyeLOverlay.style.borderColor = colors.gray;
        eyeROverlay.style.borderColor = colors.gray;
        // goodOverlay.style.display = 'flex';
        // goodOverlay.innerHTML = `Taking photo in ${photoCount}`
        canTakePhoto && mockTakePhoto(timer, video, goodOverlay, howLongDidTheyWait, waitingInterval);
        canTakePhoto = false;
        if (!isCalculating) {
          calculating(calculatingOverlay);
          isCalculating = true;
        } else {
          setTimeout(() => (isCalculating = false), 5000);
        }
        // if (photoCount < 1) {
        //   speed = 1000;
        // photoCount--;
        //   // Simulate taking 5 photos
        // } else {
        //   /* Uncomment following lines to stop timer function and end video capture */
        //   // clearInterval(timer);
        //   // video.pause();
        //   // video.srcObject = null;
        //   // takePhoto(width, height);
        // }
      } else {
        headOutline.style.borderColor = colors.bad;
        headOutline.style.borderColor = colors.bad;
        vlOverlay.style.borderColor = colors.bad;
        eyeLOverlay.style.borderColor = colors.bad;
        eyeROverlay.style.borderColor = colors.bad;
        goodOverlay.style.display = 'none';
      }

      //   console.log(
      //     'detection: ' +
      //       Math.round(resizedDetections[0].detection.score * 100) / 100,
      //     '; distance: ' + isFaceCloseEnough,
      //     '; aligned: ' + isFaceAligned,
      //     '; angle: ' + isFaceAngle
      //   );
    }

    // Uncomment this line to show the face detection box
    // faceapi.draw.drawDetections(canvas, resizedDetections);

    // Uncomment this line to show the face landmarks and outline
    // faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
  }, speed); // Change this to adjust frequency of face detection
});

function checkDetection(detections) {
  // Make sure a face was detected.

  return !(!detections || detections[0] === undefined || detections[0].detection === undefined);
}

function checkDistance(detections) {
  // Detect the distance from the camera by looking at the size of the
  // face detection box. A wider box means the candidate is closer to the camera.
  // A smaller box means they are farther from the camera. This needs to match up
  // with the size of the head_outline overlay.
  // console.log(detections[0].alignedRect.box.width);

  if (detections[0].alignedRect.box.width < MIN_FACE_WIDTH) {
    return { isGood: false, why: 'far' };
  } else if (detections[0].alignedRect.box.width > MAX_FACE_WIDTH) {
    return { isGood: false, why: 'close' };
  } else {
    return { isGood: true, why: '' };
  }
  // This currently only requires that the box is above a certain size. We may end up
  // altering this function or adding a new function to check if the user is too close,
  // which would require the face detection box to be below a certain size.
  // return (
  //   detections[0].alignedRect.box.width > MIN_FACE_WIDTH &&
  //   detections[0].alignedRect.box.width < MAX_FACE_WIDTH
  // );
}

function checkFacePresent(detections) {
  // This check requires the face detection score to be above a certain
  // threshold in order for it to pass. Lower number means more forgiving,
  // a higher number is more strict.
  return detections[0].detection.score > 0.5;
}

function checkFaceAlignment(detections, overlay, camWidth, camHeight) {
  // x, box width = 152
  // y, box height = 137
  // Find center of box

  // Alter these numbers to adjust how far away from the box center the face is allowed
  // to be before the face alignment check returns false.
  const X_BUFFER = 24;
  const Y_BUFFER = 18;

  const box = detections[0].alignedRect.box;

  // This checks the actual distance (can return neg or pos)
  const x = camWidth / 2 - (box.x + box.width / 2);
  const y = camHeight * 0.54 - (box.y + box.height / 2);

  // This checks the absolute distance (always returns positive)
  const dx = Math.abs(x);
  const dy = Math.abs(y);

  if (x < 1 - X_BUFFER) {
    // console.log('move right');
    overlay.style.display = 'flex';
    overlay.innerHTML = `<h1>Move Right</h1>`;
  } else if (x > X_BUFFER) {
    overlay.style.display = 'flex';
    overlay.innerHTML = `<h1>Move Left</h1>`;
    // console.log('move left');
  } else if (y < 1 - Y_BUFFER) {
    // console.log('Move up');
    overlay.style.display = 'flex';
    overlay.innerHTML = `<h1>Move Up</h1>`;
  } else if (y > Y_BUFFER) {
    overlay.style.display = 'flex';
    overlay.innerHTML = `<h1>Move Down</h1>`;
    // console.log('Move down');
  } else {
    overlay.style.display = 'none';
    // console.log('y is good');
  }
  return dx < X_BUFFER && dy < Y_BUFFER;
}

function getTop(l) {
  return l.map((a) => a.y).reduce((a, b) => Math.min(a, b));
}

function getMeanPosition(l) {
  return l
    .map((a) => [a.x, a.y])
    .reduce((a, b) => [a[0] + b[0], a[1] + b[1]])
    .map((a) => a / l.length);
}

function faceAngle(detections) {
  const res = detections[0];
  if (res) {
    var eye_right = getMeanPosition(res.landmarks.getRightEye());
    var eye_left = getMeanPosition(res.landmarks.getLeftEye());
    var nose = getMeanPosition(res.landmarks.getNose());
    //var mouth = getMeanPosition(res.landmarks.getMouth());
    //var jaw = getTop(res.landmarks.getJawOutline());

    // var rx = (jaw - mouth[1]) / res.detection.box.height;
    var ry = (eye_left[0] + (eye_right[0] - eye_left[0]) / 2 - nose[0]) / res.detection.box.width;

    // Adjust this value to determine how far the head is allowed to angle away from center (left or right).
    // A higher number means head is allowed to turn farther to left or right.
    return Math.abs(ry) < 0.06;

    // console.log(
    //     res.detection.score, //Face detection score
    //     ry, //Closest to 0 is looking forward
    //     rx // Closest to 0.5 is looking forward, closest to 0 is looking up
    // );
  }
}

function mockTakePhoto(handler, video, div, successTime, successInterval) {
  // clearInterval(handler);
  clearInterval(successInterval);
  console.log('they waited:', successTime);
  // Set up a random time
  const randomTime = _.random(10000, 60000);
  console.log(randomTime);

  setTimeout(() => {
    document.querySelector('.give-up').classList.remove('hide');
  }, randomTime);

  document.querySelector('#giveup').addEventListener('click', (e) => {
    e.preventDefault();
    const data = {
      successTime,
      random,
    };
    done(handler, video, div);
  });
}

function done(handler, video, div) {}

function calculating(overlay) {
  overlay.style.display = 'flex';
  overlay.innerHTML = '<h1>Calculating...</h1>';

  setTimeout(() => {
    overlay.innerHTML = `
<h4>Calculation Failed</h4>
<p>Please move your head outside frame and try again</p>
    `;
  }, _.random(2000, 5000));
}
