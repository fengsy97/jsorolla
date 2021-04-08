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

import { LitElement, html } from "/web_modules/lit-element.js";
import { classMap } from "/web_modules/lit-html/directives/class-map.js";
import UtilsNew from "../../../utilsNew.js";

export default class DetailTabs extends LitElement {

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
            mode: {     // accepted values:  tabs, pills
                type: String
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

        this._config = { ...this.getDefaultConfig(), ...this.config };
        debugger
        // this makes "active" field in config consistent with this.activeTab state. this.activeTab is the unique source of truth.
        this.activeTab = { ...this._config.items.map(item => ({ [item.id]: item.active ?? false }))}; 
    }

    update(changedProperties) {
        if (changedProperties.has("property")) {
            this.propertyObserver();
        }
        
        super.update(changedProperties);
    }

    _changeBottomTab(e) {
        const tabId = e.currentTarget.dataset.id;

        $(".nav-tabs", this).removeClass("active");
        $(".tab-content div[role=tabpanel]", this).hide();
        this.activeTab = Object.assign({}, ...this._config.items.map(item => ({ [item.id]: false })));
        $("#" + tabId + "-tab", this).show();

        this.activeTab[tabId] = true;
        this.requestUpdate();
    }

    _changeView(e) {
        const tabId = e.currentTarget.dataset.id;

        $(".content-pills", this).removeClass("active");
        $(".content-tab", this).removeClass("active");
        for (const tab in this.activeTab) {
            this.activeTab[tab] = false;
        }
        $(`button.content-pills[data-id=${tabId}]`, this).addClass("active");
        $("#" + tabId + "-tab", this).addClass("active");

        this.activeTab[tabId] = true;
        this.requestUpdate();
    }

    getDefaultConfig() {
        return {
            title: "",
            // showTitle: true,
            display: {
                titleClass: "",
                titleStyle: "",

                tabTitleClass: "",
                tabTitleStyle: "",
                pillTitleClass: "btn-success ripple content-pills",
                pillTitleStyle: "",

                contentClass: "",
                contentStyle: "padding: 10px",
            },
            items: [

            ]
        };
    }

    render() {
        if (this.mode !== "tabs" && this.mode !== "pills") {
            return html`<h3>No valid mode: ${this.mode}</h3>`;
        }

        if (this._config?.items?.length === 0) {
            return html`<h3>No items provided: ${this._config?.items}</h3>`;
        }
        
        return html`
            ${this._config.title ?
                html`
                    <div class="panel ${this._config?.display?.titleClass}" style="${this._config?.display?.titleStyle}">
                        <h3>&nbsp;${this._config.title} ${this.data?.id}</h3>
                    </div>` :
                null
            }

            <!-- Details tabs with ul (traditional tabs)-->
            ${this.mode === "tabs" ? html`
                <div class="detail-tabs">
                    <ul class="nav nav-tabs" role="tablist">
                        ${this._config.items.length && this._config.items.map(item => {
                            if (typeof item.mode === "undefined" || item.mode === this.opencgaSession.mode) {
                                return html`
                                    <li role="presentation" class="${classMap({ active: this.activeTab[item.id] })}" style="${this._config.display?.tabTitleStyle}">
                                        <a href="#${this._prefix}${item.id}" role="tab" data-toggle="tab" data-id="${item.id}" @click="${this._changeBottomTab}">
                                            <span>${item.name}</span>
                                        </a>
                                    </li>`;
                            }
                        })}
                    </ul>
                    <div class="tab-content ${this._config.display?.contentClass}" style="${this._config.display?.contentStyle}">
                        ${this._config.items.length && this._config.items.map(item => {
                            if (typeof item.mode === "undefined" || item.mode === this.opencgaSession.mode) {
                                return html`
                                    <div id="${item.id}-tab" class="tab-pane ${classMap({ active: item.active })}" role="tabpanel">
                                        ${item.render(this.data, this.activeTab[item.id], this.opencgaSession, this.cellbaseClient)}
                                    </div>`;
                            }
                        })}
                    </div>
                </div>
            `: null}
            
            <!-- //////////////////////////////////////////// -->

            ${this.mode === "pills" ? html`
            <!-- Details tabs with button (pills tabs)-->
                <div class="btn-group content-pills" role="toolbar" aria-label="toolbar">
                    <div class="btn-group" role="group" style="margin-left: 0px">
                        ${this._config.items.length && this._config.items.map(item => {
                            if (typeof item.mode === "undefined" || item.mode === this.opencgaSession.mode) {
                                return html`
                                    <button class="btn ${this._config.display?.pillTitleClass} ${this.activeTab[item.id] ? "active": ""}"     
                                            type="button" data-id="${item.id}" @click="${this._changeView}">
                                        <i class="fa fa-table icon-padding" aria-hidden="true"></i>
                                        <span style="${this._config.display?.pillTitleStyle}">${item.name}</span>
                                    </button>`;
                            }
                        })}
                    </div>
                </div>

                <div class="main-view ${this._config.display?.contentClass}" style="${this._config.display?.contentStyle}">
                    ${this._config.items.length && this._config.items.map(item => {
                        if (typeof item.mode === "undefined" || item.mode === this.opencgaSession.mode) {
                            return html`
                                <div id="${item.id}-tab" class="content-tab ${classMap({ active: item.active })}">
                                    ${item.render(this.data, this.activeTab[item.id], this.opencgaSession, this.cellbaseClient)}
                                </div>`;
                        }
                    })}
                </div>
            `: null}
            <!-- //////////////////////////////////////////// -->
        `;
    }

}

customElements.define("detail-tabs", DetailTabs);
