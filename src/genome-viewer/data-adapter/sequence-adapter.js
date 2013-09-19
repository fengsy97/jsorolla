/*
 * Copyright (c) 2012 Francisco Salavert (ICM-CIPF)
 * Copyright (c) 2012 Ruben Sanchez (ICM-CIPF)
 * Copyright (c) 2012 Ignacio Medina (ICM-CIPF)
 *
 * This file is part of JS Common Libs.
 *
 * JS Common Libs is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * JS Common Libs is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with JS Common Libs. If not, see <http://www.gnu.org/licenses/>.
 */

function SequenceAdapter(args){

    _.extend(this, Backbone.Events);

	this.host = null;
	this.gzip = true;
	
	this.params={};
	if (args != null){
		if(args.host != null){
			this.host = args.host;
		}
		if(args.species != null){
			this.species = args.species;
		}
		if(args.category != null){
			this.category = args.category;
		}
		if(args.subCategory != null){
			this.subCategory = args.subCategory;
		}
		if(args.resource != null){
			this.resource = args.resource;
		}
		if(args.featureCache != null){
			var argsFeatureCache = args.featureCache;
		}
		if(args.params != null){
			this.params = args.params;
		}
	}
	this.onGetData = new Event();
	this.sequence = {};
	this.phastCons = {};
	this.phylop = {};
	this.start = {};
	this.end = {};
}

SequenceAdapter.prototype.clearData = function(){
	this.sequence = {};
	this.start = {};
	this.end = {};
};

SequenceAdapter.prototype.getData = function(args){
	var _this = this;
	this.sender = args.sender;
	var chromosome = args.chromosome;

	if(args.start<1){
		args.start=1;
	}
    if(args.end<1){
        args.end=1;
    }
	if(args.end>300000000){
		args.end=300000000;
	}

	//clean when the new position is too far from current
	if(args.start<this.start[chromosome]-5000 || args.end > this.end[chromosome]+5000){
		this.clearData();
	}
	
	//region check
	this.params["histogram"] = args.histogram;
	this.params["interval"] = args.interval;
	this.params["transcript"] = args.transcript;
	this.params["chromosome"] = args.chromosome;
	this.params["resource"] = this.resource;

	

	//console.log("--------------------------------------------------------------------"+this.start[chromosome]+" "+this.end[chromosome]);
	//console.log("--------------------------------------------------------------------"+args.start+" "+args.end);

	var queryString = this._getSequenceQuery(args);

	if(queryString != ""){

        CellBaseManager.get({
            host: this.host,
            species: this.species,
            category:this.category,
            subCategory:this.subCategory,
            query:queryString,
            resource: this.resource,
            params: this.params,
            success:function (event) {
                _this._processSequenceQuery(event.data,true);
            }
        });


	}else{
		if(this.sender != "move"){
			this.onGetData.notify({
                items:{
                    sequence:this.sequence[chromosome],
                    phastCons:this.phastCons[chromosome],
                    phylop:this.phylop[chromosome],
                    start:this.start[chromosome],
                    end:this.end[chromosome]
                },
                params:this.params
            });
            this.trigger('data:ready',{
                items:{
                    sequence:this.sequence[chromosome],
                    phastCons:this.phastCons[chromosome],
                    phylop:this.phylop[chromosome],
                    start:this.start[chromosome],
                    end:this.end[chromosome]
                },
                params:this.params,
                sender:this
            });
		}
	}
	
};

SequenceAdapter.prototype._getSequenceQuery = function(args){
	var _this = this;
	var chromosome = args.chromosome;
	
	var s,e, query, querys = [];
	if(_this.start[chromosome]==null && _this.end[chromosome]==null){
			//args.start -= 100;
			//args.end += 100;
			_this.start[chromosome] = args.start;
			_this.end[chromosome] = args.end;
			s = args.start;
			e = args.end;
			query = chromosome+":"+s+"-"+e;
			querys.push(query);
	}else{
		if(args.start <= _this.start[chromosome]){
			s = args.start;
			e = _this.start[chromosome]-1;
            e = (e<1) ? args.end=1 : e ;
			_this.start[chromosome] = s;
			query = args.chromosome+":"+s+"-"+e;
			querys.push(query);
		}
		if(args.end >= _this.end[chromosome]){
			e = args.end;
			s = _this.end[chromosome]+1;
			_this.end[chromosome] = e;
			query = args.chromosome+":"+s+"-"+e;
			querys.push(query);
		}
	}
	
	//console.log("--------------------------------------------------------------------"+s+" "+e);
	//console.log("--------------------------------------------------------------------"+this.start[args.chromosome]+" "+this.end[args.chromosome]);
	
	return querys.toString();
};

SequenceAdapter.prototype._processSequenceQuery = function(data, throwNotify){
	var _this = this;
	var params = data.params;


    for(var i = 0; i < data.response.length; i++) {
        var queryResponse = data.response[i];
        var splitDots = queryResponse.id.split(":");
        var splitDash = splitDots[1].split("-");
        var queryStart = parseInt(splitDash[0]);
        var queryEnd = parseInt(splitDash[1]);

        var queryId = queryResponse.id;
	    var seqResponse = queryResponse.result;
	    var chromosome = seqResponse.chromosome;

        if(this.sequence[chromosome] == null){
            this.sequence[chromosome] =  seqResponse.sequence;
//          this.phastCons[chromosome] = seqResponse[i].phastCons;
//			this.phylop[chromosome] = seqResponse[i].phylop;
        }else{
            if(queryStart == this.start[chromosome]){
                this.sequence[chromosome] = seqResponse.sequence + this.sequence[chromosome];
//				this.phastCons[chromosome] = seqResponse[i].phastCons.concat(this.phastCons[chromosome]);
//				this.phylop[chromosome] = seqResponse[i].phylop.concat(this.phylop[chromosome]);
            }else{
                this.sequence[chromosome] = this.sequence[chromosome] + seqResponse.sequence;
//				this.phastCons[chromosome] = this.phastCons[chromosome].concat(seqResponse[i].phastCons);
//				this.phylop[chromosome] = this.phylop[chromosome].concat(seqResponse[i].phylop);
            }
        }

        if(this.sender == "move" && throwNotify == true){
//            this.onGetData.notify({
//                items:{
//                    sequence:seqResponse.sequence,
////                    phastCons:seqResponse[i].phastCons,
////                    phylop:seqResponse[i].phylop,
//                    start:queryStart,
//                    end:queryEnd
//                },
//                params:params
//            });
            this.trigger('data:ready',{
                items:{
                    sequence:seqResponse.sequence,
//                    phastCons:seqResponse[i].phastCons,
//                    phylop:seqResponse[i].phylop,
                    start:queryStart,
                    end:queryEnd
                },
                params:params,
                sender:this
            });
        }
    }


//	for(var i = 0; i < seqResponse.length; i++){
//		var splitDots = data.query[i].split(":");
//		var splitDash = splitDots[1].split("-");
//		var queryStart = parseInt(splitDash[0]);
//		var queryEnd = parseInt(splitDash[1]);
//
//		if(this.sequence[chromosome] == null){
//			this.sequence[chromosome] = seqResponse[i].sequence;
////			this.phastCons[chromosome] = seqResponse[i].phastCons;
////			this.phylop[chromosome] = seqResponse[i].phylop;
//		}else{
//			if(queryStart == this.start[chromosome]){
//				this.sequence[chromosome] = seqResponse[i].sequence + this.sequence[chromosome];
////				this.phastCons[chromosome] = seqResponse[i].phastCons.concat(this.phastCons[chromosome]);
////				this.phylop[chromosome] = seqResponse[i].phylop.concat(this.phylop[chromosome]);
//			}else{
//				this.sequence[chromosome] = this.sequence[chromosome] + seqResponse[i].sequence;
////				this.phastCons[chromosome] = this.phastCons[chromosome].concat(seqResponse[i].phastCons);
////				this.phylop[chromosome] = this.phylop[chromosome].concat(seqResponse[i].phylop);
//			}
//		}
//
//		if(this.sender == "move" && throwNotify == true){
//			this.onGetData.notify({
//                items:{
//                    sequence:seqResponse[i].sequence,
//                    phastCons:seqResponse[i].phastCons,
//                    phylop:seqResponse[i].phylop,
//                    start:queryStart,
//                    end:queryEnd
//                },
//                params:params
//            });
//            this.trigger('data:ready',{
//                items:{
//                    sequence:seqResponse[i].sequence,
//                    phastCons:seqResponse[i].phastCons,
//                    phylop:seqResponse[i].phylop,
//                    start:queryStart,
//                    end:queryEnd
//                },
//                params:params,
//                sender:this
//            });
//		}
//	}
	//if not onMove the svg was cleared so all sequence is sent to redraw
	if(this.sender != "move" && throwNotify == true){
//		this.onGetData.notify({
//            items:{
//                sequence:this.sequence[chromosome],
//                phastCons:this.phastCons[chromosome],
//                phylop:this.phylop[chromosome],
//                start:this.start[chromosome],
//                end:this.end[chromosome]
//            },
//            params:params
//        });
        this.trigger('data:ready',{
            items:{
                sequence:this.sequence[chromosome],
                phastCons:this.phastCons[chromosome],
                phylop:this.phylop[chromosome],
                start:this.start[chromosome],
                end:this.end[chromosome]
            },
            params:params,
            sender:this
        });
	}
};

// DEPRECATED Used by bam to get the mutations
//SequenceAdapter.prototype.getDiffString = function(args){
	//var _this=this;
	//var queryString = this._getSequenceQuery(args);
	//var chromosome = args.chromosome;
	//
	//if(queryString != ""){
		//var cellBaseManager = new CellBaseManager(this.species,{host: this.host, async:false});
		//var data = cellBaseManager.get(this.category, this.subCategory, queryString, this.resource, this.params);
		//_this._processSequenceQuery(data);
	//}
		///*now the needed sequence is on the cache*/
		//
	//var referenceSubStr = this.sequence[chromosome].substr(args.start-this.start[chromosome],args.read.length);
//
	//resultStr = "";
	//for(var i = 0; i < args.read.length; i++){
		//if(args.read.charAt(i) == referenceSubStr.charAt(i)){
			//resultStr+=" ";
		//}else{
			//resultStr+=args.read.charAt(i);
		//}
	//}
	//return resultStr;
//};

//Used by bam to get the mutations
SequenceAdapter.prototype.getNucleotidByPosition = function(args){
	var _this=this;
    if(args.start > 0 && args.end>0){
        var queryString = this._getSequenceQuery(args);

        var chromosome = args.chromosome;

        if(queryString != ""){


            var data = CellBaseManager.get({
                host: this.host,
                species: this.species,
                category:this.category,
                subCategory:this.subCategory,
                query:queryString,
                resource: this.resource,
                params: this.params,
                async:false
            });
            _this._processSequenceQuery(data);

        }
        if(this.sequence[chromosome] != null){
            var referenceSubStr = this.sequence[chromosome].substr((args.start-this.start[chromosome]),1);
            return referenceSubStr;
        }else{
            console.log("SequenceRender: this.sequence[chromosome] is undefined");
            return "";
        }
    }
};
