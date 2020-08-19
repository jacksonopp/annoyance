// config
const constraints = {
  video: true,
  audio: false,
};
// selectors
const video = document.querySelector('video');
const btn = document.querySelector('#btn');

let successTime;

setTimeout(() => (successTime = 2), 2000);

// get devices
navigator.mediaDevices
  .getUserMedia(constraints)
  .then((stream) => {
    startVideo(stream);
  })
  .catch((err) => {
    console.log(err);
  });

console.log('starting stream...');
// Start stream
function startVideo(stream) {
  console.log(stream);
  video.srcObject = stream;
  const tracks = stream.getVideoTracks();

  // Setting up the button to appear randomly
  const randomTime = _.random(20000, 60000);
  console.log(randomTime);
  setTimeout(() => {
    btn.classList.remove('hide');
  }, randomTime);

  // This timer keeps track of how long the user has waited
  let seconds = 0;
  const timer = setInterval(() => {
    seconds = seconds + 5;
    console.log(seconds);
  }, 5000);

  // When the user clicks
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    // Stop the timer
    clearInterval(timer);
    // Do some stuff
    afterClick(seconds, tracks);
  });
}

// After the user clicks
async function afterClick(seconds, tracks) {
  console.log(`Final Time: ${seconds} seconds`);
  // Stop the video
  tracks.forEach((track) => track.stop());
  // Flash the screen
  const flash = document.querySelector('.flash');
  flash.classList.remove('hide');
  // Set a timeout to flash the screen
  await new Promise((resolve, reject) => {
    setTimeout(() => {
      flash.classList.add('hide');
      resolve();
    }, 200);
  });

  // Send the data to the backend
  // successTime is a glob
  axios
    // .post('https://annoyance.herokuapp.com/api', {
    //   seconds,
    // })
    .post('http://localhost:3000/api', {
      seconds,
      successTime,
    })
    .then((res) => {
      console.log(res.data);
      window.location.pathname = '/done.html';
    })
    .catch((err) => console.log(err));
}
