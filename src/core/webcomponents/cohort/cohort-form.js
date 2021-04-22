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

import { LitElement, html } from "/web_modules/lit-element.js";
import UtilsNew from "./../../utilsNew.js";
import "../commons/tool-header.js";

export default class CohortForm extends LitElement {

    static CREATE_MODE = "create";
    static UPDATE_MODE = "update";

    constructor() {
        super();
        this._init();
    }

    createRenderRoot() {
        return this;
    }

    static get properties() {
        return {
            studyId: {
                type: String
            },
            study: {
                type: Object
            },
            mode: {
                type: String
            },
            opencgaSession: {
                type: Object
            },
            config: {
                type: Object
            }
        };
    }

    _init() {
        this._prefix = UtilsNew.randomString(8);
        this.cohort = {}
    }

    connectedCallback() {
        super.connectedCallback();
        this._config = { ...this.getDefaultConfig(), ...this.config };
    }

    onFieldChange(e) {
        switch (e.detail.param) {
            case "id":
            case "name":
            case "description":
                this.Cohort[e.detail.param] = e.detail.value;
                break;
        }
    }

    dispatchSessionUpdateRequest() {
        this.dispatchEvent(new CustomEvent("sessionUpdateRequest", {
            detail: {
            },
            bubbles: true,
            composed: true
        }));
    }


    getDefaultConfig() {
        return {
            title: "Edit",
            icon: "fas fa-edit",
            type: "form",
            buttons: {
                show: true,
                cancelText: "Cancel",
                okText: this.mode === CohortForm.CREATE_MODE ? "Save" : "Update"
            },
            display: {
                // width: "8",
                style: "margin: 10px",
                labelWidth: 3,
                labelAlign: "right",
                defaultLayout: "horizontal",
                defaultValue: "",
                help: {
                    mode: "block", // icon
                }
            },
            sections: [
                {
                    elements: [
                        {
                            name: "Cohort ID",
                            field: "id",
                            type: "input-text",
                            required: true,
                            display: {
                                placeholder: "Add a short ID...",
                                disabled: this.mode === CohortForm.UPDATE_MODE,
                                help: {
                                    text: "short Sample id for thehis as;lsal"
                                },
                                validation: {

                                }
                            },
                        },
                        {
                            name: "Cohort Type",
                            field: "cohort",
                            type: "select",
                            allowedValues: ["CASE_CONTROL","CASE_SET","CONTROL_SET","PAIRED","PAIRED_TUMOR","AGGREGATE","TIME_SERIES","FAMILY","TRIO","COLLECTION"],
                            display: {}
                        },
                        // {
                        //     name: "Creation Date",
                        //     field: "creationDate",
                        //     type: "input-text",
                        //     display: {
                        //         placeholder: "Sample name...",
                        //         visible: this.mode === CohortForm.UPDATE_MODE,
                        //         disabled: this.mode === CohortForm.UPDATE_MODE
                        //     }
                        // },
                        {
                            name: "Description",
                            field: "description",
                            type: "input-text",
                            display: {
                                placeholder: "e.g. Homo sapiens, ...",
                            }
                        },
                        {
                            name: "Num. Samples",
                            field: "numSamples",
                            type: "input-text",
                            display: {
                                placeholder: "e.g. GRCh38",
                            }
                        },
                        {
                            name: "Status name",
                            field: "status.name",
                            type: "input-text",
                            display: {
                                rows: 3,
                                placeholder: "Sample description...",
                            }
                        },
                        {
                            name: "Status Description",
                            field: "status.description",
                            type: "input-text",
                            display: {
                                rows: 3,
                                placeholder: "Sample description...",
                            }
                        },
                    ]
                }
            ]
        }
    }

    saveCohort() {
        // this.opencgaSession.opencgaClient.projects().create(this.project)
        //     .then(res => {
        //         this.Cohort = {};
        //         this.requestUpdate();

        //         this.dispatchSessionUpdateRequest();

        //         Swal.fire(
        //             "New Sample",
        //             "New Sample created correctly.",
        //             "success"
        //         );
        //     })
        //     .catch(err => {
        //         console.error(err);
        //         params.error(err);
        //     });
    }

    updateCohort() {
        // this.opencgaSession.opencgaClient.projects().update(this.Sample?.fqn,this.Sample)
        //     .then(res => {
        //         this.Sample = {};
        //         this.requestUpdate();

        //         this.dispatchSessionUpdateRequest();

        //         Swal.fire(
        //             "Edit Sample",
        //             "Sample updated correctly.",
        //             "success"
        //         );
        //     })
        //     .catch(err => {
        //         console.error(err);
        //         params.error(err);
        //     });
    }

    onSubmit(e) {
        if (mode === CohortForm.CREATE_MODE) {
            this.saveCohort()
        } else {
            this.updateCohort()
        }
    }

    onClear() {

    }

    render() {
        return html`
            <data-form  .data=${this.cohort}
                        .config="${this._config}"
                        @fieldChange="${e => this.onFieldChange(e)}"
                        @clear=${this.onClear}
                        @submit="${this.onSubmit}">
            </data-form>
        `;
    }

}

customElements.define("cohort-form", CohortForm);