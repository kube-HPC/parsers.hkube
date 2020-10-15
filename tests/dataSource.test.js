const { expect } = require('chai');
const { parser } = require('../index');
const storagePrefix = 'my-prefix';

describe('DataSource', function () {
    it('should extract DataSource metadata from the pipeline as string', function () {
        const pipeline = {
            nodes: [
                {
                    nodeName: "green",
                    algorithmName: "green-alg",
                    input: ["@dataSource.images/file.jpg"]
                },
            ],
        };
        const results = parser.extractDataSourceMetaData({ pipeline, storagePrefix });
        expect(results["dataSource.images/file.jpg"]).to.eql({
            storageInfo: { path: `${storagePrefix}/images/file.jpg` }
        });
    });
    it('should throw 1', function () {
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
            parser.extractDataSourceMetaData({ pipeline, storagePrefix })
        }).to.throw(`invalid input syntax dataSource, ex: @dataSource.<name>/<fileName>`);
    });
    it('should throw 2', function () {
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
            parser.extractDataSourceMetaData({ pipeline, storagePrefix })
        }).to.throw(`invalid input syntax dataSource.images, ex: @dataSource.<name>/<fileName>`);
    });
    xit('should extract DataSource metadata from the pipeline as string', function () {
        const pipeline = {
            nodes: [
                {
                    nodeName: "green",
                    algorithmName: "green-alg",
                    input: ["@dataSource.sda/df.jp"]
                },
            ],
        };
        const results = parser.extractDataSourceMetaData({ pipeline, storagePrefix });
        expect(results["dataSource.images/file.jpg"]).to.throw(`invalid input syntax ${entry}, ex: @dataSource.<name>/<fileName>`);
    });
    it('should extract DataSource metadata from the pipeline as object', function () {
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
        const results = parser.extractDataSourceMetaData({ pipeline, storagePrefix });
        expect(results["dataSource.videos/file-2.jpg"]).to.eql({
            storageInfo: {
                path: "my-prefix/videos/file-2.jpg"
            }
        })
    });
    it('should extract DataSource metadata from the pipeline as array', function () {
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
        const results = parser.extractDataSourceMetaData({ pipeline, storagePrefix });
        expect(results["dataSource.videos/file-3.jpg"]).to.eql({
            storageInfo: {
                path: "my-prefix/videos/file-3.jpg"
            }
        });
    });
    it('should extract metadata for more than one inputs and avoid duplicates', function () {
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

        const results = parser.extractDataSourceMetaData({ pipeline, storagePrefix });
        expect(Object.values(results)).to.have.length(3);
        expect(results['dataSource.images/file.jpg']).to.eql({
            storageInfo: {
                path: "my-prefix/images/file.jpg"
            }
        });
        expect(results["dataSource.videos/file-2.jpg"]).to.eql({
            storageInfo: {
                path: "my-prefix/videos/file-2.jpg"
            }
        })
        expect(results['dataSource.images/file-3.jpg']).to.eql({

            storageInfo: {
                path: "my-prefix/images/file-3.jpg"
            }
        })
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
        }
        const results = parser.extractDataSourceMetaData({ pipeline, storagePrefix });
        expect(results["dataSource.images/file.jpg"]).to.exist;
        expect(results["flowInput.x"]).not.to.exist;
    });
    it('should extract DataSource metadata from the pipeline as string', function () {
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
        }
        const options = { nodeInput: node.input, dataSourceMetadata };
        const result = parser.parse(options);
        const keys = Object.keys(result.storage);
        const expectedInput = [`$$${keys[0]}`, `$$${keys[1]}`];
        expect(result.input).to.eql(expectedInput);
        expect(result.storage[keys[0]]).to.eql({ path: undefined, storageInfo: { path: `${storagePrefix}/images/file.jpg` } });
        expect(result.storage[keys[1]]).to.eql({ path: undefined, storageInfo: { path: `${storagePrefix}/videos/file.jpg` } });
    });
    it.skip('should parse the dataSourceMetadata object to storage uuid', () => {

        // it('should throw when check Flow Input', function() {
        //     const pipeline = {
        //         "nodes": [
        //             {
        //                 "nodeName": "green",
        //                 "algorithmName": "green-alg",
        //                 "input": [
        //                     { data: "@datasource.images/file-1.jpg" }, //--> $$uuid
        //                     { prop: { d: "@datasource.videos/file-2.jpg" } }
        //                 ]
        //             },
        //         ],
        //     };
        //     const tmp = {
        //         "datasourcesMetadata": [{
        //                   metadata: { path: '0.data', datasource: 'name', pattern: 'name.jpg' }
        //                   storageInfo: { path: 'hkube-datasources/images/file-1.jpg' }
        //           }]
        //     };

        //     const output = {
        //         "storage": {
        //             "uuid": {
        //                 storageInfo: { path: 'hkube-datasources/images/file-1.jpg' }
        //             }
        //         }
        //     }

        //     const ds = parser.parse({ prefix: 'hkube-datasources', pipeline });
        //     // 1. create ds metadata
        //     // 2. create storage $$ from metadata

        // });
    });
});
