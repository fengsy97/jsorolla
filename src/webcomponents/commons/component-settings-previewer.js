/**
 * Copyright 2015-2023 OpenCB
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
import "../sample/sample-browser.js";

export default class ComponentSettingsPreviewer extends LitElement {

    constructor() {
        super();

        this.#init();
    }

    createRenderRoot() {
        return this;
    }

    static get properties() {
        return {
            opencgaSession: {
                type: Object,
            },
            settings: {
                type: Object,
            },
        };
    }

    #init() {
        this.map = {
            "SAMPLE": {
                render: settings => {
                    debugger
                    return html `
                        <sample-browser
                            .opencgaSession="${this.opencgaSession}"
                            .settings="${settings}">
                        </sample-browser>
                    `;
                }
            },
        };
    }

    firstUpdated(changedProperties) {
    }

    update(changedProperties) {
        super.update(changedProperties);
    }

    #setLoading(value) {
    }

    // --- OBSERVERS ---
    configObserver() {
    }

    // --- EVENTS ---
    onJsonChange(e, field) {}

    onReset() {}

    onSubmit() {}

    // --- RENDER ---
    render() {
        return html `
            <div id="#component-previewer">
                ${this.map.SAMPLE.render(this.settings)}
            </div>
        `;
    }

    getDefaultConfig() {}

}

customElements.define("component-settings-previewer", ComponentSettingsPreviewer);

