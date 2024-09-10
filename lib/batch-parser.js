const objectPath = require('object-path');
const clone = require('clone');
const flatten = require('flat');
const lodashPick = require('lodash.pick');
const lodashMerge = require('lodash.merge');
const helpers = require('./helpers');

class BatchParser {
    parseBatchInput(options, storageData) {
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
            let nonBatchStorage = {};
            const batchResult = this._createBatch(options, inp, path, storage);
            if (Array.isArray(batchResult)) {
                nonBatchStorage = this._extractStorage(inp, storageData);
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
            batchIndices.push({ index, data, path, storage, batch, nonBatchStorage });
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
                lodashMerge(storage, b.nonBatchStorage);
            });
            batchItems.push({ input, storage });
        }
        return batchItems;
    }

    _cartesian(batchIndices, nodeInput) {
        const batchItems = [];
        const hasBatch = batchIndices.filter(b => b.batch);
        const noBatch = batchIndices.filter(b => !b.batch);
        const product = this._product(...hasBatch.map(b => b.data));
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
                    const { path, nonBatchStorage } = batchIndex;
                    tmpStorage = this._extractStorage(data, batchIndex.storage);
                    lodashMerge(tmpStorage, nonBatchStorage);
                    this._setInputByPathAndIndex(path, i, input, data);
                }
                lodashMerge(storage, tmpStorage);
            }
            batchItems.push({ input, storage });
        });
        return batchItems;
    }

    _flatten(arr) {
        return [].concat(...arr);
    }

    _product(...sets) {
        return sets.reduce(
            (acc, set) => this._flatten(acc.map(x => set.map(y => [...x, y]))),
            [[]]
        );
    }

    _extractStorage(input, storageData) {
        let storage = {};
        if (helpers.isObject(input) || Array.isArray(input)) {
            const flat = flatten(input);
            const keys = Object.values(flat).filter(f => helpers.isStorage(f)).map(f => f.substr(2));
            storage = lodashPick(storageData, keys);
        }
        else if (helpers.isStorage(input)) {
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

    _createBatch(options, input, path, storage) {
        let result = null;
        if (helpers.isBatch(input)) {
            result = helpers.extractValueFromInput(options, input, { parseBatch: true }, storage);
        }
        else if (helpers.isObject(input)) {
            result = this._recursivelyObjectFindBatchKey(options, input, path, storage);
        }
        else if (Array.isArray(input)) {
            result = this._recursivelyArrayFindBatchKey(options, input, path, storage);
        }
        return result;
    }

    _recursivelyArrayFindBatchKey(object, input, path, storage) {
        const result = [];
        input.forEach((inp, ind) => {
            path.push(ind);
            if (helpers.isBatch(inp)) {
                const extractedValue = helpers.extractValueFromInput(object, inp, { parseBatch: true }, storage);
                if (extractedValue !== null) {
                    result.push(...extractedValue);
                }
            }
            else if (Array.isArray(inp)) {
                const arrayResult = this._recursivelyArrayFindBatchKey(object, inp, path, storage);
                if (arrayResult !== null) {
                    result.push(...arrayResult);
                }
            }
            else if (helpers.isObject(inp)) {
                const objectResult = this._recursivelyObjectFindBatchKey(object, inp, path, storage);
                if (objectResult !== null) {
                    result.push(...objectResult);
                }
            }
            else {
                path.pop();
            }
        });
        return result.length !== 0 ? result : null;
    }

    _recursivelyObjectFindBatchKey(object, input, path, storage) {
        const result = [];
        Object.entries(input).forEach(([key, val]) => {
            path.push(key);
            if (helpers.isBatch(val)) {
                const extractedValue = helpers.extractValueFromInput(object, val, { parseBatch: true }, storage);
                if (extractedValue !== null) {
                    result.push(...extractedValue);
                }
            }
            else if (Array.isArray(val)) {
                const arrayResult = this._recursivelyArrayFindBatchKey(object, val, path, storage);
                if (arrayResult !== null) {
                    result.push(...arrayResult);
                }
            }
            else if (helpers.isObject(val)) {
                const objectResult = this._recursivelyObjectFindBatchKey(object, val, path, storage);
                if (objectResult !== null) {
                    result.push(...objectResult);
                }
            }
            else {
                path.pop();
            }
        });
        return result.length !== 0 ? result : null;
    }
}

module.exports = new BatchParser();
