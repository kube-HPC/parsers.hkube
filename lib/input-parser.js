const objectPath = require('object-path');
const clone = require('clone');
const flatten = require('flat');
const uuidv4 = require('uuid/v4');
const lodashPick = require('lodash.pick');
const lodashMerge = require('lodash.merge');
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

        const { batch, isBatch } = this._parseBatchInput(newOptions, storage);
        const input = isBatch ? batch : newOptions.nodeInput;

        return {
            batch: isBatch,
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
                this._recursivelyCheckFlowInputArray(object, a);
            }
            else if (this._isObject(a)) {
                this._recursivelyCheckFlowInputObject(object, a);
            }
            else {
                this._validateFlowInput(object, a);
            }
        });
    }

    _recursivelyCheckFlowInputObject(object, input) {
        Object.entries(input).forEach(([key, val]) => {
            if (Array.isArray(val)) {
                this._recursivelyCheckFlowInputArray(object, val);
            }
            else if (this._isObject(val)) {
                this._recursivelyCheckFlowInputObject(object, val);
            }
            else {
                this._validateFlowInput(object, val);
            }
        });
    }

    replaceFlowInput(pipeline) {
        const metadata = {};
        pipeline.nodes.forEach((node) => {
            const flatInput = Object.values(flatten(node.input)).map(v => this._extractObjectFromInput(v));
            flatInput.forEach((path) => {
                if (this._isFlowInput(path)) {
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
        metadata[path] = Array.isArray(value) ?
            { type: 'array', size: value.length } :
            { type: typeof (value) };
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
            result.path = path;
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

    flatten(arr) {
        return [].concat(...arr);
    }

    product(...sets) {
        return sets.reduce(
            (acc, set) =>
                this.flatten(acc.map(x => set.map(y => [...x, y]))),
            [[]]
        );
    }

    _parseBatchInput(options, storageData) {
        let batchItems = [];
        const batchIndices = [];
        const operation = options.batchOperation;
        const nodeInput = options.nodeInput || [];
        let isBatch = false;
        let maxLength = 0;

        nodeInput.forEach((inp, index) => {
            let batch = false;
            const path = [];
            let data;
            let storage = {};
            const batchResult = this._createBatch(options, inp, path, storage);
            if (Array.isArray(batchResult)) {
                isBatch = true;
                batch = true;
                data = batchResult;
                if (data.length > maxLength) {
                    maxLength = data.length;
                }
            }
            else {
                data = inp;
                storage = this._extractStorage(inp, storageData);
            }
            batchIndices.push({ index, data, path, storage, batch });
        });

        if (!isBatch) {
            return { batch: batchItems, isBatch };
        }
        if (operation === 'cartesian') {
            batchItems = this._cartesian(batchIndices, nodeInput);
        }
        else {
            batchItems = this._indexed(maxLength, nodeInput, batchIndices);
        }
        return { batch: batchItems, isBatch };
    }

    _indexed(maxLength, nodeInput, batchIndices) {
        const batchItems = [];
        for (let i = 0; i < maxLength; i += 1) {
            const input = clone(nodeInput);
            const storage = {};
            batchIndices.forEach((b) => {
                let tmpStorage = b.storage;
                if (b.batch) {
                    const data = b.data[i];
                    tmpStorage = this._extractStorage(data, tmpStorage);
                    this._setInputByPathAndIndex(b.path, b.index, input, data);
                }
                lodashMerge(storage, tmpStorage);
            });
            batchItems.push({ input, storage });
        }
        return batchItems;
    }

    _cartesian(batchIndices, nodeInput) {
        const batchItems = [];
        const hasBatch = batchIndices.filter(b => b.batch);
        const noBatch = batchIndices.filter(b => !b.batch);
        const product = this.product(...hasBatch.map(b => b.data));
        product.forEach((p) => {
            const storage = {};
            const input = clone(nodeInput);
            for (let i = 0; i < nodeInput.length; i += 1) {
                let data;
                let tmpStorage;
                const found = noBatch.find(n => n.index === i);
                if (found) {
                    data = found.data;
                    tmpStorage = found.storage;
                }
                else {
                    data = p.shift();
                    const batchIndex = hasBatch.find(n => n.index === i);
                    const path = batchIndex.path;
                    tmpStorage = this._extractStorage(data, batchIndex.storage);
                    this._setInputByPathAndIndex(path, i, input, data);
                }
                lodashMerge(storage, tmpStorage);
            }
            batchItems.push({ input, storage });
        });
        return batchItems;
    }

    _extractStorage(input, storageData) {
        let storage = {};
        if (this._isObject(input) || Array.isArray(input)) {
            const flat = flatten(input);
            const keys = Object.values(flat).filter(f => this._isStorage(f)).map(f => f.substr(2));
            storage = lodashPick(storageData, keys);
        }
        else if (this._isStorage(input)) {
            const keys = input.substr(2);
            storage = lodashPick(storageData, keys);
        }
        return storage;
    }

    _setInputByPathAndIndex(path, index, input, data) {
        if (path.length > 0) {
            objectPath.set(input[index], path.join('.'), data);
        }
        else {
            input[index] = data;
        }
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
            let array = input.substr(1);
            if (input.indexOf('...') !== -1) {
                array = array.replace(/[[\]]+/g, '');
                const [s, e] = array.split('...');
                const start = parseInt(s, 10);
                const end = parseInt(e, 10);
                result = Array.from({ length: (end - start) }, (v, k) => k + start);
            }
            else {
                result = this._tryParseJSON(array);
            }
        }
        else if (this._isReference(input)) {
            if (this._isBatch(input) && !settings.parseBatch) {
                return input;
            }
            result = this._parseStorage(input, parentOutput, storage, options);
        }
        return result;
    }

    _parseStorage(input, parentOutput, storage, options) {
        let result;
        const reference = this._extractObjectFromInput(input);
        const construct = this._constructObject(reference);
        const type = this._inputToRelation(input);
        const isFlowInput = this._isFlowInput(reference);

        if (isFlowInput) {
            const resFlowInput = { ...options.flowInput, metadata: { [reference]: options.flowInput.metadata[reference] } };
            parentOutput.push({
                type,
                node: INPUTS.FLOW_INPUT,
                result: resFlowInput
            });
        }
        const isWaitBatch = this._isWaitBatch(type);
        const isWaitAny = this._isWaitAny(type);
        const index = isWaitAny ? options.index : null;
        const { object, path } = construct;
        const parent = parentOutput.find(o => o.type === type && o.index == index && o.node === object);
        const parentResult = parent.result;
        if (!parentResult) {
            return null;
        }

        if (isWaitBatch) {
            result = [];
            if (Array.isArray(parentResult)) {
                parentResult.filter(r => r).forEach((r) => {
                    const key = this._createStorage(storage, this._createResult({ ...r, path }));
                    result.push(key);
                });
            }
            else {
                const metadata = this._findMetadata(parentResult.metadata, reference);
                result = this._createStorageArray(metadata, storage, parentResult, path);
            }
        }
        else {
            const parentStorageResult = Array.isArray(parentResult) ? parentResult.map(r => this._createResult({ ...r, path })) : this._createResult({ ...parentResult, path });
            const key = this._createStorage(storage, parentStorageResult);
            result = key;
        }
        return result;
    }

    _createStorageArray(metadata, storage, parentResult, path) {
        const result = [];
        if (Number.isInteger(metadata.size) && metadata.type === 'array') {
            Array.from(Array(metadata.size).keys()).forEach((i) => {
                const key = this._createStorage(storage, this._createResult({ ...parentResult, path, index: i }));
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

    _createResult(data) {
        if (!data) {
            return null;
        }
        const { index, ...rest } = data;
        const path = this._createDataPath(rest.path, index);
        const result = {
            ...rest,
            path
        };
        return result;
    }

    _createStorage(storage, data) {
        const uuid = uuidv4();
        storage[uuid] = data;
        return `${INPUTS.STORAGE}${uuid}`;
    }

    _createDataPath(path, index) {
        let dataPath = path;
        if (Number.isInteger(index)) {
            dataPath = (path && `${path}.${index}`) || `${index}`;
        }
        return dataPath;
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
