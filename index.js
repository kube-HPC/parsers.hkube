const inputs = require('./lib/const/inputs');
const relations = require('./lib/const/relations');
const parser = require('./lib/input-parser');

module.exports = {
    parser,
    consts: {
        inputs,
        relations
    }
}

