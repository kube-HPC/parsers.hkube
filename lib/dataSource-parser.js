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
        /** @type { {[path: string]: {dataSourceName: string, metadata: {storageInfo: {path: string}}}} } */
        const metaDataMap = helpers.pipelineNodesToMetaData(pipeline, (v => helpers.isDataSource(v)), (path) => {
            const { pattern, dataSourceName } = this._parseEntry(path);
            return {
                dataSourceName,
                metadata: {
                    storageInfo: { path: `${storagePrefix}/${dataSourceName}/${pattern}` }
                }
            };
        });

        const metadata = Object.fromEntries(Object.entries(metaDataMap)
            .map(([path, { metadata: _metadata }]) => [path, _metadata]));
        const dataSources = [...new Set(
            Object.values(metaDataMap).map(({ dataSourceName }) => dataSourceName)
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
