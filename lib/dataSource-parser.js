const flatten = require('flat');
const helpers = require('./helpers');

/** @typedef {import('./dataSource.d').DataSourceMetaData} DataSourceMetaData */
/** @typedef {import('./dataSource.d').Entry} Entry */

class DataSourcesParser {
    /**
     * @param {{nodes: any[]}} pipeline
     * @param {string} storagePrefix
     * @returns {{[x: string]: DataSourceMetaData }}
     */
    extractMetaData(pipeline, storagePrefix) {
        const flatNodes = pipeline.nodes.map((node) => Object.entries(flatten(node.input))).flat();
        const metaDataItems = flatNodes.map(([path, input]) => [path, helpers.extractObjectFromInput(input)])
            .filter(([, obj]) => helpers.isDataSource(obj))
            .map(([path, obj]) => {
                const { pattern, dataSourceName } = this.parseEntry(obj);
                return {
                    metadata: {
                        dataSourceName,
                        pattern,
                        path
                    },
                    storageInfo: { path: `${storagePrefix}/${dataSourceName}/${pattern}` }
                };
            });
        return flatNodes.reduce((acc, [, name], ii) => ({ ...acc, [name]: metaDataItems[ii] }), {});
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
