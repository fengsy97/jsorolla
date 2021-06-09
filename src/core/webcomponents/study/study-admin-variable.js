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

import {html, LitElement} from "/web_modules/lit-element.js";
import UtilsNew from "./../../utilsNew.js";
import GridCommons from "../commons/grid-commons.js";
import OpencgaCatalogUtils from "../../clients/opencga/opencga-catalog-utils.js";
import "../permission/permission-browser-grid.js";
import "../variable/variable-set-create.js";


export default class StudyAdminVariable extends LitElement {

    constructor() {
        super();
        this._init();
    }

    createRenderRoot() {
        return this;
    }

    static get properties() {
        return {
            studyId: {
                type: String
            },
            study: {
                type: Object
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
        this._prefix = UtilsNew.randomString(8);
    }

    connectedCallback() {
        super.connectedCallback();
        this._config = {...this.getDefaultConfig(), ...this.config};

    }

    update(changedProperties) {
        super.update(changedProperties);
    }

    studyObserver() {

    }

    getDefaultConfig() {
        return {
            items: [
                {
                    id: "view-variable",
                    name: "View Variable",
                    icon: "fa fa-table icon-padding",
                    active: true,
                    render: () => {
                        return html`
                        <div class="guard-page">
                            <i class="fas fa-pencil-ruler fa-5x"></i>
                            <h3>Component under construction</h3>
                            <h3>(Coming Soon)</h3>
                        </div>`;
                    }
                },
                {
                    id: "create-variable",
                    name: "Create Variable",
                    icon: "fas fa-clipboard-list",
                    active: false,
                    render: (study, active, opencgaSession) => {
                        return html`
                            <div class="row">
                                <div class="col-md-6" style="margin: 20px 10px">
                                    <variable-set-create
                                            .opencgaSession="${opencgaSession}">
                                    </variable-set-create>
                                </div>
                            </div>`;
                    }
                }
            ]
        };
    }

    render() {

        if (!OpencgaCatalogUtils.isAdmin(this.opencgaSession.study, this.opencgaSession.user.id)) {
            return html`
            <div class="guard-page">
                <i class="fas fa-lock fa-5x"></i>
                <h3>No permission to view this page</h3>
            </div>`;
        }

        return html`
            <div style="margin: 20px">
                <detail-tabs
                        .data=${this.study}
                        .mode=${"pills"}
                        .config="${this._config}"
                        .opencgaSession="${this.opencgaSession}">
                </detail-tabs>
            </div>
            `;
    }

}

customElements.define("study-admin-variable", StudyAdminVariable);
