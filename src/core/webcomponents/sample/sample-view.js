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

import {LitElement, html} from "/web_modules/lit-element.js";
import UtilsNew from "../../utilsNew.js";
import "../commons/view/data-form.js";
import "../commons/annotation-sets-view.js";


export default class SampleView extends LitElement {

    constructor() {
        super();

        this._init();
    }

    createRenderRoot() {
        return this;
    }

    static get properties() {
        return {
            sample: {
                type: Object
            },
            sampleId: {
                type: String
            },
            // search: {
            //     type: Boolean
            // },
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
        this.sample = {};
    }

    connectedCallback() {
        super.connectedCallback();
        this._config = {...this.getDefaultConfig(), ...this.config};
    }

    update(changedProperties) {
        if (changedProperties.has("sampleId")) {
            this.sampleIdObserver();
        }
        if (changedProperties.has("config")) {
            this._config = {...this.getDefaultConfig(), ...this.config};
        }
        super.update();
    }

    sampleIdObserver() {
        if (this.sampleId && this.opencgaSession) {
            const query = {
                study: this.opencgaSession.study.fqn,
                includeIndividual: true
            };
            this.opencgaSession.opencgaClient.samples().info(this.sampleId, query)
                .then(response => {
                    this.sample = response.responses[0].results[0];
                    console.log("Sample View: ", this.sample);
                    this._config = {...this.getDefaultConfig(), ...this.config};
                    this.dispatchSampleId();
                })
                .catch(reason => {
                    console.error(reason);
                });
        }
    }

    onFieldChange(e) {
        this.sampleId = e.detail.value;
    }

    dispatchSampleId() {
        this.dispatchEvent(new CustomEvent("updateSampleId", {
            detail: {
                value: this.sampleId
            },
            bubbles: true,
            composed: true
        }));

        this.requestUpdate();
        console.log("execute");
    }

    getDefaultConfig() {
        return {
            title: "Summary",
            icon: "",
            display: {
                buttons: {
                    show: false
                },
                collapsable: true,
                showTitle: false,
                labelWidth: 2,
                defaultValue: "-"
            },
            sections: [
                {
                    title: "Search",
                    display: {
                        visible: sample => !sample?.id
                    },
                    elements: [
                        {
                            name: "Sample ID",
                            field: "sampleId",
                            type: "custom",
                            display: {
                                render: () => html `
                                    <sample-id-autocomplete
                                        .value="${this.sample?.id}"
                                        .opencgaSession="${this.opencgaSession}"
                                        .config=${{
                                            addButton: false,
                                            multiple: false
                                        }}
                                        @filterChange="${e => this.onFieldChange(e)}">
                                    </sample-id-autocomplete>`
                            }
                        }
                    ]
                },
                {
                    title: "General",
                    collapsed: false,
                    display: {
                        visible: sample => sample?.id
                    },
                    elements: [
                        {
                            name: "Sample ID",
                            type: "custom",
                            display: {
                                visible: sample => sample?.id,
                                render: data => html`<span style="font-weight: bold">${data.id}</span> (UUID: ${data.uuid})`
                            }
                        },
                        {
                            name: "Individual ID",
                            field: "individualId"
                        },
                        {
                            name: "Files",
                            field: "fileIds",
                            type: "list",
                            display: {
                                defaultValue: "Files not found or empty",
                                contentLayout: "bullets"
                            }
                        },
                        {
                            name: "Somatic",
                            field: "somatic",
                            display: {
                                defaultValue: "false"
                            }
                        },
                        {
                            name: "Version",
                            field: "version"
                        },
                        {
                            name: "Status",
                            field: "internal.status",
                            type: "custom",
                            display: {
                                render: field => html`${field?.name} (${UtilsNew.dateFormatter(field?.date)})`
                            }
                        },
                        {
                            name: "Creation Date",
                            field: "creationDate",
                            type: "custom",
                            display: {
                                render: field => html`${UtilsNew.dateFormatter(field)}`
                            }
                        },
                        {
                            name: "Modification Date",
                            field: "modificationDate",
                            type: "custom",
                            display: {
                                render: field => html`${UtilsNew.dateFormatter(field)}`
                            }
                        },
                        {
                            name: "Description",
                            field: "description"
                        }
                        /*
                            {
                                name: "Annotation sets",
                                field: "annotationSets",
                                type: "custom",
                                display: {
                                    render: field => html`<annotation-sets-view .annotationSets="${field}"></annotation-sets-view>`
                                }
                            }
                        */
                    ]
                }
            ]
        };
    }

    render() {
        if (!this.sample?.id && this.sampleId) {
            return html`
                <h2>Loading info... </h2>
            `;
        }

        return html`
            <data-form .data=${this.sample} .config="${this._config}"></data-form>
        `;
    }

}

customElements.define("sample-view", SampleView);
