
const { expect } = require('chai');
const { parser, consts } = require('../index');
const sinon = require('sinon');

describe('Main', function () {
    describe('Parse', function () {
        it('should parse node result to another node', function () {
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
                        "Key": "yellow:yellow-alg:bde23282-4a20-4a13-9d5c-a1e9cd4a696a",
                        "Bucket": "batch-5b0b25a1-5364-4bd6-b9b0-126de5ed2227"
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
        it('should parse node result of waitNode result', function () {
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
                        "Key": "yellow:yellow-alg:bde23282-4a20-4a13-9d5c-a1e9cd4a696a",
                        "Bucket": "batch-5b0b25a1-5364-4bd6-b9b0-126de5ed2227",
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
        it('should parse node result of waitAny result', function () {
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
                        "Key": "yellow:yellow-alg:bde23282-4a20-4a13-9d5c-a1e9cd4a696a",
                        "Bucket": "batch-5b0b25a1-5364-4bd6-b9b0-126de5ed2227",
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
        it('should parse node result of waitBatch result', function () {
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
                    Key: "yellow:yellow-alg:1bde23282-4a20-4a13-9d5c-a1e9cd4a696a",
                    Bucket: "batch-5b0b25a1-5364-4bd6-b9b0-126de5ed2227"
                }
            },
            {
                metadata: {
                    yellow: { type: "array", size: 5 }
                },
                storageInfo: {
                    Key: "yellow:yellow-alg:2bde23282-4a20-4a13-9d5c-a1e9cd4a696a",
                    Bucket: "batch-5b0b25a1-5364-4bd6-b9b0-126de5ed2227"
                }
            },
            {
                metadata: {
                    yellow: { type: "array", size: 5 }
                },
                storageInfo: {
                    Key: "yellow:yellow-alg:3bde23282-4a20-4a13-9d5c-a1e9cd4a696a",
                    Bucket: "batch-5b0b25a1-5364-4bd6-b9b0-126de5ed2227"
                }
            }];
            const node = pipeline.nodes[0];
            const parentOutput = [{ node: 'yellow', type: consts.relations.WAIT_BATCH, result: parentResult }];
            const options = Object.assign({}, { nodeInput: node.input }, { parentOutput });
            const result = parser.parse(options);
            const key = Object.keys(result.storage)[0];
            expect(result.batch).to.equal(true);
            expect(result.input).to.have.lengthOf(parentResult.length);
            expect(result.storage[key]).to.have.property('storageInfo');
            expect(result.storage[key]).to.have.property('path');
        });
        it('should parse node result of waitAnyBatch result', function () {
            const pipeline = {
                "name": "resultBatch",
                "nodes": [
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
                "flowInput": {
                    "metadata": {
                        "flowInput.files.links": { type: "array", size: 5 }
                    },
                    "storageInfo": {
                        "Key": "green:green-alg:bde23282-4a20-4a13-9d5c-a1e9cd4a696a",
                        "Bucket": "batch-5b0b25a1-5364-4bd6-b9b0-126de5ed2227"
                    }
                }
            };
            const node = pipeline.nodes[0];
            const array =
                [{
                    metadata: {
                        "yellow.data": { type: "array", size: 5 }
                    },
                    storageInfo: {
                        Key: "yellow:yellow-alg:1bde23282-4a20-4a13-9d5c-a1e9cd4a696a",
                        Bucket: "batch-5b0b25a1-5364-4bd6-b9b0-126de5ed2227"
                    }
                },
                {
                    metadata: {
                        "yellow.data": { type: "array", size: 5 }
                    },
                    storageInfo: {
                        Key: "yellow:yellow-alg:2bde23282-4a20-4a13-9d5c-a1e9cd4a696a",
                        Bucket: "batch-5b0b25a1-5364-4bd6-b9b0-126de5ed2227"
                    }
                },
                {
                    metadata: {
                        "yellow.data": { type: "array", size: 5 }
                    },
                    storageInfo: {
                        Key: "yellow:yellow-alg:3bde23282-4a20-4a13-9d5c-a1e9cd4a696a",
                        Bucket: "batch-5b0b25a1-5364-4bd6-b9b0-126de5ed2227"
                    }
                }]

            array.forEach(a => {
                const parentOutput = [{ node: 'yellow', type: consts.relations.WAIT_ANY_BATCH, result: a }];
                const options = Object.assign({}, { nodeInput: node.input }, { flowInput: pipeline.flowInput }, { parentOutput });
                const result = parser.parse(options);
                const length = array[0].length;
                const keys = Object.keys(result.storage);
                const key = keys[0];
                expect(result.batch).to.equal(true);
                expect(result.input).to.have.lengthOf(5);
                expect(result.input[0].input).to.have.lengthOf(node.input.length);
                expect(result.storage).to.have.property(key);
                expect(result.storage[key]).to.have.property('storageInfo');
                expect(result.storage[key]).to.have.property('path');
            })
        });
        it('should parse node result of waitNode/waitAny/waitAnyBatch result', function () {
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
                "flowInput": {
                    "metadata": {
                        "flowInput.files.links": { type: "array", size: 5 }
                    },
                    "storageInfo": {
                        "Key": "green:green-alg:bde23282-4a20-4a13-9d5c-a1e9cd4a696a",
                        "Bucket": "batch-5b0b25a1-5364-4bd6-b9b0-126de5ed2227"
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
            const options = Object.assign({}, { nodeInput: node.input }, { flowInput: pipeline.flowInput }, { parentOutput });
            const nodes = parser.extractNodesFromInput(node.input);
            const result = parser.parse(options);
            const keys = Object.keys(result.storage);
            const key = keys[0];
            expect(result.batch).to.equal(true);
            expect(result.input).to.have.lengthOf(waitAnyBatch.length);
            expect(result.input[0].input).to.have.lengthOf(node.input.length);

            const key0 = result.input[0].input[0].substr(2);
            const key1 = result.input[0].input[1].substr(2);
            const key2 = result.input[0].input[2].substr(2);
            const key3 = result.input[1].input[0].substr(2);
            const key4 = result.input[1].input[1].substr(2);
            const key5 = result.input[1].input[2].substr(2);
            const key6 = result.input[2].input[0].substr(2);
            const key7 = result.input[2].input[1].substr(2);
            const key8 = result.input[2].input[2].substr(2);

            expect(result.storage[key0].storageInfo).to.deep.equal(waitNode.storageInfo);
            expect(result.storage[key1].storageInfo).to.deep.equal(waitAny.storageInfo);
            expect(result.storage[key2].storageInfo).to.deep.equal(waitAnyBatch[0].storageInfo);
            expect(result.storage[key3].storageInfo).to.deep.equal(waitNode.storageInfo);
            expect(result.storage[key4].storageInfo).to.deep.equal(waitAny.storageInfo);
            expect(result.storage[key5].storageInfo).to.deep.equal(waitAnyBatch[1].storageInfo);
            expect(result.storage[key6].storageInfo).to.deep.equal(waitNode.storageInfo);
            expect(result.storage[key7].storageInfo).to.deep.equal(waitAny.storageInfo);
            expect(result.storage[key8].storageInfo).to.deep.equal(waitAnyBatch[2].storageInfo);

            expect(result.storage).to.have.property(key);
            expect(result.storage[key]).to.have.property('storageInfo');
            expect(result.storage[key]).to.have.property('path');

        });
        it('should parse simple input', function () {
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
            const options = Object.assign({}, { flowInput: pipeline.flowInput }, { nodeInput: node.input });
            const result = parser.parse(options);
            expect(result.batch).to.equal(false);
            expect(result.input).to.deep.equal(["test"]);
        });
        it('should parse empty input', function () {
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
        it('should throw type error on string', function () {
            expect(() => {
                parser.parse("string");
            }).to.throw(TypeError, 'options');
        });
        it('should throw type error on null', function () {
            expect(() => {
                parser.parse(null);
            }).to.throw(TypeError, 'options');
        });
        it('should replaceFlowInput', function () {
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
    });
    describe('Metadata', function () {
        it('should parse objectToMetadata with no path', function () {
            const object = {
                node1: {
                    foo: 'bar',
                    arr: [1, 2, 3, 4, 5],
                    num: 256
                }
            }
            const paths = ['node1'];
            const metadata = parser.objectToMetadata(object, paths);
            const keys = Object.keys(metadata);
            expect(keys).to.deep.equal(paths);
            expect(metadata[keys[0]].type).to.equal('object');
        });
        it('should parse objectToMetadata with paths and types', function () {
            const object = {
                node1: {
                    array: Array.from(Array(15000).keys()),
                    number: 34,
                    string: 'bla',
                    object: { prop: 100 }
                }
            }
            const paths = ['node1.array', 'node1.number', 'node1.string', 'node1.object.prop'];
            const metadata = parser.objectToMetadata(object, paths);
            const keys = Object.keys(metadata);
            expect(keys).to.deep.equal(paths);
            expect(metadata[keys[0]].type).to.equal('array');
            expect(metadata[keys[1]].type).to.equal('number');
            expect(metadata[keys[2]].type).to.equal('string');
            expect(metadata[keys[3]].type).to.equal('number');
        });
        it('should parse objectToMetadata with complex paths and types', function () {
            const object = {
                node: {
                    array1: [{ prop: { data: 'HTTP' } }],
                    array2: [{ prop: { data: [1, 2, 3, 4, 5] } }],
                    number: 34,
                    string: 'bla',
                    object: { prop: 100 }
                }
            }
            const paths = ['node.array1.0.prop.data', 'node.array2.0.prop.data', 'node.number', 'node.object.prop', 'node.string'];
            const metadata = parser.objectToMetadata(object, paths);
            const keys = Object.keys(metadata);
            expect(keys).to.deep.equal(paths);
            expect(metadata[keys[0]].type).to.equal('string');
            expect(metadata[keys[1]].type).to.equal('array');
            expect(metadata[keys[1]].size).to.equal(5);
            expect(metadata[keys[2]].type).to.equal('number');
            expect(metadata[keys[3]].type).to.equal('number');
            expect(metadata[keys[4]].type).to.equal('string');
        });
        it('should parse objectToMetadata type string', function () {
            const object = {
                node1: {
                    foo: 'bar',
                    arr: [1, 2, 3, 4, 5],
                    num: 256
                }
            }
            const paths = ['node1.foo'];
            const metadata = parser.objectToMetadata(object, paths);
            const keys = Object.keys(metadata);
            expect(keys).to.deep.equal(paths);
            expect(metadata[keys[0]].type).to.equal('string');
        });
        it('should parse objectToMetadata type array', function () {
            const object = {
                node1: {
                    foo: 'bar',
                    arr: [1, 2, 3, 4, 5],
                    num: 256
                }
            }
            const paths = ['node1.arr'];
            const metadata = parser.objectToMetadata(object, paths);
            const keys = Object.keys(metadata);
            expect(keys).to.deep.equal(paths);
            expect(metadata[keys[0]].size).to.equal(5);
            expect(metadata[keys[0]].type).to.equal('array');
        });
        it('should parse objectToMetadata type number', function () {
            const object = {
                node1: {
                    foo: 'bar',
                    arr: [1, 2, 3, 4, 5],
                    num: 256
                }
            }
            const paths = ['node1.num'];
            const metadata = parser.objectToMetadata(object, paths);
            const keys = Object.keys(metadata);
            expect(keys).to.deep.equal(paths);
            expect(metadata[keys[0]].type).to.equal('number');
        });
        it('should parse objectToMetadata all types', function () {
            const object = {
                node1: {
                    foo: 'bar',
                    arr: [1, 2, 3, 4, 5],
                    num: 256
                }
            }
            const paths = ['node1.foo', 'node1.arr', 'node1.num', 'node1.arr.1'];
            const metadata = parser.objectToMetadata(object, paths);
            const keys = Object.keys(metadata);
            expect(keys).to.deep.equal(paths);
        });
        it('should parse objectToMetadata type object', function () {
            const object = {
                node1: {
                    foo: 'bar',
                    arr: [1, 2, 3, 4, 5],
                    num: 256
                }
            }
            const paths = ['node1'];
            const metadata = parser.objectToMetadata(object, paths);
            const keys = Object.keys(metadata);
            expect(keys).to.deep.equal(paths);
            expect(metadata[keys[0]].type).to.equal('object');
        });
        it('should not parse objectToMetadata', function () {
            const object = {
                node1: {
                    foo: 'bar',
                    arr: [1, 2, 3, 4, 5],
                    num: 256
                }
            }
            const paths = ['node1.not', 'node1.exists', 'bla'];
            const metadata = parser.objectToMetadata(object, paths);
            const keys = Object.keys(metadata);
            expect(keys).to.be.empty;
        });
    });
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
                "fromClient": {
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
                "flowInput": {
                    "metadata": {
                        "flowInput": { type: "object" },
                        "flowInput.x": { type: "array", size: 5 },
                        "flowInput.y": { type: "bool" },
                        "flowInput.files": { type: "object" },
                        "flowInput.files.links": { type: "array", size: 5 }
                    },
                    "storageInfo": {
                        "Key": "green:green-alg:bde23282-4a20-4a13-9d5c-a1e9cd4a696a",
                        "Bucket": "batch-5b0b25a1-5364-4bd6-b9b0-126de5ed2227"
                    }
                }
            }
            const firstNode = pipeline.nodes[0];
            const options = Object.assign({}, { flowInput: pipeline.flowInput }, { nodeInput: firstNode.input });
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
                "flowInput": {
                    "metadata": {
                        "flowInput.files": { type: "object" }
                    },
                    "storageInfo": {
                        "Key": "green:green-alg:bde23282-4a20-4a13-9d5c-a1e9cd4a696a",
                        "Bucket": "batch-5b0b25a1-5364-4bd6-b9b0-126de5ed2227"
                    }
                }
            }
            const firstNode = pipeline.nodes[0];
            const options = Object.assign({}, { flowInput: pipeline.flowInput }, { nodeInput: firstNode.input });
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
                "flowInput": {
                    "metadata": {
                        "flowInput.files.links": { type: "array", size: 5 }
                    },
                    "storageInfo": {
                        "Key": "green:green-alg:bde23282-4a20-4a13-9d5c-a1e9cd4a696a",
                        "Bucket": "batch-5b0b25a1-5364-4bd6-b9b0-126de5ed2227"
                    }
                }
            }
            const firstNode = pipeline.nodes[0];
            const options = Object.assign({}, { flowInput: pipeline.flowInput }, { nodeInput: firstNode.input });
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
                "flowInput": {
                    "metadata": {
                        "flowInput.files.links": { type: "array", size: 5 }
                    },
                    "storageInfo": {
                        "Key": "green:green-alg:bde23282-4a20-4a13-9d5c-a1e9cd4a696a",
                        "Bucket": "batch-5b0b25a1-5364-4bd6-b9b0-126de5ed2227"
                    }
                }
            }
            const firstNode = pipeline.nodes[0];
            const options = Object.assign({}, { flowInput: pipeline.flowInput }, { nodeInput: firstNode.input });
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
                "flowInput": {
                    "metadata": {
                        "flowInput.files.links": { type: "array", size: 5 }
                    },
                    "storageInfo": {
                        "Key": "green:green-alg:bde23282-4a20-4a13-9d5c-a1e9cd4a696a",
                        "Bucket": "batch-5b0b25a1-5364-4bd6-b9b0-126de5ed2227"
                    }
                }
            }
            const firstNode = pipeline.nodes[0];
            const options = Object.assign({}, { flowInput: pipeline.flowInput }, { nodeInput: firstNode.input });
            const result = parser.parse(options);
            expect(result.batch).to.equal(true);
            expect(result.input).to.have.lengthOf(5);
        });
        it('should parse batch input as raw', function () {
            const pipeline = {
                "nodes": [
                    {
                        "nodeName": "green",
                        "algorithmName": "green-alg",
                        "input": [
                            "#[1,2,3,4,5]"
                        ]
                    }
                ]
            }
            const firstNode = pipeline.nodes[0];
            const options = Object.assign({}, { flowInput: pipeline.flowInput }, { nodeInput: firstNode.input });
            const result = parser.parse(options);
            expect(result.batch).to.equal(true);
            expect(result.input).to.have.lengthOf(5);
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
            const options = Object.assign({}, { flowInput: pipeline.flowInput }, { nodeInput: firstNode.input });
            const result = parser.parse(options);
            expect(result.batch).to.equal(true);
            expect(result.input).to.have.lengthOf(100);
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
                "flowInput": {
                    "metadata": {
                        "flowInput.files.links": { type: "array", size: 5 }
                    },
                    "storageInfo": {
                        "Key": "flowInput:bde23282-4a20-4a13-9d5c-a1e9cd4a696a",
                        "Bucket": "flowInput-5b0b25a1-5364-4bd6-b9b0-126de5ed2227"
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
                        "Key": "green:green-alg:bde23282-4a20-4a13-9d5c-a1e9cd4a696a",
                        "Bucket": "batch-5b0b25a1-5364-4bd6-b9b0-126de5ed2227"
                    }
                }
            }];
            const node = pipeline.nodes[0];
            const options = Object.assign({}, { flowInput: pipeline.flowInput }, { nodeInput: node.input }, { parentOutput: parentOutput });
            const result = parser.parse(options);
            expect(result.batch).to.equal(true);
            expect(result.input).to.have.lengthOf(5);
        });
    });
    describe('Checks', function () {
        it('should throw when check Flow Input', function () {
            const pipeline = {
                "nodes": [
                    {
                        "nodeName": "green",
                        "algorithmName": "green-alg",
                        "input": [
                            "#@flowInput.not_such_object"
                        ]
                    },
                ],
                "flowInput": {
                    "files": {
                        "links": [
                            "links-1",
                            "links-2",
                            "links-3",
                            "links-4",
                            "links-5"
                        ]
                    }
                }
            }
            const firstNode = pipeline.nodes[0];
            const options = Object.assign({}, { flowInput: pipeline.flowInput }, { nodeInput: firstNode.input });
            expect(() => {
                parser.checkFlowInput(options);
            }).to.throw(`unable to find flowInput.not_such_object`);
        });
        it('should not throw check Flow Input when is valid', function () {
            const pipeline = {
                "nodes": [
                    {
                        "nodeName": "green",
                        "algorithmName": "green-alg",
                        "input": [
                            "#@flowInput.files.links"
                        ]
                    },
                ],
                "flowInput": {
                    "files": {
                        "links": [
                            "links-1",
                            "links-2",
                            "links-3",
                            "links-4",
                            "links-5"
                        ]
                    }
                }
            }
            const firstNode = pipeline.nodes[0];
            const options = Object.assign({}, { flowInput: pipeline.flowInput }, { nodeInput: firstNode.input });
            parser.checkFlowInput(options);
            expect(options.nodeInput).to.deep.equal(firstNode.input);
        });
        it('should not throw check Flow Input node input is null', function () {
            const pipeline = {
                "nodes": [
                    {
                        "nodeName": "green",
                        "algorithmName": "green-alg",
                        "input": [
                            "#@flowInput.files.links"
                        ]
                    },
                ],
                "flowInput": {
                    "files": {
                        "links": [
                            "links-1",
                            "links-2",
                            "links-3",
                            "links-4",
                            "links-5"
                        ]
                    }
                }
            }
            const firstNode = pipeline.nodes[0];
            const options = Object.assign({}, { flowInput: pipeline.flowInput }, { nodeInput: null });
            parser.checkFlowInput(options);
            expect(options.nodeInput).to.be.null;
        });
        it('should throw check storage keyword', function () {
            const pipeline = {
                "nodes": [
                    {
                        "nodeName": "green",
                        "algorithmName": "green-alg",
                        "input": [
                            "$$flowInput.files.links"
                        ]
                    }
                ]
            }
            const node = pipeline.nodes[0];
            const options = Object.assign({}, { nodeInput: node.input });
            expect(() => {
                parser.checkStorageKeyword(options);
            }).to.throw(`using reserved keyword $$`);
        });
    });
    describe('ExtractNodes', function () {
        it('should extract nodes from string inside array input', function () {
            const pipeline = {
                "name": "flow2",
                "nodes": [
                    {
                        "nodeName": "green",
                        "algorithmName": "green-alg",
                        "input": [
                            "test"
                        ]
                    },
                    {
                        "nodeName": "yellow",
                        "algorithmName": "yellow-alg",
                        "input": [
                            "@green"
                        ]
                    },
                    {
                        "nodeName": "black",
                        "algorithmName": "black-alg",
                        "input": [
                            "@green",
                            "@yellow"
                        ]
                    }
                ]
            };
            const node = 'black';
            const lastNode = pipeline.nodes.find(n => n.nodeName === node);
            const nodeNames = pipeline.nodes.filter(n => n.nodeName !== node).map(n => n.nodeName);
            const nodes = parser.extractNodesFromInput(lastNode.input);
            const names = nodes.map(n => n.nodeName);
            expect(names).to.deep.equal(nodeNames);
        });
        it('should extract nodes from string inside object input', function () {
            const pipeline = {
                "name": "flow2",
                "nodes": [
                    {
                        "nodeName": "green",
                        "algorithmName": "green-alg",
                        "input": [
                            "test"
                        ]
                    },
                    {
                        "nodeName": "black",
                        "algorithmName": "black-alg",
                        "input": [
                            { b: "@green" }
                        ]
                    }
                ]
            };
            const node = 'black';
            const lastNode = pipeline.nodes.find(n => n.nodeName === node);
            const nodeNames = pipeline.nodes.filter(n => n.nodeName !== node).map(n => n.nodeName);
            const nodes = parser.extractNodesFromInput(lastNode.input[0]);
            const names = nodes.map(n => n.nodeName);
            expect(names).to.deep.equal(nodeNames);
        });
        it('should extract nodes from string input', function () {
            const pipeline = {
                "name": "flow2",
                "nodes": [
                    {
                        "nodeName": "green",
                        "algorithmName": "green-alg",
                        "input": [
                            "test"
                        ]
                    },
                    {
                        "nodeName": "black",
                        "algorithmName": "black-alg",
                        "input": [
                            "@green"
                        ]
                    }
                ]
            };
            const node = 'black';
            const lastNode = pipeline.nodes.find(n => n.nodeName === node);
            const nodeNames = pipeline.nodes.filter(n => n.nodeName !== node).map(n => n.nodeName);
            const nodes = parser.extractNodesFromInput(lastNode.input[0]);
            const names = nodes.map(n => n.nodeName);
            expect(names).to.deep.equal(nodeNames);
        });
        it('should extract nodes from object input', function () {
            const pipeline = {
                "name": "flow2",
                "nodes": [
                    {
                        "nodeName": "green",
                        "algorithmName": "green-alg",
                        "input": [
                            "test"
                        ]
                    },
                    {
                        "nodeName": "yellow",
                        "algorithmName": "yellow-alg",
                        "input": [
                            "@green"
                        ]
                    },
                    {
                        "nodeName": "black",
                        "algorithmName": "black-alg",
                        "input": [
                            [{ custom: { obj: "@green" } }],
                            { custom: { array: ["@yellow"] } }
                        ]
                    }
                ]
            };
            const node = 'black';
            const lastNode = pipeline.nodes.find(n => n.nodeName === node);
            const nodeNames = pipeline.nodes.filter(n => n.nodeName !== node).map(n => n.nodeName);
            const nodes = parser.extractNodesFromInput(lastNode.input);
            const names = nodes.map(n => n.nodeName);
            expect(names).to.deep.equal(nodeNames);
        });
        it('should extract nodes from object with wait batch', function () {
            const pipeline = {
                "name": "flow2",
                "nodes": [
                    {
                        "nodeName": "green",
                        "algorithmName": "green-alg",
                        "input": [
                            "test"
                        ]
                    },
                    {
                        "nodeName": "yellow",
                        "algorithmName": "yellow-alg",
                        "input": [
                            "@green"
                        ]
                    },
                    {
                        "nodeName": "black",
                        "algorithmName": "black-alg",
                        "input": [
                            [{ custom: { obj: "*@green" } }],
                            { custom: { array: ["@yellow"] } }
                        ]
                    }
                ]
            };
            const node = 'black';
            const lastNode = pipeline.nodes.find(n => n.nodeName === node);
            const nodeNames = pipeline.nodes.filter(n => n.nodeName !== node).map(n => n.nodeName);
            const nodes = parser.extractNodesFromInput(lastNode.input);
            const names = nodes.map(n => n.nodeName);
            expect(names).to.deep.equal(nodeNames);
        });
    });
    describe('InputTypes', function () {
        it('should return true when is batch', function () {
            const pipeline = {
                "name": "flow2",
                "nodes": [
                    {
                        "nodeName": "green",
                        "algorithmName": "green-alg",
                        "input": [
                            "#@flowInput.files.links"
                        ]
                    }
                ],
                "flowInput": {
                    "files": {
                        "links": [
                            "links-1",
                            "links-2",
                            "links-3",
                            "links-4",
                            "links-5"
                        ]
                    }
                }
            };
            const firstNode = pipeline.nodes[0];
            const result = parser._isBatch(firstNode.input[0]);
            expect(result).to.equal(true);
        });
        it('should return false when is not batch', function () {
            const pipeline = {
                "name": "flow2",
                "nodes": [
                    {
                        "nodeName": "green",
                        "algorithmName": "green-alg",
                        "input": [
                            "@flowInput.files.links"
                        ]
                    }
                ],
                "flowInput": {
                    "files": {
                        "links": [
                            "links-1",
                            "links-2",
                            "links-3",
                            "links-4",
                            "links-5"
                        ]
                    }
                }
            };
            const node = pipeline.nodes[0];
            const result = parser._isBatch(node.input[0]);
            expect(result).to.equal(false);
        });
        it('should return true when is node', function () {
            const pipeline = {
                "name": "flow2",
                "nodes": [
                    {
                        "nodeName": "yellow",
                        "algorithmName": "yellow-alg",
                        "input": [
                            "@green"
                        ]
                    }
                ]
            };
            const node = pipeline.nodes[0];
            const result = parser._isNode(node.input[0]);
            const nodeName = node.input[0].substr(1);
            expect(result.isNode).to.equal(true);
            expect(result.nodeName).to.equal(nodeName);
        });
        it('should return false when is not node', function () {
            const pipeline = {
                "name": "flow2",
                "nodes": [
                    {
                        "nodeName": "green",
                        "algorithmName": "green-alg",
                        "input": [
                            "#@flowInput.files.links"
                        ]
                    }
                ]
            };
            const node = pipeline.nodes[0];
            const result = parser._isNode(node.input[0]);
            expect(result.isNode).to.equal(false);
        });
        it('should return true when is reference', function () {
            const pipeline = {
                "name": "flow1",
                "nodes": [
                    {
                        "nodeName": "yellow",
                        "algorithmName": "yellow-alg",
                        "input": [
                            "@green"
                        ]
                    },

                ]
            }
            const node = pipeline.nodes[0];
            const result = parser._isReference(node.input[0]);
            expect(result).to.equal(true);
        });
        it('should return false when is not reference', function () {
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
            const result = parser._isReference(node.input[0]);
            expect(result).to.equal(false);
        });
    });
});