/* select
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
import AnalysisUtils from "../../commons/analysis/analysis-utils.js";
import FormUtils from "../../commons/forms/form-utils.js";
import "../../commons/forms/data-form.js";


export default class CohortVariantStatsAnalysis extends LitElement {

    constructor() {
        super();

        this.#init();
    }

    createRenderRoot() {
        return this;
    }

    static get properties() {
        return {
            toolParams: {
                type: Object
            },
            opencgaSession: {
                type: Object
            },
            title: {
                type: String
            },
        };
    }

    #init() {
        this.ANALYSIS_TOOL = "cohort-variant-stats";
        this.ANALYSIS_TITLE = "Cohort Variant Stats";

        this.DEFAULT_TOOLPARAMS = {};
        // Make a deep copy to avoid modifying default object.
        this.toolParams = {...this.DEFAULT_TOOLPARAMS};

        this.config = this.getDefaultConfig();
    }

    // update(changedProperties) {
    //     super.update(changedProperties);
    // }

    check() {
        return !!this.toolParams.cohort || !!this.toolParams.sample;
    }

    onFieldChange(e, field) {
        const param = field || e.detail.param;
        if (param) {
            this.toolParams = FormUtils.createObject(this.toolParams, param, e.detail.value);
        }
        // Enable this only when a dynamic property in the config can change
        this.config = this.getDefaultConfig();
        this.requestUpdate();
    }

    onSubmit() {
        const toolParams = {
            cohort: this.toolParams.cohort || "",
            samples: this.toolParams.samples?.split(",") || [],
            index: this.toolParams.index ?? false,
        };
        const params = {
            study: this.opencgaSession.study.fqn,
            ...AnalysisUtils.fillJobParams(this.toolParams, this.ANALYSIS_TOOL)
        };
        AnalysisUtils.submit(
            this.ANALYSIS_TITLE,
            this.opencgaSession.opencgaClient.variants().runCohortStats(toolParams, params),
            this
        );
    }

    onClear() {
        this.toolParams = {...this.DEFAULT_TOOLPARAMS};
        this.config = this.getDefaultConfig();
        this.requestUpdate();
    }

    render() {
        return html`
            <data-form
                .data="${this.toolParams}"
                .config="${this.config}"
                @fieldChange="${e => this.onFieldChange(e)}"
                @clear="${this.onClear}"
                @submit="${this.onSubmit}">
            </data-form>
        `;
    }

    getDefaultConfig() {
        const params = [
            {
                title: "Input Cohort",
                elements: [
                    {
                        title: "Cohort ID",
                        type: "custom",
                        display: {
                            render: toolParams => {
                                return html`
                                    <catalog-search-autocomplete
                                        .value="${toolParams?.cohort}"
                                        .resource="${"COHORT"}"
                                        .opencgaSession="${this.opencgaSession}"
                                        .config="${{multiple: false, disabled: !!toolParams.samples}}"
                                        @filterChange="${e => this.onFieldChange(e, "cohort")}">
                                    </catalog-search-autocomplete>`;
                            },
                            help: {
                                text: "Cohort Variant stats will be calculated for the cohort selected",
                            }
                        },
                    },
                    {
                        title: "Sample ID",
                        type: "custom",
                        display: {
                            render: toolParams => {
                                return html`
                                    <catalog-search-autocomplete
                                        .value="${toolParams?.sample}"
                                        .resource="${"SAMPLE"}"
                                        .opencgaSession="${this.opencgaSession}"
                                        .config="${{multiple: true, disabled: !!toolParams.cohort}}"
                                        @filterChange="${e => this.onFieldChange(e, "samples")}">
                                    </catalog-search-autocomplete>`;
                            },
                            help: {
                                text: "Select sample to run the analysis",
                            }
                        },
                    },
                ]
            },
            {
                title: "Configuration Parameters",
                elements: [
                    {
                        title: "Index",
                        field: "index",
                        type: "checkbox",
                        display: {
                        },
                    },
                ]
            }
        ];

        return AnalysisUtils.getAnalysisConfiguration(
            this.ANALYSIS_TOOL,
            this.title ?? this.ANALYSIS_TITLE,
            "Executes a mutational signature analysis job",
            params,
            this.check()
        );
    }

}

customElements.define("cohort-variant-stats-analysis", CohortVariantStatsAnalysis);
