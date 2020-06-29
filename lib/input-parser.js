const objectPath = require('object-path');
const clone = require('clone');
const flatten = require('flat');
const helpers = require('./helpers');
const batchParser = require('./batch-parser');
const flowInputParser = require('./flowInput-parser');

class InputParser {
    /**
     *
     *
     * @param {Object} options
     * @param {string} options.flowInput
     * @param {string} options.nodeInput
     * @param {string} options.parentOutput
     * @param {string} options.index
     * @returns
     *
     * @memberOf InputParser
     */
    parse(options) {
        if (!helpers.isObject(options)) {
            throw new TypeError('options');
        }
        const storage = Object.create(null);
        const newOptions = clone(options);
        newOptions.nodeInput.forEach((ni, ind) => {
            newOptions.nodeInput[ind] = this.parseInput(newOptions, ni, storage);
        });

        const { batch, isBatch } = batchParser.parseBatchInput(newOptions, storage);
        const input = isBatch ? batch : newOptions.nodeInput;

        return {
            batch: isBatch,
            input,
            storage
        };
    }

    parseInput(options, input, storage) {
        return helpers.parseValue(options, input, { parseFlowInput: true }, storage);
    }

    extractNodesFromInput(input) {
        const results = [];
        const result = helpers.isNode(input);
        if (result.isNode) {
            results.push(result);
        }
        else if (helpers.isObject(input)) {
            this._recursivelyFindNodeInObject(input, results);
        }
        else if (Array.isArray(input)) {
            this._recursivelyFindNodeInArray(input, results);
        }
        return results.filter(r => r.isNode);
    }

    checkFlowInput(options) {
        return flowInputParser.checkFlowInput(options, options.nodeInput);
    }

    checkStorageKeyword(options) {
        return helpers.parseValue(options, options.nodeInput, { checkStorageKeyword: true });
    }

    replaceNodeInput(input, key, prefix = true, sep = '-') {
        const newInput = clone(input);
        Object.entries(flatten(newInput)).forEach(([k, v]) => {
            const type = helpers.isNode(v);
            if (type.isNode) {
                let inp;
                if (prefix) {
                    inp = `${type.sign}${key}${sep}${type.path}`;
                }
                else {
                    inp = `${type.sign}${type.path}${sep}${key}`;
                }
                objectPath.set(newInput, k, inp);
            }
        });
        return newInput;
    }

    findNodeRelation(input, relation) {
        let result = null;
        Object.entries(flatten(input)).forEach(([, v]) => {
            const node = helpers.isNode(v);
            if (node.isNode && node.type === relation) {
                result = node;
            }
        });
        return result;
    }

    replaceFlowInput(pipeline) {
        const metadata = {};
        pipeline.nodes.forEach((node) => {
            const flatInput = Object.values(flatten(node.input)).map(v => helpers.extractObjectFromInput(v));
            flatInput.forEach((path) => {
                if (helpers.isFlowInput(path)) {
                    const value = objectPath.get(pipeline, path);
                    this._setMetadata(value, path, metadata);
                }
            });
        });
        return metadata;
    }

    objectToMetadata(object, pathList) {
        const paths = pathList || [];
        const metadata = Object.create(null);
        paths.forEach((p) => {
            const value = objectPath.get(object, p, 'DEFAULT');
            if (value !== 'DEFAULT') {
                this._setMetadata(value, p, metadata);
            }
        });
        return metadata;
    }

    _setMetadata(value, path, metadata) {
        metadata[path] = Array.isArray(value)
            ? { type: 'array', size: value.length }
            : { type: typeof (value) };
    }

    _recursivelyFindNodeInArray(input, nodes) {
        input.forEach((a) => {
            const result = helpers.isNode(a);
            if (result.isNode) {
                nodes.push(result);
            }
            if (Array.isArray(a)) {
                this._recursivelyFindNodeInArray(a, nodes);
            }
            else if (helpers.isObject(a)) {
                this._recursivelyFindNodeInObject(a, nodes);
            }
        });
    }

    _recursivelyFindNodeInObject(input, nodes) {
        Object.entries(input).forEach(([, val]) => {
            const result = helpers.isNode(val);
            if (result.isNode) {
                nodes.push(result);
            }
            else if (Array.isArray(val)) {
                this._recursivelyFindNodeInArray(val, nodes);
            }
            else if (helpers.isObject(val)) {
                this._recursivelyFindNodeInObject(val, nodes);
            }
        });
    }
}

module.exports = new InputParser();
