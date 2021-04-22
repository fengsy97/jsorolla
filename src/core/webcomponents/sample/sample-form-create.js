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
import UtilsNew from "../../utilsNew.js";
import "../commons/tool-header.js";
import "./phenotype-form.js";
import "../annotations/annotation-form.js";

export default class SampleFormCreate extends LitElement {

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
            opencgaSession: {
                type: Object
            },
            study: {
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
        this.phenotype = {};
        this.annotationSets = {};
    }

    connectedCallback() {
        super.connectedCallback();
        this._config = { ...this.getDefaultConfig(), ...this.config };
    }

    update(changedProperties) {
        if (changedProperties.has("sample")) {
            this.sampleObserver();
        }

        super.update(changedProperties);
    }

    sampleObserver() {
        // When updating wee need to keep a private copy of the original object
        // if (this.sample && this.mode === SampleFormCreate.UPDATE_MODE) {
        //     this._sample = JSON.parse(JSON.stringify(this.sample));
        //     this.requestUpdate();
        // }
    }

    // TODO move to a generic Utils class
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
                okText: "Save"
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
                    title: "Sample General Information",
                    elements: [
                        {
                            name: "Sample ID",
                            field: "id",
                            type: "input-text",
                            required: true,
                            display: {
                                placeholder: "Add a short ID...", 
                                help: {
                                    text: "short Sample id for thehis as;lsal"
                                },
                                validation: {

                                }
                            },
                        },
                        {
                            name: "Name",
                            field: "name",
                            type: "input-text",
                            display: {
                                placeholder: "Name ...",
                            }
                        },
                        {
                            name: "Description",
                            field: "description",
                            type: "input-text",
                            display: {
                                rows: 3,
                                placeholder: "Sample name...",
                                // render: (sample) => html`
                                //     <sample-id-autocomplete 
                                //             .value="${sample?.individualId}"
                                //             .opencgaSession="${this.opencgaSession}" 
                                //             @filterChange="${e => this.onFieldChange({detail: {param: "individualId", value: e.detail.value}})}">
                                //     </sample-id-autocomplete>`
                            }
                        },
                        {
                            name: "Individual ID",
                            field: "individualId",
                            type: "custom",
                            display: {
                                placeholder: "e.g. Homo sapiens, ...",
                                render: (sample) => html`
                                    <individual-id-autocomplete 
                                            .value="${sample?.individualId}"
                                            .opencgaSession="${this.opencgaSession}" 
                                            @filterChange="${e => this.onFieldChange({ detail: { param: "individualId", value: e.detail.value } })}">
                                    </individual-id-autocomplete>`
                            }
                        },
                        {
                            name: "Somatic",
                            field: "somatic",
                            type: "checkbox"
                        },
                        {
                            name: "Status name",
                            field: "status.name",
                            type: "input-text",
                            display: {
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
                },
                {
                    title: "Processing Info",
                    elements: [
                        {
                            name: "Product",
                            field: "processing.product",
                            type: "input-text"
                        },
                        {
                            name: "Preparation Method",
                            field: "processing.preparationMethod",
                            type: "input-text"
                        },
                        {
                            name: "Extraction Method",
                            field: "processing.extrationMethod",
                            type: "input-text"
                        },
                        {
                            name: "Lab Sample ID",
                            field: "processing.labSambpleId",
                            type: "input-text"
                        },
                        {
                            name: "Quantity",
                            field: "processing.quantity",
                            type: "input-text"
                        },
                        {
                            name: "Date",
                            field: "processing.date",
                            type: "input-date",
                            display: {
                                render: date => moment(date, "YYYYMMDDHHmmss").format("DD/MM/YYYY"),
                            }
                        }
                    ]
                },
                {
                    title: "Collection Info",
                    elements: [
                        {
                            name: "Tissue",
                            field: "collection.tissue",
                            type: "input-text",
                        },
                        {
                            name: "Organ",
                            field: "collection.organ",
                            type: "input-text"
                        },
                        {
                            name: "Quantity",
                            field: "collection.quantity",
                            type: "input-text"
                        },
                        {
                            name: "Method",
                            field: "collection.method",
                            type: "input-text"
                        },
                        {
                            name: "Date",
                            field: "collection.date",
                            type: "input-date",
                            display: {
                                render: date => moment(date, "YYYYMMDDHHmmss").format("DD/MM/YYYY"),
                            }
                        }
                    ]
                },
                {
                    elements: [
                        {
                            field: "phenotype",
                            type: "custom",
                            display: {
                                layout: "vertical",
                                defaultLayout: "vertical",
                                width: 12,
                                style: "padding-left: 0px",
                                render: (sample) => html`
                                        <phenotype-form 
                                            .sample="${this.sample}"
                                            .phenotype="${this.phenotype}"
                                            .opencgaSession="${this.opencgaSession}" 
                                            @fieldChange="${e => this.onFieldChange(e)}">
                                        </phenotype-form>
                                    `
                            }
                        },
                        {
                            field: "annotationSets",
                            type: "custom",
                            display: {
                                layout: "vertical",
                                defaultLayout: "vertical",
                                width: 12,
                                style: "padding-left: 0px",
                                render: (sample) => html`
                                        <annotation-form 
                                            .sample="${this.sample}"
                                            .opencgaSession="${this.opencgaSession}" 
                                            @fieldChange="${e => this.onFieldChange(e)}">
                                        </annotation-form>
                                    `
                            }
                        }
                    ]
                },
            ]
        }
    }



    saveSample() {
        // this.opencgaSession.opencgaClient.projects().create(this.project)
        //     .then(res => {
        //         this.sample = {};
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

    updateSample() {
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



    onFieldChange(e) {
        // let param = e.detail.param;
        let field = ""
        let prop = ""
        // let value = e.detail.value;

        // if (param.includes(".")) {
        //     let cat = param.split(".")[0]
        //     let prop = param.split(".")[1]

        //     if (param.search("phenotype") >= 0) {
        //         this.phenotype[prop] = value
        //         return
        //     }

        //     if (!this.sample[cat]) {
        //         this.sample[cat] = {};
        //     }

        //     this.sample[cat][prop] = value;
        //     return
        // }

        // this.sample[param] = value
        // console.log("test: ", this.sample, this.phenotype)

        switch (e.detail.param) {
            case "id":
            case "description":
            case "individualId":
            case "somatic":
                if (this._sample[e.detail.param] !== e.detail.value && e.detail.value !== null) {
                    this.sample[e.detail.param] = e.detail.value;
                } else {
                    this.sample[e.detail.param] = this._sample[e.detail.param].id;
                }
                break;
            case "status.name":
            case "status.description":
            case "processing.product":
            case "processing.preparationMethod":
            case "processing.extrationMethod":
            case "processing.labSambpleId":
            case "processing.quantity":
            case "processing.date":
            case "collection.tissue":
            case "collection.organ":
            case "collection.quantity":
            case "collection.method":
            case "collection.date":
                field = e.detail.param.split(".")[0];
                prop = e.detail.param.split(".")[1];
                if (this._sample[field]) {
                    this.sample[field] = {}
                }

                this.sample[field][prop] = e.detail.value
                break;
            case "phenotype.ageOfOnset":
            case "phenotype.status":
                prop = e.detail.param.split(".")[1];
                this.phenotype[prop] = e.detail.value;
                break;
            case "annotationSet.id":
            case "annotationSet.name":
                prop = e.detail.param.split(".")[1];
                this.annotationSets[prop] = e.detail.value;
                break;
        }
    }

    onClear() {
        console.log("OnClear sample form")
    }

    onSubmit(e) {
        console.log(this.sample, this.phenotype, this)
        // this.phenotype = {}
        // this.requestUpdate()
    }

    render() {
        return html`
            <data-form  
                .data=${this.sample}
                .config="${this._config}"
                @fieldChange="${e => this.onFieldChange(e)}"
                @clear="${this.onClear}"
                @submit="${this.onSubmit}">
            </data-form>
        `;
    }

}

customElements.define("sample-form-create", SampleFormCreate);