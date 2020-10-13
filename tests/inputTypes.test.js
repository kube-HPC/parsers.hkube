const { expect } = require('chai');
const { helpers } = require('../index');

describe('InputTypes', function() {
    it('should return true when is batch', function() {
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
            "flowInputMetadata": {
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
        const result = helpers.isBatch(firstNode.input[0]);
        expect(result).to.equal(true);
    });
    it('should return false when is not batch', function() {
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
            "flowInputMetadata": {
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
        const result = helpers.isBatch(node.input[0]);
        expect(result).to.equal(false);
    });
    it('should return true when is node', function() {
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
        const result = helpers.isNode(node.input[0]);
        const nodeName = node.input[0].substr(1);
        expect(result.isNode).to.equal(true);
        expect(result.nodeName).to.equal(nodeName);
    });
    it('should return false when is not node', function() {
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
        const result = helpers.isNode(node.input[0]);
        expect(result.isNode).to.equal(false);
    });
    it('should return true when is reference', function() {
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
        const result = helpers.isReference(node.input[0]);
        expect(result).to.equal(true);
    });
    it('should return false when is not reference', function() {
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
        const result = helpers.isReference(node.input[0]);
        expect(result).to.equal(false);
    });
});
