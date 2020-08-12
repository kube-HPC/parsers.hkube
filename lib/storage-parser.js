const { uid } = require('@hkube/uid');
const INPUTS = require('./const/inputs');

class StorageParser {
    parseStorage(helpers, input, parentOutput, storage, options) {
        let result;
        const reference = helpers.extractObjectFromInput(input);
        const construct = helpers.constructObject(reference);
        const [, type] = helpers.inputToRelation(input);
        const isFlowInput = helpers.isFlowInput(reference);

        if (isFlowInput) {
            let flowInput = options.flowInputMetadata;
            if (flowInput && flowInput.metadata) {
                flowInput = { ...options.flowInputMetadata, metadata: { [reference]: flowInput.metadata[reference] } };
            }
            parentOutput.push({
                type,
                node: INPUTS.FLOW_INPUT,
                result: flowInput
            });
        }
        const isWaitBatch = helpers.isWaitBatch(type);
        const isWaitAny = helpers.isWaitAny(type);
        const index = isWaitAny ? options.index : null;
        const { object, path } = construct;
        const parent = parentOutput.find(o => o.type === type && o.index == index && o.node === object); // eslint-disable-line
        const parentResult = parent && parent.result;
        if (!parentResult) {
            if (options.ignoreParentResult) {
                return input;
            }
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
        const uuid = uid({ length: 8 });
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
}

module.exports = new StorageParser();
