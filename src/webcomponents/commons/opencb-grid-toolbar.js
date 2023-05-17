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

import {html, LitElement, nothing} from "lit";
import OpencgaCatalogUtils from "../../core/clients/opencga/opencga-catalog-utils.js";
import UtilsNew from "../../core/utils-new.js";
import LitUtils from "./utils/lit-utils";
import ModalUtils from "./modal/modal-utils.js";
import "./opencga-export.js";
import "../variant/interpretation/variant-interpreter-grid-config.js";

export default class OpencbGridToolbar extends LitElement {

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
                type: Object
            },
            rightToolbar: {
                type: Array
            },
            query: {
                type: Object
            },
            settings: {
                type: Object
            },
            config: {
                type: Object
            }
        };
    }

    #init() {
        this._prefix = UtilsNew.randomString(8);

        this._settings = this.getDefaultSettings();
        this._config = this.getDefaultConfig();
    }

    update(changedProperties) {
        if (changedProperties.has("settings")) {
            this._settings = {...this.getDefaultSettings(), ...this.settings};
        }
        if (changedProperties.has("config")) {
            this._config = {...this.getDefaultConfig(), ...this.config};
        }
        super.update(changedProperties);
    }

    updated() {
        // firstUpdated is not working because this prefix change each update.
        // Approach #1
        // const modalIds = ["CreateModal", "ExportModal", "SettingModal"];
        // modalIds.forEach(modalId => {
        //     const modalElm = document.querySelector(`#${this._prefix+modalId}`);
        //     if ((modalElm !== null) && (modalElm !== undefined)) {
        //         ModalUtils.draggableModal(modalElm);
        //     }
        // });
    }

    // onDownloadFile(e) {
    //     this.dispatchEvent(new CustomEvent("download", {
    //         detail: {
    //             option: e.target.dataset.downloadOption
    //         }
    //     }));
    // }

    // not used as changes to exportFields is not propagated outside opencga-export anymore (exportFields is now sent on click on download button via `export` event)
    // onChangeExportField(e) {
    //     // simply forwarding from opencga-export to grid components
    //     LitUtils.dispatchCustomEvent(this, "changeExportField", e.detail, {});
    // }

    // checkboxToggle(e) {
    //     // We undo the checkbox action. We will toggle it on a different event
    //     e.currentTarget.checked = !e.currentTarget.checked;
    // }

    // onColumnClick(e) {
    //     // We do this call to avoid the dropdown to be closed after the click
    //     e.stopPropagation();
    //
    //     // Toggle the checkbox
    //     e.currentTarget.firstElementChild.checked = !e.currentTarget.firstElementChild.checked;
    //     this.dispatchEvent(new CustomEvent("columnChange", {
    //         detail: {
    //             id: e.currentTarget.dataset.columnId,
    //             selected: e.currentTarget.firstElementChild.checked
    //         }, bubbles: true, composed: true
    //     }));
    //
    // }

    onCloseSetting() {
        ModalUtils.close(`${this._prefix}SettingModal`);
    }

    onExport(e) {
        // Simply forwarding from opencga-export to grid components
        LitUtils.dispatchCustomEvent(this, "export", {}, e.detail);
    }

    onActionClick(e) {
        const action = e.currentTarget.dataset.action;
        switch (action) {
            case "create":
                ModalUtils.show(`${this._prefix}CreateModal`);
                break;
            case "export":
                ModalUtils.show(`${this._prefix}ExportModal`);
                break;
            case "settings":
                ModalUtils.show(`${this._prefix}SettingModal`);
                break;
        }
        LitUtils.dispatchCustomEvent(this, toolbar + UtilsNew.capitalize(action));
    }

    render() {
        const rightButtons = [];
        if (this.rightToolbar?.length > 0) {
            for (const rightButton of this.rightToolbar) {
                rightButtons.push(rightButton.render());
            }
        }

        const hasPermissions = OpencgaCatalogUtils.checkPermissions(this.opencgaSession?.study, this.opencgaSession?.user?.id,
            `WRITE_${this._config.resource}`);

        const isDisabled = (!hasPermissions || this._config?.disableCreate) || false;

        return html`
            <style>
                .opencb-grid-toolbar {
                    margin: 0;
                }
            </style>

            <div class="opencb-grid-toolbar">
                <div class="row">
                    <div id="${this._prefix}ToolbarLeft" class="col-md-6">
                        <!-- Display components on the LEFT -->
                    </div>

                    <div id="${this._prefix}toolbar" class="col-md-6">
                        <!-- Display components on the RIGHT -->
                        <div class="form-inline text-right pull-right">
                            <!-- First, display custom elements passed as 'rightToolbar' parameter, this must be the first ones displayed -->
                            ${rightButtons?.length > 0 ? rightButtons.map(rightButton => html`
                                <div class="btn-group">
                                    ${rightButton}
                                </div>
                            `) : nothing}

                            <!-- Second, display elements configured -->
                            ${(this._settings.showCreate || this._settings.showNew) ? html`
                                <div class="btn-group">
                                    <!-- Note 20230517 Vero: it is not possible to trigger a tooltip on a disabled button.
                                    As a workaround, the tooltip will be displayed from a wrapper -->
                                    ${this._config?.disableCreate ? html `
                                        <span class="d-inline-block" tabindex="0" data-toggle="tooltip" title="The implementation of this functionality is in progress. Thanks for your patience :)">
                                            <button data-action="create" type="button" class="btn btn-default btn-sm" disabled>
                                                <i class="fas fa-file icon-padding" aria-hidden="true"></i> New ...
                                            </button>
                                        </span>
                                    ` : html `
                                        <button data-action="create" type="button" class="btn btn-default btn-sm"
                                                ?disabled="${isDisabled}" @click="${this.onActionClick}">
                                            ${this._settings?.downloading === true ? html`<i class="fa fa-spinner fa-spin" aria-hidden="true"></i>` : null}
                                            <i class="fas fa-file icon-padding" aria-hidden="true"></i> New ...
                                        </button>
                                    `}
                                </div>
                            ` : nothing}

                            ${this._settings.showExport ? html`
                                <div class="btn-group">
                                    <button data-action="export" type="button" class="btn btn-default btn-sm" @click="${this.onActionClick}">
                                        ${this._settings?.downloading === true ? html`<i class="fa fa-spinner fa-spin" aria-hidden="true"></i>` : null}
                                        <i class="fas fa-download icon-padding" aria-hidden="true"></i> Export ...
                                    </button>
                                </div>
                            ` : nothing}

                            <!-- && this._config? !== undefined-->
                            ${this._settings?.showSettings ? html`
                                <div class="btn-group">
                                    <button data-action="settings" type="button" class="btn btn-default btn-sm" @click="${this.onActionClick}">
                                        <i class="fas fa-cog icon-padding"></i> Settings ...
                                    </button>
                                </div>` : nothing}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Add modals-->
            ${(this._settings.showCreate || this._settings.showNew) && this._config?.create && OpencgaCatalogUtils.checkPermissions(this.opencgaSession?.study, this.opencgaSession?.user?.id, `WRITE_${this._config.resource}`) ?
                ModalUtils.create(this, `${this._prefix}CreateModal`, this._config.create) : nothing
            }

            ${this._settings?.showExport && this._config?.export ?
                ModalUtils.create(this, `${this._prefix}ExportModal`, this._config.export) : nothing}


            ${this._settings?.showSettings && this._config?.settings ?
                ModalUtils.create(this, `${this._prefix}SettingModal`, this._config.settings) : nothing}
        `;
    }

    getDefaultSettings() {
        return {
            // label: "records",
            showCreate: true,
            showDownload: true,
            showSettings: true,
            download: ["Tab", "JSON"],
            buttons: ["columns", "download"],
        };
    }

    getDefaultConfig() {
        return {
            export: {
                display: {
                    // modalDraggable: true,
                    modalTitle: this.config?.resource + " Export",
                },
                render: () => html`
                    <opencga-export
                        .config="${this._config}"
                        .query=${this.query}
                        .opencgaSession="${this.opencgaSession}"
                        @export="${this.onExport}"
                        @changeExportField="${this.onChangeExportField}">
                    </opencga-export>`
            },
            settings: {
                display: {
                    // modalDraggable: true,
                    modalTitle: this.config?.resource + " Settings",
                },
                render: () => !this._config?.showInterpreterConfig ? html `
                    <catalog-browser-grid-config
                        .opencgaSession="${this.opencgaSession}"
                        .gridColumns="${this._config.columns}"
                        .toolId="${this._config?.toolId}"
                        .config="${this._settings}"
                        @settingsUpdate="${this.onCloseSetting}">
                    </catalog-browser-grid-config>` : html `
                    <variant-interpreter-grid-config
                        .opencgaSession="${this.opencgaSession}"
                        .gridColumns="${this._config.columns}"
                        .config="${this._settings}"
                        .toolId="${this._config?.toolId}"
                        @settingsUpdate="${this.onCloseSetting}">
                    </variant-interpreter-grid-config>`
            }
        };
    }

}
customElements.define("opencb-grid-toolbar", OpencbGridToolbar);
