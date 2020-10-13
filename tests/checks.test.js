const { expect } = require('chai');
const { parser } = require('../index');

describe('Checks', function() {
    it('should throw check storage keyword', function() {
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
