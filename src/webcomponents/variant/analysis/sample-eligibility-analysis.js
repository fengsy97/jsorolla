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

export default class SampleEligibilityAnalysis extends LitElement {

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
        this.ANALYSIS_TOOL = "sample-eligibility";
        this.ANALYSIS_TITLE = "Sample Eligibility";

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
            cohortId: this.toolParams.cohortId || "",
            query: this.toolParams.query || "",
            index: this.toolParams.index ?? false,
        };
        const params = {
            study: this.opencgaSession.study.fqn,
            ...AnalysisUtils.fillJobParams(this.toolParams, this.ANALYSIS_TOOL),
        };
        AnalysisUtils.submit(
            this.ANALYSIS_TITLE,
            this.opencgaSession.opencgaClient.variants().runSampleEligibility(toolParams, params),
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
                title: "Input Parameters",
                elements: [
                    {
                        title: "Cohort ID",
                        field: "cohortId",
                        type: "input-text",
                        display: {
                            help: {
                                text: "ID for the cohort to be created if index",
                            },
                        },
                    },
                    {
                        title: "Query",
                        field: "query",
                        type: "input-text",
                        display: {
                            help: {
                                text: "Election query. e.g. ((gene=A AND ct=lof) AND (NOT (gene=B AND ct=lof)))",
                            },
                        },
                    },
                    {
                        title: "Index",
                        field: "index",
                        type: "checkbox",
                        display: {
                            help: {
                                text: "Create a cohort with the resulting set of samples (if any)",
                            },
                        },
                    },
                ],
            },
        ];

        return AnalysisUtils.getAnalysisConfiguration(
            this.ANALYSIS_TOOL,
            this.title ?? this.ANALYSIS_TITLE,
            "Executes a Sample Eligibility analysis job",
            params,
            this.check()
        );
    }

}

customElements.define("sample-eligibility-analysis", SampleEligibilityAnalysis);