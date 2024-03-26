/*
 * Copyright 2015-2024 OpenCB
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

function CellBaseAdapter(args) {

    _.extend(this, Backbone.Events);

    _.extend(this, args);

    this.on(this.handlers);

    this.configureCache();

    this.debug = false;
}

CellBaseAdapter.prototype = {
    setSpecies: function(species) {
        this.species = species;
        this.configureCache();
    },
    setHost: function(host) {
        this.configureCache();
        this.host = host;
    },
    deleteCache:function(){
        this.cache.delete();
    },
    configureCache: function() {
        var host = this.host || CellBaseManager.host;
        var speciesString = this.species.id + this.species.assembly.name.replace(/[/_().\ -]/g, '');
        var cacheId = host + speciesString;
        if (!this.cacheConfig) {
            this.cacheConfig = {
                //    //subCacheId: this.resource + this.params.keys(),
                chunkSize: 3000
            }
        }
        this.cacheConfig.cacheId = cacheId;
        this.cache = new FeatureChunkCache(this.cacheConfig);
    },

    getData: function(args) {
        var _this = this;

        var params = {};
        //histogram: (dataType == 'histogram')
        _.extend(params, this.params);
        _.extend(params, args.params);

        /** 1 region check **/
        var region = args.region;
        if (region.start > 300000000 || region.end < 1) {
            return;
        }
        region.start = (region.start < 1) ? 1 : region.start;
        region.end = (region.end > 300000000) ? 300000000 : region.end;

        /** 2 category check **/
        var categories = [this.category + this.subCategory + this.resource + Utils.queryString(params)];

        /** 3 dataType check **/
        var dataType = args.dataType;
        if (_.isUndefined(dataType)) {
            console.log("dataType must be provided!!!");
        }

        /** 4 chunkSize check **/
        var chunkSize = params.interval ? params.interval : this.cacheConfig.chunkSize; // this.cache.defaultChunkSize should be the same
        if (this.debug) {
            console.log(chunkSize);
        }

        /**
         * Get the uncached regions (uncachedRegions) and cached chunks (cachedChunks).
         * Uncached regions will be used to query cellbase. The response data will be converted in chunks
         * by the Cache TODO????
         * Cached chunks will be returned by the args.dataReady Callback.
         */
        this.cache.get(region, categories, dataType, chunkSize, function(cachedChunks, uncachedRegions) {

            var category = categories[0];
            var categoriesName = "";
            for (var j = 0; j < categories.length; j++) {
                categoriesName += "," + categories[j];
            }
            categoriesName = categoriesName.slice(1);   // to remove first ','

            var chunks = cachedChunks[category];
            // TODO check how to manage multiple regions
            var queriesList = _this._groupQueries(uncachedRegions[category]);

            /** Uncached regions found **/
            if (queriesList.length > 0) {
                args.webServiceCallCount = 0;
                for (var i = 0; i < queriesList.length; i++) {
                    args.webServiceCallCount++;
                    var queryRegion = queriesList[i];

                    // Get CellBase data
                    CellBaseManager.get({
                        host: _this.host,
                        version: _this.version,
                        species: _this.species,
                        category: _this.category,
                        subCategory: _this.subCategory,
                        query: queryRegion.toString(),
                        resource: _this.resource,
                        params: params,
                        success: function(response) {
                            var responseChunks = _this._cellbaseSuccess(response, categories, dataType, chunkSize);
                            args.webServiceCallCount--;

                            chunks = chunks.concat(responseChunks);
                            if (args.webServiceCallCount === 0) {
                                chunks.sort(function(a, b) {
                                    return a.chunkKey.localeCompare(b.chunkKey)
                                });
                                args.done({
                                    items: chunks, dataType: dataType, chunkSize: chunkSize, sender: _this
                                });
                            }
                        },
                        error: function() {
                            console.log('Server error');
                            args.done();
                        }
                    });
                }
            } else
            /** All regions are cached **/
            {
                args.done({
                    items: chunks, dataType: dataType, chunkSize: chunkSize, sender: _this
                });
            }
        });
    },

    _cellbaseSuccess: function(data, categories, dataType, chunkSize) {
        var timeId = Utils.randomString(4) + this.resource + " save";
        console.time(timeId);
        /** time log **/

        var regions = [];
        var chunks = [];
        for (var i = 0; i < data.response.length; i++) {    // TODO test what do several responses mean
            var queryResult = data.response[i];
            if (dataType == "histogram") {
                for (var j = 0; j < queryResult.result.length; j++) {
                    var interval = queryResult.result[j];
                    var region = new Region(interval);
                    regions.push(region);
                    chunks.push(interval);
                }
            } else {
                regions.push(new Region(queryResult.id));
                chunks.push(queryResult.result);
            }
        }
        var items = this.cache.putByRegions(regions, chunks, categories, dataType, chunkSize);

        /** time log **/
        console.timeEnd(timeId);

        return items;
    },

    /**
     * Transform the list on a list of lists, to limit the queries
     * [ r1,r2,r3,r4,r5,r6,r7,r8 ]
     * [ [r1,r2,r3,r4], [r5,r6,r7,r8] ]
     */
    _groupQueries: function(uncachedRegions) {
        var groupSize = 50;
        var queriesLists = [];
        while (uncachedRegions.length > 0) {
            queriesLists.push(uncachedRegions.splice(0, groupSize).toString());
        }
        return queriesLists;
    },


};
