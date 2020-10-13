const { expect } = require('chai');
const { parser } = require('../index');

describe('Metadata', function() {
    it('should parse objectToMetadata with no path', function() {
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
    it('should parse objectToMetadata with paths and types', function() {
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
    it('should parse objectToMetadata with complex paths and types', function() {
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
    it('should parse objectToMetadata type string', function() {
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
    it('should parse objectToMetadata type array', function() {
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
    it('should parse objectToMetadata type number', function() {
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
    it('should parse objectToMetadata all types', function() {
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
    it('should parse objectToMetadata type object', function() {
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
    it('should not parse objectToMetadata', function() {
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