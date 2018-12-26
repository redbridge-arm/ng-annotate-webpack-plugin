
var ngAnnotate = require('ng-annotate'),
    SourceMapSource = require('webpack-core/lib/SourceMapSource');

function ngAnnotatePlugin(options) {
    this.options = options || { add: true, sourceMap: false };
}

ngAnnotatePlugin.prototype.apply = function apply(compiler) {
    var options = this.options;

    compiler.hooks.compilation.tap('NgAnnotateWebpackPlugin', function(compilation) {
        compilation.hooks.optimizeChunkAssets.tapAsync('NgAnnotateWebpackPlugin', function(chunks, callback) {
            var files = [];

            function getFilesFromChunk(chunk) {
                if(options.chunks) {
                    if(options.chunks.indexOf(chunk.name) == -1){
                        return;
                    }
                }
                files = files.concat(chunk.files);
            }

            function annotateFile(file) {
                if (options.sourceMap) {
                    options.map = {
                        inFile: file,
                        sourceRoot: ""
                    };
                }
                var value = ngAnnotate(compilation.assets[file].source(), options);

                var asset = compilation.assets[file];

                if (options.sourceMap && asset.sourceAndMap) {
                    var sourceAndMap = asset.sourceAndMap();
                    var map = sourceAndMap.map;
                    var input = sourceAndMap.source;
                } else {
                    map = asset.map();
                }

                if (!value.errors) {
                    if (options.sourceMap && asset.sourceAndMap) {
                        compilation.assets[file] = new SourceMapSource(value.src, file, JSON.parse(value.map), input, map);
                    }
                    else {
                        compilation.assets[file] = new SourceMapSource(value.src, file, map);
                    }
                }
            }

            chunks.forEach(getFilesFromChunk);

            files = files.concat(compilation.additionalChunkAssets);

            files.forEach(annotateFile);

            callback();
        });
    });
};

module.exports = ngAnnotatePlugin;
