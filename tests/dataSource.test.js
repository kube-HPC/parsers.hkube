const { expect } = require('chai');
const { parser } = require('../index');

describe('DataSource', function() {
    it('should extract DataSource metadata from the pipeline as string', function() {
        const pipeline = {
            nodes: [
                {
                    nodeName: "green",
                    algorithmName: "green-alg",
                    input: ["@dataSource.images/file.jpg"]
                },
            ],
        };

        const results = parser.extractDataSourceMetaData({ pipeline, storagePrefix: 'my-prefix' });

        expect(results["@dataSource.images/file.jpg"]).to.deep.equal({
            metadata: { dataSourceName: 'images', pattern: 'file.jpg', path: '0' },
            storageInfo: { path: 'my-prefix/images/file.jpg' }
        });
    });

    it('should extract DataSource metadata from the pipeline as object', function() {
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

        const results = parser.extractDataSourceMetaData({ pipeline, storagePrefix: 'my-prefix' });

        expect(results["@dataSource.videos/file-2.jpg"]).to.deep.equal({
            metadata: {
                dataSourceName: "videos",
                pattern: "file-2.jpg",
                path: "0.prop.d"
            },
            storageInfo: {
                path: "my-prefix/videos/file-2.jpg"
            }
        })
    });


    it('should extract DataSource metadata from the pipeline as array', function() {
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

        const results = parser.extractDataSourceMetaData({ pipeline, storagePrefix: 'my-prefix' });

        expect(results["@dataSource.videos/file-3.jpg"]).to.deep.equal({
            metadata: {
                dataSourceName: "videos",
                pattern: "file-3.jpg",
                path: "0.data.0.0"
            },
            storageInfo: {
                path: "my-prefix/videos/file-3.jpg"
            }
        });
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

        const results = parser.extractDataSourceMetaData({ pipeline, storagePrefix: 'my-prefix' });

        expect(Object.values(results)).to.have.length(3);
        expect(results['@dataSource.images/file.jpg']).to.deep.equal({
            metadata: {
                dataSourceName: "images",
                pattern: "file.jpg",
                path: "0"
            },
            storageInfo: {
                path: "my-prefix/images/file.jpg"
            }
        });
        expect(results["@dataSource.videos/file-2.jpg"]).to.deep.equal({
            metadata: {
                dataSourceName: "videos",
                pattern: "file-2.jpg",
                path: "1.prop.d"
            },
            storageInfo: {
                path: "my-prefix/videos/file-2.jpg"
            }
        })
        expect(results['@dataSource.images/file-3.jpg']).to.deep.equal({
            metadata: {
                dataSourceName: "images",
                pattern: "file-3.jpg",
                path: "1"
            },
            storageInfo: {
                path: "my-prefix/images/file-3.jpg"
            }
        })
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
