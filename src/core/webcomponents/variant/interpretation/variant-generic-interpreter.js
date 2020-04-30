/*
 * Copyright 2015-2016 OpenCB
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

import {LitElement, html} from "/web_modules/lit-element.js";
import UtilsNew from "../../../utilsNew.js";
import PolymerUtils from "../../PolymerUtils.js";
import "./opencga-variant-interpretation-editor.js";
import "./variant-cancer-interpreter.js";
import "./variant-interpreter-qc.js";
import "./variant-interpreter-grid.js";
import "./variant-cancer-interpreter-summary.js";
import "./variant-cancer-interpreter-landing.js";
import "./opencga-variant-interpretation-detail.js";
import "./opencga-variant-interpreter-genome-browser.js";
import "../opencga-variant-filter.js";
import "../../opencga/alignment/opencga-panel-transcript-view.js";
import "../../opencga/opencga-genome-browser.js";
import "../../clinical/opencga-clinical-analysis-view.js";
import "../../clinical/clinical-interpretation-view.js";
import "../../commons/opencga-active-filters.js";
import "../../commons/filters/select-field-filter-autocomplete-simple.js";
import {biotypes, tooltips} from "../../commons/opencga-variant-contants.js";


class VariantGenericInterpreter extends LitElement {

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
            clinicalAnalysisId: {
                type: String
            },
            clinicalAnalysis: {
                type: Object
            },
            cellbaseClient: {
                type: Object
            },
            // consequenceTypes: {
            //     type: Object
            // },
            // populationFrequencies: {
            //     type: Object
            // },
            // proteinSubstitutionScores: {
            //     type: Object
            // },
            config: {
                type: Object
            }
        };
    }

    _init() {
        this._prefix = "vgi-" + UtilsNew.randomString(6);

        this.query = {};
        this.search = {};

        this._config = {...this.getDefaultConfig(), ...this.config};
    }

    connectedCallback() {
        super.connectedCallback();
    }

    firstUpdated(_changedProperties) {
        // CellBase version
        // this.cellbaseClient.getMeta("about").then(response => {
        //     if (UtilsNew.isNotUndefinedOrNull(response) && UtilsNew.isNotEmptyArray(response.response)) {
        //         if (UtilsNew.isNotUndefinedOrNull(response.response[0].result) && UtilsNew.isNotEmptyArray(response.response[0].result)) {
        //             this.cellbaseVersion = response.response[0].result[0]["Version: "];
        //         }
        //     }
        // });

        this.requestUpdate();
    }

    updated(changedProperties) {
        if (changedProperties.has("opencgaSession")) {
            this.opencgaSessionObserver();
        }
        if (changedProperties.has("clinicalAnalysisId")) {
            // this.clinicalAnalysisIdObserver();
        }
    }

    opencgaSessionObserver() {
        // With each property change we must updated config and create the columns again. No extra checks are needed.
        this._config = {...this.getDefaultConfig(), ...this.config};

        this.requestUpdate();
    }

    _changeView(e) {
        e.preventDefault(); // prevents the hash change to "#" and allows to manipulate the hash fragment as needed

        $(".clinical-portal-content").hide(); // hides all content divs
        if (typeof e.target !== "undefined" && typeof e.target.dataset.view !== "undefined") {
            // $("#" + this._prefix + e.target.dataset.view).show(); // get the href and use it find which div to show
            PolymerUtils.show(this._prefix + e.target.dataset.view);
        }

        // Show the active button
        // $(".clinical-portal-button").removeClass("active");
        $(".clinical-portal-button").removeClass("myactive");
        // $(e.target).addClass("active");
        $(e.target).addClass("myactive");
    }

    onClinicalAnalysis(e) {
        this.clinicalAnalysis = e.detail.clinicalAnalysis;
        // this.clinicalAnalysis.type = "cancer";
        this.requestUpdate();
    }

    getDefaultConfig() {
        return {
            title: "Variant Generic Interpreter",
            icon: "fas fa-search",
            active: false,
            tools: [
                {
                    id: "select",
                    title: "Select Sample",
                    acronym: "VB",
                    description: "",
                    icon: "fa fa-list"
                },
                {
                    id: "qc",
                    title: "Quality Control",
                    acronym: "VB",
                    description: "",
                    icon: "fa fa-list"
                },
                {
                    id: "genome-browser",
                    title: "Genome Browser",
                    acronym: "VB",
                    description: "",
                    icon: "fa fa-list"
                },
                {
                    id: "interpretation",
                    title: "Interpretation",
                    acronym: "VB",
                    description: "",
                    icon: "fa fa-list"
                },
                {
                    id: "variant-browser",
                    title: "Variant Browser",
                    acronym: "VB",
                    description: "",
                    icon: "fa fa-list"
                },
                {
                    id: "review",
                    title: "Review",
                    acronym: "VB",
                    description: "",
                    icon: "fa fa-list"
                },
                {
                    id: "report",
                    title: "Clinical Report",
                    acronym: "VB",
                    description: "",
                    icon: "fa fa-list"
                }
            ]
        };
    }

    render() {
        // Check Project exists
        // if (!this.opencgaSession && !this.opencgaSession.project) {
        //     return html`
        //         <div class="guard-page">
        //             <i class="fas fa-lock fa-5x"></i>
        //             <h3>No project available to browse. Please login to continue</h3>
        //         </div>
        //     `;
        // }

        return html`
            <style>
                .clinical-portal-button {
                    font-size: 1.1em;
                }
                
                .myactive {
                    color: darkorange !important;
                    border-bottom-color: darkorange !important;
                    border-top-width: 1px !important;
                }
            </style>
            
            <div class="row">
            
            
                <div class="page-title">
                    <h2>
                        ${this.clinicalAnalysis && this.clinicalAnalysis.id ? html`
                            <i class="fa fa-filter" aria-hidden="true" style="padding-left: 10px;padding-right: 10px"></i>&nbsp;${this._config.title} - Case ${this.clinicalAnalysis.id}
                        ` : html`
                            <i class="fa fa-filter" aria-hidden="true"></i>&nbsp; ${this._config.title}
                        `}
                    </h2>
                </div>
            
                <div class="col-md-10 col-md-offset-1">
                    <nav class="navbar" style="margin-bottom: 5px; border-radius: 0px">
                        <div class="container-fluid">
                            <!-- Brand and toggle get grouped for better mobile display -->
                            <div class="navbar-header">
                                <!--
                                    <a class="navbar-brand" href="#home" @click="${this.changeTool}">
                                        <b>${this._config.title} <sup>${this._config.version}</sup></b>
                                    </a>
                                 -->
                            </div>
                            <div class="collapse navbar-collapse" style="padding: 0px 20px">
                                <!-- Controls aligned to the LEFT -->
                                <ul class="nav navbar-nav">
                                    ${this._config.tools && this._config.tools.map(item => html`
                                        <button type="button" class="btn btn-link clinical-portal-button" style="font-size: 1.1em" 
                                                data-view="${item.id}" @click="${this._changeView}">
                                            ${item.title}
                                        </button>
                                    `)}
                                </ul>
                            </div> 
                        </div> 
                    </nav> 
                </div>
                
                <div id="${this._prefix}MainWindow" class="col-md-12">
                    <div style="padding: 10px 10px">
                    
                        ${this._config.tools ? html`
                            <div id="${this._prefix}select" class="clinical-portal-content">
                                <variant-cancer-interpreter-landing .opencgaSession="${this.opencgaSession}"
                                                                    .config="${this._config}"
                                                                    @selectclinicalnalysis="${this.onClinicalAnalysis}">
                                </variant-cancer-interpreter-landing>
                            </div>
                        ` : null}
        
                        ${this._config.tools ? html`
                            <div id="${this._prefix}qc" class="clinical-portal-content" style="${this._config.tools[0].id !== "qc" ? "display: none" : ""}">
                                <variant-interpreter-qc .opencgaSession="${this.opencgaSession}"
                                                        .clinicalAnalysis="${this.clinicalAnalysis}"
                                                        .config="${this._config}"
                                                        @selectclinicalnalysis="${this.onClinicalAnalysis}">
                                </variant-interpreter-qc>
                            </div>
                        ` : null}
                        
                        ${this._config.tools ? html`
                            <div id="${this._prefix}genome-browser" class="clinical-portal-content" style="${this._config.tools[0].id !== "genome-browser" ? "display: none" : ""}">
                                <opencga-variant-interpreter-genome-browser .opencgaSession="${this.opencgaSession}"
                                                                            .cellbaseClient="${this.cellbaseClient}"
                                                                            .clinicalAnalysis="${this.clinicalAnalysis}"
                                                                            .config="${this._config}"
                                                                            @selectclinicalnalysis="${this.onClinicalAnalysis}">
                                </opencga-variant-interpreter-genome-browser>
                            </div>
                        ` : null}
                        
                        ${this._config.tools ? html`
                            <div id="${this._prefix}variant-browser" class="clinical-portal-content" style="${this._config.tools[0].id !== "variant-browser" ? "display: none" : ""}">
                                
                                ${this.clinicalAnalysis && this.clinicalAnalysis.type.toUpperCase() === "FAMILY" 
                                    ? html`
                                        <variant-rd-interpreter .opencgaSession="${this.opencgaSession}"
                                                                .clinicalAnalysis="${this.clinicalAnalysis}"
                                                                .query="${this.interpretationSearchQuery}"
                                                                .cellbaseClient="${this.cellbaseClient}"
                                                                .populationFrequencies="${this._config.populationFrequencies}"
                                                                .proteinSubstitutionScores="${this._config.proteinSubstitutionScores}"
                                                                .consequenceTypes="${this._config.consequenceTypes}"
                                                                @gene="${this.geneSelected}"
                                                                @samplechange="${this.onSampleChange}">
                                        </variant-rd-interpreter>`
                                    : html `
                                        <variant-cancer-interpreter .opencgaSession="${this.opencgaSession}"
                                                                    .clinicalAnalysis="${this.clinicalAnalysis}"
                                                                    .query="${this.interpretationSearchQuery}"
                                                                    .cellbaseClient="${this.cellbaseClient}"
                                                                    .populationFrequencies="${this._config.populationFrequencies}"
                                                                    .proteinSubstitutionScores="${this._config.proteinSubstitutionScores}"
                                                                    .consequenceTypes="${this._config.consequenceTypes}"
                                                                    @gene="${this.geneSelected}">
                                        </variant-cancer-interpreter>`
                                }
                            </div>
                        ` : null}
                    
                        ${this._config.tools ? html`
                            <div id="${this._prefix}review" class="clinical-portal-content" style="${this._config.tools[0].id !== "review" ? "display: none" : ""}">
                                <opencga-variant-interpretation-editor .opencgaSession="${this.opencgaSession}"
                                                                       .cellbaseClient="${this.cellbaseClient}"
                                                                       .clinicalAnalysis="${this.clinicalAnalysis}"
                                                                       .interpretation="${this.interpretation}"
                                                                       .populationFrequencies="${this.populationFrequencies}"
                                                                       .proteinSubstitutionScores="${this.proteinSubstitutionScores}"
                                                                       .consequenceTypes="${this.consequenceTypes}"
                                                                       .config="${this._config}"
                                                                       @gene="${this.geneSelected}"
                                                                       @samplechange="${this.onSampleChange}"
                                                                       style="font-size: 12px" >
                                 </opencga-variant-interpretation-editor>
                            </div>
                        ` : null}
                    </div>
                </div>
            </div> 
        `;

        // if (!this.clinicalAnalysis) {
        //     return html`
        //         <variant-cancer-interpreter-landing .opencgaSession="${this.opencgaSession}"
        //                                             .config="${this.config}"
        //                                             @selectclinicalnalysis="${this.onClinicalAnalysis}">
        //         </variant-cancer-interpreter-landing>
        //     `;
        // }
    }

}

customElements.define("variant-generic-interpreter", VariantGenericInterpreter);
