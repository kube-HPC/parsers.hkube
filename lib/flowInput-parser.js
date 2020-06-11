const objectPath = require('object-path');
const helpers = require('./helpers');

class InputParser {
    checkFlowInput(options, input) {
        if (typeof input === 'string') {
            input = this._validateFlowInput(options, input);
        }
        else if (helpers.isObject(input)) {
            this._recursivelyCheckFlowInputObject(options, input);
        }
        else if (Array.isArray(input)) {
            this._recursivelyCheckFlowInputArray(options, input);
        }
    }

    parseFlowInput(options, input, storage) {
        return helpers.parseValue(options, input, { parseFlowInput: true }, storage);
    }

    _validateFlowInput(options, input) {
        if (helpers.isReference(input)) {
            const obj = helpers.extractObjectFromInput(input);
            const isFlowInput = helpers.isFlowInput(obj);

            if (isFlowInput) {
                const flowInput = objectPath.get(options, obj);
                if (flowInput === undefined) {
                    throw new Error(`unable to find ${obj}`);
                }
            }
        }
        return input;
    }

    _recursivelyCheckFlowInputArray(object, input) {
        input.forEach((a) => {
            if (Array.isArray(a)) {
                this._recursivelyCheckFlowInputArray(object, a);
            }
            else if (helpers.isObject(a)) {
                this._recursivelyCheckFlowInputObject(object, a);
            }
            else {
                this._validateFlowInput(object, a);
            }
        });
    }

    _recursivelyCheckFlowInputObject(object, input) {
        Object.entries(input).forEach(([, val]) => {
            if (Array.isArray(val)) {
                this._recursivelyCheckFlowInputArray(object, val);
            }
            else if (helpers.isObject(val)) {
                this._recursivelyCheckFlowInputObject(object, val);
            }
            else {
                this._validateFlowInput(object, val);
            }
        });
    }
}

module.exports = new InputParser();
