const ora = require('ora');

function spinner(text = 'loading...') {
    const spinner = ora();
    spinner.start();
    spinner.color = 'yellow';
    spinner.text = text;
    return spinner;
}

module.exports = spinner;