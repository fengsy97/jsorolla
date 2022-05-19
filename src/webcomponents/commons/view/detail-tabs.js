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
import UtilsNew from "../../../core/utilsNew.js";

export default class DetailTabs extends LitElement {

    static TABS_MODE = "tabs";
    static PILLS_MODE = "pills";
    static PILLS_VERTICAL_MODE = "pills_vertical";

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
            data: {
                type: Object
            },
            mode: {// accepted values:  tabs, pills
                type: String
            },
            config: {
                type: Object
            }
        };
    }

    _init() {
        this._prefix = UtilsNew.randomString(8);

        // mode by default, if the component no use this property
        this.mode = this.mode || DetailTabs.TABS_MODE;
    }

    connectedCallback() {
        super.connectedCallback();
        this._config = {...this.getDefaultConfig(), ...this.config};

        // Read active tabs from config, if not active tab is found then FIRST one is selected.
        const _activeTabs = Object.assign({}, ...this._config.items.map(item => ({[item.id]: item.active ?? false})));

        // Set default active tab
        const activeIndex = this._config.items.findIndex(item => item.active);
        if (activeIndex < 0) {
            _activeTabs[this._config.items[0].id] = true;
        }
        this.activeTabs = _activeTabs;
    }

    update(changedProperties) {
        if (changedProperties.has("config")) {
            this.configObserver();
        }
        super.update(changedProperties);
    }

    configObserver() {
        this._config = {...this.getDefaultConfig(), ...this.config};
    }

    changeBottomTab(e) {
        this.activeTabs = Object.assign({}, ...this._config.items.map(item => ({[item.id]: false})));
        const tabId = e.currentTarget.dataset.id;
        this.activeTabs[tabId] = true;
        this.requestUpdate();
    }

    renderTabTitle() {
        return html`
            ${this._config.items.length && this._config.items.map(item => {
                if (typeof item.mode === "undefined" || item.mode === this.opencgaSession.mode) {
                    return html`
                        <li role="presentation" class="${this._config.display?.tabTitleClass} ${this.activeTabs[item.id] ? "active" : ""}" style="${this._config.display?.tabTitleStyle}">
                            <a href="#${this._prefix}${item.id}" role="tab" data-toggle="tab" data-id="${item.id}" @click="${this.changeBottomTab}">
                                <span>${item.name}</span>
                            </a>
                        </li>`;
                }
            })}
        `;
    }

    renderTabContent() {
        return html`
            ${this._config.items.length && this._config.items.map(item => {
                if (typeof item.mode === "undefined" || item.mode === this.opencgaSession.mode) {
                    return html`
                        <div id="${item.id}-tab" role="tabpanel" style="display: ${this.activeTabs[item.id] ? "block" : "none"}">
                            ${item.render(this.data, this.activeTabs[item.id], this.opencgaSession, this.cellbaseClient)}
                        </div>`;
                }
            })}
        `;
    }

    render() {
        if (this.mode !== DetailTabs.TABS_MODE && this.mode !== DetailTabs.PILLS_MODE && this.mode !== DetailTabs.PILLS_VERTICAL_MODE) {
            return html`<h3>No valid mode: '${this.mode || ""}'</h3>`;
        }

        if (this._config?.items?.length === 0) {
            return html`<h3>No items provided</h3>`;
        }

        // Allow custom tabs alignment:  "center" or "justified"
        const align = this._config?.display?.align || "";

        return html`
            ${this._config.title ?
                html`
                    <div class="panel ${this._config?.display?.titleClass}" style="${this._config?.display?.titleStyle}">
                        <h3 class="break-word">&nbsp;${this._config.title} ${this.data?.id}</h3>
                    </div>` :
                null
            }

            <div class="detail-tabs">
                <!-- TABS -->
                ${this.mode === DetailTabs.TABS_MODE ? html`
                    <ul class="nav nav-tabs ${align ? `nav-${align}` : ""}" role="tablist">
                        ${this.renderTabTitle()}
                    </ul>
                ` : null}

                <!-- PILLS -->
                ${this.mode === DetailTabs.PILLS_MODE ? html`
                    <ul class="nav nav-pills" role="tablist">
                        ${this.renderTabTitle()}
                    </ul>
                ` : null}

                <!-- PILLS -->
                ${this.mode === DetailTabs.PILLS_VERTICAL_MODE ? html`
                <div class="col-md-2">
                    <ul class="nav nav-pills nav-stacked" role="tablist">
                        ${this.renderTabTitle()}
                    </ul>
                </div>
                ` : null}

                <!-- TAB CONTENT -->
                <div class="${this._config.display?.contentClass}" style="${this._config.display?.contentStyle}">
                    ${this.renderTabContent()}
                </div>
            </div>
        `;
    }

    getDefaultConfig() {
        return {
            title: "",
            display: {
                align: "", // "center" | "justified"

                titleClass: "",
                titleStyle: "",

                tabTitleClass: "",
                tabTitleStyle: "",

                contentClass: "",
                contentStyle: "padding: 10px",
            },
            // Example:
            // items: [
            //     {
            //         id: "clinical",
            //         name: "Clinical",
            //         icon: "fas fa-notes-medical",
            //         active: true,
            //         render: () => {
            //             return html`
            //                 <h3>Clinical Component</h3>`;
            //         }
            //     },
            // ]
        };
    }

}

customElements.define("detail-tabs", DetailTabs);
