
const { expect } = require('chai');
const { parser, consts } = require('../index');
const sinon = require('sinon');

describe('Main', function () {
    xdescribe('Parse', function () {
        it('should parse batch input as string', function () {
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
            const links = pipeline.flowInput.files.links.map(f => new Array(f));
            const firstNode = pipeline.nodes[0];
            const options = Object.assign({}, { flowInput: pipeline.flowInput }, { nodeInput: firstNode.input });
            const result = parser.parse(options);
            expect(result.input).to.deep.equal(links);
        });
        it('should replace flowInput', function () {
            const pipeline = {
                "name": "multadd",
                "nodes": [
                    {
                        "nodeName": "evaladd",
                        "algorithmName": "eval-alg",
                        "input": [
                            "@flowInput.addInput",
                            "@flowInput.addInput",
                            "@evalmul",
                            "#@flowInput.files.links"
                        ],
                        "extraData": {
                            "code": [
                                "(input) => {",
                                "const result = input[0] + input[1]",
                                "return result;}"
                            ]
                        }
                    },
                    {
                        "nodeName": "evalmul",
                        "algorithmName": "eval-alg",
                        "input": [
                            "@flowInput.multInput",
                            "@flowInput.addInput",
                            "@flowInput.files"
                        ],
                        "extraData": {
                            "code": [
                                "(input) => {",
                                "const result = input[0] * input[1]",
                                "return result;}"
                            ]
                        }
                    }
                ],
                "flowInput": {
                    "addInput": 3,
                    "multInput": 5,
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
            const result = parser.replaceFlowInput(pipeline);
            expect('{"flowInput.addInput":{"type":"number"},"flowInput.files.links":{"type":"array","size":5},"flowInput.multInput":{"type":"number"},"flowInput.files":{"type":"object"}}').to.equals(JSON.stringify(result));
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
            const input = [200, pipeline.flowInput.files, false];
            const firstNode = pipeline.nodes[0];
            const options = Object.assign({}, { flowInput: pipeline.flowInput }, { nodeInput: firstNode.input });
            const result = parser.parse(options);
            expect(result.batch).to.deep.equal(false);
            expect(result.input).to.deep.equal(input);
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
            const array = pipeline.flowInput.files.links.map(f => new Array({ a: { c: f } }));
            const firstNode = pipeline.nodes[0];
            const options = Object.assign({}, { flowInput: pipeline.flowInput }, { nodeInput: firstNode.input });
            const result = parser.parse(options);
            expect(result.input).to.deep.equal(array);
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
            const array = pipeline.flowInput.files.links.map(f => new Array({ a: { b: [1, 2, [f]] } }));
            const firstNode = pipeline.nodes[0];
            const options = Object.assign({}, { flowInput: pipeline.flowInput }, { nodeInput: firstNode.input });
            const result = parser.parse(options);
            expect(result.input).to.deep.equal(array);
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
            const array = pipeline.flowInput.files.links.map(f => new Array({ a: [{ b: f }] }));
            const firstNode = pipeline.nodes[0];
            const options = Object.assign({}, { flowInput: pipeline.flowInput }, { nodeInput: firstNode.input });
            const result = parser.parse(options);
            expect(result.input).to.deep.equal(array);
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
            const array = [1, 2, 3, 4, 5].map(i => new Array(1).fill(i, 0, 1));
            const firstNode = pipeline.nodes[0];
            const options = Object.assign({}, { flowInput: pipeline.flowInput }, { nodeInput: firstNode.input });
            const result = parser.parse(options);
            expect(result.input).to.deep.equal(array);
        });
        it('should parse node result to batch', function () {
            const pipeline = {
                "name": "resultBatch",
                "nodes": [
                    {
                        "nodeName": "green",
                        "algorithmName": "green-alg",
                        "input": [
                            false,
                            "OK",
                            256
                        ]
                    },
                    {
                        "nodeName": "yellow",
                        "algorithmName": "yellow-alg",
                        "input": [
                            true,
                            "#@green",
                            "@flowInput.files.links"
                        ]
                    },
                    {
                        "nodeName": "red",
                        "algorithmName": "red-alg",
                        "input": [
                            "@yellow",
                            512
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
            const node = pipeline.nodes[1];
            const parentOutput = [{ node: 'green', type: consts.relations.WAIT_BATCH, result: [1, 2, 3, 4, 5] },];
            const options = Object.assign({}, { flowInput: pipeline.flowInput }, { nodeInput: node.input }, { parentOutput: parentOutput });
            const result = parser.parse(options);
            expect(result.batch).to.equal(true);
            expect(result.input).to.have.lengthOf(5);
        });
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
            const array = [6, 7, 8, 9, 10];
            const node = pipeline.nodes[0];
            const parentOutput = [{ node: 'yellow', type: consts.relations.WAIT_NODE, result: array }];
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
            const parentResult = { storageInfo: { path: 'link_to_data' } };
            const node = pipeline.nodes[0];
            const parentOutput = [{ node: 'yellow', type: consts.relations.WAIT_NODE, result: parentResult }];
            const options = Object.assign({}, { nodeInput: node.input }, { parentOutput: parentOutput });
            const result = parser.parse(options);
            const key = Object.keys(result.storage)[0];
            const expectedInput = [`$$${key}`, 512];
            expect(result.input).to.deep.equal(expectedInput);
            expect(result.batch).to.equal(false);
            expect(result.storage).to.have.property(key);
            expect(result.storage[key].storageInfo).to.deep.equal(parentResult.storageInfo);
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
            const parentResult = { storageInfo: { path: 'link_to_data' } };
            const node = pipeline.nodes[0];
            const parentOutput = [{ node: 'yellow', type: consts.relations.WAIT_ANY, result: parentResult }];
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
            const parentResult = [{ storageInfo: { path: 'link_to_data1' } }, { storageInfo: { path: 'link_to_data2' } }, { storageInfo: { path: 'link_to_data3' } }];
            const node = pipeline.nodes[0];
            const parentOutput = [{ node: 'yellow', type: consts.relations.WAIT_BATCH, result: parentResult }];
            const options = Object.assign({}, { nodeInput: node.input }, { parentOutput });
            const result = parser.parse(options);
            const key = Object.keys(result.storage)[0];
            expect(result.batch).to.equal(true);
            expect(result.input).to.have.lengthOf(parentResult.length)
            expect(result.storage).to.have.property(key);
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
            const array = [[{ storageInfo: { path: 'link_to_data1' } }], [{ storageInfo: { path: 'link_to_data2' } }], [{ storageInfo: { path: 'link_to_data3' } }]];
            array.forEach(a => {
                const parentOutput = [{ node: 'yellow', type: consts.relations.WAIT_ANY_BATCH, result: a }];
                const options = Object.assign({}, { nodeInput: node.input }, { flowInput: pipeline.flowInput }, { parentOutput });
                const result = parser.parse(options);
                const length = array[0].length;
                const keys = Object.keys(result.storage);
                const key = keys[0];
                expect(result.batch).to.equal(true);
                expect(result.input).to.have.lengthOf(a.length);
                expect(result.input[0]).to.have.lengthOf(node.input.length);
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
            const waitNode = { storageInfo: { path: 'link_to_data1' } };
            const waitAny = { storageInfo: { path: 'link_to_data1' } };
            const waitAnyBatch = [{ storageInfo: { path: 'link_to_data1' } }, { storageInfo: { path: 'link_to_data1' } }, { storageInfo: { path: 'link_to_data1' } }];
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
            expect(result.input[0]).to.have.lengthOf(node.input.length);

            const key0 = result.input[0][0].substr(2);
            const key1 = result.input[0][1].substr(2);
            const key2 = result.input[0][2].substr(2);
            const key3 = result.input[1][0].substr(2);
            const key4 = result.input[1][1].substr(2);
            const key5 = result.input[1][2].substr(2);
            const key6 = result.input[2][0].substr(2);
            const key7 = result.input[2][1].substr(2);
            const key8 = result.input[2][2].substr(2);

            expect(result.storage[key0].storageInfo).to.deep.equal(waitNode.storageInfo);
            expect(result.storage[key1].storageInfo).to.deep.equal(waitAny.storageInfo);
            expect(result.storage[key2].storageInfo).to.deep.equal(waitAnyBatch[0].storageInfo);
            expect(result.storage[key3].storageInfo).to.deep.equal(waitNode.storageInfo);
            expect(result.storage[key4].storageInfo).to.deep.equal(waitAny.storageInfo);
            expect(result.storage[key5].storageInfo).to.deep.equal(waitAnyBatch[1].storageInfo);
            expect(result.storage[key6].storageInfo).to.deep.equal(waitNode.storageInfo);
            expect(result.storage[key7].storageInfo).to.deep.equal(waitAny.storageInfo);
            expect(result.storage[key8].storageInfo).to.deep.equal(waitAnyBatch[2].storageInfo);

            expect(result.input[0][3]).to.deep.equal(pipeline.flowInput.files.links);
            expect(result.input[1][3]).to.deep.equal(pipeline.flowInput.files.links);
            expect(result.input[2][3]).to.deep.equal(pipeline.flowInput.files.links);

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
        it('should parse empty options', function () {
            const pipeline = {
                "name": "flow",
                "nodes": [
                    {
                        "nodeName": "black",
                        "algorithmName": "black-alg",
                        "input": []
                    }
                ]
            }
            const node = pipeline.nodes[0];
            const options = Object.assign({}, { nodeInput: node.input });
            const result = parser.parse(null);
            expect(result.batch).to.equal(false);
            expect(result.input).to.deep.equal(node.input);
        });
        it('should throw type error', function () {
            expect(() => {
                parser.parse("string");
            }).to.throw(TypeError, 'options');
        });
    });
    xdescribe('NewParse', function () {
        it('should parse batch input as string', function () {
            const pipeline = {
                "nodes": [
                    {
                        "nodeName": "green",
                        "algorithmName": "green-alg",
                        "input": [
                            "#@flowInput.files.links",
                            { data: { prop: "@flowInput" } },
                            "@flowInput.x",
                            "@flowInput.y",
                            "@flowInput"
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
                        "flowInput.x": { type: "int" },
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
            expect(result.input).to.deep.equal(links);
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
            const input = [200, pipeline.flowInput.files, false];
            const firstNode = pipeline.nodes[0];
            const options = Object.assign({}, { flowInput: pipeline.flowInput }, { nodeInput: firstNode.input });
            const result = parser.parse(options);
            expect(result.batch).to.deep.equal(false);
            expect(result.input).to.deep.equal(input);
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
            const array = pipeline.flowInput.files.links.map(f => new Array({ a: { c: f } }));
            const firstNode = pipeline.nodes[0];
            const options = Object.assign({}, { flowInput: pipeline.flowInput }, { nodeInput: firstNode.input });
            const result = parser.parse(options);
            expect(result.input).to.deep.equal(array);
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
            const array = pipeline.flowInput.files.links.map(f => new Array({ a: { b: [1, 2, [f]] } }));
            const firstNode = pipeline.nodes[0];
            const options = Object.assign({}, { flowInput: pipeline.flowInput }, { nodeInput: firstNode.input });
            const result = parser.parse(options);
            expect(result.input).to.deep.equal(array);
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
            const array = pipeline.flowInput.files.links.map(f => new Array({ a: [{ b: f }] }));
            const firstNode = pipeline.nodes[0];
            const options = Object.assign({}, { flowInput: pipeline.flowInput }, { nodeInput: firstNode.input });
            const result = parser.parse(options);
            expect(result.input).to.deep.equal(array);
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
            const array = [1, 2, 3, 4, 5].map(i => new Array(1).fill(i, 0, 1));
            const firstNode = pipeline.nodes[0];
            const options = Object.assign({}, { flowInput: pipeline.flowInput }, { nodeInput: firstNode.input });
            const result = parser.parse(options);
            expect(result.input).to.deep.equal(array);
        });
        it('should parse node result to batch', function () {
            const pipeline = {
                "name": "resultBatch",
                "nodes": [
                    {
                        "nodeName": "green",
                        "algorithmName": "green-alg",
                        "input": [
                            false,
                            "OK",
                            256
                        ]
                    },
                    {
                        "nodeName": "yellow",
                        "algorithmName": "yellow-alg",
                        "input": [
                            true,
                            "#@green",
                            "@flowInput.files.links"
                        ]
                    },
                    {
                        "nodeName": "red",
                        "algorithmName": "red-alg",
                        "input": [
                            "@yellow",
                            512
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
            const node = pipeline.nodes[1];
            const parentOutput = [{ node: 'green', type: consts.relations.WAIT_BATCH, result: [1, 2, 3, 4, 5] }];
            const options = Object.assign({}, { flowInput: pipeline.flowInput }, { nodeInput: node.input }, { parentOutput: parentOutput });
            const result = parser.parse(options);
            expect(result.batch).to.equal(true);
            expect(result.input).to.have.lengthOf(5);
        });
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
            const array = [6, 7, 8, 9, 10];
            const node = pipeline.nodes[0];
            const parentOutput = [{ node: 'yellow', type: consts.relations.WAIT_NODE, result: array }];
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
            const parentResult = { storageInfo: { path: 'link_to_data' } };
            const node = pipeline.nodes[0];
            const parentOutput = [{ node: 'yellow', type: consts.relations.WAIT_NODE, result: parentResult }];
            const options = Object.assign({}, { nodeInput: node.input }, { parentOutput: parentOutput });
            const result = parser.parse(options);
            const key = Object.keys(result.storage)[0];
            const expectedInput = [`$$${key}`, 512];
            expect(result.input).to.deep.equal(expectedInput);
            expect(result.batch).to.equal(false);
            expect(result.storage).to.have.property(key);
            expect(result.storage[key].storageInfo).to.deep.equal(parentResult.storageInfo);
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
            const parentResult = { storageInfo: { path: 'link_to_data' } };
            const node = pipeline.nodes[0];
            const parentOutput = [{ node: 'yellow', type: consts.relations.WAIT_ANY, result: parentResult }];
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
            const parentResult = [{ storageInfo: { path: 'link_to_data1' } }, { storageInfo: { path: 'link_to_data2' } }, { storageInfo: { path: 'link_to_data3' } }];
            const node = pipeline.nodes[0];
            const parentOutput = [{ node: 'yellow', type: consts.relations.WAIT_BATCH, result: parentResult }];
            const options = Object.assign({}, { nodeInput: node.input }, { parentOutput });
            const result = parser.parse(options);
            const key = Object.keys(result.storage)[0];
            expect(result.batch).to.equal(true);
            expect(result.input).to.have.lengthOf(parentResult.length)
            expect(result.storage).to.have.property(key);
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
            const array = [[{ storageInfo: { path: 'link_to_data1' } }], [{ storageInfo: { path: 'link_to_data2' } }], [{ storageInfo: { path: 'link_to_data3' } }]];
            array.forEach(a => {
                const parentOutput = [{ node: 'yellow', type: consts.relations.WAIT_ANY_BATCH, result: a }];
                const options = Object.assign({}, { nodeInput: node.input }, { flowInput: pipeline.flowInput }, { parentOutput });
                const result = parser.parse(options);
                const length = array[0].length;
                const keys = Object.keys(result.storage);
                const key = keys[0];
                expect(result.batch).to.equal(true);
                expect(result.input).to.have.lengthOf(a.length);
                expect(result.input[0]).to.have.lengthOf(node.input.length);
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
            const waitNode = { storageInfo: { path: 'link_to_data1' } };
            const waitAny = { storageInfo: { path: 'link_to_data1' } };
            const waitAnyBatch = [{ storageInfo: { path: 'link_to_data1' } }, { storageInfo: { path: 'link_to_data1' } }, { storageInfo: { path: 'link_to_data1' } }];
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
            expect(result.input[0]).to.have.lengthOf(node.input.length);

            const key0 = result.input[0][0].substr(2);
            const key1 = result.input[0][1].substr(2);
            const key2 = result.input[0][2].substr(2);
            const key3 = result.input[1][0].substr(2);
            const key4 = result.input[1][1].substr(2);
            const key5 = result.input[1][2].substr(2);
            const key6 = result.input[2][0].substr(2);
            const key7 = result.input[2][1].substr(2);
            const key8 = result.input[2][2].substr(2);

            expect(result.storage[key0].storageInfo).to.deep.equal(waitNode.storageInfo);
            expect(result.storage[key1].storageInfo).to.deep.equal(waitAny.storageInfo);
            expect(result.storage[key2].storageInfo).to.deep.equal(waitAnyBatch[0].storageInfo);
            expect(result.storage[key3].storageInfo).to.deep.equal(waitNode.storageInfo);
            expect(result.storage[key4].storageInfo).to.deep.equal(waitAny.storageInfo);
            expect(result.storage[key5].storageInfo).to.deep.equal(waitAnyBatch[1].storageInfo);
            expect(result.storage[key6].storageInfo).to.deep.equal(waitNode.storageInfo);
            expect(result.storage[key7].storageInfo).to.deep.equal(waitAny.storageInfo);
            expect(result.storage[key8].storageInfo).to.deep.equal(waitAnyBatch[2].storageInfo);

            expect(result.input[0][3]).to.deep.equal(pipeline.flowInput.files.links);
            expect(result.input[1][3]).to.deep.equal(pipeline.flowInput.files.links);
            expect(result.input[2][3]).to.deep.equal(pipeline.flowInput.files.links);

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
        it('should parse empty options', function () {
            const pipeline = {
                "name": "flow",
                "nodes": [
                    {
                        "nodeName": "black",
                        "algorithmName": "black-alg",
                        "input": []
                    }
                ]
            }
            const node = pipeline.nodes[0];
            const options = Object.assign({}, { nodeInput: node.input });
            const result = parser.parse(null);
            expect(result.batch).to.equal(false);
            expect(result.input).to.deep.equal(node.input);
        });
        it('should throw type error', function () {
            expect(() => {
                parser.parse("string");
            }).to.throw(TypeError, 'options');
        });
    });
    xdescribe('Checks', function () {
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
    xdescribe('ExtractNodes', function () {
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
    xdescribe('InputTypes', function () {
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