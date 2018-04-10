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
        options = options || {};
        if (!this._isObject(options)) {
            throw new TypeError('options');
        }
        const info = {
            storage: {}
        };
        const newOptions = clone(options);
        const batch = this._parseBatchInput(newOptions, info);
        const isBatch = batch.length > 0;
        const inputObj = isBatch ? batch : newOptions.nodeInput;

        inputObj.forEach((ni, ind) => {
            inputObj[ind] = this._parseFlowInput(newOptions, ni, info);
            if (newOptions.parentOutput) {
                const res = this._parseParentNodeOutput(newOptions, ni, info);
                if (res) {
                    inputObj[ind] = res;
                }
            }
        });
        return {
            batch: isBatch,
            input: inputObj,
            storage: info.storage
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
                    if (typeof path === 'string' && path.startsWith(INPUTS.FLOW_INPUT)) {
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

    _parseValue(options, input, settings, info) {
        if (input == null) {
            return null;
        }
        else if (typeof input === 'string') {
            input = this._extractValueFromInput(options, input, settings, info);
        }
        else if (this._isObject(input)) {
            this._recursivelyObject(options, input, settings, info);
        }
        else if (Array.isArray(input)) {
            this._recursivelyArray(options, input, settings, info);
        }
        return input;
    }

    _parseFlowInput(options, input, info) {
        return this._parseValue(options, input, { parseFlowInput: true }, info);
    }

    _parseParentNodeOutput(options, input, info) {
        return this._parseValue(options, input, { parseParentNode: true }, info);
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
            const isFlowInput = obj.object === INPUTS.FLOW_INPUT;
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

    _parseBatchInput(options, info) {
        const path = [];
        const newInput = [];
        options.nodeInput = options.nodeInput || [];
        options.nodeInput.forEach((inp, ind) => {
            const result = this._createBatch(options, inp, path, info);
            if (Array.isArray(result)) {
                result.forEach((res) => {
                    const tmpInput = clone(options.nodeInput);
                    if (path.length > 0) {
                        objectPath.set(tmpInput[ind], path.join('.'), res);
                    }
                    else {
                        tmpInput[ind] = res;
                    }
                    newInput.push(tmpInput);
                });
            }
        });
        return newInput;
    }

    _createBatch(options, input, path, info) {
        let result = null;
        if (this._isBatch(input)) {
            result = this._extractValueFromInput(options, input, { parseBatch: true }, info);
        }
        else if (this._isObject(input)) {
            result = this._recursivelyObjectFindBatchKey(options, input, path, info);
        }
        else if (Array.isArray(input)) {
            result = this._recursivelyArrayFindBatchKey(options, input, path, info);
        }
        return result;
    }

    _isWaitBatch(type) {
        return type === RELATIONS.WAIT_BATCH || type === RELATIONS.WAIT_ANY_BATCH;
    }

    _isWaitAny(type) {
        return type === RELATIONS.WAIT_ANY || type === RELATIONS.WAIT_ANY_BATCH;
    }

    _recursivelyArrayFindBatchKey(object, input, path, info) {
        let result = null;
        input.forEach((inp, ind) => {
            path.push(ind);
            if (this._isBatch(inp)) {
                result = this._extractValueFromInput(object, inp, { parseBatch: true }, info);
            }
            else if (Array.isArray(inp)) {
                result = this._recursivelyArrayFindBatchKey(object, inp, path, info);
            }
            else if (this._isObject(inp)) {
                result = this._recursivelyObjectFindBatchKey(object, inp, path, info);
            }
            else {
                path.pop();
            }
        });
        return result;
    }

    _recursivelyObjectFindBatchKey(object, input, path, info) {
        let result = null;
        Object.entries(input).forEach(([key, val]) => {
            path.push(key);
            if (this._isBatch(val)) {
                result = this._extractValueFromInput(object, val, { parseBatch: true }, info);
            }
            else if (Array.isArray(val)) {
                result = this._recursivelyArrayFindBatchKey(object, val, path, info);
            }
            else if (this._isObject(val)) {
                result = this._recursivelyObjectFindBatchKey(object, val, path, info);
            }
            else {
                path.pop();
            }
        });
        return result;
    }

    _recursivelyArray(object, input, options, info) {
        input.forEach((a, i) => {
            if (Array.isArray(a)) {
                this._recursivelyArray(object, a, options, info);
            }
            else if (this._isObject(a)) {
                this._recursivelyObject(object, a, options, info);
            }
            else {
                input[i] = this._extractValueFromInput(object, a, options, info);
            }
        });
    }

    _recursivelyObject(object, input, options, info) {
        Object.entries(input).forEach(([key, val]) => {
            if (Array.isArray(val)) {
                this._recursivelyArray(object, val, options, info);
            }
            else if (this._isObject(val)) {
                this._recursivelyObject(object, val, options, info);
            }
            else {
                input[key] = this._extractValueFromInput(object, val, options, info);
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
        const obj = this._extractObjectFromInput(input);
        const flowInput = objectPath.get(options, obj);
        if (flowInput == null) {
            throw new Error(`unable to find ${obj}`);
        }
        return input;
    }

    _extractValueFromInput(options, input, settings, info) {
        options = options || {};
        settings = settings || {};
        info = info || {};
        info.storage = info.storage || {};
        const parentOutput = options.parentOutput || [];
        let result = input;
        const isBatchRaw = this._isBatchRaw(input);
        const isStorage = this._isStorage(input);

        if (settings.checkStorageKeyword && isStorage) {
            throw new Error(`using reserved keyword ${INPUTS.STORAGE}`);
        }
        if (isBatchRaw) {
            const array = input.substr(1);
            result = this._tryParseJSON(array);
        }
        else if (this._isReference(input)) {
            if (settings.parseBatch || settings.parseParentNode || settings.parseFlowInput) {
                result = this._parseStorage(input, parentOutput, info, options);
            }
        }
        return result;
    }

    _parseStorage(input, parentOutput, info, options) {
        let result;
        const reference = this._extractObjectFromInput(input);
        const construct = this._constructObject(reference);
        const type = this._inputToRelation(input);
        const isFlowInput = construct.object === INPUTS.FLOW_INPUT;

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
                    const key = this._createStorage(info.storage, { storageInfo: r.storageInfo, path: construct.path });
                    result.push(key);
                });
            }
            else {
                const metadata = this._findMetadata(parentResult.metadata, reference);
                result = this._createStorageArray(metadata, info.storage, parentResult.storageInfo, construct.path);
            }
        }
        else {
            const storageInfo = Array.isArray(parentResult) ? parentResult.map(r => r && r.storageInfo) : parentResult.storageInfo;
            const key = this._createStorage(info.storage, { storageInfo, path: construct.path });
            result = key;
        }
        return result;
    }

    _createStorageArray(metadata, storage, storageInfo, path) {
        const result = [];
        if (Number.isInteger(metadata.size)) {
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
