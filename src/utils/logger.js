const chalk = require('chalk');

module.exports = {
  juana: msg => console.log(chalk.blue('>Juana: ' + msg)),
  server: msg => console.log(chalk.green('>Server: ' + msg)),
  socket: msg => console.log(chalk.greenBright('>Socket: ' + msg)),
  error: msg => console.log(chalk.red('>Error: ' + msg)),
};
