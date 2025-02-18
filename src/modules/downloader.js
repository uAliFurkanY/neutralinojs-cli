const fs = require('fs');
const fse = require('fs-extra');
const { https } = require('follow-redirects');
const constants = require('../constants');
const unzipper = require('unzipper');
const settings = require('../modules/settings');

let downloadFromRelease = (callback, name = null) => {
    let pathPrefix = name ? `${name}/` : '';
    fs.mkdirSync(`${pathPrefix}temp`, { recursive: true });
    const file = fs.createWriteStream(`${pathPrefix}temp/binaries.zip`);
    console.log('Downloading latest Neutralinojs binaries..');
    https.get(constants.binaries.url, function (response) {
        response.pipe(file);
        response.on('end', () => {
            console.log('Extracting zip file..');
            fs.createReadStream(`${pathPrefix}temp/binaries.zip`)
                .pipe(unzipper.Extract({ path: `${pathPrefix}temp/` }))
                .promise().then(() => { callback(name) });
        });
    });
}

let clearDownloadCache = (pathPrefix) => {
    fse.removeSync(`${pathPrefix}temp`);
}

module.exports.downloadTemplate = (template, callback, name = null) => {
    let pathPrefix = name ? `${name}/` : '';
    let templateUrl = `https://github.com/neutralinojs/${template.repoId}/archive/main.zip`;
    fs.mkdirSync(`${pathPrefix}temp`, { recursive: true });
    const file = fs.createWriteStream(`${pathPrefix}temp/template.zip`);
    https.get(templateUrl, function (response) {
        response.pipe(file);
        response.on('end', () => {
            console.log('Extracting template zip file..');
            fs.createReadStream(`${pathPrefix}temp/template.zip`)
                .pipe(unzipper.Extract({ path: `${pathPrefix}temp/` }))
                .promise().then(() => {
                    fse.copySync(`${pathPrefix}temp/${template.repoId}-main`, `${pathPrefix}`);
                    clearDownloadCache(pathPrefix);
                    callback(name);
                });
        });
    });
}

module.exports.downloadAndUpdateBinaries = (callback, name) => {
    let pathPrefix = name ? `${name}/` : '';
    let appNameFromSettings = false;
    if(!name) {
        appNameFromSettings = true;
        name = settings.get().cli.binaryName;
    }

    downloadFromRelease(() => {
        console.log('Finalizing and cleaning temp. files.');
        fse.mkdirSync(`${pathPrefix}bin`);
        fse.copySync(`${pathPrefix}temp/neutralino-win.exe`, `${pathPrefix}bin/neutralino-win.exe`);
        fse.copySync(`${pathPrefix}temp/neutralino-linux`, `${pathPrefix}bin/neutralino-linux`);
        fse.copySync(`${pathPrefix}temp/neutralino-mac`, `${pathPrefix}bin/neutralino-mac`);
        fse.copySync(`${pathPrefix}temp/WebView2Loader.dll`, `${pathPrefix}bin/WebView2Loader.dll`);
        clearDownloadCache(pathPrefix);
        if(callback)
            callback();
    }, appNameFromSettings ? null : name);
}

