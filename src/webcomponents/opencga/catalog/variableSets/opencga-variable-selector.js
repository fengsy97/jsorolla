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

// TODO check functionality and on-dom-repeat

import {LitElement, html} from "lit";
import UtilsNew from "../../../../core/utils-new.js";
import CatalogWebUtils from "../../../commons/catalog-web-utils.js";


export default class OpencgaVariableSelector extends LitElement {

    constructor() {
        super();
        this._init();
    }

    createRenderRoot() {
        return this;
    }

    static get properties() {
        return {
            variableSet: {
                type: Array
            },
            selected: {
                type: Array
            },
            config: {
                type: Object
            }
        };
    }

    _init() {
        this._prefix = "ovs-" + UtilsNew.randomString(6) + "_";
        this.variables = [];
    }

    connectedCallback() {
        super.connectedCallback();
        this._config = {...this.getDefaultConfig(), ...this.config};

    }

    firstUpdated(_changedProperties) {
        const selectpicker = $(`#${this._prefix}-annotation-picker`);
        selectpicker.selectpicker("refresh");
        selectpicker.selectpicker("deselectAll");
        if (!this._config.multiSelection) {
            // Select first allowed variable by default
            for (const variable of this.variables) {
                if (!variable.disabled) {
                    $(`#${this._prefix}-annotation-picker`).find(".selectpicker").selectpicker("deselectAll");
                    this.dispatchEvent(new CustomEvent("variablechange", {
                            detail: {
                                value: [variable]
                            }
                        }
                    ));
                    return;
                }
            }
        }

    }

    updated(changedProperties) {
        if (changedProperties.has("variableSet")) {
            this.onVariableSetConfigChange();
        }
        if (changedProperties.has("config")) {
            this.onVariableSetConfigChange();
        }
    }

    async onVariableSetConfigChange() {
        this._config = Object.assign({}, this.getDefaultConfig(), this.config);

        const customConfig = {
            onlyAllowLeafSelection: this._config.onlyAllowLeafSelection
        };

        if (UtilsNew.isNotUndefinedOrNull(this.variableSet)) {
            this.variables = CatalogWebUtils.parseVariableSetVariablesForDisplay(this.variableSet.variables, [], 25, customConfig);
            console.log("onVariableSetConfigChange this.variables ", this.variables)
            //await this.requestUpdate();
            const selectpicker = $(`#${this._prefix}-annotation-picker`);
            //console.log("selectpicker",selectpicker.val())
            //selectpicker.selectpicker("render");
            this.requestUpdate();
            await this.updateComplete;
            selectpicker.selectpicker("refresh");
        }
    }

    renderDomRepeat(e) {
        const mainDiv = $(`#${this._prefix}-main-div`);
        const selectpicker = mainDiv.find(".selectpicker");
        selectpicker.selectpicker("refresh");
        selectpicker.selectpicker("deselectAll");

        // // Add the class to the select picker buttons
        // selectpicker.selectpicker('setStyle', this._config.buttonClass, 'add');
        // // Add the class to the lists
        // mainDiv.find("ul > li").addClass(this._config.class);
    }

    onChangeSelectedVariable(e) {
        console.log("onChangeSelectedVariable");
        const selectedVariables = [];
        /*for (let i = 0; i < e.currentTarget.selectedOptions.length; i++) {
            selectedVariables.push(e.currentTarget.selectedOptions[i].dataVariable);
        }
        */
        //let selectedVariable = this.variables[selectedIndex];

        const selectpicker = $(`#${this._prefix}-annotation-picker`);
        let selectedOption = selectpicker.selectpicker("val");
        let selectedVariable = this.variables.find( variable => variable.id === selectedOption);
        selectpicker.selectpicker("refresh");
        console.log("selectedVariable",selectedVariable)
        this.dispatchEvent(new CustomEvent("variablechange", {detail: {value: selectedVariable}}));
    }

    resetSelection(e) {
        const mainDiv = $(`#${this._prefix}-main-div`);
        const selectpicker = this.querySelector(`#${this._prefix}-annotation-picker`);
        //console.log("selectpicker",selectpicker)
        selectpicker.selectpicker("refresh");
        selectpicker.selectpicker("deselectAll");
    }

    getDefaultConfig() {
        return {
            title: "Select variable and value(s)",
            multiSelection: false, // Select multiple fields
            onlyAllowLeafSelection: true, // Only allow leaf selection
            showResetButton: false,

            class: "small",
            buttonClass: "btn-sm",
            inputClass: "input-sm"
        };
    }

    render() {
        return html`
        <style>
        .ovs-list li.selected {
            background-color: #cdcdcd;
        }
    </style>

        <div id="${this._prefix}-main-div">
            ${this.variables && this.variables.length ? html`
                <label for="${this._prefix}-annotation-picker" style="margin-top: 15px;">${this._config.title}</label>

                <form>
                    <div class="form-group">
                        <select class="selectpicker ovs-list" id="${this._prefix}-annotation-picker" data-live-search="true" data-size="10"
                                @change="${this.onChangeSelectedVariable}" data-width="100%" ?multiple="${this._config.multiSelection}">
                            ${this.variables.map( (variable, i) => {
                                console.log("variable", variable);
                                return html`
                                    <option data-tokens="${variable.tags}" data-index="${i}"
                                            style="padding-left: ${variable.margin}px; cursor: ${variable.cursor};"
                                            ?disabled="${variable.disabled}">
                                        ${variable.id}
                                    </option>
                                `;
                            })}
                        </select>
                    </div>
                    ${this._config.showResetButton ? html`
                        <button type="button" class="btn btn-primary" @click="${this.resetSelection}">Reset</button>
                    ` : null}
                </form>
            ` : null}
        </div>
        `;
    }

}

customElements.define("opencga-variable-selector", OpencgaVariableSelector);
