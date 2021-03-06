const flatten = require('flat');
const helpers = require('./helpers');

class InputParser {
    checkFlowInput(options, input) {
        let object;
        if (helpers.isObject(input) || Array.isArray(input)) {
            object = flatten(input);
        }
        else {
            object = { input };
        }
        Object.values(object).forEach(v => this._validateFlowInput(options, v));
    }

    replaceFlowInput(pipeline) {
        return helpers.pipelineNodesToMetaData(pipeline, (v => helpers.isFlowInput(v)), (path) => {
            const value = helpers.getPath(pipeline, path);
            return helpers.getMetadata(value);
        });
    }

    _validateFlowInput(options, input) {
        if (!helpers.isReference(input)) {
            return;
        }
        const obj = helpers.extractObjectFromInput(input);
        const isFlowInput = helpers.isFlowInput(obj);

        if (isFlowInput) {
            const flowInput = helpers.getPath(options, obj);
            if (flowInput === undefined) {
                throw new Error(`unable to find ${obj}`);
            }
        }
    }
}

module.exports = new InputParser();
