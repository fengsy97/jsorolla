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

import {LitElement, html, nothing} from "lit";
import FormUtils from "../../webcomponents/commons/forms/form-utils.js";
import LitUtils from "../commons/utils/lit-utils.js";
import NotificationUtils from "../commons/utils/notification-utils.js";
import UtilsNew from "../../core/utilsNew.js";
import Types from "../commons/types.js";
import "../study/annotationset/annotation-set-update.js";
import "../study/ontology-term-annotation/ontology-term-annotation-create.js";
import "../study/ontology-term-annotation/ontology-term-annotation-update.js";
import "../study/status/status-update.js";
import "./external-source/external-source-update.js";
import "../commons/filters/catalog-search-autocomplete.js";

export default class SampleUpdate extends LitElement {

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
            opencgaSession: {
                type: Object
            },
            config: {
                type: Object
            }
        };
    }

    _init() {
        this.sample = {};
        this.phenotype = {};
        this.annotationSets = {};
        this.updateParams = {};
        this._config = {...this.getDefaultConfig()};
    }

    update(changedProperties) {
        if (changedProperties.has("sample")) {
            this.sampleObserver();
        }

        if (changedProperties.has("sampleId")) {
            this.sampleIdObserver();
        }

        // it's just work on update or connectedCallback
        // It's working here, it is not necessary put this on connectecCallback.
        if (changedProperties.has("config")) {
            this._config = {...this.getDefaultConfig(), ...this.config};
        }

        super.update(changedProperties);
    }

    sampleObserver() {
        // When updating wee need to keep a private copy of the original object
        if (this.sample) {
            this._sample = JSON.parse(JSON.stringify(this.sample));
        }
    }

    sampleIdObserver() {
        if (this.opencgaSession && this.sampleId) {
            const query = {
                study: this.opencgaSession.study.fqn,
                includeIndividual: true
            };
            this.opencgaSession.opencgaClient.samples().info(this.sampleId, query)
                .then(response => {
                    this.sample = response.responses[0].results[0];
                })
                .catch(reason => {
                    console.error(reason);
                });
        }
    }

    onFieldChange(e, field) {
        e.stopPropagation();
        const param = field || e.detail.param;
        switch (param) {
            case "id":
            case "description":
            case "individualId":
            case "somatic":
            case "status":
            case "source":
                this.updateParams = FormUtils.updateScalar(
                    this._sample,
                    this.sample,
                    this.updateParams,
                    param,
                    e.detail.value);
                break;
            case "processing.product":
            case "processing.preparationMethod":
            case "processing.extractionMethod":
            case "processing.labSambpleId":
            case "processing.quantity":
            case "processing.date":
            case "collection.tissue":
            case "collection.organ":
            case "collection.quantity":
            case "collection.method":
            case "collection.date":
                this.updateParams = FormUtils.updateObjectWithProps(
                    this._sample,
                    this.sample,
                    this.updateParams,
                    param,
                    e.detail.value);
                break;
        }
        this.requestUpdate();
    }

    onClear() {
        this._config = this.getDefaultConfig();
        this.sample = JSON.parse(JSON.stringify(this._sample));
        this.updateParams = {};
        this.sampleId = "";
    }

    onSubmit() {
        const params = {
            study: this.opencgaSession.study.fqn,
            phenotypesAction: "SET"
        };

        this.opencgaSession.opencgaClient.samples()
            .update(this.sample.id, this.updateParams, params)
            .then(res => {
                // this.sample = {...res.responses[0].results[0], attributes: this.sample.attributes}; // To keep OPENCGA_INDIVIDUAL
                this._sample = JSON.parse(JSON.stringify(this.sample));
                this.updateParams = {};
                NotificationUtils.dispatch(this, NotificationUtils.NOTIFY_SUCCESS, {
                    title: "Update Sample",
                    message: "Sample updated correclty"
                });
                // FormUtils.showAlert("Update Sample", "Sample updated correctly", "success");
                // sessionUpdateRequest
                // TODO: dispacth to the user the data is saved
            })
            .catch(err => {
                // console.error(err);
                NotificationUtils.dispatch(this, NotificationUtils.NOTIFY_RESPONSE, err);
                // FormUtils.showAlert("Update Sample", "Sample not updated correctly", "error");
            });
    }

    // display a button to back sample browser.
    onShowBtnSampleBrowser() {
        const query = {
            xref: this.sampleId
        };

        const showBrowser = () => {
            LitUtils.dispatchCustomEvent(this, "querySearch", null, {query: query}, null);
            const hash = window.location.hash.split("/");
            const newHash = "#sample/" + hash[1] + "/" + hash[2];
            window.location.hash = newHash;
        };

        return html `
            <div style="float: right;padding: 10px 5px 10px 5px">
                <button type="button" class="btn btn-primary" @click="${showBrowser}">
                    <i class="fa fa-hand-o-left" aria-hidden="true"></i> Sample Browser
                </button>
            </div>
        `;
    }

    onAddOrUpdateItem(e) {
        switch (e.detail.param) {
            case "collection.from":
                this.collection = {...this.collection, from: e.detail.value};
                this.sample = {...this.sample, collection: this.collection};
                this.updateParams = {...this.updateParams, collection: this.collection};
                break;
            case "phenotypes":
                this.sample = {...this.sample, phenotypes: e.detail.value};
                this.updateParams = {...this.updateParams, phenotypes: e.detail.value};
                break;
            case "annotationSets":
                break;
        }
        this.requestUpdate();
    }

    render() {
        return html`
            ${this._config?.display?.showBtnSampleBrowser? this.onShowBtnSampleBrowser(): nothing}
            <data-form
                .data=${this.sample}
                .config="${this._config}"
                .updateParams=${this.updateParams}
                @fieldChange="${e => this.onFieldChange(e)}"
                @addOrUpdateItem="${e => this.onAddOrUpdateItem(e)}"
                @clear="${this.onClear}"
                @submit="${this.onSubmit}">
            </data-form>
        `;
    }


    getDefaultConfig() {
        return Types.dataFormConfig({
            icon: "fas fa-edit",
            type: "form",
            display: {
                style: "margin: 10px",
                defaultLayout: "horizontal",
                labelAlign: "right",
                labelWidth: 3,
                buttonOkText: "Update"
            },
            sections: [{
                title: "General Information",
                elements: [
                    {
                        title: "Sample ID",
                        field: "id",
                        type: "input-text",
                        display: {
                            placeholder: "Add a short ID...",
                            helpMessage: this.sample.creationDate? "Created on " + UtilsNew.dateFormatter(this.sample.creationDate):"No creation date",
                            disabled: true,
                        }
                    },
                    {
                        title: "Individual ID",
                        field: "individualId",
                        type: "custom",
                        display: {
                            placeholder: "e.g. Homo sapiens, ...",
                            render: individualId => html`
                                <catalog-search-autocomplete
                                    .value="${individualId}"
                                    .resource="${"INDIVIDUAL"}"
                                    .opencgaSession="${this.opencgaSession}"
                                    .classes="${this.updateParams.individualId ? "selection-updated" : ""}"
                                    .config="${{multiple: false}}"
                                    @filterChange="${e =>
                                        this.onFieldChange({
                                        detail: {
                                            param: "individualId",
                                            value: e.detail.value
                                        }
                                    })}">
                                </catalog-search-autocomplete>
                            `,
                        }
                    },
                    {
                        title: "Somatic",
                        field: "somatic",
                        type: "checkbox"
                    },
                    {
                        title: "Description",
                        field: "description",
                        type: "input-text",
                        display: {
                            placeholder: "Add a description...",
                            rows: 3,
                        }
                    },
                    {
                        title: "Source",
                        field: "source",
                        type: "custom",
                        display: {
                            render: source => html`
                                <external-source-update
                                    .source="${source}"
                                    .displayConfig="${{
                                        defaultLayout: "vertical",
                                        buttonsVisible: false,
                                        width: 12,
                                        style: "border-left: 2px solid #0c2f4c; padding-left: 12px",
                                    }}"
                                    @fieldChange="${e => this.onFieldChange(e, "source")}">
                                </external-source-update>
                            `,
                        }
                    },
                    {
                        title: "Status",
                        field: "status",
                        type: "custom",
                        display: {
                            render: status => html`
                                <status-update
                                    .status="${status}"
                                    .displayConfig="${{
                                        defaultLayout: "vertical",
                                        buttonsVisible: false,
                                        width: 12,
                                        style: "border-left: 2px solid #0c2f4c; padding-left: 12px",
                                    }}"
                                    @fieldChange="${e => this.onFieldChange(e, "status")}">
                                </status-update>
                            `,
                        }
                    },
                    // {
                    //     title: "Creation Date",
                    //     field: "creationDate",
                    //     type: "input-date",
                    //     display: {
                    //         render: creationDate => html`${UtilsNew.dateFormatter(creationDate)}`
                    //     }
                    // },
                ]
            },
            {
                title: "Processing Info",
                elements: [
                    {
                        title: "Product",
                        field: "processing.product",
                        type: "custom",
                        display: {
                            render: product => html`
                                <ontology-term-annotation-update
                                    .ontology="${product}"
                                    .displayConfig="${{
                                            defaultLayout: "vertical",
                                            buttonsVisible: false,
                                            style: "border-left: 2px solid #0c2f4c; padding-left: 12px",
                                        }}"
                                    @fieldChange="${e => this.onFieldChange(e, "processing.product")}">
                                </ontology-term-annotation-update>
                            `,
                        }
                    },
                    {
                        title: "Preparation Method",
                        field: "processing.preparationMethod",
                        type: "input-text",
                        display: {
                            placeholder: "Add a preparation method..."
                        }
                    },
                    {
                        title: "Extraction Method",
                        field: "processing.extractionMethod",
                        type: "input-text",
                        display: {
                            placeholder: "Add a extraction method..."
                        }
                    },
                    {
                        title: "Lab Sample ID",
                        field: "processing.labSambpleId",
                        type: "input-text",
                        display: {
                            placeholder: "Add the lab sample ID..."
                        }
                    },
                    {
                        title: "Quantity",
                        field: "processing.quantity",
                        type: "input-num",
                        display: {
                            placeholder: "Add a quantity..."
                        }
                    },
                    {
                        title: "Date",
                        field: "processing.date",
                        type: "input-date",
                        display: {
                            render: date => moment(date, "YYYYMMDDHHmmss").format("DD/MM/YYYY")
                        }
                    }
                ]
            },
            {
                title: "Collection Info",
                elements: [
                    {
                        title: "From",
                        field: "collection.from",
                        type: "custom-list",
                        display: {
                            style: "border-left: 2px solid #0c2f4c; padding-left: 12px; margin-bottom:24px",
                            collapsedUpdate: true,
                            renderUpdate: (from, callback) => html`
                                <ontology-term-annotation-update
                                    .ontology="${from}"
                                    .displayConfig="${{
                                            defaultLayout: "vertical",
                                            style: "margin-bottom:0px",
                                            buttonOkText: "Save",
                                            buttonClearText: "",
                                        }}"
                                    @updateItem="${callback}">
                                </ontology-term-annotation-update>
                            `,
                            renderCreate: (from, callback) => html`
                                <label>Create new item</label>
                                <ontology-term-annotation-create
                                    .displayConfig="${{
                                            defaultLayout: "vertical",
                                            buttonOkText: "Add",
                                            buttonClearText: "",
                                        }}"
                                    @addItem="${callback}">
                                </ontology-term-annotation-create>`
                        }
                    },
                    {
                        title: "Organ",
                        field: "collection.organ",
                        type: "input-text",
                        display: {
                            placeholder: "Add an organ..."
                        }
                    },
                    {
                        title: "Quantity",
                        field: "collection.quantity",
                        type: "input-num",
                        display: {
                            placeholder: "Add a quantity..."
                        }
                    },
                    {
                        title: "Method",
                        field: "collection.method",
                        type: "input-text",
                        display: {
                            placeholder: "Add a method..."
                        }
                    },
                    {
                        title: "Date",
                        field: "collection.date",
                        type: "input-date",
                        display: {
                            render: date => moment(date, "YYYYMMDDHHmmss").format("DD/MM/YYYY")
                        }
                    }
                ]
            },
            {
                title: "Phenotypes",
                elements: [
                    {
                        title: "Phenotype",
                        field: "phenotypes",
                        type: "custom-list",
                        display: {
                            style: "border-left: 2px solid #0c2f4c; padding-left: 12px; margin-bottom:24px",
                            collapsedUpdate: true,
                            renderUpdate: (pheno, callback) => html`
                                <ontology-term-annotation-update
                                    .ontology="${pheno}"
                                    .entity="${"phenotype"}"
                                    .displayConfig="${{
                                            defaultLayout: "vertical",
                                            buttonOkText: "Save",
                                            buttonClearText: "",
                                        }}"
                                    @updateItem="${callback}">
                                </ontology-term-annotation-update>
                            `,
                            renderCreate: (pheno, callback) => html`
                                <label>Create new item</label>
                                <ontology-term-annotation-create
                                    .entity="${"phenotype"}"
                                    .displayConfig="${{
                                            defaultLayout: "vertical",
                                            buttonOkText: "Add",
                                            buttonClearText: "",
                                        }}"
                                    @addItem="${callback}">
                                </ontology-term-annotation-create>
                            `,
                        }
                    },
                ]
            },
            // {
            //     title: "Annotation Set",
            //     elements: [
            //         {
            //             field: "annotationSets",
            //             type: "custom",
            //             display: {
            //                 layout: "vertical",
            //                 defaultLayout: "vertical",
            //                 width: 12,
            //                 style: "padding-left: 0px",
            //                 render: () => html`
            //                 <annotation-set-update
            //                     .annotationSets="${this.sample?.annotationSets}"
            //                     .opencgaSession="${this.opencgaSession}"
            //                     @changeAnnotationSets="${e => this.onSync(e, "annotationsets")}">
            //                 </annotation-set-update>`
            //             }
            //         }
            //     ]
            // }
            ]
        });
    }

}

customElements.define("sample-update", SampleUpdate);
