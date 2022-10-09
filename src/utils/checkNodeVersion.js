const chalk = require('chalk');
const semver = require('semver');
const pkg = require('../../package.json');

module.exports = function() {
    if (semver.lt(process.version, semver.minVersion(pkg.engines.node))) {
        console.log(`该软件包需要node版本${chalk.red(pkg.engines.node)}，请升级node版本。`);
        process.exit(0);
    }
};