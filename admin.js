axios.get('https://annoyance.herokuapp.com/api').then((res) => {
  const compressed = compressArray(handleData(res.data));
  console.log(compressed);
  renderData(compressed);
});

// https://gist.github.com/ralphcrisostomo/3141412
function compressArray(original) {
  var compressed = [];
  // make a copy of the input array
  var copy = original.slice(0);

  // first loop goes over every element
  for (var i = 0; i < original.length; i++) {
    var myCount = 0;
    // loop over every element in the copy and see if it's the same
    for (var w = 0; w < copy.length; w++) {
      if (original[i] == copy[w]) {
        // increase amount of times duplicate is found
        myCount++;
        // sets item to undefined
        delete copy[w];
      }
    }

    if (myCount > 0) {
      var a = new Object();
      a.x = original[i];
      a.y = myCount;
      compressed.push(a);
    }
  }

  return compressed;
}

function handleData(data) {
  return data.map((datam) => datam.wait_time);
}

function renderData(times) {
  var ctx = document.getElementById('chart');
  var labels = times.map((times) => times.x);
  var results = times.map((times) => times.y);
  var myChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Time Waited (in sec)',
          data: results,
          borderColor: ['rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)', 'rgba(255, 206, 86, 1)', 'rgba(75, 192, 192, 1)', 'rgba(153, 102, 255, 1)', 'rgba(255, 159, 64, 1)'],
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: false,
      scales: {
        yAxes: [
          {
            ticks: {
              beginAtZero: true,
            },
          },
        ],
      },
    },
  });
}
