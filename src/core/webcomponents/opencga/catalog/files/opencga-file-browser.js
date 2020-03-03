/**
 * Copyright 2015-2019 OpenCB
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

import  {LitElement, html} from "/web_modules/lit-element.js";
import Utils from "../../../../utils.js";
import UtilsNew from "../../../../utilsNew.js";
import PolymerUtils from "../../../PolymerUtils.js";
import "./opencga-file-filter.js";
import "./opencga-file-grid.js";
import "../../opencga-active-filters.js";
import "../variableSets/opencga-annotation-comparator.js";
import "../../../commons/opencb-facet-query.js";
import "../../commons/opencga-facet-view.js";


//TODO check functionality (notify usage)
export default class OpencgaFileBrowser extends LitElement {

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
            filters: {
                type: Object,
                //notify: true
            },
            search: {
                type: Object,
                //notify: true
            },
            config: {
                type: Object
            },
            query: {
                type: Object
            }
        };
    }

    _init() {
        this._prefix = "ofb-" + Utils.randomString(6) + "_";

        this.files = []; // TODO recheck what's the point of this

        this._config = this.getDefaultConfig();

        this.filtersConfig = {
            complexFields: ["annotation"]
        };
    }


    updated(changedProperties) {
        if(changedProperties.has("filters")) {
            this.onFilterUpdate();
        }
        if(changedProperties.has("config")) {
            this.configObserver();
        }
        if(changedProperties.has("opencgaSession") || changedProperties.has("config")) {
            this.filterAvailableVariableSets();
        }
        if (changedProperties.has("query")) {
            this.queryObserver();
        }
    }

    configObserver() {
        this._config = Object.assign(this.getDefaultConfig(), this.config);
    }

    queryObserver() {
        console.log(this.query)
        if (UtilsNew.isNotUndefinedOrNull(this.query)) {
            this.preparedQuery = {...this.query};
            this.executedQuery ={...this.query};
        }
        this.requestUpdate();
    }

    onClear() {
        this._config = Object.assign(this.getDefaultConfig(), this.config);
        this.query = {};
        this.search = {};
    }

    onSelectFile(e) {
        this.file = e.detail.file;

        let sampleList = [];
        for (let i = 0; i < e.detail.file.samples.length; i++) {
            sampleList.push(e.detail.file.samples[i].id);
        }

        this.sampleSearch = {
            id: sampleList.join(",")
        }
    }

    _changeView(e) {
        e.preventDefault(); // prevents the hash change to "#" and allows to manipulate the hash fragment as needed

        $('.file-browser-view-content').hide(); // hides all content divs
        if (typeof e.target !== "undefined" && typeof e.target.dataset.view !== "undefined") {
            PolymerUtils.show(this._prefix + e.target.dataset.view);
        }

        // Show the active button
        $('.file-browser-view-buttons').removeClass("active");
        $(e.target).addClass("active");

        if (e.target.dataset.view === "Summary") {
            this.SummaryActive = true;
            this.requestUpdate();
        } else {
            this.SummaryActive = false;
        }
    }

    filterAvailableVariableSets() {
        this._config = Object.assign(this.getDefaultConfig(), this.config);

        if (this._config.disableVariableSets) {
            this.variableSets = [];
            return;
        }

        if (this._config.variableSetIds.length === 0) {
            this.variableSets = this.opencgaSession.study.variableSets;
        } else {
            let variableSets = [];
            for (let i = 0; i < this.opencgaSession.study.variableSets.length; i++) {
                if (this._config.variableSetIds.indexOf(this.opencgaSession.study.variableSets[i].id) !== -1) {
                    variableSets.push(this.opencgaSession.study.variableSets[i]);
                }
            }
            this.variableSets = variableSets;
        }
        this.requestUpdate();
    }

    isNotEmpty(myArray) {
        return UtilsNew.isNotEmptyArray(myArray);
    }

    onQueryFilterChange(e) {
        this.preparedQuery = e.detail.query;
        this.requestUpdate();
    }

    onQueryFilterSearch(e) {
        this.preparedQuery = e.detail.query;
        this.executedQuery = e.detail.query;
        this.requestUpdate();
    }

    onActiveFilterChange(e) {
        this.preparedQuery = {...e.detail};
        this.query = {...e.detail};
        this.requestUpdate();
    }

    onActiveFilterClear() {
        //this._config = Object.assign(this.getDefaultConfig(), this.config);
        this.query = {};
        //this.search = {};
        this.preparedQuery = {};
        this.requestUpdate();
    }

    getDefaultConfig() {
        return {
            title: "File Browser",
            showTitle: true,
            showAggregationStats: true,
            showComparator: true,
            disableVariableSets: false,
            filter: {

            },
            grid: {
            },
            gridComparator: {
                multiselection: true,
                pageSize: 5,
                pageList: [5, 10],
            },
            variableSetIds: [],
            summary: {
                fields: ["type", "format", "bioformat"]
            }
        };
    }

    render() {
        return html`
        <style include="jso-styles">
            .icon-padding {
                padding-left: 4px;
                padding-right: 5px;
            }

            .detail-tab-title {
                font-size: 115%;
                font-weight: bold;
            }
        </style>

        ${this._config.showTitle ? html`
            <div class="page-title">
                <h2>
                    <i class="fa fa-users" aria-hidden="true"></i> </i>&nbsp;${this._config.title}
                </h2>
            </div>
        ` : null}
        
        <div class="row" style="padding: 0px 10px">
            <div class="col-md-2">
                <opencga-file-filter .opencgaSession="${this.opencgaSession}"
                                     .config="${this._config.filter}"
                                     .files="${this.files}"
                                     .query="${this.query}"
                                     .search="${this.search}"
                                     .variableSets="${this.variableSets}"
                                     @queryChange="${this.onQueryFilterChange}"
                                     @querySearch="${this.onQueryFilterSearch}">
                </opencga-file-filter>
            </div>

            <div class="col-md-10">
                <opencga-active-filters .opencgaSession="${this.opencgaSession}"
                                        .query="${this.preparedQuery}"
                                        .refresh="${this.executedQuery}"
                                        .defaultStudy="${this.opencgaSession.study.alias}"
                                        .config="${this.filtersConfig}"
                                        .alias="${this.activeFilterAlias}"
                                        @activeFilterClear="${this.onActiveFilterClear}"
                                        @activeFilterChange="${this.onActiveFilterChange}">
                </opencga-active-filters>

                <!-- File View Buttons -->
                <div class="col-md-12" style="padding: 5px 0px 5px 0px">
                    <div class="btn-toolbar" role="toolbar" aria-label="..." style="padding: 10px 0px;margin-left: 0px">
                        <div class="btn-group" role="group" style="margin-left: 0px">
                            <button type="button" class="btn btn-success file-browser-view-buttons active ripple" data-view="TableResult" @click="${this._changeView}">
                                <i class="fa fa-table icon-padding" aria-hidden="true" data-view="TableResult" @click="${this._changeView}"></i> Table Result
                            </button>
                            <button type="button" class="btn btn-success file-browser-view-buttons ripple" data-view="Summary"
                                @click="${this._changeView}">
                                <i class="fas fa-chart-bar icon-padding" aria-hidden="true" data-view="Summary" @click="${this._changeView}"></i> Summary Stats
                            </button>
                            ${this.isNotEmpty(this.variableSets) ? html`
                                <button type="button" class="btn btn-success file-browser-view-buttons ripple" data-view="FileComparator" @click="${this._changeView}">
                                    <i class="fa fa-users icon-padding" aria-hidden="true" data-view="FileComparator" @click="${this._changeView}"></i> File Comparator
                                </button>
                            ` : null}
                            
                        </div>
                    </div>
                </div>


                <!--File View Content-->
                <div>
                    <div id="${this._prefix}TableResult" class="file-browser-view-content">
                        <opencga-file-grid .opencgaSession="${this.opencgaSession}"
                                           .config="${this._config.grid}"
                                           .query="${this.executedQuery}"
                                           .search="${this.executedQuery}"
                                           .eventNotifyName="${this.eventNotifyName}"
                                           .files="${this.files}"
                                           style="font-size: 12px"
                                           @selectfile="${this.onSelectFile}">
                        </opencga-file-grid>

                        <div style="padding-top: 5px">
                            <ul id="${this._prefix}ViewTabs" class="nav nav-tabs" role="tablist">

                                <li role="presentation" class="active">
                                    <a href="#${this._prefix}FileViewer" role="tab" data-toggle="tab" class="detail-tab-title">
                                        File info
                                    </a>
                                </li>

                                <li role="presentation">
                                    <a href="#${this._prefix}SampleViewer" role="tab" data-toggle="tab" class="detail-tab-title">
                                        Sample grid
                                    </a>
                                </li>
                            </ul>

                            <div class="tab-content" style="height: 680px">
                                <div role="tabpanel" class="tab-pane active" id="${this._prefix}FileViewer">
                                    Work in progress
                                </div>
                                <div role="tabpanel" class="tab-pane" id="${this._prefix}SampleViewer">
                                    <opencga-sample-grid .opencgaClient="${this.opencgaSession.opencgaClient}"
                                                         .opencgaSession="${this.opencgaSession}"
                                                         .search="${this.sampleSearch}"
                                                         style="font-size: 12px">
                                    </opencga-sample-grid>
                                </div>

                            </div>
                        </div>

                    </div>

                    <div id="${this._prefix}Summary" class="file-browser-view-content" style="display: none">
                        <opencb-facet-query resource="files"
                                            .opencgaSession="${this.opencgaSession}"
                                            .cellbaseClient="${this.cellbaseClient}"  
                                            .config="${this._config}"
                                            .query="${this.executedQuery}"
                                            .active="${this.SummaryActive}">
                        </opencb-facet-query>
                    </div>

                    <div id="${this._prefix}FileComparator" class="file-browser-view-content" style="display: none">

                        <opencga-file-grid .opencgaSession="${this.opencgaSession}"
                                            .config="${this._config.gridComparator}"
                                            .eventNotifyName="${this.eventNotifyName}"
                                            .files="${this.files}"
                                            .search="${this.search}"
                                            style="font-size: 12px">
                        </opencga-file-grid>

                        <div style="padding-top: 5px">
                            <h3> Annotation comparator</h3>
                            <opencga-annotation-viewer .opencgaClient="${this.opencgaSession.opencgaClient}"
                                                       .opencgaSession="${this.opencgaSession}"
                                                       .config="${this._config}"
                                                       .entryIds="${this.files}"
                                                       entity="FILE">
                            </opencga-annotation-viewer>
                        </div>

                    </div>
                </div>

            </div>
        </div>
        `;
    }
}

customElements.define("opencga-file-browser", OpencgaFileBrowser);
