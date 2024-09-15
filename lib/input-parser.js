const objectPath = require('object-path');
const clone = require('clone');
const flatten = require('flat');
const helpers = require('./helpers');
const batchParser = require('./batch-parser');
const flowInputParser = require('./flowInput-parser');
const dataSourceParser = require('./dataSource-parser');

/**
 * A class for parsing and handling structured input data.
 *
 * @class InputParser
 */
class InputParser {
    /**
     * Parses the input data and processes it based on the provided options.
     *
     * @param {Object} options - The options object for parsing.
     * @param {Array} options.nodeInput - The input data for the node to be parsed.
     * @param {string} options.flowInput
     * @param {string} options.parentOutput - Optional parent output data.
     * @param {string} options.index
     * @returns {Object} The result of the parsing operation.
     * @returns {boolean} return.batch - Indicates if the result is a batch.
     * @returns {Array|Object} return.input - The parsed input data.
     * @returns {Object} return.storage - A storage object used during parsing.
     *
     * @memberOf InputParser
     */
    parse(options) {
        if (!helpers.isObject(options)) {
            throw new TypeError('options');
        }
        const storage = Object.create(null);
        const newOptions = clone(options);
        const { result: flattenedValues, paths } = this._flattenValuesWithPath(newOptions.nodeInput);
        newOptions.nodeInput = flattenedValues;
        newOptions.nodeInput.forEach((ni, ind) => {
            newOptions.nodeInput[ind] = this.parseInput(newOptions, ni, storage);
        });

        const { batch, isBatch } = batchParser.parseBatchInput(newOptions, storage);
        batch.forEach((value) => {
            value.input = this._unFlattenValues(paths, value.input);
        });
        const input = isBatch ? batch : this._unFlattenValues(paths, newOptions.nodeInput);

        return {
            batch: isBatch,
            input,
            storage
        };
    }

    /**
     * Flattens nested data structures and records the paths to each value.
     *
     * @private
     * @param {Array|Object} input - The data to flatten.
     * @returns {Object} An object containing:
     * @returns {Array} result - The flattened values.
     * @returns {Array} paths - The paths to each flattened value.
     */
    _flattenValuesWithPath(input) {
        const result = [];
        const paths = [];

        function processItem(item, path = []) {
            if (Array.isArray(item)) {
                item.forEach((subItem, index) => processItem(subItem, [...path, index]));
            }
            else if (typeof item === 'object' && item !== null) {
                Object.keys(item).forEach(key => processItem(item[key], [...path, key]));
            }
            else {
                result.push(item);
                paths.push(path);
            }
        }

        processItem(input);
        return { result, paths };
    }

    /**
     * Reconstructs the original data structure from flattened values and paths.
     *
     * @private
     * @param {Array} paths - The paths to the flattened values.
     * @param {Array} newValues - The flattened values to reconstruct.
     * @returns {Array|Object} The reconstructed data structure.
     */
    _unFlattenValues(paths, newValues) {
        const reconstruct = (pathsArray, values) => {
            const result = [];
            pathsArray.forEach((path, index) => {
                let temp = result;
                for (let i = 0; i < path.length - 1; i += 1) {
                    const key = path[i];
                    if (temp[key] === undefined) {
                        temp[key] = (typeof path[i + 1] === 'string') ? {} : [];
                    }
                    temp = temp[key];
                }
                temp[path[path.length - 1]] = values[index];
            });
            return result;
        };
        return reconstruct(paths, newValues);
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
