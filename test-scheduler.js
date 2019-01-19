const cron = require('node-cron');
const moment = require('moment');
let taskArr = [];

function stopAllTask() {
  console.log('stopping task');
  taskArr.forEach(task => {
    task.stop();
  })
  taskArr = [];
  console.log('stop taskArr length', taskArr.length);
}

function createSchedule(mqttClient, io, routineArr) {
  console.log(routineArr);

  routineArr.forEach(routine => {
    console.log(routine)
    routine.schedules.forEach(item => {
      const task = cron.schedule(`${item.time}`, () => {
        console.log(moment());
  
        mqttClient.publish(`inTopic_ismail220a/${routine.type}/${routine.num}`, '1');
        
        let data = {}
        data.state = 1;
        data[`${routine.type}Num`] = routine.num
        
        io.emit(`${routine.type}Change`, data);
  
        setTimeout(() => {
          data.state = 0;
          mqttClient.publish(`inTopic_ismail220a/${routine.type}/${routine.num}`, '0');
          io.emit(`${routine.type}Change`, data);
        }, item.delayToOff)
      });
      taskArr.push(task);
    })
  })
  console.log('create taskArr length', taskArr.length);
}

module.exports = {stopAllTask, createSchedule};