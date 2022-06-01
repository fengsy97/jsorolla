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

import {LitElement, html} from "lit";
import UtilsNew from "../../../core/utilsNew.js";
import "./variant-interpreter-browser-rd.js";
import "./variant-interpreter-browser-cancer.js";
import "./variant-interpreter-browser-cnv.js";
import "./variant-interpreter-browser-rearrangement.js";
import "../../visualization/genome-browser.js";
import "../../commons/view/detail-tabs.js";

class VariantInterpreterBrowser extends LitElement {

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
            cellbaseClient: {
                type: Object
            },
            clinicalAnalysis: {
                type: Object
            },
            clinicalAnalysisId: {
                type: String
            },
            settings: {
                type: Object
            }
        };
    }

    _init() {
        this._prefix = UtilsNew.randomString(8);

        this._config = this.getDefaultConfig();
    }

    update(changedProperties) {
        if (changedProperties.has("clinicalAnalysis")) {
            this.clinicalAnalysisObserver();
        }
        if (changedProperties.has("clinicalAnalysisId")) {
            this.clinicalAnalysisIdObserver();
        }
        super.update(changedProperties);
    }

    clinicalAnalysisObserver() {
        if (this.clinicalAnalysis) {
            switch (this.clinicalAnalysis.type.toUpperCase()) {
                case "SINGLE":
                case "FAMILY":
                    this._sample = this.clinicalAnalysis.proband.samples[0];
                    break;
                case "CANCER":
                    this._somaticSample = this.clinicalAnalysis.proband.samples.find(s => s.somatic);
                    this._germlineSample = this.clinicalAnalysis.proband.samples.find(s => !s.somatic);
                    break;
            }
            this._config = this.getDefaultConfig();
        }
        this.requestUpdate();
    }

    clinicalAnalysisIdObserver() {
        if (this.opencgaSession && this.clinicalAnalysisId) {
            this.opencgaSession.opencgaClient.clinical().info(this.clinicalAnalysisId, {study: this.opencgaSession.study.fqn})
                .then(response => {
                    this.clinicalAnalysis = response.responses[0].results[0];
                })
                .catch(response => {
                    console.error("An error occurred fetching clinicalAnalysis: ", response);
                });
        }
    }

    // onClinicalAnalysisUpdate(e) {
    //     LitUtils.dispatchCustomEvent(this, "clinicalAnalysisUpdate", null, {
    //         clinicalAnalysis: e.detail.clinicalAnalysis,
    //     }, null);
    // }

    render() {
        // Check if project exists
        if (!this.opencgaSession?.project) {
            return html`
                <div class="guard-page">
                    <i class="fas fa-lock fa-5x"></i>
                    <h3>No public projects available to browse. Please login to continue</h3>
                </div>
            `;
        }

        if (!this.clinicalAnalysis) {
            return html`
                <div class="guard-page">
                    <h3>No Case found</h3>
                </div>
            `;
        }

        if (!this.clinicalAnalysis.proband?.samples?.length) {
            return html`
                <div class="alert alert-warning" role="alert">
                    <i class="fas fa-3x fa-exclamation-circle align-middle"></i>
                    No sample available for Proband
                </div>
            `;
        }

        return html`
            <detail-tabs
                .data="${this.clinicalAnalysis}"
                .config="${this._config}"
                .opencgaSession="${this.opencgaSession}">
            </detail-tabs>
        `;
    }

    getDefaultConfig() {
        const items = [];

        // Check for clinicalAnalysis
        if (this.clinicalAnalysis) {
            const type = this.clinicalAnalysis.type.toUpperCase();

            if (type === "SINGLE" || type === "FAMILY") {
                items.push({
                    id: "variant-browser",
                    name: "Variant Browser",
                    active: true,
                    render: (clinicalAnalysis, active, opencgaSession) => {
                        return html`
                            <div class="col-md-12">
                                <tool-header
                                    title="Variant Browser - ${this._sample?.id}"
                                    class="bg-white"></tool-header>
                                <variant-interpreter-browser-rd
                                    .opencgaSession="${opencgaSession}"
                                    .clinicalAnalysis="${clinicalAnalysis}"
                                    .cellbaseClient="${this.cellbaseClient}"
                                    .settings="${this.settings.browsers["RD"]}"
                                    @clinicalAnalysisUpdate="${this.onClinicalAnalysisUpdate}"
                                    @samplechange="${this.onSampleChange}">
                                </variant-interpreter-browser-rd>
                            </div>
                        `;
                    }
                });
            } else {
                if (type === "CANCER") {
                    // Add somatic variant browser
                    items.push({
                        id: "cancer-somatic-variant-browser",
                        name: "Somatic Small Variants",
                        active: true,
                        render: (clinicalAnalysis, active, opencgaSession) => {
                            return html`
                                <div class="col-md-12">
                                    <tool-header
                                        title="Somatic Variant Browser - ${this._somaticSample?.id}"
                                        class="bg-white"></tool-header>
                                    <variant-interpreter-browser-cancer
                                        .opencgaSession="${opencgaSession}"
                                        .clinicalAnalysis="${clinicalAnalysis}"
                                        .cellbaseClient="${this.cellbaseClient}"
                                        .settings="${this.settings.browsers["CANCER_SNV"]}"
                                        @clinicalAnalysisUpdate="${this.onClinicalAnalysisUpdate}">
                                    </variant-interpreter-browser-cancer>
                                </div>
                            `;
                        }
                    });

                    // Add CNV Variant browser
                    if (this.settings.browsers["CANCER_CNV"]) {
                        items.push({
                            id: "somatic-cnv-variant-browser",
                            name: "Somatic CNV Variants",
                            active: false,
                            render: (clinicalAnalysis, active, opencgaSession) => html`
                                <div class="col-md-12">
                                    <tool-header
                                        title="Somatic CNV Variant Browser - ${this._somaticSample?.id}"
                                        class="bg-white">
                                    </tool-header>
                                    <variant-interpreter-browser-cnv
                                        .opencgaSession="${opencgaSession}"
                                        .clinicalAnalysis="${clinicalAnalysis}"
                                        .query="${this.query}"
                                        .cellbaseClient="${this.cellbaseClient}"
                                        .settings="${this.settings.browsers["CANCER_CNV"]}"
                                        @clinicalAnalysisUpdate="${this.onClinicalAnalysisUpdate}">
                                    </variant-interpreter-browser-cnv>
                                </div>
                            `,
                        });
                    }

                    // Check for adding rearrangements variant browser
                    if (this.settings.browsers["REARRANGEMENT"]) {
                        items.push({
                            id: "cancer-somatic-rearrangement-variant-browser",
                            name: "Somatic Rearrangement Variants",
                            render: (clinicalAnalysis, active, opencgaSession) => html`
                                <div class="col-md-12">
                                    <tool-header
                                        title="Somatic Rearrangement Variant Browser - ${this._somaticSample?.id}"
                                        class="bg-white">
                                    </tool-header>
                                    <variant-interpreter-browser-rearrangement
                                        .opencgaSession="${opencgaSession}"
                                        .clinicalAnalysis="${clinicalAnalysis}"
                                        .cellbaseClient="${this.cellbaseClient}"
                                        .settings="${this.settings.browsers["REARRANGEMENT"]}"
                                        @clinicalAnalysisUpdate="${this.onClinicalAnalysisUpdate}">
                                    </variant-interpreter-browser-rearrangement>
                                </div>
                            `,
                        });
                    }

                    // Check for adding germline browser
                    if (this._germlineSample) {
                        items.push({
                            id: "cancer-germline-variant-browser",
                            name: "Germline Small Variants",
                            render: (clinicalAnalysis, active, opencgaSession) => {
                                return html`
                                    <div class="col-md-12">
                                        <tool-header
                                            title="Germline Variant Browser - ${this._germlineSample?.id}"
                                            class="bg-white">
                                        </tool-header>
                                        <variant-interpreter-browser-rd
                                            .opencgaSession="${opencgaSession}"
                                            .clinicalAnalysis="${clinicalAnalysis}"
                                            .cellbaseClient="${this.cellbaseClient}"
                                            .settings="${this._config}"
                                            @clinicalAnalysisUpdate="${this.onClinicalAnalysisUpdate}"
                                            @samplechange="${this.onSampleChange}">
                                        </variant-interpreter-browser-rd>
                                    </div>
                                `;
                            },
                        });
                        items.push({
                            id: "rearrangement-germline-variant-browser",
                            name: "Germline Rearrangement Variants",
                            render: (clinicalAnalysis, active, opencgaSession) => html`
                                <div class="col-md-12">
                                    <tool-header
                                        title="Germline Rearrangement Variant Browser - ${this._germlineSample?.id}"
                                        class="bg-white">
                                    </tool-header>
                                    <variant-interpreter-browser-rearrangement
                                        .opencgaSession="${opencgaSession}"
                                        .clinicalAnalysis="${clinicalAnalysis}"
                                        .somatic="${false}"
                                        .cellbaseClient="${this.cellbaseClient}"
                                        .settings="${this.settings.browsers["REARRANGEMENT"]}"
                                        @clinicalAnalysisUpdate="${this.onClinicalAnalysisUpdate}">
                                    </variant-interpreter-browser-rearrangement>
                                </div>
                            `,
                        });
                    }
                }
            }

            // Append genome browser
            items.push({
                id: "genome-browser",
                name: "Genome Browser (Beta)",
                render: (clinicalAnalysis, active, opencgaSession) => {
                    const featuresOfInterest = [];
                    if (clinicalAnalysis.interpretation?.primaryFindings.length > 0) {
                        featuresOfInterest.push({
                            name: "Primary Findings",
                            features: clinicalAnalysis.interpretation.primaryFindings.map(feature => ({
                                id: feature.id,
                                chromosome: feature.chromosome,
                                start: feature.start,
                                end: feature.end,
                            })),
                        });
                    }

                    return html`
                        <div style="margin-top:16px;">
                            <genome-browser
                                .opencgaSession="${opencgaSession}"
                                .region="${clinicalAnalysis.interpretation.primaryFindings[0]}"
                                .active="${active}"
                                .config="${{
                                    cellBaseClient: this.cellbaseClient,
                                    featuresOfInterest: featuresOfInterest,
                                }}"
                                .tracks="${[
                                    {
                                        type: "gene-overview",
                                        overview: true,
                                        config: {},
                                    },
                                    {
                                        type: "sequence",
                                        config: {},
                                    },
                                    {
                                        type: "gene",
                                        config: {},
                                    },
                                    {
                                        type: "opencga-variant",
                                        config: {
                                            title: "Variants",
                                            query: {
                                                sample: clinicalAnalysis.proband.samples.map(s => s.id).join(","),
                                            },
                                            height: 120,
                                        },
                                    },
                                    ...(clinicalAnalysis.proband?.samples || []).map(sample => ({
                                        type: "opencga-alignment",
                                        config: {
                                            title: `Alignments - ${sample.id}`,
                                            sample: sample.id,
                                        },
                                    })),
                                ]}">
                            </genome-browser>
                        </div>
                    `;
                },
            });
        }

        // Return tabs configuration
        return {
            // title: "Variant Interperter Browser",
            display: {
                align: "center",
            },
            items: items,
        };
    }

}

customElements.define("variant-interpreter-browser", VariantInterpreterBrowser);
