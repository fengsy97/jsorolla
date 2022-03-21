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

import {html, LitElement} from "lit";
import UtilsNew from "../../core/utilsNew.js";
import {RestClient} from "../../core/clients/rest-client.js";
import FormUtils from "../commons/forms/form-utils";
import NotificationUtils from "../commons/utils/notification-utils.js";
import DetailTabs from "../commons/view/detail-tabs.js";
import Types from "../commons/types.js";
import "../commons/json-viewer.js";


export default class RestEndpoint extends LitElement {

    constructor() {
        super();

        this._init();
    }

    createRenderRoot() {
        return this;
    }

    static get properties() {
        return {
            endpoint: {
                type: Object
            },
            opencgaSession: {
                type: Object
            },
        };
    }

    _init() {
        this._prefix = UtilsNew.randomString(8);
        this.data = {};
        this._data = {};
        this.dataJson = {};
        this.form = {};
        this.methodColor = {
            "GET": "blue",
            "POST": "darkorange",
            "DELETE": "red"
        };
        this.parameterTypeToHtml = {
            "string": "input-text",
            "integer": "input-text",
            "boolean": "checkbox",
            "enum": "select",
            "object": "input-text",
        };
        this._queryFilter = ["include", "exclude", "skip", "version", "limit", "release", "count", "attributes"];
        // Type not support by the moment..
        // Format, BioFormat, List, software, Map
        // ResourceType, Resource, Query, QueryOptions

        this.restClient = new RestClient();
        this.isLoading = false;
    }

    update(changedProperties) {
        if (changedProperties.has("endpoint")) {
            this.endpointObserver();
        }
        if (changedProperties.has("opencgaSession")) {
            this.opencgaSessionObserver();
        }
        super.update(changedProperties);
    }

    endpointObserver() {
        this.result = "";
        if (this.endpoint?.parameters?.length > 0) {
            const queryElements = [];
            const filterElements = [];
            const pathElements = [];
            const bodyElements = [];

            for (const parameter of this.endpoint.parameters) {
                if (parameter.param === "body") {
                    if (!this.data.body) {
                        this.data.body = {};
                    }

                    if (UtilsNew.hasProp(parameter, "data")) {
                        for (const dataParameter of parameter.data) {
                            const paramType = dataParameter.type?.toLowerCase();

                            this.data.body[dataParameter.name] = UtilsNew.hasProp(this.parameterTypeToHtml, paramType) ?
                                dataParameter.defaultValue || "" : dataParameter?.type === "List" ? [] : {};

                            if (UtilsNew.hasProp(this.parameterTypeToHtml, paramType)) {
                                bodyElements.push(
                                    {
                                        name: dataParameter.name,
                                        field: "body." + dataParameter.name,
                                        type: this.parameterTypeToHtml[dataParameter.type?.toLowerCase()],
                                        allowedValues: dataParameter.allowedValues?.split(","),
                                        defaultValue: dataParameter.defaultValue,
                                        required: !!dataParameter.required
                                    }
                                );
                            }
                        }
                    }
                } else {
                    this.data[parameter.name] = parameter.defaultValue || "";
                    const element = {
                        name: parameter.name,
                        field: parameter.name,
                        type: this.parameterTypeToHtml[parameter.type],
                        allowedValues: parameter.allowedValues?.split(",") || "",
                        defaultValue: parameter.defaultValue,
                        required: !!parameter.required,
                        display: {
                            disabled: parameter.name === "study"
                        },
                    };


                    if (parameter.param === "path") {
                        pathElements.push(element);
                    } else {
                        if (this._queryFilter.includes(parameter.name)) {
                            filterElements.push(element);
                        } else {
                            queryElements.push(element);
                        }
                    }
                }
            }

            const pathElementSorted = this.sortArray(pathElements);
            const queryElementSorted = this.sortArray(queryElements)
                .sort((a, b) => {
                    if (a.name === "study") {
                        return -1;
                    } else {
                        return 1;
                    }
                });
            const filterElementSorted = this.sortArray(filterElements);
            const elements = [...pathElementSorted, ...queryElementSorted, ...filterElementSorted];
            const fieldElements =
                this.isNotEndPointAdmin() ? elements :
                    this.isAdministrator() ? elements :
                        this.disabledElements(elements);


            this.form = {
                type: "form",
                buttons: {
                    show: true,
                    clearText: "Clear",
                    okText: "Try it out!"
                },
                display: {
                    width: "12",
                    labelWidth: "3",
                    defaultLayout: "horizontal",
                    buttonsVisible: this.isNotEndPointAdmin() ? true : this.isAdministrator()
                },
                sections: []
            };

            if (fieldElements.length > 0) {
                this.form.sections.push(
                    {
                        title: "Parameters",
                        display: {
                            titleHeader: "h4",
                            style: "margin-left: 20px",
                        },
                        elements: [...fieldElements]
                    }
                );
            }

            if (bodyElements.length > 0) {
                const bodyElementsT =
                    this.isNotEndPointAdmin() ? bodyElements :
                        this.isAdministrator() ? bodyElements:
                            this.disabledElements(bodyElements);

                this.form.sections.push({
                    title: "Body",
                    display: {
                        titleHeader: "h4",
                        style: "margin-left: 20px"
                    },
                    elements: [
                        {
                            type: "custom",
                            display: {
                                render: () => html`
                                        <detail-tabs
                                            .config="${this.getTabsConfig(bodyElementsT)}"
                                            .mode="${DetailTabs.PILLS_MODE}">
                                        </detail-tabs>
                                    `
                            }
                        }
                    ]
                });
            }

            if (this.opencgaSession?.study && fieldElements.some(field => field.name === "study")) {
                this.data = {...this.data, study: this.opencgaSession?.study?.fqn};
            }
            this.dataJson = {body: JSON.stringify(this.data?.body, undefined, 4)};
        } else {
            this.form = Types.dataFormConfig({
                type: "form",
                display: {
                    buttonClearText: "",
                    buttonOkText: "Try it out!",
                    labelWidth: "3",
                    defaultLayout: "horizontal",
                    buttonsVisible: this.isNotEndPointAdmin() ? true: this.isAdministrator()
                },
                sections: [{
                    elements: [{
                        type: "notification",
                        text: "No parameters...",
                        display: {
                            notificationType: "info",
                        },
                    }]
                }]
            });
        }
        this.requestUpdate();
    }

    opencgaSessionObserver() {
        if (this.opencgaSession?.study && this.data?.study) {
            this.data = {...this.data, study: this.opencgaSession?.study?.fqn};
        }
    }

    isAdministrator() {
        return this.opencgaSession?.user?.account?.type === "ADMINISTRATOR" || this.opencgaSession?.user.id === "OPENCGA";
    }

    isNotEndPointAdmin() {
        return !this.endpoint.path.includes("/admin/");
    }

    disabledElements(elements) {

        return elements.map(element => {
            const obj = {...element, display: {disabled: true}};
            return obj;
        });
    }

    sortArray(elements) {
        const _elements = elements;

        _elements.sort((a, b) => {
            const _nameA = a.name.toLowerCase();
            const _nameB = b.name.toLowerCase();

            // If both have the same required value, sort in alphabetical order
            if (a.required === b.required) {
                if (_nameA < _nameB) {
                    return -1;
                }

                if (_nameA > _nameB) {
                    return 1;
                }
            }

            if (a.required) {
                return -1;
            } else {
                return 1;
            }
        });

        return _elements;
    }


    onFormFieldChange(e, field) {
        const param = field || e.detail.param;
        // this.data = {...FormUtils.updateScalar(this._data, this.data, {}, param, e.detail.value)};

        if (param === "body") {
            this.dataJson = {...this.dataJson, body: e.detail.value};
            try {
                const dataObject = JSON.parse(e.detail.value);
                Object.keys(dataObject).forEach(key => {
                    if (key in this.data.body) {
                        this.data = {...this.data, body: {...this.data.body, [key]: dataObject[key]}};
                    }
                });
            } catch (error) {
                return false;
            }
        } else {
            this.data = {...FormUtils.createObject(this.data, param, e.detail.value)};
            this.dataJson = {body: JSON.stringify(this.data?.body, undefined, 4)};
        }
        this.requestUpdate();
        e.stopPropagation();
    }

    onFormClear() {
        this.dataJson = {};
        if (this.opencgaSession?.study && this.data?.study) {
            this.data = {study: this.opencgaSession.study.fqn};
        } else {
            this.data = {};
        }
        this._data = {};
        this.requestUpdate();
    }

    onSubmit() {

        let url = this.opencgaSession.opencgaClient._config.host + "/webservices/rest" + this.endpoint.path + "?";
        url += "sid=" + this.opencgaSession.opencgaClient._config.token;

        // Replace PATH params
        url = url.replace("{apiVersion}", this.opencgaSession.opencgaClient._config.version);
        this.endpoint.parameters
            .filter(parameter => parameter.param === "path")
            .forEach(parameter => {
                url = url.replace(`{${parameter.name}}`, this.data[parameter.name]);
            });

        // Add QUERY params
        this.endpoint.parameters
            .filter(parameter => parameter.param === "query" && this.data[parameter.name])
            .forEach(parameter => {
                url += `&${parameter.name}=${this.data[parameter.name]}`;
            });

        this.isLoading = true;
        this.requestUpdate();

        this.restClient.call(url, {})
            .then(response => {
                this.result = response.responses[0];
            })
            .catch(response => {
                NotificationUtils.dispatch(this, NotificationUtils.NOTIFY_RESPONSE, response);
            })
            .finally(() => {
                this.isLoading = false;
                this.requestUpdate();
            });
    }

    getJsonDataForm() {
        return {
            type: "form",
            buttons: {
                show: true,
                clearText: "Clear",
                okText: "Try it out!"
            },
            display: {
                width: "12",
                labelWidth: "3",
                defaultLayout: "horizontal",
            },
            sections: [
                {
                    title: "Individual General Information",
                    elements: [
                        {
                            title: "Individual id",
                            field: "id",
                            type: "input-text",
                            required: true,
                            display: {
                                placeholder: "Add an ID...",
                                rows: 10,
                                help: {
                                    text: "json data model"
                                }
                            }
                        }
                    ]
                }
            ]
        };
    }

    getUrlLinkModelClass(responseClass) {
        // https://github.com/opencb/opencga/blob/develop/opencga-core/src/main/java/org/opencb/opencga/core/models/user/UserFilter.java
        // https://github.com/opencb/biodata/blob/develop/biodata-models/src/main/avro/variantAnnotation.avdl
        // https://github.com/opencb/biodata/blob/develop/biodata-models/src/main/java/org/opencb/biodata/models/alignment/RegionCoverage.java

        // org.opencb.biodata.models.variant.avro.VariantAnnotation;
        // org.opencb.biodata.models.alignment.RegionCoverage;
        // org.opencb.commons.datastore.core.QueryResponse;

        if (responseClass.includes("opencb.opencga")) {
            return `https://github.com/opencb/opencga/blob/develop/opencga-core/src/main/java/${responseClass.replaceAll(".", "/").replace(";", "")}.java`;
        }

        if (responseClass.includes("avro")) {
            const response = responseClass.split(".");
            const className = response[response.length - 1].replace(";", "");
            const modelClassName = className => {
                return className.charAt(0).toLowerCase() + className.slice(1);
            };
            return `https://github.com/opencb/biodata/blob/develop/biodata-models/src/main/avro/${modelClassName(className)}.avdl`;
        }

        if (responseClass.includes("opencb.biodata") && !responseClass.includes("avro")) {
            return `https://github.com/opencb/biodata/blob/develop/biodata-models/src/main/java/${responseClass.replaceAll(".", "/").replace(";", "")}.java`;
        }
    }

    renderResponseClass(responseClass) {
        return responseClass.includes("opencga") || responseClass.includes("biodata") ? html `
            <a target="_blank" href="${this.getUrlLinkModelClass(this.endpoint.responseClass)}">${this.endpoint.responseClass}</a>
            ` : html `${this.endpoint.responseClass}`;
    }

    getTabsConfig(elements) {

        const configForm = {
            buttonsVisible: false,
            display: {
                buttonsVisible: false
            },
            sections: [{
                display: {
                    titleHeader: "h4",
                },
                elements: [...elements]
            }]

        };


        const configJson = {
            display: {
                buttonsVisible: false
            },
            sections: [{
                display: {
                    titleHeader: "h4",
                },
                elements: [
                    {
                        title: "Body",
                        field: "body",
                        type: "input-text",
                        required: true,
                        display: {
                            placeholder: "Data Json...",
                            rows: 10,
                            help: {
                                text: "json data model"
                            }
                        }
                    }
                ]
            }]
        };

        return {
            items: [
                {
                    id: "form",
                    name: "Form",
                    icon: "fab fa-wpforms",
                    active: true,
                    render: () => {
                        return html`
                        <!-- Body Forms -->
                            <data-form
                                .data="${this.data}"
                                .config="${configForm}"
                                @fieldChange="${e => this.onFormFieldChange(e)}"
                                @clear="${this.onFormClear}"
                                @submit="${this.onSubmit}">
                            </data-form>
                    `;
                    }
                },
                {
                    id: "json",
                    name: "JSON",
                    icon: "",
                    render: () => {
                        return html`
                        <!-- Body Json -->
                            <data-form
                                .data="${this.dataJson}"
                                .config="${configJson}"
                                @fieldChange="${e => this.onFormFieldChange(e)}"
                                @clear="${this.onFormClear}"
                                @submit="${this.onSubmit}">
                            </data-form>
                    `;
                    }
                }
            ]
        };
    }

    render() {
        if (!this.endpoint) {
            return;
        }

        return html`
            <div class="panel panel-default">
                <div class="panel-body">
                    <!-- Header Section-->
                    <h4>
                        <span style="margin-right: 10px; font-weight: bold; color:${this.methodColor[this.endpoint.method]}">
                            ${this.endpoint.method}
                        </span>
                        ${this.endpoint.path}
                    </h4>
                    <div class="help-block" style="margin: 0 10px">
                        ${this.endpoint.description}
                    </div>

                    <!-- Response Section-->
                    <div style="padding: 5px 10px">
                        <h3>Response</h3>
                        <div>
                            <div>Type: ${this.endpoint.response} (Source code: ${this.renderResponseClass(this.endpoint.responseClass)})</div>
                        </div>
                    </div>

                    <!-- Parameters Section-->
                    <div style="padding: 5px 10px">
                        <!-- <h3>Parameters</h3> -->

                        <div style="padding: 20px">
                            <data-form
                                .data="${this.data}"
                                .config="${this.form}"
                                @fieldChange="${e => this.onFormFieldChange(e)}"
                                @clear="${this.onFormClear}"
                                @submit="${this.onSubmit}">
                            </data-form>
                        </div>
                    </div>

                    <!-- Results Section-->
                    <div style="padding: 5px 10px">
                        <h3>Results</h3>
                        <div style="padding: 20px">
                            ${this.isLoading ? html`
                                <loading-spinner></loading-spinner>
                            ` : html`
                                <json-viewer
                                    .data="${this.result}"
                                    .config="${this.form}">
                                </json-viewer>
                            `}

                        </div>
                    </div>
                </div>
            </div>
        `;
    }

}

customElements.define("rest-endpoint", RestEndpoint);
