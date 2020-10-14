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
        /**
         * @type {string[][]}
         * [[ path, object, input ]]
         * */
        const objects = pipeline.nodes
            .map((node) => Object.entries(flatten(node.input)))
            .flat()
            .map(([path, input]) => [path, helpers.extractObjectFromInput(input), input])
            .filter(([, obj]) => helpers.isDataSource(obj));

        const metaDataItems = objects
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

        return objects.reduce((acc, [, , input], ii) => ({
            ...acc,
            [input]: metaDataItems[ii]
        }), {});
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
