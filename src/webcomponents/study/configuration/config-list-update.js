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
import "../../commons/forms/text-field-filter.js";
import UtilsNew from "../../../core/utilsNew.js";
import DetailTabs from "../../commons/view/detail-tabs.js";
import LitUtils from "../../commons/utils/lit-utils.js";
import "../../commons/list-update.js";

export default class ConfigListUpdate extends LitElement {

    constructor() {
        super();
        this._init();
    }

    createRenderRoot() {
        return this;
    }

    static get properties() {
        return {
            entity: {
                type: String
            },
            items: {},
            config: {
                type: Object
            }
        };
    }

    connectedCallback() {
        super.connectedCallback();
        this._config = {...this.getDefaultConfig()};


        if (UtilsNew.isUndefined(this.items)) {
            this.items = [];
        }
    }

    _init() {
        this.status = {};
        this._prefix = UtilsNew.randomString(8);
    }

    editItem(e, key) {
        const filterChange = {
            data: {
                param: e.detail.param,
                value: e.detail.value
            }, key};
        LitUtils.dispatchEventCustom(this, "editChange", filterChange);
        e.stopPropagation();
    }

    renderConfig(itemConfigs, key) {

        if (itemConfigs.constructor === Array) {
            const title = this.config.edit.display.mode?.heading?.title || "id";
            const subtitle = this.config.edit.display.mode?.heading?.subtitle || "description";
            return html`
            ${itemConfigs?.map(item => {
                const status = {...item, parent: key? key : ""};
                return html`
                    <div class="list-group-item">
                        <div class="row">
                            <div class="col-md-8">
                                <div style="padding-bottom:2px">
                                    <b>${status[title]}</b>
                                    <p class="text-muted">${status[subtitle]}</p>
                                </div>
                            </div>
                            <div class="col-md-4">
                                    <data-form
                                        .data="${status}"
                                        @fieldChange=${ e => this.editItem(e, {parent: key, entity: this.entity})}
                                        .config="${this.config.edit}">
                                    </data-form>
                            </div>
                        </div>
                    </div>
                `;
            })}
            <data-form
                .data="${this.status}"
                @fieldChange=${ e => this.editItem(e, {parent: key, entity: this.entity, new: true})}
                .config="${this.config.new}">
            </data-form>
        `;
        }

        if (itemConfigs.constructor === Object) {
            return html `
                <data-form
                    .data=${itemConfigs}
                    @fieldChange=${ e => this.editItem(e, {parent: key, entity: this.entity})}
                    .config=${this.config.edit}>
                </data-form>
            `;
        }

        return "Others Configs";
    }

    getDefaultConfig() {
        const configKeys = Object.keys(this.items).filter(key => this.items[key] instanceof Object);
        return {
            display: {
                contentStyle: "",
            },

            items: configKeys.map(key => {
                return {
                    id: key,
                    name: key,
                    render: () => {
                        return html`
                            <div class="col-md-6">
                                <div class="list-group">
                                    <list-update
                                        .key=${this.key}
                                        .data=${{items: this.items[key]}}
                                        .config=${this.config}>
                                    </list-update>
                                </div>
                            </div>`;
                    }
                };
            })
        };
    }

    render() {
        return html`
            ${this.items.constructor === Object ? html `
                <detail-tabs
                    .config="${this._config}"
                    .mode="${DetailTabs.PILLS_VERTICAL_MODE}">
                </detail-tabs>`:
                html `
                <list-update
                    .key=${this.key}
                    .data=${{items: this.items}}
                    .config=${this.config}>
                </list-update>
                `}
        `;
    }

}

customElements.define("config-list-update", ConfigListUpdate);