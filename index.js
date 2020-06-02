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

async function afterClick(seconds, tracks) {
  console.log(`Final Time: ${seconds} seconds`);
  tracks.forEach((track) => track.stop());
  const flash = document.querySelector('.flash');
  flash.classList.remove('hide');
  await new Promise((resolve, reject) => {
    setTimeout(() => {
      flash.classList.add('hide');
      resolve();
    }, 200);
  });

  axios
    .post('http://ec2-18-217-92-181.us-east-2.compute.amazonaws.com:3000/api/', {
      seconds,
    })
    .then((res) => {
      console.log(res.data);
      window.location.pathname = '/done.html';
    })
    .catch((err) => console.log(err));
}
