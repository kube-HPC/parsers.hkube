const { expect } = require('chai');
const { parser } = require('../index');

describe('ExtractNodes', function() {
    it('should extract nodes from string inside array input', function() {
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
    it('should extract nodes from string inside object input', function() {
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
    it('should extract nodes from string input', function() {
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
    it('should extract nodes from object input', function() {
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
    it('should extract nodes from object with wait batch', function() {
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
