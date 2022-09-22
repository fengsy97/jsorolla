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
import "../../commons/analysis/opencga-analysis-tool.js";
import AnalysisUtils from "../../commons/analysis/analysis-utils";
import FormUtils from "../../commons/forms/form-utils";


export default class OpencgaIndividualRelatednessAnalysis extends LitElement {

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
                type: Object,
            },
            opencgaSession: {
                type: Object,
            },
            title: {
                type: String,
            }
        };
    }

    #init() {
        this.ANALYSIS_TOOL = "individual-relatedness";
        this.ANALYSIS_TITLE = "Individual Relatedness";
        this.ANALYSIS_DESCRIPTION = "Compute a score to quantify relatedness between samples";

        this.DEFAULT_TOOL_PARAMS = {
            minorAlleleFreq: "0.3", // TODO: double-check
        };
        // Make a deep copy to avoid modifying default object.
        this.toolParams = {
            ...this.DEFAULT_TOOL_PARAMS
        };

        this.config = this.getDefaultConfig();

    }

    check() {
        // TODO: Pending
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
            samples: this.toolParams.samples?.split(",") || [],
            individuals: this.toolParams.individual || "",
            minorAlleleFreq: this.toolParams.minorAlleleFreq
        };
        const params = {
            study: this.opencgaSession.study.fqn,
            ...AnalysisUtils.fillJobParams(this.toolParams, this.ANALYSIS_TOOL)
        };
        AnalysisUtils.submit(
            this.ANALYSIS_TITLE,
            this.opencgaSession.opencgaClient
                .variants()
                .runRelatedness(toolParams, params),
            this,
        );
    }

    onClear() {
        this.toolParams = this.DEFAULT_TOOLPARAMS;
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
                // QUESTION:
                //   The parameters needed discussed with Joaquin are: samples OR individuals
                //   Q. Can you mix them, i.e., 1 sample and 2 individuals
                // FIXME: If not possible to mix, manage disjunction
                title: "Input Parameters",
                elements: [
                    {
                        title: "Select individuals",
                        field: "individuals",
                        type: "custom",
                        display: {
                            // FIXME: change placeholder
                            placeholder: "e.g. IndividualId1,IndividualId2,...",
                            helpMessage: "Individual Ids",
                            render: toolParams => html `
                                <catalog-search-autocomplete
                                    .value="${toolParams?.individuals?.map(sample => sample.id).join(",")}"
                                    .resource="${"INDIVIDUAL"}"
                                    .opencgaSession="${this.opencgaSession}"
                                    .config="${{multiple: true, disabled: !!toolParams.samples}}"
                                    @filterChange="${e => this.onFieldChange(e, "individuals")}">
                                </catalog-search-autocomplete>
                            `,
                        },
                    },
                    {
                        title: "Select samples",
                        field: "samples",
                        type: "custom",
                        display: {
                            render: toolParams => html `
                                <catalog-search-autocomplete
                                    .value="${toolParams?.sample}"
                                    .resource="${"SAMPLE"}"
                                    .opencgaSession="${this.opencgaSession}"
                                    .config="${{multiple: true, disabled: !!toolParams.individuals}}"
                                    @filterChange="${e => this.onFieldChange(e, "samples")}">
                                </catalog-search-autocomplete>
                                `
                        },
                    },
                ],
            },
            {
                title: "Configuration Parameters",
                elements: [
                    {
                        title: "Select minor allele frequency",
                        field: "minorAlleleFreq",
                        type: "input-text",
                        display: {}
                    },
                ],
            }
        ];

        return AnalysisUtils.getAnalysisConfiguration(
            this.ANALYSIS_TOOL,
            this.ANALYSIS_TITLE,
            this.ANALYSIS_DESCRIPTION,
            params,
            this.check()
        );
    }

}

customElements.define("individual-relatedness-analysis", OpencgaIndividualRelatednessAnalysis);
