/** @typedef {import('./dataSource.d').Entry} Entry */

class DataSourcesParser {
    /** @type {(entry: string) => Entry} */
    parseEntry(entry) {
        // split at the first occurrence of '/'
        // ex: 'dataSource.images/subDir/file.jpg'
        // outputs: [ 'dataSource.images', '/subDir/file.jpg', 'subDir/file.jpg', '' ]
        const [pre, path, pattern] = entry.split(/(\/(.+))/);
        const [, dataSourceName] = pre.split('.');
        if (!path || !pattern || !dataSourceName) {
            throw new Error(`invalid input syntax ${entry}, ex: @dataSource.<name>/<fileName>`);
        }
        return {
            path, pattern, dataSourceName
        };
    }
}

module.exports = new DataSourcesParser();
