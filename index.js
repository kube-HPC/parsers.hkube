const inputs = require('./lib/const/inputs');
const relations = require('./lib/const/relations');
const parser = require('./lib/input-parser');
const helpers = require('./lib/helpers');

module.exports = {
    parser,
    helpers,
    consts: {
        inputs,
        relations
    }
};
