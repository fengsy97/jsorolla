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
import RestClient from "../../core/clients/rest-client.js";
import "../commons/json-viewer.js";
import "../commons/json-editor.js";

import RestUtils from "./rest-utils.js";
import "./opencga-rest-input.js";
import "./opencga-rest-result.js";

export default class OpencgaRestEndpoint extends LitElement {

    constructor() {
        super();

        this.#init();
    }

    createRenderRoot() {
        return this;
    }

    static get properties() {
        return {
            endpoint: {
                type: Object,
            },
            opencgaSession: {
                type: Object,
            },
        };
    }

    #init() {
        this.restClient = new RestClient();
        this.isLoading = false;
        // FIXME: to refactor
        this.methodColor = {
            "GET": "blue",
            "POST": "darkorange",
            "DELETE": "red"
        };
    }

    update(changedProperties) {
        if (changedProperties.has("opencgaSession")) {
            this.opencgaSessionObserver();
        }
        super.update(changedProperties);
    }

    opencgaSessionObserver() {
        if (this.opencgaSession?.study && this.data?.param?.study) {
            this.data.param = {...this.data.param, study: this.opencgaSession?.study?.fqn};
        }
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
            const modelClassName = name => {
                return name.charAt(0).toLowerCase() + name.slice(1);
            };
            return `https://github.com/opencb/biodata/blob/develop/biodata-models/src/main/avro/${modelClassName(className)}.avdl`;
        }

        if (responseClass.includes("opencb.biodata") && !responseClass.includes("avro")) {
            return `https://github.com/opencb/biodata/blob/develop/biodata-models/src/main/java/${responseClass.replaceAll(".", "/").replace(";", "")}.java`;
        }
    }

    renderResponseClass(responseClass) {
        return responseClass.includes("opencga") || responseClass.includes("biodata") ? html`
            <a target="_blank"
               href="${this.getUrlLinkModelClass(this.endpoint.responseClass)}">${this.endpoint.responseClass}</a>
        ` : html`${this.endpoint.responseClass}`;
    }

    onSubmit() {
        this.result = e.detail.value;
        this.requestUpdate();
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
                        <h3>Response Type</h3>
                        <div>
                            <div>Type: ${this.endpoint.response} (Source code:
                                ${this.renderResponseClass(this.endpoint.responseClass)})
                            </div>
                        </div>
                    </div>

                    <!-- Parameters Section-->
                    <div style="padding: 5px 10px">
                        <opencga-rest-input
                            .endpoint="${this.endpoint}"
                            .opencgaSession="${this.opencgaSession}"
                            .bodyMode="${"json"}"
                            @sumbit="${this.onSubmit}"
                        ></opencga-rest-input>
                    </div>

                    <!-- Results Section -->
                    <div style="padding: 5px 10px">
                        <opencga-rest-result
                            .result="${this.result}"
                        ></opencga-rest-result>
                    </div>

                </div>
            </div>
        `;
    }

    getDefaultConfig() {
        return {
            type: "form",
            display: {
                width: "12",
                labelWidth: "3",
                defaultLayout: "horizontal",
                buttonClearText: "Clear",
                buttonOkText: "Try it out!",
                buttonsVisible: (this.endpoint?.method === "GET" || this.endpoint?.method === "DELETE") && (RestUtils.isNotEndPointAdmin(this.endpoint) || RestUtils.isAdministrator(this.opencgaSession))
            },
            sections: [],
        };
    }

}

customElements.define("opencga-rest-endpoint", OpencgaRestEndpoint);

