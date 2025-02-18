const fs = require('fs');
const chokidar = require('chokidar');
const devServer = require('./devserver');
const bundler = require('../modules/bundler');
const APP_PATH = '.';

let fileWatcher = null;

module.exports.start = () => {
    startFileWatcher();
    devServer.start();
}

module.exports.stop = () => {
    if(fileWatcher)
        fileWatcher.close();
    devServer.stop();
}

function startFileWatcher() {
    if(!fs.existsSync(APP_PATH))
        return;
    fileWatcher = chokidar.watch(APP_PATH , {ignoreInitial: true}).on('all', (event, path) => {
        if(['unlink', 'unlinkDir'].includes(event))
            return;
        devServer.setData({
            needsReload: true
        });
    });
}
