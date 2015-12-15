/**
 * Database methods
 */

var abi = require("augur-abi");
if (typeof localStorage === "undefined" || localStorage === null) {
    var LocalStorage = require("node-localstorage").LocalStorage;
    localStorage = new LocalStorage("./scratch");
}
var errors = require("../errors");
var constants = require("../constants");
var utils = require("../utilities");

module.exports = {

    put: function (label, data, cb) {
        if (label !== null && label !== undefined && label !== '' && data) {
            var account = {
                label: abi.prefix_hex(utils.sha256(label)),
                privateKey: data.privateKey,
                iv: abi.pad_left(data.iv, 32, true),
                salt: data.salt,
                mac: data.mac,
                id: abi.pad_left(data.id, 32, true)
            };
            localStorage.setItem(account.label, JSON.stringify(account));
            if (!utils.is_function(cb)) return true;
            if (typeof chrome === "undefined" || !chrome || !chrome.runtime) {
                return cb(true);
            }
            var item = {};
            item[account.label] = JSON.stringify(account);
            console.log("[db] chrome id:", constants.CHROME_ID);
            console.log("[db] item:", item);
            chrome.runtime.sendMessage(constants.CHROME_ID, item, null, function (res) {
                console.log("[db] response:", res);
                console.log(chrome.runtime.lastError);
                return cb(true);
            });
        }
        if (!utils.is_function(cb)) return errors.DB_WRITE_FAILED;
        cb(errors.DB_WRITE_FAILED);
    },

    get: function (label, cb) {
        if (label && label !== '') {
            var item = localStorage.getItem(abi.prefix_hex(utils.sha256(label)));
            if (item !== null) {
                try {
                    item = JSON.parse(item);
                    if (item && item.constructor === Object && item.privateKey) {
                        var account = {
                            handle: label,
                            privateKey: new Buffer(abi.unfork(item.privateKey), "hex"),
                            iv: new Buffer(abi.pad_left(item.iv, 32), "hex"),
                            salt: new Buffer(abi.unfork(item.salt), "hex"),
                            mac: new Buffer(abi.unfork(item.mac), "hex"),
                            id: new Buffer(abi.pad_left(item.id, 32), "hex")
                        };
                        if (!utils.is_function(cb)) return account;
                        return cb(account);
                    }
                    if (!utils.is_function(cb)) return errors.DB_READ_FAILED;
                    return cb(errors.DB_READ_FAILED);
                } catch (exc) {
                    console.error(exc);
                    if (!utils.is_function(cb)) return errors.DB_READ_FAILED;
                    return cb(errors.DB_READ_FAILED);
                }
            }
            if (!utils.is_function(cb)) return errors.DB_READ_FAILED;
            return cb(errors.DB_READ_FAILED);
        }
        if (!utils.is_function(cb)) return errors.DB_READ_FAILED;
        cb(errors.DB_READ_FAILED);
    }

};
