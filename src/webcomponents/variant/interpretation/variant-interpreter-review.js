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
import "./variant-interpreter-review-primary.js";
import "./variant-interpreter-rearrangement-grid.js";
import "../../clinical/interpretation/clinical-interpretation-editor.js";
import "../../commons/view/detail-tabs.js";
import "../../clinical/interpretation/clinical-interpretation-review.js";


export default class VariantInterpreterReview extends LitElement {

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
                type: Object,
            },
            clinicalAnalysis: {
                type: Object,
            },
            clinicalAnalysisId: {
                type: String,
            },
            settings: {
                type: Object,
            },
        };
    }

    _init() {
        this._config = this.getDefaultConfig();
    }

    update(changedProperties) {
        if (changedProperties.has("clinicalAnalysisId")) {
            this.clinicalAnalysisIdObserver();
        }

        if (changedProperties.has("clinicalAnalysis")) {
            this._config = this.getDefaultConfig();
        }

        super.update(changedProperties);
    }


    clinicalAnalysisIdObserver() {
        if (this.opencgaSession && this.clinicalAnalysisId) {
            this.opencgaSession.opencgaClient.clinical().info(this.clinicalAnalysisId, {study: this.opencgaSession.study.fqn})
                .then(response => {
                    this.clinicalAnalysis = response.responses[0].results[0];
                    this._config = this.getDefaultConfig();
                })
                .catch(response => {
                    console.error("An error occurred fetching clinicalAnalysis: ", response);
                });
        }
    }

    render() {
        // Check if session has not been created or project does not exist
        if (!this.opencgaSession || !this.opencgaSession.project) {
            return html`
                <div class="guard-page">
                    <i class="fas fa-lock fa-5x"></i>
                    <h3>No public projects available to browse. Please login to continue</h3>
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
        const items = [
            {
                id: "general-info",
                name: "General Info",
                active: false,
                render: (clinicalAnalysis, active, opencgaSession) => {
                    return html`
                        <div class="col-md-10 col-md-offset-1">
                            <tool-header
                                class="bg-white"
                                title="Interpretation - ${clinicalAnalysis?.interpretation?.id}">
                            </tool-header>
                            <clinical-interpretation-editor
                                .active="${active}"
                                .clinicalAnalysis="${clinicalAnalysis}"
                                .opencgaSession="${opencgaSession}">
                            </clinical-interpretation-editor>
                        </div>
                    `;
                }
            }
        ];

        // Check for clinicalAnalysis
        if (this.clinicalAnalysis) {
            const type = this.clinicalAnalysis.type.toUpperCase();

            if (type === "CANCER") {
                items.push(
                    {
                        id: "primary-findings",
                        name: "Somatic Variants",
                        render: (clinicalAnalysis, active, opencgaSession) => {
                            // TODO: fix this line to get correct variants to display
                            // const variants = this.clinicalAnalysis?.interpretation?.primaryFindings || [];
                            const variants = clinicalAnalysis?.interpretation?.primaryFindings
                                .filter(v => v.type !== "COPY_NUMBER")
                                .filter(v => v.type !== "BREAKEND");
                            return html`
                                <div class="col-md-10 col-md-offset-1">
                                    <tool-header
                                        class="bg-white"
                                        title="Primary Findings - ${clinicalAnalysis?.interpretation?.id}">
                                    </tool-header>
                                    <variant-interpreter-review-primary
                                        .opencgaSession="${opencgaSession}"
                                        .clinicalAnalysis="${clinicalAnalysis}"
                                        .clinicalVariants="${variants}"
                                        .active="${active}"
                                        .gridConfig="${{
                                            somatic: true,
                                            variantTypes: ["SNV", "INDEL"],
                                        }}"
                                        .settings="${this.settings.browsers["CANCER_SNV"]}">
                                    </variant-interpreter-review-primary>
                                </div>
                            `;
                        },
                    }
                );

                // TODO: add a condition for displaying CNV browser
                items.push({
                    id: "somatic-cnv-variants",
                    name: "Somatic CNV Variants",
                    render: (clinicalAnalysis, active, opencgaSession) => {
                        const variants = clinicalAnalysis?.interpretation?.primaryFindings
                            .filter(v => {
                                const sampleId = v.studies[0]?.samples[0]?.sampleId;
                                const sample = this.clinicalAnalysis.proband.samples.find(s => s.id === sampleId);
                                return sample && sample.somatic;
                            })
                            .filter(v => v.type === "COPY_NUMBER");
                        return html`
                            <div class="col-md-10 col-md-offset-1">
                                <tool-header
                                    class="bg-white"
                                    title="Somatic CNV Variants - ${clinicalAnalysis?.interpretation?.id}">
                                </tool-header>
                                <variant-interpreter-review-primary
                                    .opencgaSession="${opencgaSession}"
                                    .clinicalAnalysis="${clinicalAnalysis}"
                                    .clinicalVariants="${variants}"
                                    .active="${active}"
                                    .gridConfig="${{
                                        somatic: true,
                                        variantTypes: ["COPY_NUMBER", "CNV"],
                                    }}"
                                    .settings="${this.settings.browsers["CANCER_CNV"]}">
                                </variant-interpreter-review-primary>
                            </div>
                        `;
                    },
                });
                // TODO: add a condition for displaying rearrangements
                items.push({
                    id: "somatic-rearrangements",
                    name: "Somatic Rearrangements Variants",
                    render: (clinicalAnalysis, active, opencgaSession) => {
                        const variants = clinicalAnalysis?.interpretation?.primaryFindings
                            .filter(v => {
                                const sampleId = v.studies[0]?.samples[0]?.sampleId;
                                const sample = this.clinicalAnalysis.proband.samples.find(s => s.id === sampleId);
                                return sample && sample.somatic;
                            })
                            .filter(v => v.type === "BREAKEND");

                        return html`
                            <div class="col-md-10 col-md-offset-1">
                                <tool-header
                                    class="bg-white"
                                    title="Somatic Rearrangements - ${clinicalAnalysis?.interpretation?.id}">
                                </tool-header>
                                ${variants.length > 0 ? html`
                                    <variant-interpreter-rearrangement-grid
                                        .opencgaSession="${opencgaSession}"
                                        .clinicalAnalysis="${clinicalAnalysis}"
                                        .clinicalVariants="${variants}"
                                        .review="${true}">
                                    </variant-interpreter-rearrangement-grid>
                                ` : html`
                                    <div class="alert alert-warning">
                                        <b>Warning</b>: there are not selected rearrangements to display.
                                    </div>
                                `}
                            </div>
                        `;
                    },
                });
            } else {
                items.push(
                    {
                        id: "primary-findings",
                        name: "Primary Findings",
                        render: (clinicalAnalysis, active, opencgaSession) => {
                            // TODO: fix this line to get correct variants to display
                            const variants = this.clinicalAnalysis?.interpretation?.primaryFindings || [];
                            return html`
                                <div class="col-md-10 col-md-offset-1">
                                    <tool-header
                                        class="bg-white"
                                        title="Primary Findings - ${clinicalAnalysis?.interpretation?.id}">
                                    </tool-header>
                                    <variant-interpreter-review-primary
                                        .opencgaSession="${opencgaSession}"
                                        .clinicalAnalysis="${clinicalAnalysis}"
                                        .clinicalVariants="${variants}"
                                        .active="${active}"
                                        .gridConfig="${{
                                            somatic: false,
                                            variantTypes: ["SNV", "INDEL", "INSERTION", "DELETION"],
                                        }}"
                                        .settings="${this.settings.browsers["RD"]}">
                                    </variant-interpreter-review-primary>
                                </div>
                            `;
                        },
                    }
                );
            }
        }

        return {
            // title: "Interpretation review",
            display: {
                align: "center",
            },
            items: items,
        };
    }

}

customElements.define("variant-interpreter-review", VariantInterpreterReview);
