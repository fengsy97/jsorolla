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
import FormUtils from "../../commons/forms/form-utils.js";
import AnalysisUtils from "../../commons/analysis/analysis-utils.js";
import UtilsNew from "../../../core/utils-new.js";
import "../../commons/forms/data-form.js";
import "../../commons/forms/select-field-filter.js";
import "../../commons/view/signature-view.js";

export default class MutationalSignatureAnalysis extends LitElement {

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
            active: {
                type: Boolean,
            },
        };
    }

    #init() {
        this.ANALYSIS_TOOL = "mutational-signature";
        this.ANALYSIS_TITLE = "Mutational Signature";
        this.ANALYSIS_DESCRIPTION = "Executes a mutational signature analysis job";

        this.DEFAULT_TOOLPARAMS = {
            fitMethod: "FitMS",
            fitSigVersion: "RefSigv2",
            fitThresholdPerc: "5",
            fitThresholdPval: "0.05",
            fitMaxRareSigs: "1",
            fitNBoot: "200"
        };
        this.toolParams = {
            ...UtilsNew.objectClone(this.DEFAULT_TOOLPARAMS)
        };

        this.REFSIGV1_ORGANS = [
            "Biliary", "Bladder", "Bone_SoftTissue", "Breast", "Cervix", "CNS",
            "Colorectal", "Esophagus", "Head_neck", "Kidney", "Liver", "Lung",
            "Lymphoid", "Ovary", "Pancreas", "Prostate", "Skin", "Stomach", "Uterus"];
        this.REFSIGV2_ORGANS = [
            "Biliary", "Bladder", "Bone_SoftTissue", "Breast", "CNS", "Colorectal",
            "Esophagus", "Head_neck", "Kidney", "Liver", "Lung", "Lymphoid", "NET",
            "Oral_Oropharyngeal", "Ovary", "Pancreas", "Prostate", "Skin", "Stomach", "Uterus"];

        this.query = {};
        this.active = true;
        this.selectedSample = null;
        this.config = this.getDefaultConfig();
    }

    firstUpdated(changedProperties) {
        if (changedProperties.has("toolParams")) {
            // Save the initial 'query'. Needed for onClear() method
            this.query = this.toolParams.query || {};
        }
    }

    update(changedProperties) {
        if (changedProperties.has("toolParams")) {
            this.toolParams = {
                ...UtilsNew.objectClone(this.DEFAULT_TOOLPARAMS),
                ...this.toolParams,
            };
            this.config = this.getDefaultConfig();
            this.onChangeSample();
        }
        super.update(changedProperties);
    }

    check() {
        return !!this.toolParams.organ;
    }

    onFieldChange(e, field) {
        const param = field || e.detail.param;
        if (param) {
            this.toolParams = FormUtils.createObject(this.toolParams, param, e.detail.value);
        }
        // Enable this only when a dynamic property in the config can change
        this.config = this.getDefaultConfig();
        this.requestUpdate();
        // this.onChangeSample();
    }

    onSubmit() {
        const toolParams = {
            fitId: this.toolParams.fitId || `fit-${UtilsNew.getDatetime()}`,
            fitMethod: this.toolParams.fitMethod,
            fitSigVersion: this.toolParams.fitSigVersion,
            fitOrgan: this.toolParams.fitOrgan,
            fitMaxRareSigs: this.toolParams.fitMaxRareSigs,
            fitNBoot: this.toolParams.fitNBoot,
            fitThresholdPerc: this.toolParams.fitThresholdPerc,
            fitThresholdPval: this.toolParams.fitThresholdPval,
        };

        // Check if we have provided an existing signature list
        if (this.toolParams.signature) {
            toolParams.skip = "catalogue";
            toolParams.id = this.toolParams.signature;
            toolParams.sample = this.toolParams.query.sample;
        } else {
            toolParams.id = this.toolParams.id || `signature-${UtilsNew.getDatetime()}`;
            toolParams.description = this.toolParams.description || "";
            toolParams.query = JSON.stringify(this.toolParams.query);
        }

        const params = {
            study: this.opencgaSession.study.fqn,
            ...AnalysisUtils.fillJobParams(this.toolParams, this.ANALYSIS_TOOL)
        };

        AnalysisUtils.submit(
            this.ANALYSIS_TITLE,
            this.opencgaSession.opencgaClient.variants()
                .runMutationalSignature(toolParams, params),
            this
        );
    }

    onClear() {
        this.toolParams = {
            ...UtilsNew.objectClone(this.DEFAULT_TOOLPARAMS),
            query: {
                ...this.query
            }
        };
        this.config = this.getDefaultConfig();
    }

    onChangeSample() {
        if (this.toolParams?.query?.sample && this.active) {
            if (this.toolParams.query.sample !== this.selectedSample?.id) {
                this.opencgaSession.opencgaClient.samples()
                    .search({
                        id: this.toolParams.query.sample,
                        include: "id,qualityControl.variant.signatures",
                        study: this.opencgaSession.study.fqn,
                    })
                    .then(response => {
                        this.selectedSample = response?.responses?.[0]?.results?.[0] || null;
                        this.toolParams.signature = null; // Force to remove selected signature
                        this.config = this.getDefaultConfig();
                        this.requestUpdate();
                    });
            }
        } else {
            this.selectedSample = null;
            this.toolParams.signature = null; // Force to remove selected signature
            this.config = this.getDefaultConfig();
            this.requestUpdate();
        }
    }

    generateSignaturesDropdown() {
        const signatures = this.selectedSample?.qualityControl?.variant?.signatures || [];

        if (signatures.length > 0) {
            const signaturesbyType = {};
            signatures.forEach(signature => {
                const type = signature.type?.toUpperCase();
                if (!signaturesbyType[type]) {
                    signaturesbyType[type] = [];
                }
                signaturesbyType[type].push(signature.id);
            });

            return Object.keys(signaturesbyType)
                .map(type => {
                    return {
                        id: type,
                        fields: signaturesbyType[type],
                    };
                });

        } else {
            return [];
        }
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
        const signatures = this.selectedSample?.qualityControl?.variant?.signatures || [];
        const signaturesQuery = AnalysisUtils.getVariantQueryConfiguration("query.", [], this.opencgaSession, this.onFieldChange.bind(this));
        const params = [
            {
                title: "Input Parameters",
                elements: [
                    {
                        title: "Sample ID",
                        field: "query.sample",
                        type: "custom",
                        display: {
                            render: sampleId => html`
                                <catalog-search-autocomplete
                                    .value="${sampleId}"
                                    .resource="${"SAMPLE"}"
                                    .opencgaSession="${this.opencgaSession}"
                                    .config="${{multiple: false, disabled: !!this.query.sample}}"
                                    @filterChange="${e => this.onFieldChange(e, "query.sample")}">
                                </catalog-search-autocomplete>
                            `,
                        },
                    },
                    {
                        title: "Signature",
                        field: "signature",
                        type: "custom",
                        display: {
                            visible: signatures.length > 0,
                            render: signature => html`
                                <select-field-filter
                                    .data="${this.generateSignaturesDropdown()}"
                                    .value=${signature}
                                    ?multiple="${false}"
                                    ?liveSearch=${false}
                                    @filterChange="${e => this.onFieldChange(e, "signature")}">
                                </select-field-filter>
                            `,
                        },
                    },
                    {
                        title: "Signature Query",
                        field: "signature",
                        type: "custom",
                        display: {
                            visible: signatures.length > 0 && !!this.toolParams?.signature,
                            render: id => {
                                const signature = signatures.find(item => item.id === id);
                                if (signature?.query) {
                                    return Object.keys(signature.query).map(key => html`
                                        <span class="badge">
                                            ${key}: ${signature.query[key]}
                                        </span>
                                    `);
                                }
                                return "-";
                            },
                        },
                    },
                    {
                        title: "Signature Plot",
                        field: "signature",
                        type: "custom",
                        display: {
                            visible: signatures.length > 0 && !!this.toolParams?.signature,
                            render: id => {
                                const signature = signatures.find(item => item.id === id);
                                return html`
                                    <signature-view
                                        .signature="${signature}"
                                        .mode="${signature.type.toUpperCase() === "SV" ? "SV" : "SBS"}"
                                        ?active="${true}">
                                    </signature-view>
                                `;
                            },
                        },
                    },
                    {
                        title: "Signature ID",
                        field: "id",
                        type: "input-text",
                        display: {
                            visible: signatures.length === 0,
                            placeholder: `signature-${UtilsNew.getDatetime()}`,
                        },
                    },
                    {
                        title: "Signature Description",
                        field: "description",
                        type: "input-text",
                        display: {
                            visible: signatures.length === 0,
                        },
                    },
                    ...(signatures.length === 0 ? signaturesQuery : []),
                ],
            },
            {
                title: "Fitting Parameters",
                elements: [
                    {
                        title: "Fit ID",
                        field: "fitId",
                        type: "input-text",
                        display: {
                            placeholder: `fit-${UtilsNew.getDatetime()}`,
                        },
                    },
                    {
                        title: "Fit Method",
                        field: "fitMethod",
                        type: "select",
                        allowedValues: ["Fit", "FitMS"],
                    },
                    {
                        title: "Sig Version",
                        field: "fitSigVersion",
                        type: "select",
                        allowedValues: ["COSMICv2", "COSMICv3.2", "RefSigv1", "RefSigv2"],
                    },
                    {
                        title: "Organ",
                        field: "fitOrgan",
                        type: "select",
                        allowedValues: this.toolParams.fitSigVersion === "RefSigv2" ? this.REFSIGV2_ORGANS : this.REFSIGV1_ORGANS,
                        display: {
                            disabled: this.toolParams.fitSigVersion !== "RefSigv1" && this.toolParams.fitSigVersion !== "RefSigv2",
                            help: {
                                text: "Only available for RefSigv1 or RefSigv2",
                            },
                        },
                    },
                    {
                        title: "thresholdperc",
                        field: "fitThresholdPerc",
                        type: "input-text",
                    },
                    {
                        title: "thresholdpval",
                        field: "fitThresholdPval",
                        type: "input-text",
                    },
                    {
                        title: "maxraresigs",
                        field: "fitMaxRareSigs",
                        type: "input-text",
                    },
                    {
                        title: "nboot",
                        field: "fitNBoot",
                        type: "input-text",
                    },
                ]
            }
        ];

        return AnalysisUtils.getAnalysisConfiguration(
            this.ANALYSIS_TOOL,
            this.title ?? this.ANALYSIS_TITLE,
            this.ANALYSIS_DESCRIPTION,
            params,
            this.check()
        );
    }

}

customElements.define("mutational-signature-analysis", MutationalSignatureAnalysis);
