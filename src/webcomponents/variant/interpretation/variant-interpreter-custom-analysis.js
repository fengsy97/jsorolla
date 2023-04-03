/*
 * Copyright 2015-Present OpenCB
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
import "../../commons/view/detail-tabs.js";
import "./variant-interpreter-custom-analysis-overview.js";
import "../../clinical/analysis/hrdetect-analysis.js";
import "../../clinical/analysis/mutational-signature-analysis.js";

class VariantInterpreterCustomAnalysis extends LitElement {

    constructor() {
        super();

        this.#init();
    }

    createRenderRoot() {
        return this;
    }

    static get properties() {
        return {
            opencgaSession: {
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

    #init() {
        this._config = this.getDefaultConfig();
    }

    update(changedProperties) {
        if (changedProperties.has("opencgaSession") || changedProperties.has("settings")) {
            this._config = this.getDefaultConfig();
        }

        if (changedProperties.has("clinicalAnalysisId")) {
            this.clinicalAnalysisIdObserver();
        }

        super.update(changedProperties);
    }

    clinicalAnalysisIdObserver() {
        if (this.opencgaSession?.opencgaClient && this.clinicalAnalysisId) {
            this.opencgaSession.opencgaClient.clinical()
                .info(this.clinicalAnalysisId, {study: this.opencgaSession.study.fqn})
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
        // Check Project exists
        if (!this.opencgaSession.project) {
            return html`
                <div>
                    <h3><i class="fas fa-lock"></i> No public projects available to browse. Please login to continue</h3>
                </div>
            `;
        }

        // Check if no analysis have been configured --> display a warning message
        if (!this._config?.items || this._config.items.length === 0) {
            return html`
                <div class="col-md-6 col-md-offset-3" style="padding: 20px">
                    <div class="alert alert-warning" role="alert">
                        No Custom Analysis available.
                    </div>
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

        if (this.clinicalAnalysis) {
            const probandId = this.clinicalAnalysis.proband.id;
            const visibleTabs = new Set((this.settings?.tabs || []).map(tab => tab.id));

            if (visibleTabs.has("overview")) {
                items.push({
                    id: "overview",
                    active: true,
                    name: "Overview",
                    render: (clinicalAnalysis, active, opencgaSession) => {
                        return html`
                            <div class="col-md-8 col-md-offset-2">
                                <tool-header title="Analysis Overview" class="bg-white"></tool-header>
                                <variant-interpreter-custom-analysis-overview
                                    .opencgaSession="${opencgaSession}"
                                    .clinicalAnalysis="${clinicalAnalysis}"
                                    .settings="${this.settings}"
                                    .active="${active}">
                                </variant-interpreter-custom-analysis-overview>
                            </div>
                        `;
                    },
                });
            }

            if (visibleTabs.has("mutational-signature")) {
                items.push({
                    id: "mutational-signature",
                    name: "Mutational Signature",
                    render: (clinicalAnalysis, active, opencgaSession) => {
                        const somaticSample = clinicalAnalysis?.proband?.samples?.find(sample => sample.somatic);
                        return html`
                            <div class="col-md-8 col-md-offset-2">
                                <tool-header
                                    title="Mutational Signature - ${probandId} (${somaticSample?.id})"
                                    class="bg-white">
                                </tool-header>
                                <mutational-signature-analysis
                                    .toolParams="${{query: {sample: somaticSample?.id}}}"
                                    .opencgaSession="${opencgaSession}"
                                    .active="${active}">
                                </mutational-signature-analysis>
                            </div>
                        `;
                    },
                });
            }
            if (visibleTabs.has("hrdetect")) {
                items.push({
                    id: "hrdetect",
                    name: "HRDetect",
                    render: (clinicalAnalysis, active, opencgaSession) => {
                        const somaticSample = clinicalAnalysis?.proband?.samples?.find(sample => sample.somatic);
                        return html`
                            <div class="col-md-8 col-md-offset-2">
                                <tool-header
                                    title="HRDetect - ${probandId} (${somaticSample?.id})"
                                    class="bg-white">
                                </tool-header>
                                <hrdetect-analysis
                                    .toolParams="${{query: {sample: somaticSample?.id}}}"
                                    .opencgaSession="${opencgaSession}"
                                    .active="${active}">
                                </hrdetect-analysis>
                            </div>
                        `;
                    },
                });
            }
        }

        return {
            display: {
                align: "center"
            },
            items: items,
        };
    }

}

customElements.define("variant-interpreter-custom-analysis", VariantInterpreterCustomAnalysis);
