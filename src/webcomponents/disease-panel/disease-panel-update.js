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
import FormUtils from "../commons/forms/form-utils.js";
import Types from "../commons/types.js";
import NotificationUtils from "../commons/utils/notification-utils.js";
import BioinfoUtils from "../../core/bioinfo/bioinfo-utils.js";
import UtilsNew from "../../core/utils-new.js";
import "../commons/filters/catalog-search-autocomplete.js";
import LitUtils from "../commons/utils/lit-utils";


export default class DiseasePanelUpdate extends LitElement {

    constructor() {
        super();

        this.#init();
    }

    createRenderRoot() {
        return this;
    }

    static get properties() {
        return {
            diseasePanel: {
                type: Object
            },
            diseasePanelId: {
                type: String
            },
            opencgaSession: {
                type: Object
            },
            displayConfig: {
                type: Object
            },
        };
    }

    #init() {
        this.diseasePanel = {};
        this.updateParams = {};

        this.displayConfigDefault = {
            buttonOkText: "Update",
            titleWidth: 3,
            width: 8,
            defaultValue: "",
            defaultLayout: "horizontal",
            buttonsVisible: true,
            buttonsWidth: 8,
            buttonsAlign: "right",
        };
        this._config = this.getDefaultConfig();
    }

    #setLoading(value) {
        this.isLoading = value;
        this.requestUpdate();
    }

    firstUpdated(changedProperties) {
        if (changedProperties.has("diseasePanel")) {
            this.initOriginalObject();
        }
    }

    update(changedProperties) {
        if (changedProperties.has("diseasePanelId")) {
            this.diseasePanelIdObserver();
        }
        if (changedProperties.has("displayConfig")) {
            this.displayConfig = {...this.displayConfigDefault, ...this.displayConfig};
            this._config = this.getDefaultConfig();
        }
        super.update(changedProperties);
    }

    initOriginalObject() {
        if (this.diseasePanel) {
            this._diseasePanel = UtilsNew.objectClone(this.diseasePanel);
        }
    }

    diseasePanelIdObserver() {
        if (this.diseasePanelId && this.opencgaSession) {
            const query = {
                study: this.opencgaSession.study.fqn,
            };
            let error;
            this.#setLoading(true);
            this.opencgaSession.opencgaClient.panels()
                .info(this.diseasePanelId, query)
                .then(response => {
                    this.diseasePanel = response.responses[0].results[0];
                    this.initOriginalObject();
                })
                .catch(reason => {
                    this.diseasePanel = {};
                    error = reason;
                    console.error(reason);
                })
                .finally(() => {
                    this._config = {...this.getDefaultConfig(), ...this.config};
                    LitUtils.dispatchCustomEvent(this, "diseasePanelSearch", this.individual, {query: {...query}}, error);
                    this.#setLoading(false);
                });
        } else {
            this.diseasePanel = {};
        }
    }

    onFieldChange(e, field) {
        const param = field || e.detail.param;
        switch (param) {
            case "id":
            case "name":
            case "description":
            case "source.id":
            case "source.name":
            case "source.version":
                this.updateParams = FormUtils.updateObjectParams(
                    this._diseasePanel,
                    this.diseasePanel,
                    this.updateParams,
                    param,
                    e.detail.value);
                break;
            case "disorders": // arrays
            case "variants":
            case "regions":
            case "genes":
                this.updateParams = FormUtils.updateArraysObject(
                    this._diseasePanel,
                    this.diseasePanel,
                    this.updateParams,
                    param,
                    e.detail.value
                );
                break;
        }

        // Get gene name and coordinates
        if (this.diseasePanel?.genes?.length > 0) {
            for (const gene of this.diseasePanel?.genes) {
                if (!gene.id) {
                    this.opencgaSession.cellbaseClient.getGeneClient(gene.name, "info", {exclude: "transcripts,annotation"})
                        .then(res => {
                            const g = res.responses[0].results[0];
                            gene.id = g.id;
                            gene.coordinates = [
                                {
                                    location: `${g.chromosome}:${g.start}-${g.end}`
                                }
                            ];
                            this.diseasePanel = {...this.diseasePanel};
                            this.requestUpdate();
                        })
                        .catch(err => {
                            console.error(err);
                        });
                }
            }
        }
        this.requestUpdate();
    }

    onClear() {
        this.updateParams = {};
        this.diseasePanelId = "";
        this.diseasePanel = UtilsNew.objectClone(this._diseasePanel);
        this._config = {...this.getDefaultConfig(), ...this.config};
    }

    onSubmit() {
        const params = {
            study: this.opencgaSession.study.fqn,
            includeResult: true
        };
        let error;
        this.#setLoading(true);
        // CAUTION: workaround for avoiding the overwrite of non updated keys in an object.
        //  Remove when form-utils.js revisited
        Object.keys(this.updateParams).forEach(key => this.updateParams[key] = this.diseasePanel[key]);
        this.opencgaSession.opencgaClient.panels()
            .update(this._diseasePanel.id, this.updateParams, params)
            .then(response => {
                this._diseasePanel = UtilsNew.objectClone(response.responses[0].results[0]);
                this.updateParams = {};
                this._config = this.getDefaultConfig();
                NotificationUtils.dispatch(this, NotificationUtils.NOTIFY_SUCCESS, {
                    title: "Disease Panel Updated",
                    message: "Disease Panel updated correctly"
                });
            })
            .catch(reason => {
                error = reason;
                NotificationUtils.dispatch(this, NotificationUtils.NOTIFY_RESPONSE, reason);
            })
            .finally(() => {
                // this._config = {...this.getDefaultConfig(), ...this.config};
                LitUtils.dispatchCustomEvent(this, "diseasePanelUpdate", this.family, {}, error);
                this.#setLoading(false);
            });
    }

    render() {
        if (this.isLoading) {
            return html`<loading-spinner></loading-spinner>`;
        }

        if (!this.diseasePanel?.id) {
            return html`<div>No valid object found</div>`;
        }

        return html`
            <data-form
                .data="${this.diseasePanel}"
                .config="${this._config}"
                .updateParams="${this.updateParams}"
                @fieldChange="${e => this.onFieldChange(e)}"
                @clear="${e => this.onClear(e)}"
                @submit="${this.onSubmit}">
            </data-form>
        `;
    }

    getDefaultConfig() {
        return Types.dataFormConfig({
            id: "disease-panel-update",
            title: "Disease Panel Update",
            icon: "fas fa-edit",
            type: "form",
            buttons: {
                clearText: "Cancel",
                okText: "Update Panel",
            },
            display: this.displayConfig || this.displayConfigDefault,
            sections: [
                {
                    title: "General Information",
                    elements: [
                        {
                            type: "notification",
                            text: "Some changes have been done in the form. Not saved, changes will be lost",
                            display: {
                                visible: () => !UtilsNew.isObjectValuesEmpty(this.updateParams),
                                notificationType: "warning",
                            }
                        },
                        {
                            title: "Disease Panel ID",
                            field: "id",
                            type: "input-text",
                            required: true,
                            display: {
                                placeholder: "Add an ID...",
                                help: {
                                    text: "Add a disease panel ID"
                                }
                            }
                        },
                        {
                            title: "Disease Panel Name",
                            field: "name",
                            type: "input-text",
                            display: {
                                placeholder: "Add the diseae panel name..."
                            }
                        },
                        {
                            title: "Disorders",
                            field: "disorders",
                            type: "object-list",
                            display: {
                                style: "border-left: 2px solid #0c2f4c; padding-left: 12px; margin-bottom:24px",
                                collapsedUpdate: true,
                                view: disorder => html`
                                    <div>${disorder.id} ${disorder?.name ? `- ${disorder?.name}` : ""}</div>
                                `,
                            },
                            elements: [
                                {
                                    title: "Disorder ID",
                                    field: "disorders[].id",
                                    type: "input-text",
                                    display: {
                                        placeholder: "Add variant ID...",
                                    }
                                },
                                {
                                    title: "Name",
                                    field: "disorders[].name",
                                    type: "input-text",
                                    display: {
                                    }
                                },
                                {
                                    title: "Description",
                                    field: "disorders[].description",
                                    type: "input-text",
                                    display: {
                                    }
                                },
                            ]
                        },
                        {
                            title: "Source",
                            field: "source",
                            type: "object",
                            elements: [
                                {
                                    title: "ID",
                                    field: "source.id",
                                    type: "input-text",
                                    display: {
                                        placeholder: "Add disease panel name...",
                                    }
                                },
                                {
                                    title: "Name",
                                    field: "source.name",
                                    type: "input-text",
                                    display: {
                                        placeholder: "Add disease panel name..."
                                    }
                                },
                                {
                                    title: "Version",
                                    field: "source.version",
                                    type: "input-text",
                                    display: {
                                        placeholder: "Add disease panel version...",
                                    }
                                },
                                {
                                    title: "Author",
                                    field: "source.author",
                                    type: "input-text",
                                    display: {
                                        placeholder: "Add disease panel author name...",
                                    }
                                },
                                {
                                    title: "Project",
                                    field: "source.project",
                                    type: "input-text",
                                    display: {
                                        placeholder: "Add disease panel project name...",
                                    }
                                }
                            ]
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
                    ]
                },
                {
                    title: "Genes",
                    elements: [
                        {
                            title: "Genes",
                            field: "genes",
                            type: "object-list",
                            display: {
                                style: "border-left: 2px solid #0c2f4c; padding-left: 12px; margin-bottom:24px",
                                collapsedUpdate: true,
                                view: gene => html`
                                    <div>
                                        <div>${gene?.name} (<a href="${BioinfoUtils.getGeneLink(gene?.id)}" target="_blank">${gene?.id}</a>)</div>
                                        <div style="margin: 5px 0">MoI: ${gene?.modeOfInheritance || "NA"} (Confidence: ${gene.confidence || "NA"})</div>
                                        <div class="help-block">${gene.coordinates?.[0]?.location}</div>
                                    </div>
                                `,
                            },
                            elements: [
                                {
                                    title: "Gene",
                                    field: "genes[].name",
                                    type: "custom",
                                    display: {
                                        placeholder: "Add gene...",
                                        render: (data, dataFormFilterChange) => {
                                            return html`
                                                <feature-filter
                                                    .cellbaseClient="${this.opencgaSession.cellbaseClient}"
                                                    @filterChange="${e => dataFormFilterChange(e.detail.value)}">
                                                </feature-filter>
                                            `;
                                        },
                                    }
                                },
                                {
                                    title: "Mode of Inheritance",
                                    field: "genes[].modeOfInheritance",
                                    type: "select",
                                    allowedValues: MODE_OF_INHERITANCE,
                                    display: {
                                        placeholder: "Select a mode of inheritance..."
                                    }
                                },
                                {
                                    title: "Confidence",
                                    field: "genes[].confidence",
                                    type: "select",
                                    allowedValues: DISEASE_PANEL_CONFIDENCE,
                                    display: {
                                        placeholder: "Select a confidence..."
                                    }
                                },
                                {
                                    title: "Imprinted",
                                    field: "genes[].imprinted",
                                    type: "select",
                                    allowedValues: DISEASE_PANEL_IMPRINTED,
                                    display: {
                                        placeholder: "Select imprinted..."
                                    }
                                },
                            ]
                        },
                    ]
                },
                {
                    title: "Regions",
                    elements: [
                        {
                            title: "Regions",
                            field: "regions",
                            type: "object-list",
                            display: {
                                style: "border-left: 2px solid #0c2f4c; padding-left: 12px; margin-bottom:24px",
                                collapsedUpdate: true,
                                view: region => html`
                                    <div>${region.id} - ${region?.modeOfInheritance || "-"}</div>
                                `,
                            },
                            elements: [
                                {
                                    title: "Region ID",
                                    field: "regions[].id",
                                    type: "input-text",
                                    display: {
                                        placeholder: "Add region...",
                                    }
                                },
                                {
                                    title: "Mode of Inheritance",
                                    field: "regions[].modeOfInheritance",
                                    type: "select",
                                    allowedValues: MODE_OF_INHERITANCE,
                                    display: {
                                        placeholder: "Select a mode of inheritance..."
                                    }
                                },
                                {
                                    title: "Confidence",
                                    field: "regions[].confidence",
                                    type: "select",
                                    allowedValues: DISEASE_PANEL_CONFIDENCE,
                                    display: {
                                        placeholder: "Select a confidence..."
                                    }
                                },
                            ]
                        },
                    ]
                },
                {
                    title: "Variants",
                    elements: [
                        {
                            title: "Variants",
                            field: "variants",
                            type: "object-list",
                            display: {
                                style: "border-left: 2px solid #0c2f4c; padding-left: 12px; margin-bottom:24px",
                                collapsedUpdate: true,
                                view: variant => html`
                                    <div>${variant.id} - ${variant?.modeOfInheritance || "-"}</div>
                                `,
                            },
                            elements: [
                                {
                                    title: "Variant ID",
                                    field: "variants[].id",
                                    type: "input-text",
                                    display: {
                                        placeholder: "Add variant ID...",
                                    }
                                },
                                {
                                    title: "Mode of Inheritance",
                                    field: "variants[].modeOfInheritance",
                                    type: "select",
                                    allowedValues: MODE_OF_INHERITANCE,
                                    display: {
                                        placeholder: "Select a mode of inheritance..."
                                    }
                                },
                                {
                                    title: "Confidence",
                                    field: "variants[].confidence",
                                    type: "select",
                                    allowedValues: DISEASE_PANEL_CONFIDENCE,
                                    display: {
                                        placeholder: "Select a confidence..."
                                    }
                                },
                            ]
                        },
                    ]
                },
            ]
        });
    }

}

customElements.define("disease-panel-update", DiseasePanelUpdate);
