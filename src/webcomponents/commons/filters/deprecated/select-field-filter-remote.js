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

import {LitElement, html} from "lit";
import UtilsNew from "../../../../core/utils-new.js";


/**
 * @deprecated
 *
 * */

export default class SelectFieldFilterRemote extends LitElement {

    constructor() {
        super();

        // Set status and init private properties
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
            placeholder: {
                type: String
            },
            // NOTE value (default Values) is either a single value as string or a comma separated list (this decision is due to easily manage default values in case of array of objects)
            value: {
                type: String
            },
            multiple: {
                type: Boolean
            },
            disabled: {
                type: Boolean
            },
            maxOptions: {
                type: Number
            },
            required: {
                type: Boolean
            },
            // the expected format is either an array of string or an array of objects {id, name}
            data: {
                type: Object
            }
        };
    }

    _init() {
        this._prefix = "sff-" + UtilsNew.randomString(6) + "_";
        this.multiple = false;
        this.data = [];
    }

    firstUpdated() {
        $(".selectpicker", this).selectpicker("val", "");
        $(".selectpicker", this).on("loaded.bs.select", (e, clickedIndex, isSelected, previousValue) => {
            console.log(e);
            $(".bs-searchbox input", this).on("input", e => {
                console.log("changed", e.target.value);
                this.opencgaSession.opencgaClient.variants().query({
                    study: this.opencgaSession.study.fqn,
                    limit: 10,
                    name: e.target.value
                }).then(restResponse => {
                    console.log("restResponse", restResponse.getResults());
                    const data = restResponse.getResults().map(_ => ({id: _.id, name: _.id}));
                    this.data = data;
                    this.requestUpdate();
                    $(".selectpicker", this).selectpicker("refresh");

                });
            });
        });
        $(".selectpicker", this).on("changed.bs.select", function (e, clickedIndex, isSelected, previousValue) {
            console.log(e);

        });
    }

    updated(_changedProperties) {
        if (_changedProperties.has("data")) {
            // TODO check why lit-element execute this for all existing select-field-filter instances..wtf
            // console.log("data",this.data)
            $(".selectpicker", this).selectpicker("refresh");
        }
        if (_changedProperties.has("value")) {
            $(".selectpicker", this).selectpicker("val", this.value ? (this.multiple ? this.value.split(",") : this.value) : "");
        }
        if (_changedProperties.has("disabled")) {
            $(".selectpicker", this).selectpicker("refresh");
        }
    }

    filterChange(e) {
        const selection = $(".selectpicker", this).selectpicker("val");
        let val;
        if (selection && selection.length) {
            val = this.multiple ? selection.join(",") : selection[0];
        }
        this.value = val ? val : null; // this allow users to get the selected values using DOMElement.value
        console.log("select filterChange", val);
        const event = new CustomEvent("filterChange", {
            detail: {
                value: this.value
            }
        });
        this.dispatchEvent(event);
    }

    // safe check if the field is an object (NOTE null is an object, so the constructor check is not enough)
    // TODO add safe check if is a plain string
    isObject(obj) {
        return obj != null && obj.constructor.name === "Object";
    }

    render() {
        return html`
            <div id="${this._prefix}-select-field-filter-wrapper" class="form-group">
                <select id="${this._prefix}-select"
                        data-live-search="true"
                        class="selectpicker"
                        multiple
                        .disabled=${this.disabled}
                        .required=${this.required}
                        title="${this.placeholder ? this.placeholder : "Select an option"}"
                        data-max-options="${!this.multiple ? 1 : this.maxOptions ? this.maxOptions : false}"
                        @change="${this.filterChange}" data-width="100%">
                    ${this.data.map(opt => html`
                        ${opt.fields ? html`
                            <optgroup label="${opt.name}">${opt.fields.map(subopt => html`
                                ${this.isObject(subopt) ? html`
                                    <option ?disabled="${subopt.disabled}" ?selected="${subopt.selected}" .value="${subopt.id ? subopt.id : subopt.name}">${subopt.name}</option>
                                ` : html`
                                    <option>${subopt}</option>
                                `}
                                `)}
                            </optgroup>
                            ` : html`
                                ${this.isObject(opt) ? html`
                                    <option ?disabled="${opt.disabled}" ?selected="${opt.selected}" .value="${opt.id ? opt.id : opt.name}">${opt.name}</option>
                                ` : html`
                                    <option>${opt}</option>
                            `}
                        `}
                    `)}
                </select>
            </div>
        `;
    }

}

customElements.define("select-field-filter-remote", SelectFieldFilterRemote);
