const constraints = {
  video: true,
  audio: false,
};
const video = document.querySelector('video');
const btn = document.querySelector('#btn');

navigator.mediaDevices
  .getUserMedia(constraints)
  .then((stream) => {
    startVideo(stream);
  })
  .catch((err) => {
    console.log(err);
  });

console.log('starting stream...');
function startVideo(stream) {
  console.log(stream);
  video.srcObject = stream;
  const tracks = stream.getVideoTracks();

  let seconds = 0;

  const timer = setInterval(() => {
    ++seconds;
    console.log(seconds);
  }, 1000);

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    clearInterval(timer);
    afterClick(seconds, tracks);
  });
}

function afterClick(seconds, tracks) {
  console.log(`Final Time: ${seconds} seconds`);
  console.log(tracks);
  tracks.forEach((track) => track.stop());
  setTimeout(() => {
    window.location.pathname = '/done.html';
  }, 3000);
}
