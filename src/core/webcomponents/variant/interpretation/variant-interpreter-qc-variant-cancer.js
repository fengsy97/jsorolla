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

import {LitElement, html} from "/web_modules/lit-element.js";
import UtilsNew from "../../../utilsNew.js";
import Circos from "./test/circos.js";
import "../opencga-variant-filter.js";
import "../../commons/opencga-active-filters.js";
import "../../commons/view/signature-view.js";
import "../../loading-spinner.js";

export default class VariantInterpreterQcVariantCancer extends LitElement {

    constructor() {
        super();
        this._init();
    }

    createRenderRoot() {
        return this;
    }

    static get properties() {
        return {
            query: {
                type: Object
            },
            sampleId: {
                type: String
            },
            config: {
                type: Object
            },
            active: {
                type: Boolean
            }
        }
    }

    _init(){
        this._prefix = "sf-" + UtilsNew.randomString(6) + "_";
        this.preparedQuery = {};

        this.base64 = "data:image/png;base64, " + Circos.base64;

    }

    connectedCallback() {
        super.connectedCallback();
        this._config = {...this.getDefaultConfig(), ...this.config};
    }

    firstUpdated(_changedProperties) {

    }

    updated(changedProperties) {
        if (changedProperties.has("query") || changedProperties.has("sampleId")) {
            this.propertyObserver();
        }
    }

    queryObserver() {
        if (this.query) {
            this.preparedQuery = {study: this.opencgaSession.study.fqn, ...this.query};
            this.executedQuery = {study: this.opencgaSession.study.fqn, ...this.query};
        }
        this.requestUpdate();
    }

    async propertyObserver() {
        this.signature = null;
        await this.requestUpdate();
        this.opencgaSession.opencgaClient.variants().queryMutationalSignature({
            study: this.opencgaSession.study.fqn,
            fitting: false,
            sample: this.sampleId,
            ...this.query
        }).then( restResult => {
            this.signature = restResult.getResult(0).signature;
            }).catch( restResponse => {
            this.signature = {
                errorState: "Error from Server " + restResponse.getEvents("ERROR").map(error => error.message).join(" \n ")
            };
        }).finally( () => {
            this.requestUpdate();
        })
    }

    onVariantFilterChange(e) {
        this.preparedQuery = e.detail.query;
        this.requestUpdate();
    }

    onVariantFilterSearch(e) {
        console.log("onVariantFilterSearch", e)
        //this.preparedQuery = this._prepareQuery(e.detail.query); //TODO check if we need to process e.detail.query
        this.query = {...e.detail.query};
        this.requestUpdate();
    }

    onActiveFilterChange(e) {
        this.query = {study: this.opencgaSession.study.fqn, ...e.detail};
        this.requestUpdate();
    }

    onActiveFilterClear() {
        console.log("onActiveFilterClear");
        this.query = {study: this.opencgaSession.study.fqn};
        this.requestUpdate();
    }

    getDefaultConfig() {
        return {
            title: "",
            icon: "fas fa-search",
            filter: {
                title: "Filter",
                searchButtonText: "Run",
                activeFilters: {
                    alias: {
                        // Example:
                        // "region": "Region",
                        // "gene": "Gene",
                        "ct": "Consequence Types"
                    },
                    complexFields: ["genotype"],
                    hiddenFields: []
                },
                sections: [     // sections and subsections, structure and order is respected
                    {
                        title: "Study and Cohorts",
                        collapsed: false,
                        fields: [
                            {
                                id: "cohort",
                                title: "Cohort Alternate Stats",
                                onlyCohortAll: true,
                                tooltip: tooltips.cohort
                                //cohorts: this.cohorts
                            }
                        ]
                    },
                    {
                        title: "Genomic",
                        collapsed: true,
                        fields: [
                            {
                                id: "biotype",
                                title: "Gene Biotype",
                                biotypes: biotypes,
                                tooltip: tooltips.biotype
                            },
                            {
                                id: "region",
                                title: "Genomic Location",
                                tooltip: tooltips.region
                            },
                            {
                                id: "feature",
                                title: "Feature IDs (gene, SNPs, ...)",
                                tooltip: tooltips.feature
                            },
                            {
                                id: "diseasePanels",
                                title: "Disease Panels",
                                tooltip: tooltips.diseasePanels
                            },

                            {
                                id: "type",
                                title: "Variant Type",
                                types: ["SNV", "INDEL", "CNV", "INSERTION", "DELETION"],
                                tooltip: tooltips.type
                            }
                        ]
                    },
                    {
                        title: "Consequence Type",
                        collapsed: true,
                        fields: [
                            {
                                id: "consequenceTypeSelect",
                                title: "Select SO terms",
                                tooltip: tooltips.consequenceTypeSelect
                            }
                        ]
                    }
                ],
                examples: [
                    {
                        name: "Example BRCA2",
                        active: false,
                        query: {
                            gene: "BRCA2",
                            ct: "missense_variant"
                        }
                    },
                    {
                        name: "Full Example",
                        query: {
                            "region": "1,2,3,4,5",
                            "xref": "BRCA1,TP53",
                            "biotype": "protein_coding",
                            "type": "SNV,INDEL",
                            "ct": "lof",
                            "populationFrequencyAlt": "1kG_phase3:ALL<0.1,GNOMAD_GENOMES:ALL<0.1",
                            "protein_substitution": "sift>5,polyphen>4",
                            "conservation": "phylop>1;phastCons>2;gerp<=3"
                        }
                    }
                ],
                result: {
                    grid: {}
                },
                detail: {
                    title: "Selected Variant",
                    views: [
                        {
                            id: "annotationSummary",
                            title: "Summary",
                            active: true
                        },
                        {
                            id: "annotationConsType",
                            title: "Consequence Type"
                        },
                        {
                            id: "annotationPropFreq",
                            title: "Population Frequencies"
                        },
                        {
                            id: "annotationClinical",
                            title: "Clinical"
                        },
                        {
                            id: "cohortStats",
                            title: "Cohort Stats"
                            //cohorts: this.cohorts
                        },
                        {
                            id: "samples",
                            title: "Samples"
                        },
                        {
                            id: "beacon",
                            // component: "variant-beacon-network",
                            title: "Beacon"
                            // Uncomment and edit Beacon hosts to change default hosts
                            // hosts: [
                            //     "brca-exchange", "cell_lines", "cosmic", "wtsi", "wgs", "ncbi", "ebi", "ega", "broad", "gigascience", "ucsc",
                            //     "lovd", "hgmd", "icgc", "sahgp"
                            // ]
                        },
                        {
                            id: "network",
                            // component: "reactome-variant-network",
                            title: "Reactome Pathways"
                        }
                        // {
                        //     id: "template",
                        //     component: "opencga-variant-detail-template",
                        //     title: "Template"
                        // }
                    ]
                }
            }
        }
    }

    render() {
        return html`
            <div class="row">
                <div class="col-md-2 left-menu">
                    <opencga-variant-filter .opencgaSession=${this.opencgaSession}
                                            .query="${this.query}"
                                            .cellbaseClient="${this.cellbaseClient}"
                                            .populationFrequencies="${this.populationFrequencies}"
                                            .consequenceTypes="${this.consequenceTypes}"
                                            .cohorts="${this.cohorts}"
                                            .searchButton="${true}"
                                            .config="${this._config.filter}"
                                            @queryChange="${this.onVariantFilterChange}"
                                            @querySearch="${this.onVariantFilterSearch}">
                    </opencga-variant-filter>
                </div>

                <div class="col-md-10">
                    <div>
                        <opencga-active-filters filterBioformat="VARIANT"
                                                .opencgaSession="${this.opencgaSession}"
                                                .defaultStudy="${this.opencgaSession.study.fqn}"
                                                .query="${this.preparedQuery}"
                                                .refresh="${this.executedQuery}"
                                                .alias="${this.activeFilterAlias}"
                                                .filters="${this._config.filter.examples}"
                                                .config="${this._config.filter.activeFilters}"
                                                @activeFilterChange="${this.onActiveFilterChange}"
                                                @activeFilterClear="${this.onActiveFilterClear}">
                        </opencga-active-filters>
                        
                        <div class="main-view">
<!--                            executedQuery : -->${JSON.stringify(this.executedQuery)}
                            <div class="row" style="padding: 10px">
                                <div class="col-md-12">
                                    <div class="col-md-7">
                                        <h2>Circos</h2>
                                        <img class="img-responsive" src="${this.base64}">
                                        <!--<img width="640" src="https://www.researchgate.net/profile/Angela_Baker6/publication/259720064/figure/fig1/AS:613877578465328@1523371228720/Circos-plot-summarizing-somatic-events-A-summary-of-all-identified-somatic-genomic.png">-->
                                    </div>
                                    <div class="col-md-5">
                                        <h2>Signature</h2>
                                        <signature-view .signature="${this.signature}" .active="${this.active}"></signature-view>
                                        <!--<img width="480" src="https://cancer.sanger.ac.uk/signatures_v2/Signature-3.png">-->
                                        <div style="padding-top: 20px">
                                            <h2>Sample Stats</h2>
                                            <img width="480" src="https://www.ensembl.org/img/vep_stats_2.png">
                                        </div>
                                    </div>
                                </div>
                            </div>                            
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

}

customElements.define("variant-interpreter-qc-variant-cancer", VariantInterpreterQcVariantCancer);
