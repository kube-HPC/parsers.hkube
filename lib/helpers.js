const objectPath = require('object-path');
const flatten = require('flat');
const RELATIONS = require('./const/relations');
const INPUTS_TO_RELATIONS = require('./const/inputs-to-relations');
const INPUTS = require('./const/inputs');
const storageParser = require('./storage-parser');
const DEFAULT_GET_PATH_VALUE = 'DEFAULT_GET_PATH_VALUE';

class Helpers {
    parseValue(options, input, settings, storage) {
        if (input == null) {
            return null;
        }
        if (typeof input === 'string') {
            input = this.extractValueFromInput(options, input, settings, storage);
        }
        else if (this.isObject(input)) {
            this._recursivelyObject(options, input, settings, storage);
        }
        else if (Array.isArray(input)) {
            this._recursivelyArray(options, input, settings, storage);
        }
        return input;
    }

    getMetadata(value) {
        if (value === undefined) {
            return value;
        }
        const meta = Array.isArray(value)
            ? { type: 'array', size: value.length }
            : { type: typeof (value) };
        return meta;
    }

    _recursivelyArray(object, input, options, storage) {
        input.forEach((a, i) => {
            if (Array.isArray(a)) {
                this._recursivelyArray(object, a, options, storage);
            }
            else if (this.isObject(a)) {
                this._recursivelyObject(object, a, options, storage);
            }
            else {
                input[i] = this.extractValueFromInput(object, a, options, storage);
            }
        });
    }

    _recursivelyObject(object, input, options, storage) {
        Object.entries(input).forEach(([key, val]) => {
            if (Array.isArray(val)) {
                this._recursivelyArray(object, val, options, storage);
            }
            else if (this.isObject(val)) {
                this._recursivelyObject(object, val, options, storage);
            }
            else {
                input[key] = this.extractValueFromInput(object, val, options, storage);
            }
        });
    }

    isNode(input) {
        const result = {
            isNode: false
        };
        if (this.isReference(input)) {
            const path = this.extractObjectFromInput(input);
            const obj = this.constructObject(path);
            const isFlowInput = this.isFlowInput(path);
            const isDataSource = this.isDataSource(path);
            result.nodeName = obj.object;
            result.isNode = !isFlowInput && !isDataSource;
            const [sign, type] = this.inputToRelation(input);
            result.sign = sign;
            result.type = type;
            result.path = path;
        }
        return result;
    }

    /** @type {(input: string) => string} */
    extractObjectFromInput(input) {
        const val = Object.values(INPUTS).find(v => this._startsWith(input, v));
        const object = val ? input.substr(val.length) : undefined;
        return object;
    }

    /**
     * this method accepts each item in the input's collection
     * ex: '@flowInput.x'
     */
    extractValueFromInput(options, input, settings, storage) {
        options = options || {};
        settings = settings || {};
        storage = storage || {};
        const parentOutput = options.parentOutput || [];
        let result = input;

        if (this.isStorage(input) && settings.checkStorageKeyword) {
            throw new Error(`using reserved keyword ${INPUTS.STORAGE}`);
        }
        if (this.isBatchRaw(input) && settings.parseBatch) {
            const tmpArray = input.substr(1).replace(/[[\]]+/g, '').replace(/\s/g, '').split(',');
            const array = [];
            tmpArray.forEach((a) => {
                if (a.indexOf('...') !== -1) {
                    const [s, e] = a.split('...');
                    const start = parseInt(s, 10);
                    const end = parseInt(e, 10);
                    const arr = Array.from({ length: (end - start + 1) }, (v, k) => k + start);
                    array.push(...arr);
                }
                else {
                    array.push(a);
                }
            });
            result = array;
        }
        else if (this.isReference(input)) {
            if (this.isBatch(input) && !settings.parseBatch) {
                return input;
            }
            result = storageParser.parseStorage(this, input, parentOutput, storage, options);
        }
        return result;
    }

    pipelineNodesToMetaData(pipeline, filterPredicate, metadataPredicate) {
        const entries = pipeline.nodes
            .map((node) => Object.values(flatten(node.input))
                .map(v => this.extractObjectFromInput(v))
                .filter(v => filterPredicate(v)))
            .flat()
            .map(path => [path, metadataPredicate(path)])
            .filter(([, metadata]) => metadata !== undefined);
        return Object.fromEntries(entries);
    }

    inputToRelation(input) {
        return Object.entries(INPUTS_TO_RELATIONS).find(([k]) => this._startsWith(input, k));
    }

    isFlowInput(input) {
        return this._startsWith(input, INPUTS.FLOW_INPUT);
    }

    /** @type {(input: string) => boolean} */
    isDataSource(input) {
        return this._startsWith(input, INPUTS.DATASOURCE);
    }

    isStorage(input) {
        return this._startsWith(input, INPUTS.STORAGE);
    }

    isBatch(input) {
        return this.isBatchRef(input) || this.isBatchRaw(input) || this.isWaitAnyBatch(input);
    }

    isBatchRef(input) {
        return this._startsWith(input, INPUTS.BATCH);
    }

    isBatchRaw(input) {
        return this._startsWith(input, INPUTS.BATCH_RAW);
    }

    isWaitAnyBatch(input) {
        return this._startsWith(input, INPUTS.WAIT_ANY_BATCH);
    }

    isReference(input) {
        return Object.keys(INPUTS_TO_RELATIONS).some(r => this._startsWith(input, r));
    }

    _startsWith(input, prefix) {
        return typeof input === 'string' && input.startsWith(prefix);
    }

    constructObject(input) {
        const array = input.split('.');
        const object = array.shift();
        const path = array.join('.');
        return { object, path };
    }

    isObject(object) {
        return Object.prototype.toString.call(object) === '[object Object]';
    }

    isWaitBatch(type) {
        return type === RELATIONS.WAIT_BATCH || type === RELATIONS.WAIT_ANY_BATCH;
    }

    isWaitAny(type) {
        return type === RELATIONS.WAIT_ANY || type === RELATIONS.WAIT_ANY_BATCH;
    }

    getPath(object, path) {
        const value = objectPath.get(object, path, DEFAULT_GET_PATH_VALUE);
        if (value === DEFAULT_GET_PATH_VALUE) {
            return undefined;
        }
        return value;
    }

    _tryParseJSON(json) {
        let parsed;
        try {
            parsed = JSON.parse(json);
        }
        catch (e) {
            parsed = json;
        }
        return parsed;
    }
}

module.exports = new Helpers();
