const chalk = require('chalk'),
process = require('process'),
os = require('os'),
fse = require('fs-extra'),
https = require('https'); ;

// Can not use in China(at 2020/05/05 21:29)
//const MCASSETS_RAW = 'https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/';
// The image hosted on gitee maintained by xtex is accessible in China, but the update may not be timely
const MCASSETS_RAW = 'https://gitee.com/xtex/minecraft-assets/raw/';

var caches = os.homedir() + "/IceCanary/Caches";

function httpsSync(url) {
    return new Promise(function (resolve, reject) {
        var req = http.get(url, function (res) {
                res.setEncoding(encoding);
                res.on('data', function (chunk) {
                    data += chunk;
                });
                res.on('end', function () {
                    resolve({
                        result: true,
                        data: data
                    });
                });
            });

        req.on('error', (e) => {
            resolve({
                result: false,
                errmsg: e.message
            });
        });
        req.end();
    });
}

var Utils = {
    error: function (message) {
        console.log(chalk.red.bold('ERROR: ') + message);
        process.exit();
    },
    info: function (message) {
        console.log(chalk.green.bold('INFO: ') + message);
    },
    getAsset: function (mcversion, path, callback) {
        path = path.toLowerCase();
        var allPath = caches + "/" + mcversion + "/" + path;
        if (!fse.existsSync(allPath)) {
            fse.createFileSync(allPath);
            fse.unlinkSync(allPath);
            var url = MCASSETS_RAW + mcversion + "/" + path;
            Utils.info(`Downloading Minecraft asset file ${path} for Minecraft ${mcversion} from ${url}`);
            https.get(url, function (res) {
                if (res.statusCode != 200)
                    Utils.error(`Failed to cache Minecraft asset file ${path} for Minecraft ${mcversion} from ${url} because server responsed status code ${res.statusCode}.`);
                var data = "";
                res.on('data', function (chunk) {
                    data += chunk;
                });
                res.on('end', function () {
                    fse.writeFileSync(allPath, data);
                    callback(data.toString());
                });
            }).on('error', Utils.error);
        } else
            callback(fse.readFileSync(allPath).toString());
    },
    getChalk: function () {
        return chalk;
    },
    createASyncHolder: function () {
        var o = {
            tasks: 0,
            callback: undefined
        };
        o.start = function () {
            this.tasks++;
        }
        o.end = function () {
            this.tasks--;
            if (this.tasks == 0 && this.callback != undefined)
                this.callback();
        }
        o.setupCallback = function (func) {
            if (this.tasks == 0)
                func();
            else
                this.callback = func;
        }
        return o;
    },
    trimPath: function (src) {
        while (src.startsWith('\\') || src.startsWith('/'))
            src = src.slice(1);
        return src;
    },
    deobjectiveObject: function (src, header, dest) {
        for (name in src) {
            if (src[name].indexOf) {
                dest[header + name] = src[name];
            } else {
                Utils.deobjectiveObject(src[name], header + name + '.', dest);
            }
        }
    }
};

module.exports = Utils;
