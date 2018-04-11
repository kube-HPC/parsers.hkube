const objectPath = require('object-path');
const clone = require('clone');
const flatten = require('flat');
const uuidv4 = require('uuid/v4');
const RELATIONS = require('./const/relations');
const INPUTS_TO_RELATIONS = require('./const/inputs-to-relations');
const INPUTS = require('./const/inputs');

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
        if (!this._isObject(options)) {
            throw new TypeError('options');
        }
        const storage = Object.create(null);
        const newOptions = clone(options);
        newOptions.nodeInput.forEach((ni, ind) => {
            newOptions.nodeInput[ind] = this._parseFlowInput(newOptions, ni, storage);
        });

        const batchResult = this._parseBatchInput(newOptions, storage);
        const batch = batchResult.length > 0;
        const input = batch ? batchResult : newOptions.nodeInput;

        return {
            batch,
            input,
            storage
        };
    }

    extractNodesFromInput(input) {
        const results = [];
        const result = this._isNode(input);
        if (result.isNode) {
            results.push(result);
        }
        else if (this._isObject(input)) {
            this._recursivelyFindNodeInObject(input, results);
        }
        else if (Array.isArray(input)) {
            this._recursivelyFindNodeInArray(input, results);
        }
        return results.filter(r => r.isNode);
    }

    checkFlowInput(options) {
        return this._checkFlowInput(options, options.nodeInput);
    }

    checkStorageKeyword(options) {
        return this._parseValue(options, options.nodeInput, { checkStorageKeyword: true });
    }

    _checkFlowInput(options, input) {
        if (typeof input === 'string') {
            input = this._validateFlowInput(options, input);
        }
        else if (this._isObject(input)) {
            this._recursivelyCheckFlowInputObject(options, input);
        }
        else if (Array.isArray(input)) {
            this._recursivelyCheckFlowInputArray(options, input);
        }
    }

    _recursivelyCheckFlowInputArray(object, input) {
        input.forEach((a, i) => {
            if (Array.isArray(a)) {
                this._recursivelyArray(object, a);
            }
            else if (this._isObject(a)) {
                this._recursivelyObject(object, a);
            }
            else {
                this._validateFlowInput(object, a);
            }
        });
    }

    _recursivelyCheckFlowInputObject(object, input) {
        Object.entries(input).forEach(([key, val]) => {
            if (Array.isArray(val)) {
                this._recursivelyArray(object, val);
            }
            else if (this._isObject(val)) {
                this._recursivelyObject(object, val);
            }
            else {
                this._validateFlowInput(object, val);
            }
        });
    }

    replaceFlowInput(pipeline) {
        const metadata = {};
        if (pipeline.flowInput) {
            pipeline.nodes.forEach((node) => {
                const flatInput = Object.values(flatten(node.input)).map(v => this._extractObjectFromInput(v));
                flatInput.forEach((path) => {
                    if (this._isFlowInput(path)) {
                        const value = objectPath.get(pipeline, path);
                        metadata[path] = Array.isArray(value) ?
                            { type: 'array', size: value.length } :
                            { type: typeof (value) };
                    }
                });
            });
        }
        return metadata;
    }

    _parseValue(options, input, settings, storage) {
        if (input == null) {
            return null;
        }
        else if (typeof input === 'string') {
            input = this._extractValueFromInput(options, input, settings, storage);
        }
        else if (this._isObject(input)) {
            this._recursivelyObject(options, input, settings, storage);
        }
        else if (Array.isArray(input)) {
            this._recursivelyArray(options, input, settings, storage);
        }
        return input;
    }

    _parseFlowInput(options, input, storage) {
        return this._parseValue(options, input, { parseFlowInput: true }, storage);
    }

    _extractObjectFromInput(input) {
        let object;
        for (let v of Object.values(INPUTS)) {
            if (this._startsWith(input, v)) {
                object = input.substr(v.length);
                break;
            }
        }
        return object;
    }

    _isNode(input) {
        const result = {
            isNode: false
        };
        if (this._isReference(input)) {
            const path = this._extractObjectFromInput(input);
            const obj = this._constructObject(path);
            const isFlowInput = this._isFlowInput(path);
            result.nodeName = obj.object;
            result.isNode = !isFlowInput;
            result.type = this._inputToRelation(input);
        }
        return result;
    }

    _inputToRelation(input) {
        let object;
        for (let [k, v] of Object.entries(INPUTS_TO_RELATIONS)) {
            if (this._startsWith(input, k)) {
                object = v;
                break;
            }
        }
        return object;
    }

    _isFlowInput(input) {
        return this._startsWith(input, INPUTS.FLOW_INPUT);
    }

    _isStorage(input) {
        return this._startsWith(input, INPUTS.STORAGE);
    }

    _isBatch(input) {
        return this._isBatchRef(input) || this._isBatchRaw(input) || this._isWaitAnyBatch(input);
    }

    _isBatchRef(input) {
        return this._startsWith(input, INPUTS.BATCH);
    }

    _isBatchRaw(input) {
        return this._startsWith(input, INPUTS.BATCH_RAW);
    }

    _isObjRef(input) {
        return this._startsWith(input, INPUTS.REF);
    }

    _isWaitAnyBatch(input) {
        return this._startsWith(input, INPUTS.WAIT_ANY_BATCH);
    }

    _isReference(input) {
        return Object.keys(INPUTS_TO_RELATIONS).some(r => this._startsWith(input, r));
    }

    _startsWith(input, prefix) {
        return typeof input === 'string' && input.startsWith(prefix);
    }

    _constructObject(input) {
        const array = input.split('.');
        const object = array.shift();
        const path = array.join('.');
        return { object, path };
    }

    _isObject(object) {
        return Object.prototype.toString.call(object) === '[object Object]';
    }

    _parseBatchInput(options, storageData) {
        const path = [];
        const newInput = [];
        options.nodeInput = options.nodeInput || [];
        options.nodeInput.forEach((inp, ind) => {
            const result = this._createBatch(options, inp, path, storageData);
            if (Array.isArray(result)) {
                const { cleanStorage, isStorage } = this._filterStorage(result, storageData);
                result.forEach((res) => {
                    const storage = clone(cleanStorage);
                    const input = clone(options.nodeInput);
                    if (path.length > 0) {
                        objectPath.set(input[ind], path.join('.'), res);
                    }
                    else {
                        input[ind] = res;
                    }
                    if (isStorage) {
                        const storageKey = res.substr(2);
                        storage[storageKey] = storageData[storageKey];
                    }
                    newInput.push({ input, storage });
                });
            }
        });

        return newInput;
    }

    _filterStorage(result, storageData) {
        let cleanStorage = Object.create(null);
        const isStorage = this._isStorage(result[0]);
        if (isStorage) {
            const storageKeys = result.map(r => r.substr(2));
            Object.entries(storageData)
                .filter(([k, v]) => !storageKeys.includes(k))
                .reduce((map, obj) => {
                    const [key, val] = obj;
                    map[key] = val;
                    return map;
                }, cleanStorage);
        }
        else {
            cleanStorage = storageData;
        }
        return { cleanStorage, isStorage };
    }

    _createBatch(options, input, path, storage) {
        let result = null;
        if (this._isBatch(input)) {
            result = this._extractValueFromInput(options, input, { parseBatch: true }, storage);
        }
        else if (this._isObject(input)) {
            result = this._recursivelyObjectFindBatchKey(options, input, path, storage);
        }
        else if (Array.isArray(input)) {
            result = this._recursivelyArrayFindBatchKey(options, input, path, storage);
        }
        return result;
    }

    _isWaitBatch(type) {
        return type === RELATIONS.WAIT_BATCH || type === RELATIONS.WAIT_ANY_BATCH;
    }

    _isWaitAny(type) {
        return type === RELATIONS.WAIT_ANY || type === RELATIONS.WAIT_ANY_BATCH;
    }

    _recursivelyArrayFindBatchKey(object, input, path, storage) {
        let result = null;
        input.forEach((inp, ind) => {
            path.push(ind);
            if (this._isBatch(inp)) {
                result = this._extractValueFromInput(object, inp, { parseBatch: true }, storage);
            }
            else if (Array.isArray(inp)) {
                result = this._recursivelyArrayFindBatchKey(object, inp, path, storage);
            }
            else if (this._isObject(inp)) {
                result = this._recursivelyObjectFindBatchKey(object, inp, path, storage);
            }
            else {
                path.pop();
            }
        });
        return result;
    }

    _recursivelyObjectFindBatchKey(object, input, path, storage) {
        let result = null;
        Object.entries(input).forEach(([key, val]) => {
            path.push(key);
            if (this._isBatch(val)) {
                result = this._extractValueFromInput(object, val, { parseBatch: true }, storage);
            }
            else if (Array.isArray(val)) {
                result = this._recursivelyArrayFindBatchKey(object, val, path, storage);
            }
            else if (this._isObject(val)) {
                result = this._recursivelyObjectFindBatchKey(object, val, path, storage);
            }
            else {
                path.pop();
            }
        });
        return result;
    }

    _recursivelyArray(object, input, options, storage) {
        input.forEach((a, i) => {
            if (Array.isArray(a)) {
                this._recursivelyArray(object, a, options, storage);
            }
            else if (this._isObject(a)) {
                this._recursivelyObject(object, a, options, storage);
            }
            else {
                input[i] = this._extractValueFromInput(object, a, options, storage);
            }
        });
    }

    _recursivelyObject(object, input, options, storage) {
        Object.entries(input).forEach(([key, val]) => {
            if (Array.isArray(val)) {
                this._recursivelyArray(object, val, options, storage);
            }
            else if (this._isObject(val)) {
                this._recursivelyObject(object, val, options, storage);
            }
            else {
                input[key] = this._extractValueFromInput(object, val, options, storage);
            }
        });
    }

    _recursivelyFindNodeInArray(input, nodes) {
        input.forEach((a) => {
            const result = this._isNode(a);
            if (result.isNode) {
                nodes.push(result);
            }
            if (Array.isArray(a)) {
                this._recursivelyFindNodeInArray(a, nodes);
            }
            else if (this._isObject(a)) {
                this._recursivelyFindNodeInObject(a, nodes);
            }
        });
    }

    _recursivelyFindNodeInObject(input, nodes) {
        Object.entries(input).forEach(([key, val]) => {
            const result = this._isNode(val);
            if (result.isNode) {
                nodes.push(result);
            }
            else if (Array.isArray(val)) {
                this._recursivelyFindNodeInArray(val, nodes);
            }
            else if (this._isObject(val)) {
                this._recursivelyFindNodeInObject(val, nodes);
            }
        });
    }

    _validateFlowInput(options, input) {
        if (this._isReference(input)) {
            const obj = this._extractObjectFromInput(input);
            const isFlowInput = this._isFlowInput(obj);

            if (isFlowInput) {
                const flowInput = objectPath.get(options, obj);
                if (flowInput == null) {
                    throw new Error(`unable to find ${obj}`);
                }
            }
        }
        return input;
    }

    _extractValueFromInput(options, input, settings, storage) {
        options = options || {};
        settings = settings || {};
        storage = storage || {};
        const parentOutput = options.parentOutput || [];
        let result = input;

        if (this._isStorage(input) && settings.checkStorageKeyword) {
            throw new Error(`using reserved keyword ${INPUTS.STORAGE}`);
        }
        if (this._isBatchRaw(input) && settings.parseBatch) {
            const array = input.substr(1);
            result = this._tryParseJSON(array);
        }
        else if (this._isReference(input)) {
            if (this._isBatch(input) && !settings.parseBatch) {
                return input;
            }
            result = this._parseStorage(settings, input, parentOutput, storage, options);
        }
        return result;
    }

    _parseStorage(settings, input, parentOutput, storage, options) {
        let result;
        const reference = this._extractObjectFromInput(input);
        const construct = this._constructObject(reference);
        const type = this._inputToRelation(input);
        const isFlowInput = this._isFlowInput(reference);

        if (isFlowInput) {
            parentOutput.push({
                type,
                node: INPUTS.FLOW_INPUT,
                result: options.flowInput
            });
        }
        const isWaitBatch = this._isWaitBatch(type);
        const isWaitAny = this._isWaitAny(type);
        const index = isWaitAny ? options.index : null;
        const parent = parentOutput.find(o => o.type === type && o.index == index && o.node === construct.object);
        const parentResult = parent.result;
        if (!parentResult) {
            return null;
        }

        if (isWaitBatch) {
            result = [];
            if (Array.isArray(parentResult)) {
                parentResult.forEach((r) => {
                    const key = this._createStorage(storage, { storageInfo: r.storageInfo, path: construct.path });
                    result.push(key);
                });
            }
            else {
                const metadata = this._findMetadata(parentResult.metadata, reference);
                result = this._createStorageArray(metadata, storage, parentResult.storageInfo, construct.path);
            }
        }
        else {
            const storageInfo = Array.isArray(parentResult) ? parentResult.map(r => r && r.storageInfo) : parentResult.storageInfo;
            const key = this._createStorage(storage, { storageInfo, path: construct.path });
            result = key;
        }
        return result;
    }

    _createStorageArray(metadata, storage, storageInfo, path) {
        const result = [];
        if (Number.isInteger(metadata.size) && metadata.type === 'array') {
            Array.from(Array(metadata.size).keys()).forEach((i) => {
                const key = this._createStorage(storage, { storageInfo, path, index: i });
                result.push(key);
            });
        }
        return result;
    }

    _findMetadata(metadata, reference) {
        let result = null;
        Object.entries(metadata).forEach(([k, v]) => {
            if (k === reference) {
                result = v;
            }
        });
        return result;
    }

    _createStorage(storage, data) {
        const uuid = uuidv4();
        storage[uuid] = data;
        return `${INPUTS.STORAGE}${uuid}`;
    }

    _tryParseJSON(json) {
        let parsed = json;
        try {
            parsed = JSON.parse(json);
        }
        catch (e) {
        }
        return parsed;
    }
}

module.exports = new InputParser();
