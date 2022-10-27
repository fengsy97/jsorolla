import Utils from "./../utils.js";
import UtilsNew from "../utils-new.js";
import LinearFeatureTrack from "./FeatureTrack.js";
import CoverageRenderer from "./renderers/CoverageRenderer.js";
import {SVG} from "./../svg.js";


export default class LinearCoverageTrack extends LinearFeatureTrack {

    /*
    args = {
        name: ,          // Name to be displayed
        htmlTitle: ,     // If passed, it will be displayed the html string passed in the variable
        targetId: ,
        dataAdapter: ,   // Adapter to retrieve data
        data: ,          // Static data if no data adapter is passed (mainly for testing purposes)
        opencga: {
            client: ,    // OpenCGA client
            study: ,     // Study fqn,
            file: ,      // File
        }
        renderer:        // Renderer
        {configArgs}
    }
    */
    constructor(args, config) {
        super(args, config);

        this.config = Object.assign(this._getDefaultConfig(), this.config);

        if (UtilsNew.isUndefinedOrNull(this.renderer)) {
            this.renderer = new CoverageRenderer();
        }

        if (UtilsNew.isUndefinedOrNull(this.dataAdapter)) {
            if (UtilsNew.isNotUndefinedOrNull(this.opencga)) {
                this.dataAdapter = new OpencgaAdapter(this.opencga.client, "coverage");
            }
        }

        this.dataType = "coverage";
        this.init(this.targetId);
    }

    init(targetId) {
        this._initDomContainer(targetId);

        this.main = SVG.addChild(this.contentDiv, "svg", {
            "class": "trackSvg",
            "x": 0,
            "y": 0,
            "width": this.config.width,
            "height": this.config.height,
        });

        this.svgCanvasFeatures = SVG.addChild(this.main, "svg", {
            "class": "features",
            "x": -this.pixelPosition,
            "height": this.config.height,
            "width": this.config.svgCanvasWidth
        });
    }

    _checkAllParams(params) {
        if (UtilsNew.isEmpty(params.study)) {
            throw "Missing 'study' query parameter";
        }
        if (UtilsNew.isEmpty(params.fileId)) {
            throw "Missing 'fileId' query parameter";
        }
        if (UtilsNew.isUndefinedOrNull(params.region)) {
            throw "Missing 'region' query parameter";
        }
    }

    /**
     *
      * @param args: Object containing:
     *   {
     *       data: {},
     *       query: {},
     *       config: {}
     *   }
     */
    draw(args) {
        let config = Object.assign({}, this.config, args.config);

        let coverageConfiguration = {
            width: config.width,
            height: config.height,
            pixelPosition: this.pixelPosition,
            target: this.svgCanvasFeatures
        };

        if (UtilsNew.isUndefinedOrNull(args.query)) {
            let data = UtilsNew.isUndefinedOrNull(args.data) ? this.data : args.data;

            if (UtilsNew.isUndefinedOrNull(data)) {
                throw "Missing 'data' or 'query'";
            }

            // Adjust to see the whole coverage window
            coverageConfiguration["visibleStartPosition"] = data.coverage.start;
            coverageConfiguration["visibleEndPosition"] = data.coverage.end;

            this.clean();
            this.renderer.render(data, coverageConfiguration);
        } else {
            this._checkAllParams(args.query);

            // Adjust to see the whole coverage window
            coverageConfiguration["visibleStartPosition"] = args.query.region.start;
            coverageConfiguration["visibleEndPosition"] = args.query.region.end;

            // We will obtain a region with an the offset defined
            let start = (args.query.region.start - config.regionOffset) < 0 ? 0 : args.query.region.start - config.regionOffset;
            let end = args.query.region.end + config.regionOffset;

            let _this = this;

            this.dataAdapter.getData({
                params: {
                    study: args.query.study,
                    fileId: args.query.fileId,
                    minCoverage: config.lowCoverageThreshold,
                    // sid: this.opencga.client._config.sessionId,
                },
                dataType: this.dataType,
                region: new Region(`${args.query.region.chromosome}:${start}-${end}`),
                width: config.width
            }).then(function(data) {
                _this.clean();
                _this.renderer.render(data, coverageConfiguration);
            });
        }
    }


    setRegion(chromosome, start, end) {
        this.region = new Region(chromosome, start, end);
    }

    _initDomContainer(targetId) {
        let div = $(`<div id="${this.id}-div"></div>`)[0];
        div.classList.add("ocb-track");
        $(div).css({
            "padding": "5px 0px"
        });

        this.titleDiv = $(`<div class="ocb-track-title"></div>`)[0];
        this.contentDiv = $(`<div id="${this.id}-svg"></div>`)[0];

        $(this.contentDiv).css({
            "position": "relative",
            "box-sizing": "border-box",
            "z-index": 3,
            "height": this.height,
            "overflow-y": "hidden",
            "overflow-x": "hidden"
        });

        $(`#${targetId}`).addClass("unselectable");
        $(`#${targetId}`).append(div);
        $(div).append(this.titleDiv);
        $(div).append(this.contentDiv);

        this.htmlTitle = UtilsNew.isEmpty(this.htmlTitle) ? `<h5>${this.name}</h5>` : this.htmlTitle;
        $(this.titleDiv).html(this.htmlTitle);
    }

    _getScaleFactor(width, start, end) {
        return width / (end - start + 1);
    }

    _getDefaultConfig() {
        return Object.assign(super._getDefaultConfig(), {
            lowCoverageThreshold: 20,
            regionOffset: 500
        });
    }

}
