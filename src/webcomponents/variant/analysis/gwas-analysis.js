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
import AnalysisUtils from "../../commons/analysis/analysis-utils.js";
import FormUtils from "../../commons/forms/form-utils.js";
import UtilsNew from "../../../core/utilsNew.js";
import "../../commons/forms/data-form.js";
import "../../commons/filters/catalog-search-autocomplete.js";


export default class GwasAnalysis extends LitElement {

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
                type: Object,
            },
            toolParams: {
                type: Object,
            },
            title: {
                type: String,
            },
        };
    }

    #init() {
        this.ANALYSIS_TOOL = "gwas";
        this.ANALYSIS_TITLE = "GWAS";

        this.DEFAULT_TOOLPARAMS = {};
        // CAUTION!: spread operator makes a shallow copy if objects,
        //  arrays or functions are nested ( not a deep copy but a reference)
        // Make a deep copy to avoid modifying default object.
        this.toolParams = {
            ...UtilsNew.objectClone(this.DEFAULT_TOOLPARAMS),
        };

        this.config = this.getDefaultConfig();
    }

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
            controlCohort: this.toolParams.controlCohort || "",
            controlCohortSamples: this.toolParams.controlCohortSamples?.split(",") || [],
            controlCohortSamplesAnnotation: this.toolParams.controlCohortSamplesAnnotation,
            caseCohort: this.toolParams.caseCohort || "",
            caseCohortSamples: this.toolParams.caseCohortSamples?.split(",") || [],
            caseCohortSamplesAnnotation: this.toolParams.caseCohortSamplesAnnotation,
            mode: this.toolParams.mode,
            fisherMode: this.toolParams.fisherMode,
            index: this.toolParams.index ?? false,
            indexScoreId: this.toolParams.indexScoreId,
            phenotype: this.toolParams.phenotype,
        };
        const params = {
            study: this.opencgaSession.study.fqn,
            ...AnalysisUtils.fillJobParams(this.toolParams, this.ANALYSIS_TOOL),
        };
        AnalysisUtils.submit(
            this.ANALYSIS_TITLE,
            this.opencgaSession.opencgaClient.variants().runGwas(toolParams, params),
            this,
        );
    }

    onClear() {
        this.toolParams = {
            ...UtilsNew.objectClone(this.DEFAULT_TOOLPARAMS),
        };
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
                title: "Case Cohort Parameters",
                elements: [
                    {
                        title: "Case Cohort",
                        type: "custom",
                        display: {
                            render: toolParams => html`
                                <catalog-search-autocomplete
                                    .value="${toolParams?.caseCohort}"
                                    .resource="${"COHORT"}"
                                    .opencgaSession="${this.opencgaSession}"
                                    .config="${{multiple: false}}"
                                    @filterChange="${e => this.onFieldChange(e, "caseCohort")}">
                                </catalog-search-autocomplete>
                            `,
                        },
                    },
                    {
                        title: "Case Cohort Samples",
                        type: "custom",
                        display: {
                            render: toolParams => html`
                                <catalog-search-autocomplete
                                    .value="${toolParams?.caseCohortSamples}"
                                    .resource="${"SAMPLE"}"
                                    .query="${{include: "id,individualId", cohortIds: this.toolParams.caseCohort}}"
                                    .opencgaSession="${this.opencgaSession}"
                                    .config="${{multiple: true, disabled: !this.toolParams.caseCohort}}"
                                    @filterChange="${e => this.onFieldChange(e, "caseCohortSamples")}">
                                </catalog-search-autocomplete>
                            `,
                        },

                    },
                    {
                        title: "Case Cohort Sample Annotation",
                        field: "caseCohortSamplesAnnotation",
                        type: "input-text",
                    }
                ]
            },
            {
                title: "Control Cohort Parameters",
                elements: [
                    {
                        title: "Control Cohort",
                        type: "custom",
                        display: {
                            render: toolParams => html`
                                <catalog-search-autocomplete
                                    .value="${toolParams?.controlCohort}"
                                    .resource="${"COHORT"}"
                                    .opencgaSession="${this.opencgaSession}"
                                    .config="${{multiple: false}}"
                                    @filterChange="${e => this.onFieldChange(e, "controlCohort")}">
                                </catalog-search-autocomplete>
                            `,
                        },
                    },
                    {
                        title: "Control Cohort Samples",
                        type: "custom",
                        display: {
                            render: toolParams => html`
                                <catalog-search-autocomplete
                                    .value="${toolParams?.controlCohortSamples}"
                                    .resource="${"SAMPLE"}"
                                    .query="${{include: "id,individualId", cohortIds: this.toolParams.controlCohort}}"
                                    .opencgaSession="${this.opencgaSession}"
                                    .config="${{multiple: true, disabled: !this.toolParams.controlCohort}}"
                                    @filterChange="${e => this.onFieldChange(e, "controlCohortSamples")}">
                                </catalog-search-autocomplete>
                            `,
                        },
                    },
                    {
                        title: "Control Cohort Sample Annotation",
                        field: "controlCohortSamplesAnnotation",
                        type: "input-text",
                    }
                ]
            },
            {
                title: "Configuration Parameters",
                elements: [
                    {
                        title: "Association test",
                        field: "method",
                        type: "select",
                        // defaultValue: "FISHER_TEST",
                        allowedValues: ["FISHER_TEST", "CHI_SQUARE_TEST"],
                    },
                    {
                        title: "Fisher mode",
                        field: "fisherMode",
                        type: "select",
                        // defaultValue: "GREATER",
                        allowedValues: ["GREATER", "LESS", "TWO_SIDED"],
                        display: {
                            disabled: this.toolParams?.method !== "FISHER_TEST",
                        },
                    },
                    {
                        title: "Phenotype",
                        field: "phenotype",
                        type: "input-text",
                    },
                    {
                        title: "Index results",
                        field: "index",
                        type: "checkbox",
                    },
                    {
                        title: "Index score id",
                        field: "indexScoreId",
                        type: "input-text",
                    }
                ]
            }
        ];

        return AnalysisUtils.getAnalysisConfiguration(
            this.ANALYSIS_TOOL,
            this.title ?? this.ANALYSIS_TITLE,
            "Executes a GWAS analysis job",
            params,
            this.check()
        );
    }

}

customElements.define("gwas-analysis", GwasAnalysis);