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
import FormUtils from "../../webcomponents/commons/forms/form-utils.js";
import LitUtils from "../commons/utils/lit-utils.js";
import NotificationUtils from "../commons/utils/notification-utils.js";
import Types from "../commons/types.js";
import "../commons/filters/catalog-search-autocomplete.js";
import "../study/annotationset/annotation-set-update.js";
import "../commons/tool-header.js";


export default class FamilyCreate extends LitElement {

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
            displayConfig: {
                type: Object
            }
        };
    }

    #init() {
        this.family = {};
        this.displayConfigDefault = {
            buttonsVisible: true,
            buttonOkText: "Create",
            style: "margin: 10px",
            titleWidth: 3,
            defaultLayout: "horizontal",
            defaultValue: "",
        };
        this.members = "";
        this._config = this.getDefaultConfig();
    }

    update(changedProperties) {
        if (changedProperties.has("displayConfig")) {
            this.displayConfig = {...this.displayConfigDefault, ...this.displayConfig};
            this._config = this.getDefaultConfig();
        }
        super.update(changedProperties);
    }

    onFieldChange(e, field) {
        const param = field || e.detail.param;
        switch (param) {
            case "members":
                this.members = e.detail.value;
                // let members = [];
                // if (e.detail.value) {
                //     members = e.detail.value.split(",").map(member => {
                //         return {id: member};
                //     });
                // }
                // this.family = {...this.family, members: e.detail.value};
                break;
            case "annotationSets":
                this.family = {...this.family, annotationSets: e.detail.value};
                break;
            default:
                this.family = {
                    ...FormUtils.createObject(
                        this.family,
                        param,
                        e.detail.value
                    )
                };
                break;
        }
        this.requestUpdate();
    }

    onClear(e) {
        this.family = {};
        this.members = "";
        this._config = this.getDefaultConfig();
        this.requestUpdate();
    }

    // https://ws.opencb.org/opencga-prod/webservices/#!/Families/createFamilyPOST
    onSubmit() {
        let error;
        this.isLoading = true;
        this.opencgaSession.opencgaClient.families()
            .create(this.family, {study: this.opencgaSession.study.fqn, members: this.members})
            .then(() => {
                // TODO: Add a condition to confirm if the information has been saved to the server.
                NotificationUtils.dispatch(this, NotificationUtils.NOTIFY_SUCCESS, {
                    title: "Family Create",
                    message: "New family created correctly"
                });
                console.log("Family Saved", this.family);
                this.onClear();
            })
            .catch(reason => {
                error = reason;
                NotificationUtils.dispatch(this, NotificationUtils.NOTIFY_RESPONSE, err);
            })
            .finally(() => {
                this.family = {};
                this._config = this.getDefaultConfig();
                this.isLoading = false;
                LitUtils.dispatchCustomEvent(this, "familyCreate", this.family, {}, error);
                this.requestUpdate();
            });
    }

    render() {
        return html`
            <data-form
                .data="${this.family}"
                .config="${this._config}"
                @fieldChange="${e => this.onFieldChange(e)}"
                @clear="${this.onClear}"
                @submit="${this.onSubmit}">
            </data-form>
        `;
    }

    getDefaultConfig() {
        return Types.dataFormConfig({
            type: "form",
            display: this.displayConfig || this.displayConfigDefault,
            sections: [
                {
                    title: "General Information",
                    elements: [
                        {
                            type: "notification",
                            text: "Some changes have been done in the form. Not saved, changes will be lost",
                            display: {
                                visible: () => Object.keys(this.family).length > 0,
                                notificationType: "warning",
                            }
                        },
                        {
                            title: "Family ID",
                            field: "id",
                            type: "input-text",
                            required: true,
                            display: {
                                placeholder: "Add a short ID...",
                                helpMessage: "short family id ",
                                validation: {}
                            },
                        },
                        {
                            title: "Name",
                            field: "name",
                            type: "input-text",
                            display: {
                                placeholder: "Add a family name...",
                            }
                        },
                        {
                            title: "Members",
                            field: "members",
                            type: "custom",
                            display: {
                                placeholder: "e.g. Homo sapiens, ...",
                                helpMessage: "Individual Ids",
                                render: members => {
                                    return html`
                                        <catalog-search-autocomplete
                                            .value="${members}"
                                            .resource="${"INDIVIDUAL"}"
                                            .opencgaSession="${this.opencgaSession}"
                                            .config="${{multiple: true}}"
                                            @filterChange="${e => this.onFieldChange(e, "members")}">
                                        </catalog-search-autocomplete>
                                    `;
                                }
                            }
                        },
                        // {
                        //     title: "Creation Date",
                        //     field: "creationDate",
                        //     type: "input-date",
                        //     display: {
                        //         render: date =>
                        //             moment(date, "YYYYMMDDHHmmss").format(
                        //                 "DD/MM/YYYY"
                        //             )
                        //     }
                        // },
                        // {
                        //     title: "Modification Date",
                        //     field: "modificationDate",
                        //     type: "input-date",
                        //     display: {
                        //         render: date =>
                        //             moment(date, "YYYYMMDDHHmmss").format(
                        //                 "DD/MM/YYYY"
                        //             )
                        //     }
                        // },
                        {
                            title: "Expected Size",
                            field: "expectedSize",
                            type: "input-num",
                            display: {
                                placeholder: "Add a expected size...",
                            }
                        },
                        {
                            title: "Description",
                            field: "description",
                            type: "input-text",
                            display: {
                                rows: 3,
                                placeholder: "Add a Family description...",
                            }
                        },
                        {
                            title: "Status",
                            field: "status",
                            type: "custom",
                            display: {
                                render: () => html`
                                    <status-create
                                        .displayConfig="${{
                                            defaultLayout: "vertical",
                                            buttonsVisible: false,
                                            width: 12,
                                            style: "border-left: 2px solid #0c2f4c; padding-left: 12px",
                                        }}"
                                        @fieldChange="${e => this.onFieldChange(e, "status")}">
                                    </status-create>`
                            }
                        },
                    ]
                },
                // {
                //     title: "Annotations Sets",
                //     elements: [
                //         {
                //             field: "annotationSets",
                //             type: "custom",
                //             display: {
                //                 layout: "vertical",
                //                 defaultLayout: "vertical",
                //                 width: 12,
                //                 style: "padding-left: 0px",
                //                 render: family => html`
                //                     <annotation-set-update
                //                         .annotationSets="${family?.annotationSets}"
                //                         .opencgaSession="${this.opencgaSession}"
                //                         @changeAnnotationSets="${e => this.onFieldChange(e, "annotationSets")}">
                //                     </annotation-set-update>
                //                 `
                //             }
                //         }
                //     ]
                // }
            ]
        });
    }

}

customElements.define("family-create", FamilyCreate);
