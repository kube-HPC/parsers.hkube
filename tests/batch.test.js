const { expect } = require('chai');
const { parser, consts } = require('../index');

describe('Batch', function () {
    it('should parse batch input as string', function () {
        const pipeline = {
            "nodes": [
                {
                    "nodeName": "green",
                    "algorithmName": "green-alg",
                    "input": [
                        "#@flowInput.files.links",
                        { data: { prop: "@flowInput.x" } },
                        "@flowInput.x",
                        "@flowInput.y",
                        "@flowInput",
                        2,
                        false,
                        ["@flowInput"],
                        { a: { b: "@flowInput.z" } }
                    ]
                },
            ],
            "flowInputOrig": {
                "x": [1, 2, 3, 4, 5],
                "y": false,
                "files": {
                    "links": [1, 2, 3, 4, 5]
                }
            },
            "flowInputMetadata": {
                "metadata": {
                    "flowInputMetadata": { type: "object" },
                    "flowInput.x": { type: "array", size: 5 },
                    "flowInput.y": { type: "bool" },
                    "flowInput.files": { type: "object" },
                    "flowInput.files.links": { type: "array", size: 5 }
                },
                "storageInfo": {
                    "path": "batch-5b0b25a1-5364-4bd6-b9b0-126de5ed2227"
                }
            }
        }
        const firstNode = pipeline.nodes[0];
        const options = Object.assign({}, { flowInputMetadata: pipeline.flowInputMetadata }, { nodeInput: firstNode.input });
        const result = parser.parse(options);
        expect(result.batch).to.equal(true);
        expect(result.input).to.have.lengthOf(5);
    });
    it('should parse batch input which is not an array', function () {
        const pipeline = {
            "nodes": [
                {
                    "nodeName": "green",
                    "algorithmName": "green-alg",
                    "input": [
                        200,
                        "#@flowInput.files",
                        false
                    ]
                },
            ],
            "flowInputMetadata": {
                "metadata": {
                    "flowInput.files": { type: "object" }
                },
                "storageInfo": {
                    "path": "batch-5b0b25a1-5364-4bd6-b9b0-126de5ed2227"
                }
            }
        }
        const firstNode = pipeline.nodes[0];
        const options = Object.assign({}, { flowInputMetadata: pipeline.flowInputMetadata }, { nodeInput: firstNode.input });
        const result = parser.parse(options);
        expect(result.batch).to.deep.equal(true);
    });
    it('should parse batch input as object', function () {
        const pipeline = {
            "nodes": [
                {
                    "nodeName": "green",
                    "algorithmName": "green-alg",
                    "input": [
                        {
                            a: {
                                c: "#@flowInput.files.links"
                            }
                        }
                    ]
                },
            ],
            "flowInputMetadata": {
                "metadata": {
                    "flowInput.files.links": { type: "array", size: 5 }
                },
                "storageInfo": {
                    "path": "batch-5b0b25a1-5364-4bd6-b9b0-126de5ed2227"
                }
            }
        }
        const firstNode = pipeline.nodes[0];
        const options = Object.assign({}, { flowInputMetadata: pipeline.flowInputMetadata }, { nodeInput: firstNode.input });
        const result = parser.parse(options);
        const guids = result.input.map(i => i.input[0].a.c).every(i => i.startsWith('$$'));
        expect(result.batch).to.equal(guids);
        expect(result.batch).to.equal(true);
        expect(result.input).to.have.lengthOf(5);
    });
    it('should parse batch input as array', function () {
        const pipeline = {
            "nodes": [
                {
                    "nodeName": "green",
                    "algorithmName": "green-alg",
                    "input": [
                        {
                            a: {
                                b: [1, 2, ["#@flowInput.files.links"]]
                            }
                        }
                    ]
                },
            ],
            "flowInputMetadata": {
                "metadata": {
                    "flowInput.files.links": { type: "array", size: 5 }
                },
                "storageInfo": {
                    "path": "batch-5b0b25a1-5364-4bd6-b9b0-126de5ed2227"
                }
            }
        }
        const firstNode = pipeline.nodes[0];
        const options = Object.assign({}, { flowInputMetadata: pipeline.flowInputMetadata }, { nodeInput: firstNode.input });
        const result = parser.parse(options);
        expect(result.batch).to.equal(true);
        expect(result.input).to.have.lengthOf(5);
    });
    it('should parse batch input as complex array', function () {
        const pipeline = {
            "nodes": [
                {
                    "nodeName": "green",
                    "algorithmName": "green-alg",
                    "input": [
                        {
                            a: [{
                                b: "#@flowInput.files.links"
                            }]
                        }
                    ]
                },
            ],
            "flowInputMetadata": {
                "metadata": {
                    "flowInput.files.links": { type: "array", size: 5 }
                },
                "storageInfo": {
                    "path": "batch-5b0b25a1-5364-4bd6-b9b0-126de5ed2227"
                }
            }
        }
        const firstNode = pipeline.nodes[0];
        const options = Object.assign({}, { flowInputMetadata: pipeline.flowInputMetadata }, { nodeInput: firstNode.input });
        const result = parser.parse(options);
        expect(result.batch).to.equal(true);
        expect(result.input).to.have.lengthOf(5);
    });
    it('should parse batch input as raw with ranges', function () {
        const pipeline = {
            "nodes": [
                {
                    "nodeName": "green",
                    "algorithmName": "green-alg",
                    "input": [
                        "#[1, 2, 3, 4, 5, 1...10, 11,12, 20...30]"
                    ]
                }
            ]
        }
        const firstNode = pipeline.nodes[0];
        const options = { flowInputMetadata: pipeline.flowInputMetadata, nodeInput: firstNode.input };
        const result = parser.parse(options);
        expect(result.batch).to.equal(true);
        expect(result.input).to.have.lengthOf(28);
    });
    it('should parse batch input as raw with words', function () {
        const pipeline = {
            "nodes": [
                {
                    "nodeName": "green",
                    "algorithmName": "green-alg",
                    "input": [
                        "#[hello, 1...10, world, 10...20]"
                    ]
                }
            ]
        }
        const firstNode = pipeline.nodes[0];
        const options = { flowInputMetadata: pipeline.flowInputMetadata, nodeInput: firstNode.input };
        const result = parser.parse(options);
        expect(result.batch).to.equal(true);
        expect(result.input).to.have.lengthOf(23);
    });
    it('should parse batch range input as raw', function () {
        const pipeline = {
            "nodes": [
                {
                    "nodeName": "green",
                    "algorithmName": "green-alg",
                    "input": [
                        "#[600...700]"
                    ]
                }
            ]
        }
        const firstNode = pipeline.nodes[0];
        const options = Object.assign({}, { flowInputMetadata: pipeline.flowInputMetadata }, { nodeInput: firstNode.input });
        const result = parser.parse(options);
        expect(result.batch).to.equal(true);
        expect(result.input).to.have.lengthOf(101);
    });
    it('should parse node result to batch', function () {
        const pipeline = {
            "name": "resultBatch",
            "nodes": [
                {
                    "nodeName": "yellow",
                    "algorithmName": "yellow-alg",
                    "input": [
                        true,
                        "#@green",
                        "@flowInput.files.links"
                    ]
                }
            ],
            "flowInputMetadata": {
                "metadata": {
                    "flowInput.files.links": { type: "array", size: 5 }
                },
                "storageInfo": {
                    "path": "flowInput-5b0b25a1-5364-4bd6-b9b0-126de5ed2227"
                }
            }
        };

        const parentOutput = [{
            node: 'green',
            type: consts.relations.WAIT_BATCH,
            result: {
                "metadata": {
                    "green": { type: "array", size: 5 }
                },
                "storageInfo": {
                    "path": "batch-5b0b25a1-5364-4bd6-b9b0-126de5ed2227"
                }
            }
        }];
        const node = pipeline.nodes[0];
        const options = Object.assign({}, { flowInputMetadata: pipeline.flowInputMetadata }, { nodeInput: node.input }, { parentOutput: parentOutput });
        const result = parser.parse(options);
        expect(result.batch).to.equal(true);
        expect(result.input).to.have.lengthOf(5);
    });
    it('should parse node result to batch in object', function () {
        const pipeline = {
            "name": "resultBatch",
            "nodes": [
                {
                    "nodeName": "yellow",
                    "algorithmName": "yellow-alg",
                    "input": [
                        {
                            "a": true,
                            "b": "#@green",
                            "c": "@flowInput.files.links"
                        }
                    ]
                }
            ],
            "flowInputMetadata": {
                "metadata": {
                    "flowInput.files.links": { type: "array", size: 5 }
                },
                "storageInfo": {
                    "path": "flowInput-5b0b25a1-5364-4bd6-b9b0-126de5ed2227"
                }
            }
        };

        const parentOutput = [{
            node: 'green',
            type: consts.relations.WAIT_BATCH,
            result: {
                "metadata": {
                    "green": { type: "array", size: 5 }
                },
                "storageInfo": {
                    "path": "batch-5b0b25a1-5364-4bd6-b9b0-126de5ed2227"
                }
            }
        }];
        const node = pipeline.nodes[0];
        const options = Object.assign({}, { flowInputMetadata: pipeline.flowInputMetadata }, { nodeInput: node.input }, { parentOutput: parentOutput });
        const result = parser.parse(options);
        expect(result.batch).to.equal(true);
        expect(result.input).to.have.lengthOf(5);
        expect(Object.keys(result.input[0].storage)).to.have.lengthOf(2);
    });
    it('should parse batch input as indexed', function () {
        const pipeline = {
            nodes: [
                {
                    nodeName: "green",
                    algorithmName: "green-alg",
                    input: [
                        { data1: "#[0...10]" },
                        { val1: "data1" },
                        { val2: "data2" },
                        { data2: "#[10...20]" },
                        "data1",
                        "data2",
                        { data3: "#[20...30]" }
                    ]
                }
            ]
        }
        const node = pipeline.nodes[0];
        const options = { nodeInput: node.input, batchOperation: 'indexed' };
        const result = parser.parse(options);
        expect(result.batch).to.equal(true);
        expect(result.input).to.have.lengthOf(11);
        expect(result.input[0].input[0].data1).to.equal(0);
        expect(result.input[0].input[3].data2).to.equal(10);
        expect(result.input[0].input[6].data3).to.equal(20);
        expect(result.input[9].input[0].data1).to.equal(9);
        expect(result.input[9].input[3].data2).to.equal(19);
        expect(result.input[9].input[6].data3).to.equal(29);

        expect(result.input[0].input[1].val1).to.equal("data1");
        expect(result.input[0].input[2].val2).to.equal("data2");
        expect(result.input[0].input[4]).to.equal("data1");
        expect(result.input[0].input[5]).to.equal("data2");
        expect(result.input[9].input[1].val1).to.equal("data1");
        expect(result.input[9].input[2].val2).to.equal("data2");
        expect(result.input[9].input[4]).to.equal("data1");
        expect(result.input[9].input[5]).to.equal("data2");
    });
    it('should parse batch input as cartesian', function () {
        const pipeline = {
            nodes: [
                {
                    nodeName: "green",
                    algorithmName: "green-alg",
                    input: [
                        { data1: "#[0...10]" },
                        { val1: "data1" },
                        { val2: "data2" },
                        { data2: "#[100...110]" }
                    ]
                }
            ]
        }
        const node = pipeline.nodes[0];
        const options = { nodeInput: node.input, batchOperation: 'cartesian' };
        const result = parser.parse(options);
        expect(result.batch).to.equal(true);
        expect(result.input).to.have.lengthOf(121);
        expect(result.input[0].input[0].data1).to.equal(0);
        expect(result.input[0].input[1].val1).to.equal("data1");
        expect(result.input[0].input[2].val2).to.equal("data2");
        expect(result.input[0].input[3].data2).to.equal(100);
        expect(result.input[100].input[0].data1).to.equal(9);
        expect(result.input[100].input[1].val1).to.equal("data1");
        expect(result.input[100].input[2].val2).to.equal("data2");
        expect(result.input[100].input[3].data2).to.equal(101);
    });
    it('should parse batch input as cartesian with flowInput', function () {
        const pipeline = {
            nodes: [
                {
                    nodeName: "green",
                    algorithmName: "green-alg",
                    input: [
                        "#@flowInput.files.links",
                        { data: { prop: "@flowInput.x" } },
                        "@flowInput.x",
                        "@flowInput.y",
                        "#@flowInput.files.links",
                        2,
                        false,
                        ["@flowInput"],
                        { a: { b: "@flowInput.z" } }
                    ]
                },
            ],
            "flowInput": {
                "x": [1, 2, 3, 4, 5],
                "y": false,
                "files": {
                    "links": [1, 2, 3, 4, 5]
                }
            },
            "flowInputMetadata": {
                "metadata": {
                    "flowInputMetadata": { type: "object" },
                    "flowInput.x": { type: "array", size: 5 },
                    "flowInput.y": { type: "bool" },
                    "flowInput.files": { type: "object" },
                    "flowInput.files.links": { type: "array", size: 5 }
                },
                "storageInfo": {
                    "path": "batch-5b0b25a1-5364-4bd6-b9b0-126de5ed2227"
                }
            }
        }
        const firstNode = pipeline.nodes[0];
        const options = { flowInputMetadata: pipeline.flowInputMetadata, nodeInput: firstNode.input, batchOperation: 'cartesian' };
        const result = parser.parse(options);
        expect(result.batch).to.equal(true);
        expect(result.input).to.have.lengthOf(25);
    });
});