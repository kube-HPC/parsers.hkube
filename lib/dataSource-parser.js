const flatten = require('flat');
const helpers = require('./helpers');

/** @typedef {import('./dataSource-parser').DataSourceMetaData} DataSourceMetaData */
/** @typedef {import('./dataSource-parser').Entry} Entry */

class DataSourcesParser {
    /** @type {(pipeline: object) => DataSourceMetaData[][]} */
    extractMetaData(pipeline) {
        return pipeline.nodes.map((node) => Object.entries(flatten(node.input))
            .map(([path, input]) => [path, helpers.extractObjectFromInput(input)])
            .filter(([, obj]) => helpers.isDataSource(obj))
            .map(([path, obj]) => {
                const { pattern, dataSourceName } = this.parseEntry(obj);
                return {
                    metadata: {
                        dataSourceName,
                        pattern,
                        path
                    },
                    storageInfo: { path: `hkube-datasources/${dataSourceName}/${pattern}` }
                };
            }));
    }

    /** @type {(entry: string) => Entry} */
    parseEntry(entry) {
        // split at the first occurrence of '/'
        // ex: 'dataSource.images/subDir/file.jpg'
        // outputs: [ 'dataSource.images', '/subDir/file.jpg', 'subDir/file.jpg', '' ]
        const [pre, path, pattern] = entry.split(/(\/(.+))/);
        const [, dataSourceName] = pre.split('.');
        return {
            path, pattern, dataSourceName
        };
    }
    // parse(input) {
    //     const obj = helpers.extractObjectFromInput(input);
    //     console.log({ obj });
    //     return null;
    // }
}

module.exports = new DataSourcesParser();
