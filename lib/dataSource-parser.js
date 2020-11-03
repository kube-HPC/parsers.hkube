const helpers = require('./helpers');

/** @typedef {import('./dataSource.d').Entry} Entry */

class DataSourcesParser {
    /** @returns {{
     *  metadata: {
     *      [entryId: string]: {storageInfo: {path: string}}
     *  },
     * dataSources: string[]
     * }}
     */
    extractDataSourceMetaData({ pipeline, storagePrefix }) {
        /** @type { {[path: string]: {dataSourceName: string, storageInfo: {path: string}}} } */
        const metaDataMap = helpers.pipelineNodesToMetaData(pipeline, (v => helpers.isDataSource(v)), (path) => {
            const { pattern, dataSourceName } = this._parseEntry(path);
            return { dataSourceName, storageInfo: { path: `${storagePrefix}/${dataSourceName}/${pattern}` } };
        });
        /** @type {[string, object, string][]} */
        const splittedEntries = Object.entries(metaDataMap)
            .map(([path, { dataSourceName, ...rest }]) => [path, rest, dataSourceName]);

        const metadata = Object.fromEntries(splittedEntries.map(([path, entry]) => [path, entry]));
        const dataSources = [...new Set(
            splittedEntries.map(([, , dataSource]) => dataSource)
        )];
        return { metadata, dataSources };
    }

    /** @type {(entry: string) => Entry} */
    _parseEntry(entry) {
        // split at the first occurrence of '/'
        // ex: 'dataSource.images/subDir/file.jpg'
        // outputs: [ 'dataSource.images', '/subDir/file.jpg', 'subDir/file.jpg', '' ]
        const [pre, path, pattern] = entry.split(/(\/(.+))/);
        const [, dataSourceName] = pre.split('.');
        if (!path || !pattern || !dataSourceName) {
            throw new Error('invalid input syntax, ex: @dataSource.<dataSourceName>/<fileName>');
        }
        return {
            path, pattern, dataSourceName
        };
    }
}

module.exports = new DataSourcesParser();
