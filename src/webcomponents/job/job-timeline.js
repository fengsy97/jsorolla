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

import {LitElement, html} from "lit";
import UtilsNew from "../../core/utils-new.js";


export default class JobTimeline extends LitElement {

    constructor() {
        super();
        this._init();
    }

    createRenderRoot() {
        return this;
    }

    static get properties() {
        return {
            opencgaSession: {
                type: Object
            },
            active: {
                type: Object
            },
            query: {
                type: Object
            },
            config: {
                type: Object
            }
        };
    }

    _init() {
        this._prefix = "sf-" + UtilsNew.randomString(6) + "_";
        this._results = [];
        this.intervals = [];
    }

    connectedCallback() {
        super.connectedCallback();
        this._config = {...this.getDefaultConfig(), ...this.config};
    }

    updated(changedProperties) {
        // console.log(`query ${this.query}, active ${this.active}`)
        if ((changedProperties.has("query") || changedProperties.has("opencgaSession") || changedProperties.has("active")) && this.active) {
            this.fetchContent();// TODO avoid remote request in case the query hasn't changed
            this.fileId = null;
        }
    }

    async fetchContent() {
        console.log("query observer");
        this.draw?.clear();
        $("#svg-timeline").empty();
        this.querySelector("#loading").style.display = "block";
        this.intervals = [];
        this.status = {};
        // const width = this._config.board.width === "auto" ? this.querySelector("#svg").clientWidth : this._config.board.width;

        const filters = {
            study: this.opencgaSession.study.fqn,
            deleted: false,
            count: true,
            limit: 500,
            // include: "name",
            // exclude: "execution",
            ...this.query
        };
        this.opencgaSession.opencgaClient.jobs().search(filters).then(restResponse => {
            const results = restResponse.getResults();
            if (!results.length) {
                this.querySelector("#svg-timeline").innerHTML = "No matching records found";
                return;
            }

            this.timestampMin = Infinity;
            this.timestampMax = -Infinity;

            this._results = [];
            for (let i = 0; i < results.length; i++) {
                const result = {
                    id: results[i].id,
                    timestampStart: results[i].execution && results[i].execution.start ? results[i].execution.start : moment(results[i].creationDate, "YYYYMMDDHHmmss").valueOf(),
                    timestampEnd: results[i].execution ? results[i].execution.end ? results[i].execution.end : results[i].execution.start : moment(results[i].creationDate, "YYYYMMDDHHmmss").valueOf(),
                    status: results[i]?.internal?.status?.name || "UNKNOWN",
                    dependsOn: results[i].dependsOn
                };
                this._results.push(result);
                if (this.timestampMin > result.timestampStart) {
                    this.timestampMin = result.timestampStart;
                }
                if (this.timestampMax < result.timestampEnd) {
                    this.timestampMax = result.timestampEnd;
                }
            }
            this._results = this._results.sort((a, b) => a.timestampStart - b.timestampStart);
            this.generateTimeline();

        }).catch(e => {
            console.log(e);
        }).finally(() => {
            this.querySelector("#loading").style.display = "none";
        });
    }

    generateTimeline() {
        if (!this._results.length) {
            this.querySelector("#svg-timeline").innerHTML = "No matching records found";
            return;
        }
        $("#svg-timeline").empty();
        if (this.draw) {
            this.draw.clear();
            // TODO FIXME for some reason draw is not actually really cleared (cache issue?)
        }
        // console.log("timestampMinMax", this.timestampMin, this.timestampMax);

        this._config.board.width = this._config.board.width || this.querySelector("#svg-timeline").clientWidth - 200;
        this.tick = Math.round(this._config.board.width / this._config.ticks);
        this.dateTick = Math.round((this.timestampMax - this.timestampMin) / this._config.ticks);

        this.svg = SVG().addTo("#svg-timeline").size(1, 1).attr({style: "border: 1px solid #cacaca"});
        this.rect = this.svg.rect(1, 1).attr({fill: "#fff", x: this._config.board.originX, y: this._config.board.originY});

        this.draw = this.svg.group();

        let track = 0;
        // the first loop plots the intervals
        const trackLastEnd = [-Infinity]; // one element because I need a value to compare the first job ((trackLastEnd[t] + config.hspace) < jobA.start)
        for (let i = 0; i < this._results.length; i++) {
            const job = this._results[i];
            job.start = this._config.board.originX + this.rescale_linear(job.timestampStart);
            job.end = this._config.board.originX + this.rescale_linear(job.timestampEnd);

            let assigned = false;

            for (let t = 0; t < track; t++) {
                if (trackLastEnd[t] + this._config.hspace < job.start) {
                    job.track = t;
                    trackLastEnd[t] = job.end;
                    assigned = true;
                    break;
                }
            }
            // if job overlaps all the previous jobs
            if (!assigned) {
                track++;
                job.track = track;
                trackLastEnd[track] = job.end;
            }
            job.y = this._config.board.originY + 50 + job.track * this._config.vspace;
            this.addInterval(job);
        }

        this._config.height = 200 + trackLastEnd.length * this._config.vspace;
        this.svg.size(this._config.board.width + 200, this._config.height);
        this.rect.size(this._config.board.width + 200, this._config.height);
        this.drawTicks(this._config.ticks, this._config.height - 100);

        // the second loop plots the dependencies arrow (if the jobs are sorted by date we can avoid it and use one loop)
        this.intervals.forEach((target, i) => {
            if (target.dependsOn && target.dependsOn.length) {
                target.dependsOn.forEach(dep => {
                    if (!dep || !dep.id) console.error("Dependant Job ID not defined, dep", target);
                    const source = this.intervals.find(c => c.id === dep.id);
                    if (source) {
                        this.draw.line(source.end, source.y, target.start, target.y).stroke({
                            color: "#000",
                            width: 1,
                            opacity: this._config.edgesVisibility === "onclick" ? .3 : .1
                        }).attr({id: source.id + "__" + target.id, class: "edge"});
                    }
                });
            }
        });
        this.draw.move(this._config.board.padding, this._config.board.padding);
    }

    addInterval(job) {
        const x1 = job.start;
        const x2 = job.end;
        const y = job.y;
        const line = this.draw.line(x1, y, x2, y)
            .stroke({color: this.statusColor(job.status), width: this._config.lineWidth, linecap: "round"})
            .attr({id: job.id, class: "job", start: job.timestampStart, _color: this.statusColor(job.status)});

        line.on("click", () => this.onJobClick(line));
        this.intervals.push(job);
    }

    onJobClick(line) {
        SVG.find(".job").forEach(line => line.stroke({color: line.node.attributes._color.value}));
        if (this._config.edgesVisibility === "onclick") {
            SVG.find(".edge").stroke({opacity: 0});
            SVG.find(`.edge[id*="${line.id()}"]`).stroke({opacity: .3});
        }
        line.stroke({color: "#000"});
        // this.file
        this.jobId = line.id();
        this.requestUpdate();
    }

    drawTicks(num, height) {
        const minorTickSize = this.tick / this._config.minorTicks;
        for (let i = 0; i <= num; i++) {
            for (let j = 1; j <= this._config.minorTicks; j++) {
                this.draw.line(this._config.board.originX + this.tick * i + minorTickSize * j, this._config.board.originY + 35, this._config.board.originX + this.tick * i + minorTickSize * j, height).stroke({
                    color: "#e0e0e0",
                    width: 1
                });
            }
            this.draw.line(this._config.board.originX + this.tick * i, this._config.board.originY + 35, this._config.board.originX + this.tick * i, height).stroke({
                color: "#ddd",
                width: 1
            });
            this.draw.text(
                moment(this.timestampMin + this.dateTick * i).format("D MMM YY") + "\n    " +
                moment(this.timestampMin + this.dateTick * i).format("HH:ss")).dy(this._config.board.originY).dx(this._config.board.originX + this.tick * i - 20);

        }
    }

    // min-max normalization. unix timestamp (in ms) in pixel
    rescale_linear(timestamp) {
        const oldRange = this.timestampMax - this.timestampMin;
        const minX = 0;
        const maxX = this._config.board.width;
        const newRange = maxX - minX;
        const rescaled = minX + ((timestamp - this.timestampMin) * newRange / oldRange);
        return Math.round(rescaled);
    }

    statusColor(status) {
        return {
            "PENDING": "#245da9",
            "QUEUED": "#245da9",
            "RUNNING": "#245da9",
            "DONE": "#008901",
            "ERROR": "#f00",
            "UNKNOWN": "#5b5b5b",
            "REGISTERING": "#245da9",
            "UNREGISTERED": "#5b5b5b",
            "ABORTED": "#b6904e",
            "DELETED": "#c09c00"
        }[status];
    }

    getDefaultConfig() {
        return {
            lineWidth: 10,
            ticks: 20, // number of vertical lines
            minorTicks: 0, // number of vertical lines between ticks
            vspace: 40, // space between tracks
            hspace: 10, // space between adjacent intervals
            edgesVisibility: "always", // [always | onclick]
            board: {
                width: 0, // it can a number (px) or "auto" (full width)
                height: 0, // height is dynamic on the number of tracks
                originX: 0,
                originY: 0,
                padding: 50
            }
        };
    }

    setWidth(e) {
        this._config.board.width = e.target.value * (this.querySelector("#svg-timeline").clientWidth - 200);
        this.generateTimeline();
    }

    setHeight(e) {
        console.log(e);
        this._config.vspace = e.target.value;
        this.generateTimeline();
    }

    setEdgeVisibility(e) {
        this._config.edgesVisibility = e.currentTarget.value;
        this.generateTimeline();
    }
    resizing(e) {
        $("#svg-timeline").css("opacity", e.type === "mousedown" ? .5 : 1);
    }


    render() {
        return html`
        <style>
            tspan {
                font-family: sans-serif;
                font-size: 12px;
            }

            #jobs-timeline .slide-container {
                text-align: center;
                height: 45px;
                display: inline-block;
            }

            #jobs-timeline .slide-container:first-child {
                margin-right: 10px;
            }

            #jobs-timeline .slide-container span {
                display: block;
            }

            #jobs-timeline .toolbar {
                /* width: 480px;*/
                float: right;
                margin-bottom: 10px;
            }

            #svg-timeline {
                overflow: auto;
                clear: both;
            }

            #jobs-timeline .edge-radio-container {
                width: 210px;
                display: inline-block;
                vertical-align: middle;
                text-align: center;
            }

        </style>
        <div id="jobs-timeline">
            <div class="toolbar">
                <!--<fieldset class="edge-radio-container">
                <label>Job dependencies</label>
                <div class="switch-toggle text-white">
                    <input id="edge-all" type="radio" name="edge-radio" value="all" checked @change="\${this.setEdgeVisibility}">
                    <label for="edge-all" ><span class="\${this._prefix}-text">Always visible</span></label>
                    <input id="edge-onclick" type="radio" name="edge-radio" value="onclick" @change="\${this.setEdgeVisibility}">
                    <label for="edge-onclick" ><span class="\${this._prefix}-text">On click</span></label>
                    <a class="btn btn-primary ripple btn-small"></a>
                </div>-->
            </fieldset>
                <div class="slide-container">
                    <label>Height</label>
                    <input type="range" min="30" max="150" value="40" class="slider" step="10" id="svg-height" @change="${this.setHeight}" @mousedown="${this.resizing}" @mouseup="${this.resizing}">
                </div>
                <div class="slide-container">
                    <label>Width</label>
                    <input type="range" min="0.8" max="3" value="1" class="slider" step="0.1" id="svg-width" @change="${this.setWidth}" @mousedown="${this.resizing}" @mouseup="${this.resizing}">
                </div>
            </div>
            <div id="loading" style="display: none">
                <loading-spinner></loading-spinner>
            </div>
            <div id="svg-timeline">
            </div>
        </div>
        <job-detail
            .opencgaSession="${this.opencgaSession}"
            .jobId="${this.jobId}">
        </job-detail>
        `;
    }

}

customElements.define("jobs-timeline", JobTimeline);
