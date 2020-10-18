const helpers = require('./helpers');

/** @typedef {import('./dataSource.d').Entry} Entry */

class DataSourcesParser {
    extractDataSourceMetaData({ pipeline, storagePrefix }) {
        return helpers.pipelineNodesToMetaData(pipeline, (v => helpers.isDataSource(v)), (path) => {
            const { pattern, dataSourceName } = this._parseEntry(path);
            return { storageInfo: { path: `${storagePrefix}/${dataSourceName}/${pattern}` } };
        });
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
