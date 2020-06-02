let mockData = { message: 'not ping' };

const btn = document.querySelector('#btn');

btn.addEventListener('click', (e) => {
  e.preventDefault();
  axios.get('https://annoyance.herokuapp.com/api/ping').then((res) => {
    ping(res.data);
    // ping(mockData);
  });
});

let num = 0;
function ping(data) {
  console.log(data);
  if (num >= 3) {
    // data = { message: 'ping' };
  }
  if (data.message !== 'ping') {
    btn.classList.add('hide');
    document.querySelector('#loading').classList.remove('hide');
    setTimeout(() => {
      console.log('waiting for server');
      num++;
      ping(data);
    }, 5000);
  } else {
    window.location.href = './app.html';
  }
}