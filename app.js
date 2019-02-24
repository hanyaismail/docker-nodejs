const fs = require('fs');
const moment = require('moment');
const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const mqtt = require('mqtt');
const Scheduler = require('./test-scheduler');
const mqttClient = mqtt.connect('ws://iot.eclipse.org:80/ws');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const jade = require('jade');
// const { stopAllTask, createSchedule } = require('./test-scheduler');
const PORT = 8080;

// const schedulerApi = new Scheduler(mqttClient, io);

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
        time: '0 32 23 * * *',
        delayToOff: 10000,
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

// create schedule
// schedulerApi.createTask(routineSchedule);

app.set('view engine', 'jade');

app.use(express.static(__dirname + '/public'));

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.use(cookieParser());

// initialize express-session to allow us track the logged-in user across sessions.
app.use(session({
    key: 'user_sid',
    secret: 'somerandonstuffs',
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: 600000
    }
}));

// This middleware will check if user's cookie is still saved in browser and user is not set, then automatically log the user out.
// This usually happens when you stop your express server after login, your cookie still remains saved in the browser.
app.use((req, res, next) => {
  if (req.cookies.user_sid && !req.session.user) {
      res.clearCookie('user_sid');        
  }
  next();
});

// middleware function to check for logged-in users
const sessionChecker = (req, res, next) => {
  if (req.session.user && req.cookies.user_sid) {
      console.log('good')
      res.redirect('/ndasbor');
  } else {
      next();
  }    
};

const users = [
  {
    username: "ninja",
    password: "ninja",
  },
  {
    username: "coola",
    password: "coola",
  }
]

// route for user Login
app.route('/login')
    .get(sessionChecker, (req, res) => {
      res.render('login')
    })
    .post((req, res) => {
        const username = req.body.username,
              password = req.body.password;

        const user = users.find(user => user.username === username)
        console.log('found user', user)
        if(!user) {
          console.log('no user')
          return res.redirect('/login');
        }

        if(user.password !== password) {
          console.log('wrong password')
          return res.redirect('/login');
        }

        req.session.user = user;
        res.redirect('/ndasbor');
    });

app.get('/ndasbor', (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    res.render('dashboard');
  } else {
    res.redirect('/login');
  }
});

// route for user logout
app.get('/logout', (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
      res.clearCookie('user_sid');
      res.redirect('/');
  } else {
      res.redirect('/login');
  }
});

app.get('/', sessionChecker, (req, res) => {
  res.redirect('/login');
});

server.listen(PORT, () => {
  console.log(`server run on port ${PORT}`)
})