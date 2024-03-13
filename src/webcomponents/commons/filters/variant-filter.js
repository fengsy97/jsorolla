/*
 * Copyright 2015-2016 OpenCB
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


import {html, LitElement} from "lit";
import UtilsNew from "../../../core/utils-new.js";


export default class VariantFilter extends LitElement {

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
            id: {
                type: String
            },
            config: {
                type: Object
            }
        };
    }

    _init() {
        this._prefix = UtilsNew.randomString(8);
        this.separator = ",";
        this._config = this.getDefaultConfig();
    }

    // firstUpdated(changedProperties) {
    //     this._config = {...this.getDefaultConfig(), ...this.config};
    // }

    // update(changedProperties) {
    //     super.update(changedProperties);
    // }

    filterChange(e) {
        // Process the textarea: remove newline chars, empty chars, leading/trailing commas
        const _id = e.target.value.trim()
            .replace(/\r?\n/g, this.separator)
            .replace(/\s/g, "")
            .split(this.separator)
            .filter(Boolean)
            .join(this.separator);

        const event = new CustomEvent("filterChange", {
            detail: {
                value: _id
            },
            bubbles: true,
            composed: true
        });
        this.dispatchEvent(event);
    }

    render() {
        return html`
            <textarea
                id="${this._prefix}IdTextarea"
                name="id"
                .value="${this.id || ""}"
                rows="${this._config.rows}"
                placeholder="${this._config.placeholder}"
                class="form-control clearable ${this._prefix}FilterTextInput"
                @input="${e => this.filterChange(e)}">
            </textarea>
        `;
    }

    getDefaultConfig() {
        return {
            rows: 3,
            placeholder: "1:78571307:C:T,..."
        };
    }

}

customElements.define("variant-filter", VariantFilter);
