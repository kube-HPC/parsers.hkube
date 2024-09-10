const objectPath = require('object-path');
const clone = require('clone');
const flatten = require('flat');
const helpers = require('./helpers');
const batchParser = require('./batch-parser');
const flowInputParser = require('./flowInput-parser');
const dataSourceParser = require('./dataSource-parser');

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
        newOptions.nodeInput = newOptions.nodeInput.map(ni => this.parseInput(newOptions, ni, storage));

        const input = [];
        let isThereBatch = false;
        const allNodeInput = clone(newOptions.nodeInput);

        allNodeInput.forEach((ni, ind) => {
            const currNi = helpers.isObject(ni) ? Object.entries(ni) : ni;
            if (Array.isArray(currNi)) {
                currNi.forEach((value, key) => {
                    isThereBatch = isThereBatch || this._handleNodeInput(ind, { [key]: value }, newOptions, storage, input);
                });
            }
            else {
                isThereBatch = isThereBatch || this._handleNodeInput(ind, currNi, newOptions, storage, input);
            }
        });

        return {
            batch: isThereBatch,
            input,
            storage
        };
    }

    /**
     * Processes the given node input and adds the processed input to the provided input array.
     *
     * @param {number} ind - Index of the node input.
     * @param {object} niValue - Node input value to process.
     * @param {object} newOptions - Options object.
     * @param {object} storage - Storage for input.
     * @param {Array} input - Array to collect processed inputs.
     * @returns {boolean} True if the result is a batch, false otherwise.
     */
    _handleNodeInput(ind, niValue, newOptions, storage, input) {
        const oldValue = newOptions.nodeInput[ind];
        newOptions.nodeInput[ind] = niValue;
        const { batch, isBatch } = batchParser.parseBatchInput(newOptions, storage);
        if (isBatch) {
            input.push(...batch);
            return true;
        }
        input.push(oldValue);
        return false;
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
        return flowInputParser.replaceFlowInput(pipeline);
    }

    extractDataSourceMetaData({ pipeline }) {
        return dataSourceParser.extractDataSourceMetaData({ pipeline });
    }

    objectToMetadata(object, pathList) {
        const paths = pathList || [];
        const metadata = Object.create(null);
        paths.forEach((p) => {
            const value = helpers.getPath(object, p);
            if (value !== undefined) {
                const meta = helpers.getMetadata(value);
                metadata[p] = meta;
            }
        });
        return metadata;
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
