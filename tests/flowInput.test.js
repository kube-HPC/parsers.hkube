const { expect } = require('chai');
const { parser } = require('../index');

describe('FlowInput', function() {
    it('should throw when check Flow Input', function() {
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
    it('should not throw check Flow Input when is valid', function() {
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
    it('should not throw check Flow Input node input is null', function() {
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
    it('should check FlowInput as string', function() {
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
    it('should check FlowInput as object', function() {
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
    it('should check FlowInput as array', function() {
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
});
