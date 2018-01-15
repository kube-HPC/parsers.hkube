const objectPath = require('object-path');
const clone = require('clone');
const RELATIONS = require('./const/relations');
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
        const newOptions = clone(options);
        const batch = this._parseBatchInput(newOptions);
        const isBatch = batch.length > 0;
        const inputObj = isBatch ? batch : newOptions.nodeInput;

        inputObj.forEach((ni, ind) => {
            inputObj[ind] = this._parseFlowInput(newOptions, ni);
            if (newOptions.parentOutput) {
                const res = this._parseParentNodeOutput(newOptions, ni);
                if (res) {
                    inputObj[ind] = res;
                }
            }
        });
        return {
            batch: isBatch,
            input: inputObj
        };
    }

    /**
     * 
     * 
     * @param {any} input 
     * @returns 
     * 
     * @memberOf InputParser
     */
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

    checkFlowInput(options, input) {
        return this._parseValue(options, input, { checkFlow: true });
    }

    /**
     * 
     * 
     * @param {any} object 
     * @param {any} input 
     * @param {any} options 
     * @returns 
     * 
     * @memberOf InputParser
     */
    _parseValue(options, input, settings) {
        if (input == null) {
            return null;
        }
        else if (!this._isObject(options) && !Array.isArray(options)) {
            return options;
        }
        else if (typeof input === 'string') {
            input = this._extractValueFromInput(options, input, settings);
        }
        else if (this._isObject(input)) {
            this._recursivelyObject(options, input, settings);
        }
        else if (Array.isArray(input)) {
            this._recursivelyArray(options, input, settings);
        }
        return input;
    }

    _parseFlowInput(options, input) {
        return this._parseValue(options, input, { parseFlow: true });
    }

    _parseParentNodeOutput(options, input) {
        return this._parseValue(options, { parseParentNode: true });
    }

    /**
     * 
     * 
     * @param {any} input 
     * @returns 
     * 
     * @memberOf InputParser
     */
    _extractObjectFromInput(input) {
        let object;
        if (this._isObjRef(input)) {
            object = input.substr(1);
        }
        if (this._isBatch(input)) {
            object = input.substr(2);
        }
        else if (this._isWaitBatch(input)) {
            object = input.substr(2);
        }
        return object;
    }

    /**
     * 
     * 
     * @param {any} input 
     * @returns 
     * 
     * @memberOf InputParser
     */
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
            result.isWaitBatch = this._isBatch(input);
            result.isWaitAnyBatch = this._isWaitBatch(input);
            result.isWaitNode = !isFlowInput && !result.isWaitBatch && !result.isWaitAnyBatch;
        }
        return result;
    }

    _isBatch(input) {
        return typeof input === 'string' && input.startsWith(INPUTS.BATCH);
    }

    _isBatchRef(input) {
        return typeof input === 'string' && input.startsWith(INPUTS.BATCH_REF);
    }

    _isBatchRaw(input) {
        return typeof input === 'string' && input.startsWith(INPUTS.BATCH_RAW);
    }

    _isObjRef(input) {
        return typeof input === 'string' && input.startsWith(INPUTS.REF);
    }

    _isWaitBatch(input) {
        return typeof input === 'string' && input.startsWith(INPUTS.WAIT_BATCH);
    }

    _isFlowInput(input) {
        let result = false;
        if (this._isObjRef(input)) {
            const nodeName = input.substr(1);
            const res = this._constructObject(nodeName);
            result = res.object === INPUTS.FLOW_INPUT;
        }
        return result;
    }

    _isReference(input) {
        return this._isObjRef(input) || this._isBatchRef(input) || this._isWaitBatch(input);
    }

    _parseBatchInput(options) {
        const path = [];
        const newInput = [];
        options.nodeInput = options.nodeInput || [];
        options.nodeInput.forEach((inp, ind) => {
            const result = this._createBatch(options, inp, path);
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

    _createBatch(options, input, path) {
        let result = null;
        if (this._isBatch(input)) {
            result = this._extractValueFromInput(options, input, { parseBatch: true });
        }
        else if (this._isObject(input)) {
            result = this._recursivelyObjectFindBatchKey(options, input, path);
        }
        else if (Array.isArray(input)) {
            result = this._recursivelyArrayFindBatchKey(options, input, path);
        }
        return result;
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

    _recursivelyArrayFindBatchKey(object, input, path) {
        let result = null;
        input.forEach((inp, ind) => {
            path.push(ind);
            if (this._isBatch(inp)) {
                result = this._extractValueFromInput(object, inp, null);
            }
            else if (Array.isArray(inp)) {
                result = this._recursivelyArrayFindBatchKey(object, inp, path);
            }
            else if (this._isObject(inp)) {
                result = this._recursivelyObjectFindBatchKey(object, inp, path);
            }
            else {
                path.pop();
            }
        });
        return result;
    }

    _recursivelyObjectFindBatchKey(object, input, path) {
        let result = null;
        Object.entries(input).forEach(([key, val]) => {
            path.push(key);
            if (this._isBatch(val)) {
                result = this._extractValueFromInput(object, val, null);
            }
            else if (Array.isArray(val)) {
                result = this._recursivelyArrayFindBatchKey(object, val, path);
            }
            else if (this._isObject(val)) {
                result = this._recursivelyObjectFindBatchKey(object, val, path);
            }
            else {
                path.pop();
            }
        });
        return result;
    }

    _recursivelyArray(object, input, options) {
        input.forEach((a, i) => {
            if (Array.isArray(a)) {
                this._recursivelyArray(object, a, options);
            }
            else if (this._isObject(a)) {
                this._recursivelyObject(object, a, options);
            }
            else {
                input[i] = this._extractValueFromInput(object, a, options);
            }
        });
    }

    _recursivelyObject(object, input, options) {
        Object.entries(input).forEach(([key, val]) => {
            if (Array.isArray(val)) {
                this._recursivelyArray(object, val, options);
            }
            else if (this._isObject(val)) {
                this._recursivelyObject(object, val, options);
            }
            else if (typeof input[key] !== 'object') {
                input[key] = this._extractValueFromInput(object, val, options);
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

    _extractValueFromInput(options, input, settings) {
        options = options || {};
        settings = settings || {};
        const parentOutput = options.parentOutput || {};
        let result = input;
        const isBatchRaw = this._isBatchRaw(input);
        const isBatch = this._isBatchRef(input);
        const isWaitBatch = this._isWaitBatch(input);

        if (isBatchRaw) {
            const array = input.substr(1);
            result = this._tryParseJSON(array);
        }
        if (this._isReference(input)) {
            const ni = null;
            const obj = this._extractObjectFromInput(input);
            const construct = this._constructObject(obj);
            if (construct.object === INPUTS.FLOW_INPUT) {
                result = objectPath.get(options, obj);

                if (options.checkFlow) {
                    if (result == null) {
                        throw new Error(`unable to find ${obj}`);
                    }
                }
            }
            else if (settings.parseBatch) {
                const parent = parentOutput.find(o => o.type === RELATIONS.WAIT_BATCH && o.index == options.index && o.node === construct.object);
                result = parent.result;
                if (construct.path) {
                    result = objectPath.get(result, construct.path);
                }
            }
            else if (settings.parseParentNode) {
                const type = isWaitBatch ? RELATIONS.WAIT_ANY : RELATIONS.WAIT_NODE;
                const parent = parentOutput.find(o => o.type === type && o.index == options.index && o.node === construct.object);
                result = parent.result;
                if (construct.path) {
                    result = objectPath.get(result, construct.path);
                }
                return result;
            }
            else {
                const array = [];
                if (Array.isArray(ni)) {
                    ni.forEach((inp) => {
                        if (Array.isArray(inp)) {
                            array.push(inp);
                        }
                        else {
                            array.push(objectPath.get(inp, construct.path));
                        }
                    });
                    result = array;
                }
                else {
                    result = objectPath.get(options, obj)
                }
            }
        }
        return result;
    }

    _tryParseJSON(json) {
        let parsed = json;
        try {
            parsed = JSON.parse(json);
        }
        catch (e) {
        }
        return parsed
    }
}

module.exports = new InputParser();
