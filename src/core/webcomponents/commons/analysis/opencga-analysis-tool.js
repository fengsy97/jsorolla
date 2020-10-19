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

import {LitElement, html} from "/web_modules/lit-element.js";
import UtilsNew from "../../../utilsNew.js";
import "../../text-icon.js";
import "./opencga-analysis-tool-form.js";


export default class OpencgaAnalysisTool extends LitElement {

    constructor() {
        super();

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
            cellbaseClient: {
                type: Object
            },
            analysisClass: {
                type: Object
            }
        };
    }

    _init() {
        this._prefix = "oat-" + UtilsNew.randomString(6);
    }

    connectedCallback() {
        super.connectedCallback();
        console.error("CONFIG")
        console.error(this._config)
    }

    updated(changedProperties) {
        if (changedProperties.has("analysisClass")) {
            this._config = {...this.analysisClass.config};
            this.requestUpdate();
        }
    }

    openModal(e) {
        $("#analysis_description_modal", this).modal("show");
    }

    onAnalysisRun(e) {
        // Execute function provided in the configuration
        if (this.analysisClass.execute) {
            this.analysisClass.execute(this.opencgaSession, e.detail.data, e.detail.params);
        } else {
            console.error(`No execute() function provided for analysis: ${this._config.id}`)
        }
    }

    render() {
        // Check Project exists
        if (!this.opencgaSession || !this.opencgaSession.study) {
            return html`
                <div class="guard-page">
                    <i class="fas fa-lock fa-5x"></i>
                    <h3>No OpenCGA study available to run an analysis. Please login to continue.</h3>
                </div>
            `;
        }

        // Check Analysis tool configuration
        if (!this._config || !this._config.id || !this._config.form) {
            return html`
                <div class="guard-page">
                    <i class="fas fa-exclamation fa-5x"></i>
                    <h3>No valid Analysis tool configuration provided. Please check configuration:</h3>
                    <div style="padding: 10px">
                        <pre>${JSON.stringify(this._config, null, 2)}</pre>
                    </div>
                </div>
            `;
        }

        return html`
            <div class="opencga-analysis-tool">
                <tool-header title="${this._config.title}" icon="${this._config.icon}" .rhs="${html`<button class="btn btn-default ripple" @click="${e => this.openModal()}"><i class="fas fa-info-circle"></i> Info</button>`}"></tool-header>
                <!-- <tool-header title="${`<text-icon title="${this._config.title}" acronym="${this._config.acronym ? this._config.acronym : this._config.title[0] + this._config.title[1] + this._config.title[2].toLowerCase()}"></text-icon>` + this._config.title}"></tool-header> -->
    
                <div class="container">
                    <opencga-analysis-tool-form .opencgaSession=${this.opencgaSession} 
                                                .cellbaseClient="${this.cellbaseClient}"
                                                .config="${this._config.form}"
                                                @analysisRun="${this.onAnalysisRun}">
                    </opencga-analysis-tool-form>
                </div>
                
                <div class="modal fade" id="analysis_description_modal" tabindex="-1" role="dialog">
                    <div class="modal-dialog" role="document">
                        <div class="modal-content">
                            <div class="modal-header">
                                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </button>
                                <h4 class="modal-title">${this._config.title}</h4>
                            </div>
                            <div class="modal-body">
                                ${this._config.description}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

}

customElements.define("opencga-analysis-tool", OpencgaAnalysisTool);
