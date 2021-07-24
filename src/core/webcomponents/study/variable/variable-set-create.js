/**
 * Copyright 2015-2021 OpenCB
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
import "./variable-list-update.js";
import FormUtils from "../../../form-utils.js";

export default class VariableSetCreate extends LitElement {

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
                type: Object
            },
            config: {
                type: Object
            }
        };
    }

    _init() {
        this.variableSet = {
            variables: [],
            unique: true
        };
        this.variable = {};
    }

    connectedCallback() {
        super.connectedCallback();
        this._config = {...this.getDefaultConfig(), ...this.config};
    }

    refreshForm() {
        // When using data-form we need to update config object and render again
        this._config = {...this.getDefaultConfig(), ...this.config};
        this.requestUpdate();
    }

    onFieldChangeVariableSet(e) {
        e.stopPropagation();
        const field = e.detail.param;
        console.log("Field:", field);
        if (e.detail.value) {
            switch (e.detail.param) {
                case "id":
                case "name":
                case "unique":
                case "confidential":
                case "description":
                    this.variableSet = {
                        ...this.variableSet,
                        [field]: e.detail.value
                    };
                    break;
                case "entities":
                    const entities = e.detail.value ? e.detail.value.split(",") : [];
                    this.variableSet = {
                        ...this.variableSet,
                        [field]: entities
                    };
                    break;
            }
        } else {
            delete this.variableSet[field];
        }
    }

    // Option2 : Event for valiations ... this dispatch when user out the input field.
    onBlurChange(e) {
        e.stopPropagation();
        const field = e.detail.param;
        console.log("VariableSet Data", field, e.detail.value);
        // switch (e.detail.param) {
        //     case "id":
        //     case "name":
        //     case "unique":
        //     case "confidential":
        //     case "description":
        //     case "entities":
        //         console.log("Blur Event:", e.detail.value);
        //         // if (field === "id") {
        //         //     this.refreshForm();
        //         // }
        //         console.log("VariableSet Data", this.variableSet);
        //         this.requestUpdate();
        // }
    }


    getDefaultConfig() {
        return {
            title: "Edit",
            icon: "fas fa-edit",
            type: "form",
            buttons: {
                show: true,
                top: true,
                classes: "pull-right",
                cancelText: "Cancel",
                okText: "Save"
            },
            display: {
                style: "margin: 10px",
                labelWidth: 3,
                labelAlign: "right",
                defaultLayout: "horizontal",
                defaultValue: "",
                help: {
                    mode: "block",
                    // icon: "fa fa-lock",
                }
            },
            sections: [
                {
                    title: "General Information",
                    elements: [
                        {
                            name: "Id",
                            field: "id",
                            type: "input-text",
                            required: "required",
                            display: {
                                placeholder: "Add a short ID...",
                                help: {
                                    // mode: "block",
                                    icon: "fa fa-lock",
                                    text: "short variableSet id"
                                },
                                validation: {
                                    message: "Please enter more that 3 character",
                                    validate: variable => variable?.id?.length > 4 || variable?.id === undefined || variable?.id === ""
                                    // TODO: this work if we update the config every change
                                    // to re-evaluate or refresh the form applying the validation.
                                    // validate: variable => variable?.id?.length > 4
                                }
                            }
                        },
                        {
                            name: "Name",
                            field: "name",
                            type: "input-text",
                            required: "required",
                            display: {
                                placeholder: "Name ...",
                                help: {
                                    text: "short name variable"
                                },
                            }
                        },
                        {
                            name: "Entities",
                            field: "entities",
                            type: "select",
                            allowedValues: ["SAMPLE", "COHORT", "INDIVIDUAL", "FAMILY", "FILE"],
                            multiple: true,
                            display: {
                                placeholder: "select a entity..."
                            }
                        },
                        {
                            name: "Unique",
                            field: "unique",
                            type: "checkbox",
                            required: true
                        },
                        {
                            name: "Confidential",
                            field: "confidential",
                            type: "checkbox",
                            checked: false
                        },
                        {
                            name: "Description",
                            field: "description",
                            type: "input-text",
                            required: true,
                            display: {
                                rows: 3,
                                placeholder: "variable description..."
                            }
                        }
                    ]
                },
                {
                    title: "Variables",
                    elements: [
                        {
                            field: "variables",
                            type: "custom",
                            display: {
                                layout: "vertical",
                                defaultLayout: "vertical",
                                width: 12,
                                style: "padding-left: 0px",
                                render: () => html`
                                    <variable-list-update
                                        .variables="${this.variableSet?.variables}"
                                        @changeVariables="${e => this.onSyncVariables(e)}">
                                    </variable-list-update>`
                            }
                        },
                    ]
                }
            ]
        };
    }

    async onSyncVariables(e) {
        console.log("...Sync variables list to the variableSet", e.detail.value);
        this.variableSet = {...this.variableSet, variables: e.detail.value};
        console.log("variableSet synced: ", this.variableSet);
        e.stopPropagation();
    }

    onClear(e) {
        console.log("Clear Form");
        Swal.fire({
            title: "Are you sure to clear?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, delete it!",
            reverseButtons: true
        }).then(result => {
            if (result.isConfirmed) {
                this.variableSet = {};
                this.requestUpdate();
                Swal.fire(
                    "Cleaned!",
                    "The fields has been cleaned.",
                    "success"
                );
            }
        });
    }

    async saveData() {
        // TODO: review requestUpdate();
        try {
            await this.requestUpdate();
            const res = await this.opencgaSession.opencgaClient.studies()
                .updateVariableSets(this.opencgaSession.study.fqn, this.variableSet, {action: "ADD"});
            this.variableSet = {
                variables: [],
                unique: true
            };
            FormUtils.showAlert(
                "New VariableSet",
                "VariableSet save correctly",
                "success"
            );
        } catch (err) {
            FormUtils.showAlert(
                "New VariableSet",
                `Could not save variableSet ${err}`,
                "error"
            );
        } finally {
            await this.requestUpdate();
        }
    }

    onSubmit(e) {
        Swal.fire({
            title: "Are you sure to create?",
            text: "You won't be able to modify this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, save it!",
            reverseButtons: true
        }).then(result => {
            if (result.isConfirmed) {
                this.saveData();
            }
        });
    }

    sampleVariables() {
        return [
            {
                "id": "typeCount",
                "name": "typeCount",
                "category": "",
                "type": "MAP_INTEGER",
                "required": false,
                "multiValue": false,
                "allowedValues": [],
                "rank": 7,
                "dependsOn": "",
                "description": "Variants count group by type. e.g. SNP, INDEL, MNP, SNV, ...",
                "attributes": {}
            },
            {
                "id": "variantCount",
                "name": "variantCount",
                "category": "",
                "type": "INTEGER",
                "required": false,
                "multiValue": false,
                "allowedValues": [],
                "rank": 0,
                "dependsOn": "",
                "description": "Number of variants in the variant set",
                "attributes": {}
            },
            {
                "id": "hsMetricsReport",
                "name": "Hs metrics report",
                "category": "",
                "type": "OBJECT",
                "required": false,
                "multiValue": false,
                "allowedValues": [],
                "rank": 10,
                "dependsOn": "",
                "description": "Hs metrics report (from the picard/CollecHsMetrics command)",
                "variables": [
                    {
                        "id": "onBaitVsSelected",
                        "name": "On bait vs selected",
                        "type": "DOUBLE",
                        "required": false,
                        "multiValue": false,
                        "allowedValues": [],
                        "rank": 24,
                        "description": "The percentage of on+near bait bases that are on as opposed to near"
                    },
                    {
                        "id": "minTargetCoverage",
                        "name": "Min target coverage",
                        "type": "DOUBLE",
                        "required": false,
                        "multiValue": false,
                        "allowedValues": [],
                        "rank": 23,
                        "description": "The minimum coverage of targets"
                    }
                ]
            },
            {
                "id": "fastQcReport",
                "name": "FastQC report",
                "category": "",
                "type": "OBJECT",
                "required": false,
                "multiValue": false,
                "allowedValues": [],
                "rank": 8,
                "dependsOn": "",
                "description": "FastQC report (from the FastQC tool)",
                "variables": [],
                "attributes": {}
            },
            {
                "id": "mendelianErrorsReport",
                "name": "Mendelian errors report",
                "category": "",
                "type": "OBJECT",
                "required": false,
                "multiValue": false,
                "allowedValues": [],
                "rank": 7,
                "dependsOn": "",
                "description": "Mendelian errors report",
                "variables": [
                    {
                        "id": "numErrors",
                        "name": "Total number of errors",
                        "type": "INTEGER",
                        "required": false,
                        "multiValue": false,
                        "allowedValues": [],
                        "rank": 0,
                        "description": "Total number of errors"
                    },
                    {
                        "id": "chromAggregation",
                        "name": "Aggregation per chromosome",
                        "type": "OBJECT",
                        "required": false,
                        "multiValue": false,
                        "allowedValues": [],
                        "rank": 2,
                        "description": "Aggregation per chromosome",
                        "variables": [
                            {
                                "id": "codeAggregation",
                                "name": "Aggregation per error code",
                                "type": "MAP_INTEGER",
                                "required": false,
                                "multiValue": false,
                                "allowedValues": [],
                                "rank": 2,
                                "description": "Aggregation per error code for that chromosome"
                            },
                            {
                                "id": "numErrors",
                                "name": "Total number of errors",
                                "type": "STRING",
                                "required": false,
                                "multiValue": false,
                                "allowedValues": [],
                                "rank": 1,
                                "description": "Total number of errors"
                            },
                            {
                                "id": "chromosome",
                                "name": "chromosome",
                                "type": "STRING",
                                "required": false,
                                "multiValue": false,
                                "allowedValues": [],
                                "rank": 0,
                                "description": "Chromosome"
                            }
                        ]
                    },
                ]
            }
        ];
    }

    render() {
        return html `
            <data-form
                .data=${this.variableSet}
                .config="${this._config}"
                @fieldChange="${e => this.onFieldChangeVariableSet(e)}"
                @blurChange="${e => this.onBlurChange(e)}"
                @clear="${e => this.onClear(e)}"
                @submit="${e => this.onSubmit(e)}">
            </data-form>`;
    }

}

customElements.define("variable-set-create", VariableSetCreate);