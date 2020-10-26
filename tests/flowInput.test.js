const { expect } = require('chai');
const { parser } = require('../index');

describe('FlowInput', function () {
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
        const options = Object.assign({}, { flowInputMetadata: pipeline.flowInput }, { nodeInput: firstNode.input });
        expect(() => {
            parser.checkFlowInput(options);
        }).to.throw(`unable to find flowInput.not_such_object`);
    });
    it('should parse without flowInput metadata', function () {
        const pipeline = {
            "name": "flow1",
            "nodes": [
                {
                    "nodeName": "white",
                    "algorithmName": "black-alg",
                    "input": [
                        "@flowInput.array"
                    ]
                }
            ]
        }
        const node = pipeline.nodes[0];
        const options = { nodeInput: node.input };
        const result = parser.parse(options);
        expect(result.batch).to.equal(false);
        expect(result.input[0]).to.be.null;
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
        const options = { flowInput: pipeline.flowInput, nodeInput: firstNode.input };
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
        const options = Object.assign({}, { flowInputMetadata: pipeline.flowInput }, { nodeInput: null });
        parser.checkFlowInput(options);
        expect(options.nodeInput).to.be.null;
    });
    it('should check FlowInput as string', function () {
        const pipeline = {
            "nodes": [
                {
                    "nodeName": "green",
                    "algorithmName": "green-alg",
                    "input": ["@flowInput.files.links"]
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
        const nodeInput = pipeline.nodes[0].input[0];
        const options = { flowInput: pipeline.flowInput, nodeInput };
        const result = parser.checkFlowInput(options);

    });
    it('should check FlowInput as object', function () {
        const pipeline = {
            "nodes": [
                {
                    "nodeName": "green",
                    "algorithmName": "green-alg",
                    "input": [{
                        links: [
                            {
                                data: { data: "@flowInput.files.links" }
                            }
                        ]
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
        const nodeInput = pipeline.nodes[0].input[0];
        const options = { flowInput: pipeline.flowInput, nodeInput };
        const result = parser.checkFlowInput(options);

    });
    it('should check FlowInput as array', function () {
        const pipeline = {
            "nodes": [
                {
                    "nodeName": "green",
                    "algorithmName": "green-alg",
                    "input": [{ data: [["@flowInput.files.links"]] }]
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
        const nodeInput = pipeline.nodes[0].input[0];
        const options = { flowInput: pipeline.flowInput, nodeInput };
        const result = parser.checkFlowInput(options);
    });
    it('should replace simple FlowInput', function () {
        const pipeline = {
            "name": "resultBatch",
            "nodes": [
                {
                    "nodeName": "red",
                    "algorithmName": "red-alg",
                    "input": [
                        "@flowInput.files.links"
                    ]
                }
            ],
            "flowInput": {
                "x": 3
            }
        };
        const metadata = parser.replaceFlowInput(pipeline);
        expect(metadata).to.eql({});
    });
    it('should replace complex FlowInput', function () {
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
