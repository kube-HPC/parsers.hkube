const { expect } = require('chai');
const { parser, consts } = require('../index');

describe('Parse', function() {
    it('should parse node result to another node', function() {
        const pipeline = {
            "name": "resultBatch",
            "nodes": [
                {
                    "nodeName": "red",
                    "algorithmName": "red-alg",
                    "input": [
                        "@yellow",
                        512
                    ]
                }
            ]
        };

        const node = pipeline.nodes[0];
        const parentOutput = [{
            node: 'yellow',
            type: consts.relations.WAIT_NODE,
            result: {
                "metadata": {
                    "yellow": { type: "array", size: 5 }
                },
                "storageInfo": {
                    "path": "batch-5b0b25a1-5364-4bd6-b9b0-126de5ed2227"
                }
            }
        }];
        const options = Object.assign({}, { nodeInput: node.input }, { parentOutput: parentOutput });
        const result = parser.parse(options);
        const key = Object.keys(result.storage)[0];
        const expectedInput = [`$$${key}`, 512];
        expect(result.input).to.deep.equal(expectedInput);
        expect(result.batch).to.equal(false);
    });
    it('should parse node result of waitNode result', function() {
        const pipeline = {
            "name": "resultBatch",
            "nodes": [
                {
                    "nodeName": "red",
                    "algorithmName": "red-alg",
                    "input": [
                        "@yellow.data",
                        512
                    ]
                }
            ]
        };
        const node = pipeline.nodes[0];
        const parentOutput = [{
            node: 'yellow',
            type: consts.relations.WAIT_NODE,
            result: {
                "metadata": {
                    "yellow": { type: "array", size: 5 }
                },
                "storageInfo": {
                    "path": 'link_to_data'
                }
            }
        }];
        const options = Object.assign({}, { nodeInput: node.input }, { parentOutput: parentOutput });
        const result = parser.parse(options);
        const key = Object.keys(result.storage)[0];
        const expectedInput = [`$$${key}`, 512];
        expect(result.input).to.deep.equal(expectedInput);
        expect(result.batch).to.equal(false);
        expect(result.storage).to.have.property(key);
        expect(result.storage[key].storageInfo).to.deep.equal(parentOutput[0].result.storageInfo);
        expect(result.storage[key].path).to.equal('data');
    });
    it('should parse node result of waitAny result', function() {
        const pipeline = {
            "name": "resultBatch",
            "nodes": [
                {
                    "nodeName": "red",
                    "algorithmName": "red-alg",
                    "input": [
                        "*@yellow.data",
                        512
                    ]
                }
            ]
        };
        const node = pipeline.nodes[0];
        const parentOutput = [{
            node: 'yellow',
            type: consts.relations.WAIT_ANY,
            result: {
                "metadata": {
                    "yellow": { type: "array", size: 5 }
                },
                "storageInfo": {
                    "path": 'link_to_data'
                }
            }
        }];
        const options = Object.assign({}, { nodeInput: node.input }, { parentOutput: parentOutput });
        const result = parser.parse(options);
        const key = Object.keys(result.storage)[0];
        const expectedInput = [`$$${key}`, 512];
        expect(result.batch).to.equal(false);
        expect(result.input).to.deep.equal(expectedInput);
    });
    it('should parse node result of waitBatch result', function() {
        const pipeline = {
            "name": "resultBatch",
            "nodes": [
                {
                    "nodeName": "red",
                    "algorithmName": "red-alg",
                    "input": [
                        "#@yellow.data",
                        512
                    ]
                }
            ]
        };
        const parentResult = [{
            metadata: {
                yellow: { type: "array", size: 5 }
            },
            storageInfo: {
                path: "batch-5b0b25a1-5364-4bd6-b9b0-126de5ed2227"
            }
        },
        {
            metadata: {
                yellow: { type: "array", size: 5 }
            },
            storageInfo: {
                path: "batch-5b0b25a1-5364-4bd6-b9b0-126de5ed2227"
            }
        },
        {
            metadata: {
                yellow: { type: "array", size: 5 }
            },
            storageInfo: {
                path: "batch-5b0b25a1-5364-4bd6-b9b0-126de5ed2227"
            }
        }];
        const node = pipeline.nodes[0];
        const parentOutput = [{ node: 'yellow', type: consts.relations.WAIT_BATCH, result: parentResult }];
        const options = Object.assign({}, { nodeInput: node.input }, { parentOutput });
        const result = parser.parse(options);
        const key = Object.keys(result.input[0].storage)[0];
        expect(result.batch).to.equal(true);
        expect(result.input).to.have.lengthOf(parentResult.length);
        expect(result.input[0].storage[key]).to.have.property('storageInfo');
        expect(result.input[0].storage[key]).to.have.property('path');
        expect(result.input[0].storage[key]).to.have.property('metadata');
    });
    it('should parse node result of waitAnyBatch result', function() {
        const pipeline = {
            name: "resultBatch",
            nodes: [
                {
                    "nodeName": "red",
                    "algorithmName": "red-alg",
                    "input": [
                        true,
                        "*#@yellow.data",
                        512,
                        "@flowInput.files.links"
                    ]
                }
            ],
            flowInputMetadata: {
                "metadata": {
                    "flowInput.files.links": { type: "array", size: 5 }
                },
                "storageInfo": {
                    "path": "batch-5b0b25a1-5364-4bd6-b9b0-126de5ed2227"
                }
            }
        };
        const size = 5;
        const node = pipeline.nodes[0];
        const parentResult = {
            metadata: {
                "yellow.data": { type: "array", size }
            },
            storageInfo: {
                path: "batch-5b0b25a1-5364-4bd6-b9b0-126de5ed2227"
            }
        };

        const parentOutput = [{ node: 'yellow', type: consts.relations.WAIT_ANY_BATCH, result: parentResult }];
        const options = Object.assign({}, { nodeInput: node.input }, { flowInputMetadata: pipeline.flowInputMetadata }, { parentOutput });
        const result = parser.parse(options);
        const keysInput = result.input.map(i => i.input[1].substr(2));
        const keysStorage = result.input.map(i => Object.keys(i.storage)[0]);
        expect(keysInput).to.eql(keysStorage);
        expect(result.batch).to.equal(true);
        expect(result.input).to.have.lengthOf(size);
        expect(result.input[0].input).to.have.lengthOf(node.input.length);
    });
    it('should parse node result of waitNode/waitAny/waitAnyBatch result', function() {
        const pipeline = {
            "name": "resultBatch",
            "nodes": [
                {
                    "nodeName": "red",
                    "algorithmName": "red-alg",
                    "input": [
                        "@yellow.data",
                        "*@yellow.data",
                        "*#@yellow.data",
                        "@flowInput.files.links"
                    ]
                }
            ],
            "flowInputMetadata": {
                "metadata": {
                    "flowInputMetadata.files.links": { type: "array", size: 5 }
                },
                "storageInfo": {
                    "path": "batch-5b0b25a1-5364-4bd6-b9b0-126de5ed2227"
                }
            }
        };

        const node = pipeline.nodes[0];
        const waitNode = {
            metadata: {
                "flowInput.files.links": { type: "array", size: 5 }
            },
            storageInfo: { path: 'link_to_data1' }
        };
        const waitAny = {
            metadata: {
                "flowInput.files.links": { type: "array", size: 5 }
            },
            storageInfo: { path: 'link_to_data1' }
        };
        const waitAnyBatch = [
            {
                metadata: {
                    "flowInput.files.links": { type: "array", size: 5 }
                }, storageInfo: { path: 'link_to_data1' }
            },
            {
                metadata: {
                    "flowInput.files.links": { type: "array", size: 5 }
                }, storageInfo: { path: 'link_to_data1' }
            },
            {
                metadata: {
                    "flowInput.files.links": { type: "array", size: 5 }
                }, storageInfo: { path: 'link_to_data1' }
            }];

        const parentOutput = [
            { node: 'yellow', type: consts.relations.WAIT_NODE, result: waitNode },
            { node: 'yellow', type: consts.relations.WAIT_ANY, result: waitAny },
            { node: 'yellow', type: consts.relations.WAIT_ANY_BATCH, result: waitAnyBatch }
        ];
        const options = Object.assign({}, { nodeInput: node.input }, { flowInputMetadata: pipeline.flowInputMetadata }, { parentOutput });
        const result = parser.parse(options);
        const key0 = result.input[0].input[0].substr(2);
        const key1 = result.input[0].input[1].substr(2);
        const key2 = result.input[0].input[2].substr(2);
        const key3 = result.input[0].input[3].substr(2);

        expect(result.batch).to.equal(true);
        expect(result.input).to.have.lengthOf(waitAnyBatch.length);
        expect(result.input[0].input).to.have.lengthOf(node.input.length);

        expect(result.input[0].storage[key0].storageInfo).to.deep.equal(waitNode.storageInfo);
        expect(result.input[0].storage[key1].storageInfo).to.deep.equal(waitAny.storageInfo);
        expect(result.input[0].storage[key2].storageInfo).to.deep.equal(waitAnyBatch[0].storageInfo);
        expect(result.input[0].storage[key3].storageInfo).to.deep.equal(pipeline.flowInputMetadata.storageInfo);
    });
    it('should parse node without parent output', function() {
        const pipeline = {
            "name": "resultBatch",
            "nodes": [
                {
                    "nodeName": "red",
                    "algorithmName": "red-alg",
                    "input": [
                        "@yellow",
                        512
                    ]
                }
            ]
        };

        const node = pipeline.nodes[0];
        const options = { nodeInput: node.input, ignoreParentResult: true };
        const result = parser.parse(options);
        expect(result.input).to.deep.equal(node.input);
        expect(result.batch).to.equal(false);
    });
    it('should parse simple input', function() {
        const pipeline = {
            "name": "flow1",
            "nodes": [
                {
                    "nodeName": "white",
                    "algorithmName": "black-alg",
                    "input": [
                        "test"
                    ]
                }
            ]
        }
        const node = pipeline.nodes[0];
        const options = Object.assign({}, { flowInputMetadata: pipeline.flowInputMetadata }, { nodeInput: node.input });
        const result = parser.parse(options);
        expect(result.batch).to.equal(false);
        expect(result.input).to.deep.equal(["test"]);
    });
    it('should parse empty input', function() {
        const pipeline = {
            "name": "flow1",
            "nodes": [
                {
                    "nodeName": "white",
                    "algorithmName": "black-alg",
                    "input": []
                }
            ]
        }
        const node = pipeline.nodes[0];
        const options = Object.assign({}, { nodeInput: node.input });
        const result = parser.parse(options);
        expect(result.batch).to.equal(false);
        expect(result.input).to.deep.equal(node.input);
    });
    it('should throw type error on string', function() {
        expect(() => {
            parser.parse("string");
        }).to.throw(TypeError, 'options');
    });
    it('should throw type error on null', function() {
        expect(() => {
            parser.parse(null);
        }).to.throw(TypeError, 'options');
    });
    it('should replaceFlowInput', function() {
        const pipeline = {
            "name": "resultBatch",
            "nodes": [
                {
                    "nodeName": "red",
                    "algorithmName": "red-alg",
                    "input": [
                        "#@flowInput.files.links",
                        { data: { prop: "@flowInput.x" } },
                        "@flowInput.x",
                        "@flowInput.y",
                        "@flowInput",
                        2,
                        false,
                        ["@flowInput"]
                    ]
                }
            ],
            "flowInput": {
                "x": 3,
                "y": false,
                "files": {
                    "links": [
                        "links-1",
                        "links-2",
                        "links-3",
                        "links-4",
                        "links-5"
                    ]
                }
            },
        };
        const metadata = parser.replaceFlowInput(pipeline);
        const keys = Object.keys(metadata);
        expect(metadata[keys[0]].type).to.equal('array');
        expect(metadata[keys[0]].size).to.equal(5);
        expect(metadata[keys[1]].type).to.equal('number');
        expect(metadata[keys[2]].type).to.equal('boolean');
        expect(metadata[keys[3]].type).to.equal('object');
    });
    it('should parse flowInput', function() {
        const pipeline = {
            name: "resultBatch",
            nodes: [
                {
                    "nodeName": "red",
                    "algorithmName": "red-alg",
                    "input": [
                        true,
                        512,
                        "@flowInput.files.links"
                    ]
                }
            ],
            flowInputMetadata: {
                "metadata": {
                    "flowInput.files.links": { type: "array", size: 5 }
                },
                "storageInfo": {
                    "path": "batch-5b0b25a1-5364-4bd6-b9b0-126de5ed2227"
                }
            }
        };
        const node = pipeline.nodes[0];
        const options = { nodeInput: node.input, flowInputMetadata: pipeline.flowInputMetadata };
        const result = parser.parse(options);
        const key1 = result.input[2].substr(2);
        const key2 = Object.keys(result.storage)[0];
        expect(key1).to.eql(key2);
        expect(result.batch).to.equal(false);
    });
    it('should replaceNodeInput', function() {
        const result = parser.replaceNodeInput(['@yellow.data', '#@green.batch'], 'sign');
        expect(result).to.eql(['@sign-yellow.data', '#@sign-green.batch']);
    });
    it('should replaceNodeInput', function() {
        const result = parser.replaceNodeInput(['@yellow.data', '#@green.batch'], 'sign', prefix = false);
        expect(result).to.eql(['@yellow.data-sign', '#@green.batch-sign']);
    });
    it('should findNodeRelation', function() {
        const result = parser.findNodeRelation([{ data: '*@yellow.data' }, { prop: '#@green.batch' }], consts.relations.WAIT_ANY);
        expect(result.type).to.eql(consts.relations.WAIT_ANY);
    });
});