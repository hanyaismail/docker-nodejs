const fs = require('fs');
const moment = require('moment');
const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const mqtt = require('mqtt');
const mqttClient = mqtt.connect('ws://iot.eclipse.org:80/ws');
const { stopAllTask, createSchedule } = require('./test-scheduler');
const PORT = 8080;

const schedules = [
  '*/5 * * * * *',
]

const routineSchedule = [
  '* 24 11 * * *',
]

mqttClient.on('connect', () => {
  console.log('connected ecplise');
  mqttClient.subscribe('outTopic_ismail220a');
});

mqttClient.on('message', (topic, message) => {
  console.log('topic: ', topic);
  console.log('message: ', message.toString());
});

io.on('connection', function (socket) {
  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    console.log(data);
  });
  socket.on('fogger', data => {
    console.log('data', data);
    mqttClient.publish('inTopic_ismail220a', data.state.toString());
    socket.broadcast.emit('foggerChange', data);
  })
  // let state = 1;
  let data = {
    state: 1,
    foggerNum: '1',
  }
  const scheduleCb = () => {
    console.log(moment())
    console.log(`cool every ${schedules} ${data.state}`)
    socket.broadcast.emit('foggerChange', data);
    mqttClient.publish('inTopic_ismail220a', data.state.toString());
    data.state = data.state === 1 ? 0 : 1;
  }

  console.log('socket connected')
});

const routineCb = () => {
  console.log(moment())
  mqttClient.publish('inTopic_ismail220a', '1');
  io.emit('foggerChange', {
    state: 1,
    foggerNum: '1',
  });
  setTimeout(() => {
    mqttClient.publish('inTopic_ismail220a', '0');
    io.emit('foggerChange', {
      state: 0,
      foggerNum: '1',
    });
  }, 300000)
}

createSchedule(routineSchedule, routineCb);

app.get('/', (req, res) => {
  fs.readFile(__dirname + '/public/index.html', (err, data) => {
    if (err) {
      res.writeHead(404, {'Content-Type': 'text/html'});
      return res.end("404 Not Found");
    }
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(data);
    return res.end();
  });
});

server.listen(PORT, () => {
  console.log(`server run on port ${PORT}`)
})