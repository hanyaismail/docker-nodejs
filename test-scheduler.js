const cron = require('node-cron');
let taskArr = [];

function stopAllTask() {
  console.log('stopping task');
  taskArr.forEach(task => {
    task.stop();
  })
  taskArr = [];
  console.log('stop taskArr length', taskArr.length);
}

function createSchedule(timeArr, cb) {
  console.log(timeArr)
  timeArr.forEach(time => {
    const task = cron.schedule(`${time}`, cb);
    taskArr.push(task);
  })
  console.log('create taskArr length', taskArr.length);
}

module.exports = {stopAllTask, createSchedule};