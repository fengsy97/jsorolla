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

import {LitElement, html} from "lit";
import UtilsNew from "../../core/utils-new.js";
import PolymerUtils from "../PolymerUtils.js";
import "../commons/opencga-facet-result-view.js";
import "../loading-spinner.js";

/**
* @deprecated
* */

class OpencgaVariantFacetQuery extends LitElement {

    constructor() {
        super();

        // Set status and init private properties
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
            query: {
                type: Object
            },
            cellbaseClient: {
                type: Object
            },
            populationFrequencies: {
                type: Object
            },
            config: {
                type: Object
            },
            active: {
                type: Boolean
            }
        };
    }

    _init() {
        this._prefix = "facet" + UtilsNew.randomString(6);

        // this.checkProjects = true;

        // These are for making the queries to server
        this.facetFields = [];
        this.facetRanges = [];

        this.facetFieldsName = [];
        this.facetRangeFields = [];

        this.results = [];
        this._showInitMessage = true;

        this.facets = new Set();
        this.facetFilters = [];
        this.facetActive = true;
        this._config = this.getDefaultConfig();
    }

    firstUpdated(_changedProperties) {
        $(".bootstrap-select", this).selectpicker();
    }

    updated(changedProperties) {
        if (changedProperties.has("opencgaSession") || changedProperties.has("query")) {
            this.propertyObserver();
        }
        if (changedProperties.has("query")) {
            this.queryObserver();
        }
        if (changedProperties.has("config")) {
            this.configObserver();
        }
        if (changedProperties.has("active")) {
            this.fetchDefaultData();
        }
    }

    propertyObserver(opencgaSession, query) {
        // this.clear();
        //PolymerUtils.show(this._prefix + "Warning");
    }

    queryObserver() {
        console.log("queryObserver  in facet!")
        //executedQuery in opencga-variant-browser has changed so, if requested,  we have to repeat the facet query
        this.facetResults = [];
        this.fetchDefaultData();
    }

    configObserver() {
        this._config = {...this.getDefaultConfig(), ...this.config};
    }

    addDefaultStats(e) {
        for (let i = 0; i < this._config.defaultStats.fields.length; i++) {
            this.facets.add(this._config.defaultStats.fields[i]);
        }
        this.facetFilters = Array.from(this.facets);
        this.requestUpdate();
    }

    fetchDefaultData() {
        //this.facetResults is reset in queryObserver
        if(this.active && !this.facetResults.length) {
            this.addDefaultStats();
            this.fetchData();
        }
    }

    fetchData() {
        if (UtilsNew.isUndefinedOrNull(this.opencgaSession.opencgaClient)) {
            console.log("opencgaClient is null or undefined");
            return;
        }

        PolymerUtils.hide(this._prefix + "Warning");

        this.clearPlots();
        this.querySelector("#loading").style.display = "block";

        // Join 'query' from left menu and facet filters
        let queryParams = {...this.query,
                study: this.opencgaSession.study.fqn,
                fields: this.facetFilters.join(";"),
                timeout: 60000};

        console.warn("queryParams", queryParams);
        this.opencgaSession.opencgaClient.variants().aggregationStats(queryParams)
            .then(queryResponse => {
                this.facetResults = queryResponse.response[0].result[0].results;
                this.querySelector("#loading").style.display = "none";
                this._showInitMessage = false;
            })
            .catch(function(e) {
                console.log(e);
                this.querySelector("#loading").style.display = "none";
                this._showInitMessage = false;
            })
            .finally(() => this.requestUpdate());

    }

    clearPlots() {
        if (UtilsNew.isNotUndefined(this.results) && this.results.length > 0) {
            for (let result of this.results) {
                PolymerUtils.removeElement(this._prefix + result.name + "Plot");
            }
        }
        this.results = [];
    }

    clear() {
        this.clearPlots();
        this.chromosome = "";

        this.facets = new Set();
        this.facetFilters = [];

        PolymerUtils.hide(this._prefix + "Warning");

        this.facetFields = [];
        this.facetRanges = [];
        this.facetFieldsName = [];
        this.facetRangeFields = [];
        this._showInitMessage = true;

        this.requestUpdate();
    }

    facetSearch() {
        //query.study = this.opencgaSession.study.fqn;
        this.dispatchEvent(new CustomEvent("facetSearch", {
            detail: this.query,
            bubbles: true,
            composed: true
        }));
    }

    //TODO add default configuration for file, sample, individual, family, cohort, clinical analysis
    getDefaultConfig() {
        return {
            // title: "Aggregation Stats",
            active: false,
            populationFrequencies: true,
            defaultStats: {
                visible: true,
                fields: ["chromosome", "biotypes", "type"]
            },
            fields: {
                terms: [
                    {
                        name: "Chromosome", value: "chromosome"
                    },
                    {
                        name: "Studies", value: "studies"
                    },
                    {
                        name: "Variant Type", value: "type"
                    },
                    {
                        name: "Genes", value: "genes"
                    },
                    {
                        name: "Biotypes", value: "biotypes"
                    },
                    {
                        name: "Consequence Type", value: "consequenceType"
                    }
                ],
                ranges: [
                    {
                        name: "PhastCons", value: "phastCons", default: "[0..1]:0.1"
                    },
                    {
                        name: "PhyloP", value: "phylop", default: ""
                    },
                    {
                        name: "Gerp", value: "gerp", default: "[-12.3..6.17]:2"
                    },
                    {
                        name: "CADD Raw", value: "caddRaw"
                    },
                    {
                        name: "CADD Scaled", value: "caddScaled"
                    },
                    {
                        name: "Sift", value: "sift", default: "[0..1]:0.1"
                    },
                    {
                        name: "Polyphen", value: "polyphen", default: "[0..1]:0.1"
                    }
                ]
            }
        };
    }

    render() {
        return html`
        <style>
            #loading {
                text-align: center;
                margin-top: 40px;
            }
        </style>

        <div class="row">
            <!-- RESULTS - Facet Plots -->
            ${this.active ? html`
            <div class="col-md-12">
                <div>
                    <button type="button" class="btn btn-primary ripple pull-right" @click="${this.facetSearch}">Run Advanced facet query</button>
                </div>
                <div >
                    <h2>Results</h2>

                    <div id="loading" style="display: none">
                        <loading-spinner></loading-spinner>
                    </div>
                    ${this._showInitMessage ? html`
                        <!--<h4>No facet filters selected</h4>-->
                    ` : html`
                        ${this.facetResults.map(item => html`
                            <div>
                                <h3>${item.name}</h3>
                                <opencga-facet-result-view .facetResult="${item}"
                                                           .config="${this.facetConfig}"
                                                           ?active="${this.facetActive}">
                                </opencga-facet-result-view>
                            </div>
                        `)}
                    `}
                </div>
            </div>` : null}
        </div>
    `;
    }
}

customElements.define("opencga-variant-facet-query", OpencgaVariantFacetQuery);
