const cron = require('node-cron');
const moment = require('moment');

class Scheduler {
  constructor(mqttClient, io) {
    this._mqttClient = mqttClient
    this._io = io
    this._taskArr = []
  }

  stopAllTask() {
    console.log('stopping task');
    this._taskArr.forEach(task => {
      task.stop();
    })
    this._taskArr = [];
    console.log('stop taskArr length', taskArr.length);
  }

  createTask(routineArr) {
    console.log(routineArr);

    routineArr.forEach(routine => {
      console.log(routine)
      routine.schedules.forEach(item => {
        const task = cron.schedule(`${item.time}`, () => {
          console.log(moment());
    
          this._mqttClient.publish(`inTopic_ismail220a/${routine.type}/${routine.num}`, '1');
          
          let data = {}
          data.state = 1;
          data[`${routine.type}Num`] = routine.num
          
          this._io.emit(`${routine.type}Change`, data);
    
          setTimeout(() => {
            data.state = 0;
            this._mqttClient.publish(`inTopic_ismail220a/${routine.type}/${routine.num}`, '0');
            this._io.emit(`${routine.type}Change`, data);
          }, item.delayToOff)
        });
        taskArr.push(task);
      })
    })
    console.log('create taskArr length', taskArr.length);
  }
}

module.exports = Scheduler;