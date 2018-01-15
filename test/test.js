
const { expect } = require('chai');
const inputParser = require('../index');
const sinon = require('sinon');

describe('Main', function () {
    describe('Parse', function () {
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
            const result = inputParser.parse(options);
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
            const result = inputParser.parse(options);
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
            const result = inputParser.parse(options);
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
            const result = inputParser.parse(options);
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
            const result = inputParser.parse(options);
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
            const result = inputParser.parse(options);
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
            const parentOutput = [{ node: 'green', type: 'waitBatch', result: [1, 2, 3, 4, 5] },];
            const options = Object.assign({}, { flowInput: pipeline.flowInput }, { nodeInput: node.input }, { parentOutput: parentOutput });
            const result = inputParser.parse(options);
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
            const parentOutput = [{ node: 'yellow', type: 'waitNode', result: array }];
            const options = Object.assign({}, { nodeInput: node.input }, { parentOutput: parentOutput });
            const result = inputParser.parse(options);
            expect(result.batch).to.equal(false);
            expect(result.input).to.deep.equal([array, 512]);
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
            const array = { data: [6, 7, 8, 9, 10] };
            const node = pipeline.nodes[0];
            const parentOutput = [{ node: 'yellow', type: 'waitNode', result: array }];
            const options = Object.assign({}, { nodeInput: node.input }, { parentOutput: parentOutput });
            const result = inputParser.parse(options);
            expect(result.batch).to.equal(false);
            expect(result.input).to.deep.equal([array.data, 512]);
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
            const array = { data: [6, 7, 8, 9, 10] };
            const node = pipeline.nodes[0];
            const parentOutput = [{ node: 'yellow', type: 'waitAny', result: array }];
            const options = Object.assign({}, { nodeInput: node.input }, { parentOutput: parentOutput });
            const result = inputParser.parse(options);
            expect(result.batch).to.equal(false);
            expect(result.input).to.deep.equal([array.data, 512]);
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
            const array = { data: [6, 7, 8, 9, 10] };
            const expected = array.data.map(i => [i, 512]);
            const node = pipeline.nodes[0];
            const parentOutput = [{ node: 'yellow', type: 'waitBatch', result: array }];
            const options = Object.assign({}, { nodeInput: node.input }, { parentOutput: parentOutput });
            const result = inputParser.parse(options);
            expect(result.batch).to.equal(true);
            expect(result.input).to.deep.equal(expected);
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
            const result = inputParser.parse(options);
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
            const result = inputParser.parse(options);
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
            const result = inputParser.parse(null);
            expect(result.batch).to.equal(false);
            expect(result.input).to.deep.equal(node.input);
        });
        it('should throw type error', function () {
            expect(() => {
                inputParser.parse("string");
            }).to.throw(TypeError, 'options');
        });
    });
    describe('CheckFlowInput', function () {
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
                inputParser.checkFlowInput(options);
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
            inputParser.checkFlowInput(options);
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
            inputParser.checkFlowInput(options);
            expect(options.nodeInput).to.be.null;
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
            const nodes = inputParser.extractNodesFromInput(lastNode.input);
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
            const nodes = inputParser.extractNodesFromInput(lastNode.input[0]);
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
            const nodes = inputParser.extractNodesFromInput(lastNode.input[0]);
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
            const nodes = inputParser.extractNodesFromInput(lastNode.input);
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
            const nodes = inputParser.extractNodesFromInput(lastNode.input);
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
            const result = inputParser._isBatch(firstNode.input[0]);
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
            const result = inputParser._isBatch(node.input[0]);
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
            const result = inputParser._isNode(node.input[0]);
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
            const result = inputParser._isNode(node.input[0]);
            expect(result.isNode).to.equal(false);
        });
        it('should return true when is flowInput', function () {
            const pipeline = {
                "name": "flow1",
                "nodes": [
                    {
                        "nodeName": "green",
                        "algorithmName": "green-alg",
                        "input": [
                            "@flowInput.files.link"
                        ]
                    }
                ],
                "flowInput": {
                    "files": {
                        "link": "links-1"
                    }
                }
            }
            const node = pipeline.nodes[0];
            const result = inputParser._isFlowInput(node.input[0]);
            expect(result).to.equal(true);
        });
        it('should return false when is not flowInput', function () {
            const pipeline = {
                "name": "flow1",
                "nodes": [
                    {
                        "nodeName": "yellow",
                        "algorithmName": "yellow-alg",
                        "input": [
                            "@green"
                        ]
                    }
                ]
            }
            const node = pipeline.nodes[0];
            const result = inputParser._isFlowInput(node.input[0]);
            expect(result).to.equal(false);
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
            const result = inputParser._isReference(node.input[0]);
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
            const result = inputParser._isReference(node.input[0]);
            expect(result).to.equal(false);
        });
    });
});