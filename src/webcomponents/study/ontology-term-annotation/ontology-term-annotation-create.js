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
import LitUtils from "../../commons/utils/lit-utils.js";
import Types from "../../commons/types.js";
import FormUtils from "../../commons/forms/form-utils.js";

// the following attribute are OntologyTermAnnotation:
// Sample -> SampleProcessing -> product
// Individual -> Ethnicity
export default class OntologyTermAnnotationCreate extends LitElement {

    constructor() {
        super();
        this._init();
    }

    createRenderRoot() {
        return this;
    }

    static get properties() {
        return {
            ontology: {
                type: Object
            },
            entity: {
                type: String,
            },
            mode: {
                type: String,
            },
            displayConfig: {
                type: Object
            }
        };
    }

    _init() {
        this.mode = "";
        this.displayConfigDefault = {
            buttonsAlign: "right",
            buttonClearText: "Clear",
            buttonOkText: "Create Ontology Term",
            titleVisible: false,
            titleWidth: 4,
            defaultLayout: "horizontal",
        };
        this._config = this.getDefaultConfig();
    }

    update(changedProperties) {
        if (changedProperties.has("displayConfig")) {
            this.displayConfig = {...this.displayConfigDefault, ...this.displayConfig};
            this._config = this.getDefaultConfig();
        }
        super.update(changedProperties);
    }

    onFieldChange(e, field) {
        e.stopPropagation();
        const param = field || e.detail.param;
        this.ontology = {
            ...FormUtils.createObject(
                this.ontology,
                param,
                e.detail.value
            )};
        LitUtils.dispatchCustomEvent(this, "fieldChange", this.ontology);
    }

    // Submit to upper component.
    onSendOntology(e) {
        // Avoid others onSubmit...ex. sample-create::onSubmit
        e.stopPropagation();
        // Send the ontology to the upper component
        LitUtils.dispatchCustomEvent(this, "addItem", this.ontology);
    }

    onClearForm(e) {
        e.stopPropagation();
        this.ontology = {};
        LitUtils.dispatchCustomEvent(this, "closeForm");
    }

    render() {
        return html`
            <data-form
                .data="${this.ontology}"
                .config="${this._config}"
                @fieldChange="${e => this.onFieldChange(e)}"
                @clear="${this.onClearForm}"
                @submit="${e => this.onSendOntology(e)}">
            </data-form>
        `;
    }

    #configOntology(entity) {
        switch (entity?.toUpperCase()) {
            case "PHENOTYPE":
                return [
                    {
                        name: "Age of onset",
                        field: "ageOfOnset",
                        type: "input-num",
                        display: {
                            placeholder: "Add an age of onset..."
                        }
                    },
                    {
                        name: "Status",
                        field: "status",
                        type: "select",
                        allowedValues: ["OBSERVED", "NOT_OBSERVED", "UNKNOWN"],
                        display: {
                            placeholder: "Select a status..."
                        }
                    }
                ];
            case "DISORDER":
                // Nacho (02/03/2022): At the moment IVA DOES NOT SUPPORT creating list inside other lists.
                return [];
            default:
                return [];
        }
    }

    getDefaultConfig() {
        return Types.dataFormConfig({
            type: this.mode,
            display: this.displayConfig || this.displayConfigDefault,
            sections: [
                {
                    elements: [
                        {
                            name: "ID",
                            field: "id",
                            type: "input-text",
                            required: true,
                            display: {
                                placeholder: "Add short id...",
                            }
                        },
                        {
                            name: "Name",
                            field: "name",
                            type: "input-text",
                            display: {
                                placeholder: "Add a name..."
                            }
                        },
                        {
                            name: "Source",
                            field: "source",
                            type: "input-text",
                            display: {
                                placeholder: "Add a source..."
                            }
                        },
                        ...this.#configOntology(this.entity),
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
                }
            ]
        });
    }

}

customElements.define("ontology-term-annotation-create", OntologyTermAnnotationCreate);
