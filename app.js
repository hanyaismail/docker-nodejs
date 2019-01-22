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

mqttClient.on('connect', () => {
  console.log('connected ecplise');
  mqttClient.subscribe('outTopic_ismail220a');
  mqttClient.subscribe('initialStateOut_ismail220a/fogger/1')
  mqttClient.subscribe('initialStateOut_ismail220a/light/1')
});

mqttClient.on('message', (topic, message) => {
  console.log('topic: ', topic);
  console.log('message: ', message.toString(), message);

  if(topic == "initialStateOut_ismail220a/fogger/1") {
    io.emit('foggerChange', {foggerNum: '1', state: parseInt(message) === 1 ? 0 : 1})
  }

  if(topic == "initialStateOut_ismail220a/light/1") {
    io.emit('lightChange', {lightNum: '1', state: parseInt(message) === 1 ? 0 : 1})
  }
});

io.on('connection', function (socket) {

  socket.on('fogger', data => {
    console.log('dataFogger', data);
    mqttClient.publish(`inTopic_ismail220a/fogger/${data.foggerNum}`, data.state.toString());
    socket.broadcast.emit('foggerChange', data);
  });

  socket.on('light', data => {
    console.log('dataLight', data);
    mqttClient.publish(`inTopic_ismail220a/light/${data.lightNum}`, data.state.toString());
    socket.broadcast.emit('lightChange', data);
  });

  mqttClient.publish('initialState_ismail220a');
  // let state = 1;
  // let data = {
  //   state: 1,
  //   foggerNum: '1',
  // }
  // const scheduleCb = () => {
  //   console.log(moment())
  //   console.log(`cool every ${schedules} ${data.state}`)
  //   socket.broadcast.emit('foggerChange', data);
  //   mqttClient.publish('inTopic_ismail220a', data.state.toString());
  //   data.state = data.state === 1 ? 0 : 1;
  // }

  console.log('socket connected')
});

const routineSchedule = [
  {
    type: 'fogger',
    num: '1',
    schedules: [
      {
        time: '0 42 21 * * *',
        delayToOff: 60000,
      }
    ],
  },
  {
    type: 'light',
    num: '1',
    schedules: [
      {
        time: '0 42 21 * * *',
        delayToOff: 60000,
      }
    ],
  }
];

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

createSchedule(mqttClient, io, routineSchedule);

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