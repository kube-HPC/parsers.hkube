const { expect } = require('chai');
const { parser } = require('../index');
const storagePrefix = 'my-prefix';
const ERROR = 'invalid input syntax, ex: @dataSource.<dataSourceName>/<fileName>';

describe('DataSource', function() {
    it('should throw invalid input syntax', function() {
        const pipeline = {
            nodes: [
                {
                    nodeName: "green",
                    algorithmName: "green-alg",
                    input: ["@dataSource"]
                },
            ],
        };
        expect(() => {
            parser.extractDataSourceMetaData({ pipeline, storagePrefix });
        }).to.throw(ERROR);
    });
    it('should throw invalid input syntax with dot', function() {
        const pipeline = {
            nodes: [
                {
                    nodeName: "green",
                    algorithmName: "green-alg",
                    input: ["@dataSource.images"]
                },
            ],
        };
        expect(() => {
            parser.extractDataSourceMetaData({ pipeline, storagePrefix });
        }).to.throw(ERROR);
    });
    it('should extract dataSource metadata from the pipeline as string', function() {
        const pipeline = {
            nodes: [
                {
                    nodeName: "green",
                    algorithmName: "green-alg",
                    input: ["@dataSource.images/file.jpg"]
                },
            ],
        };
        const { metadata, dataSources } = parser.extractDataSourceMetaData({ pipeline, storagePrefix });
        expect(metadata["dataSource.images/file.jpg"]).to.eql({
            storageInfo: { dataSourceName: 'images', pattern: 'file.jpg', storagePrefix },
        });
        expect(dataSources).to.have.lengthOf(1);
        expect(dataSources[0]).to.eq('images');

    });
    it('should extract dataSource metadata from the pipeline as object', function() {
        const pipeline = {
            nodes: [
                {
                    nodeName: "green",
                    algorithmName: "green-alg",
                    input: [
                        { prop: { d: "@dataSource.videos/file-2.jpg" } },
                    ]
                },
            ],
        };
        const { metadata, dataSources } = parser.extractDataSourceMetaData({ pipeline, storagePrefix });
        expect(metadata["dataSource.videos/file-2.jpg"]).to.eql({
            storageInfo: {
                storagePrefix, dataSourceName: 'videos', pattern: 'file-2.jpg'
            },
        });
        expect(dataSources).to.eql(['videos']);
    });
    it('should extract dataSource metadata from the pipeline as array', function() {
        const pipeline = {
            "nodes": [
                {
                    "nodeName": "green",
                    "algorithmName": "green-alg",
                    "input": [
                        { data: [["@dataSource.videos/file-3.jpg"]] }
                    ]
                },
            ],
        };
        const { metadata, dataSources } = parser.extractDataSourceMetaData({ pipeline, storagePrefix });
        expect(metadata["dataSource.videos/file-3.jpg"]).to.eql({
            storageInfo: {
                dataSourceName: 'videos', pattern: 'file-3.jpg', storagePrefix
            },
        });
        expect(dataSources).to.eql(['videos']);
    });
    it('should extract metadata for more than one inputs and avoid duplicates', function() {
        const pipeline = {
            nodes: [
                {
                    nodeName: "green",
                    algorithmName: "green-alg",
                    input: [
                        "@dataSource.images/file.jpg",
                        { prop: { d: "@dataSource.videos/file-2.jpg" } }
                    ]
                },
                {
                    nodeName: "blue",
                    algorithmName: "blue-alg",
                    input: [
                        "@dataSource.images/file.jpg",
                        "@dataSource.images/file-3.jpg",
                    ]
                },
            ],
        };

        const { metadata, dataSources } = parser.extractDataSourceMetaData({ pipeline, storagePrefix });
        expect(Object.values(metadata)).to.have.length(3);
        expect(metadata['dataSource.images/file.jpg']).to.eql({
            storageInfo: {
                storagePrefix, dataSourceName: 'images', pattern: 'file.jpg'
            },
        });
        expect(metadata["dataSource.videos/file-2.jpg"]).to.eql({
            storageInfo: {
                storagePrefix, dataSourceName: 'videos', pattern: 'file-2.jpg'
            },
        });
        expect(metadata['dataSource.images/file-3.jpg']).to.eql({
            storageInfo: {
                storagePrefix, dataSourceName: 'images', pattern: 'file-3.jpg'
            },
        });
        expect(dataSources).to.have.length(2);
        expect(dataSources).to.include('videos');
        expect(dataSources).to.include('images');
    });
    it('should handle both dataSource and flowInput', () => {
        const pipeline = {
            nodes: [
                {
                    nodeName: "green",
                    algorithmName: "green-alg",
                    input: [
                        "@dataSource.images/file.jpg",
                        "@flowInput.x"
                    ]
                },
            ],
            flowInput: {
                x: 3,
            }
        };
        const { metadata, dataSources } = parser.extractDataSourceMetaData({ pipeline, storagePrefix });
        expect(metadata["dataSource.images/file.jpg"]).to.exist;
        expect(metadata["flowInput.x"]).not.to.exist;
        expect(dataSources[0]).to.eq('images');
    });
    it('should parse with dataSource metadata', function() {
        const pipeline = {
            nodes: [
                {
                    nodeName: "green",
                    algorithmName: "green-alg",
                    input: ["@dataSource.videos/file.jpg", "@dataSource.images/file.jpg"]
                },
            ],
        };
        const node = pipeline.nodes[0];
        const dataSourceMetadata = {
            'dataSource.videos/file.jpg': {
                storageInfo: { path: `${storagePrefix}/images/file.jpg` }
            },
            'dataSource.images/file.jpg': {
                storageInfo: { path: `${storagePrefix}/videos/file.jpg` }
            }
        };
        const options = { nodeInput: node.input, dataSourceMetadata };
        const result = parser.parse(options);
        const keys = Object.keys(result.storage);
        const expectedInput = [`$$${keys[0]}`, `$$${keys[1]}`];
        expect(result.input).to.eql(expectedInput);
        expect(result.storage[keys[0]]).to.eql({ path: undefined, storageInfo: { path: `${storagePrefix}/images/file.jpg` } });
        expect(result.storage[keys[1]]).to.eql({ path: undefined, storageInfo: { path: `${storagePrefix}/videos/file.jpg` } });
    });
    it('should parse without dataSource metadata', function() {
        const pipeline = {
            nodes: [
                {
                    nodeName: "green",
                    algorithmName: "green-alg",
                    input: ["@dataSource.videos/file.jpg", "@dataSource.images/file.jpg"]
                },
            ],
        };
        const node = pipeline.nodes[0];
        const options = { nodeInput: node.input };
        const result = parser.parse(options);
        expect(result.input).to.eql([null, null]);
    });
});
