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

import {LitElement, html} from "lit";
import "./config-list-update.js";

export default class StudyClinicalConfig extends LitElement {

    constructor() {
        super();
        this._init();
    }

    createRenderRoot() {
        return this;
    }

    static get properties() {
        return {
            study: {
                type: Object
            },
            opencgaSession: {
                type: Object
            },
        };
    }

    _init() {
        console.log("init study clinical config");
        // console.log("study selected ", this.study);
    }

    connectedCallback() {
        super.connectedCallback();
        this.updateParams = {};
        this._config = {...this.getDefaultConfig()};
        console.log("config study", this.study.internal.configuration.clinical);
    }

    update(changedProperties) {
        // if (changedProperties.has("study")) {
        // }
        super.update(changedProperties);
    }

    removeItem(e) {
        console.log("Execute remove buttons:", e.detail.value);
        e.stopPropagation();
        Swal.fire({
            title: "Are you sure?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, delete it!",
            reverseButtons: true
        }).then(result => {
            if (result.isConfirmed) {
                // TODO: add remove conditions by entity
                Swal.fire(
                    "Deleted!",
                    "The config has been deleted. (Test UI)",
                    "success"
                );
            }
        });
    }

    onFieldChange(e) {

    }

    onSubmit() {

    }

    onClear() {

    }

    editItem(e) {
        console.log("EditChanges: ", e.detail.value);
        e.stopPropagation();
    }

    configClinical(entity, heading) {

        const configModal = isNew => {
            return isNew ? {
                type: "modal",
                title: "Add Config",
                buttonStyle: "margin-top:6px"
            } : {
                type: "modal",
                title: "Edit Config",
                heading: {
                    title: heading?.title,
                    subtitle: heading?.subtitle
                },
                buttonClass: "pull-right",
                btnGroups: [
                    {
                        title: "Edit",
                        openModal: true,
                    },
                    {
                        title: "Delete",
                        btnClass: "btn-danger",
                        event: "removeItem"
                    }
                ]
            };
        };

        const configSection = entity => {
            switch (entity) {
                case "clinical":
                case "interpretation":
                case "flags":
                    return {
                        elements: [
                            {
                                name: "Id",
                                field: "id",
                                type: "input-text",
                                display: {
                                    placeholder: "Name ..."
                                }
                            },
                            {
                                name: "Description",
                                field: "description",
                                type: "input-text",
                                display: {
                                    rows: 3,
                                    placeholder: "Add a description..."
                                }
                            },
                        ]
                    };
                case "priorities":
                    return {
                        elements: [
                            {
                                name: "Id",
                                field: "id",
                                type: "input-text",
                                display: {
                                    placeholder: "Name ..."
                                }
                            },
                            {
                                name: "Description",
                                field: "description",
                                type: "input-text",
                                display: {
                                    rows: 3,
                                    placeholder: "Add a description..."
                                }
                            },
                            {
                                name: "Rank",
                                field: "rank",
                                type: "input-text",
                            },
                            {
                                name: "Default priority",
                                field: "defaultPriority",
                                type: "checkbox",
                            },
                        ]
                    };
                case "consent":
                    return {
                        elements: [
                            {
                                name: "Id",
                                field: "id",
                                type: "input-text",
                                display: {
                                    placeholder: "Name ..."
                                }
                            },
                            {
                                name: "Name",
                                field: "name",
                                type: "input-text",
                                display: {
                                    placeholder: "Name ..."
                                }
                            },
                            {
                                name: "Description",
                                field: "description",
                                type: "input-text",
                                display: {
                                    rows: 3,
                                    placeholder: "Add a description..."
                                }
                            },
                        ]
                    };
            }
        };

        const configStatus = isNew => {
            return {
                title: "Edit",
                buttons: {
                    show: true,
                    cancelText: "Cancel",
                    classes: "btn btn-primary ripple pull-right",
                    okText: "Save"
                },
                display: {
                    labelWidth: 3,
                    labelAlign: "right",
                    defaultLayout: "horizontal",
                    mode: configModal(isNew),
                    defaultValue: ""
                },
                sections: [configSection(entity)]
            };
        };

        return {
            edit: configStatus(false),
            new: configStatus(true)
        };
    }

    getDefaultConfig() {
        return {
            type: "form",
            buttons: {
                show: true,
                cancelText: "Cancel",
                okText: "Update"
            },
            display: {
                // width: "8",
                style: "margin: 10px",
                labelWidth: 3,
                labelAlign: "right",
                defaultLayout: "horizontal",
                defaultValue: "",
                help: {
                    mode: "block" // icon
                }
            },
            sections: [
                {
                    title: "Clinical Status",
                    elements: [
                        {
                            type: "custom",
                            display: {
                                layout: "vertical",
                                defaultLayout: "vertical",
                                width: 12,
                                style: "padding-left: 0px",
                                render: clinical => html`
                                    <config-list-update
                                        entity="clinical"
                                        .items="${clinical.status}"
                                        .config=${this.configClinical("clinical")}
                                        @editChange=${this.editItem}
                                        @removeItem=${this.removeItem}>
                                    </config-list-update>`
                            }
                        },
                    ]
                },
                {
                    title: "Interpretation Status",
                    elements: [
                        {
                            type: "custom",
                            display: {
                                layout: "vertical",
                                defaultLayout: "vertical",
                                width: 12,
                                style: "padding-left: 0px",
                                render: clinical => html`
                                    <config-list-update
                                        entity="interpretation"
                                        .items="${clinical.interpretation.status}"
                                        .config=${this.configClinical("interpretation")}
                                        @removeItem=${this.removeItem}>
                                    </config-list-update>`
                            }
                        },
                    ]
                },
                {
                    title: "Priorities",
                    elements: [
                        {
                            type: "custom",
                            display: {
                                layout: "vertical",
                                defaultLayout: "vertical",
                                width: 8,
                                style: "padding-left: 0px",
                                render: clinical => html`
                                    <config-list-update
                                        entity="priorities"
                                        .items="${clinical.priorities}"
                                        .config=${this.configClinical("priorities")}
                                        @removeItem=${this.removeItem}>
                                    </config-list-update>`
                            }
                        },
                    ]
                },
                {
                    title: "flags",
                    elements: [
                        {
                            type: "custom",
                            display: {
                                layout: "vertical",
                                defaultLayout: "vertical",
                                width: 12,
                                style: "padding-left: 0px",
                                render: clinical => html`
                                    <config-list-update
                                        entity="flags"
                                        .items="${clinical.flags}"
                                        .config=${this.configClinical("flags")}
                                        @removeItem=${this.removeItem}>
                                    </config-list-update>`
                            }
                        },
                    ]
                },
                {
                    title: "consent",
                    elements: [
                        {
                            type: "custom",
                            display: {
                                layout: "vertical",
                                defaultLayout: "vertical",
                                width: 8,
                                style: "padding-left: 0px",
                                render: clinical => html`
                                    <config-list-update
                                        entity="consent"
                                        .items="${clinical.consent.consents}"
                                        .config=${this.configClinical("consent")}
                                        @removeItem=${this.removeItem}>
                                    </config-list-update>`
                            }
                        },
                    ]
                }
            ]
        };
    }

    render() {
        return html`
            <!-- <div class="guard-page">
                <i class="fas fa-pencil-ruler fa-5x"></i>
                <h3>Clinial Config under construction</h3>
                <h3>(Coming Soon)</h3>
            </div> -->
            <div style="margin: 25px 40px">
                <data-form
                    .data=${this.study.internal.configuration.clinical}
                    .config="${this._config}"
                    @fieldChange="${e => this.onFieldChange(e)}"
                    @clear="${this.onClear}"
                    @submit="${this.onSubmit}">
                </data-form>
            </div>
        `;
    }

}

customElements.define("study-clinical-config", StudyClinicalConfig);