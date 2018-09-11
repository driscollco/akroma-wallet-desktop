"use strict";
exports.__esModule = true;
var environment_local_1 = require("../environments/environment.local");
var environment_dev_1 = require("../environments/environment.dev");
var environment_prod_1 = require("../environments/environment.prod");
var ENV = 'prod';
var LOCAL = 'local';
var DEV = 'dev';
var PROD = 'prod';
var conf;
console.log('Env', ENV);
if (ENV === PROD) {
    conf = environment_prod_1.CONF_PROD;
}
else if (ENV === DEV) {
    conf = environment_dev_1.CONF_DEV;
}
else {
    conf = environment_local_1.CONF_LOCAL;
}
exports.AppConfig = Object.assign({}, conf);
