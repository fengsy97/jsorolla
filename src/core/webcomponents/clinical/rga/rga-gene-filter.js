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

import {LitElement, html} from "/web_modules/lit-element.js";
import UtilsNew from "../../../utilsNew.js";
import GridCommons from "../../commons/grid-commons.js";
import CatalogGridFormatter from "../../commons/catalog-grid-formatter.js";
import "../../commons/filters/text-field-filter.js";
import "../../commons/filters/feature-filter.js";
import "../../commons/filters/variant-type-filter.js";
import "../../commons/filters/cohort-stats-filter.js";
import "../../commons/filters/consequence-type-select-filter.js";
import "../../commons/filters/clinvar-accessions-filter.js";


export default class RgaGeneFilter extends LitElement {

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
            query: {
                type: Object
            },
            config: {
                type: Object
            }
        };
    }


    _init() {
        // super.ready();
        this._prefix = "rga-" + UtilsNew.randomString(6) + "_";
        this.query = {};
        this.preparedQuery = {};
        this.searchButton = true;
    }

    connectedCallback() {
        super.connectedCallback();
        // this._config = {...this.getDefaultConfig(), ...this.config};
        this.preparedQuery = {...this.query}; // propagates here the iva-app query object
    }

    firstUpdated(_changedProperties) {
        super.firstUpdated(_changedProperties);
        UtilsNew.initTooltip(this);
    }

    updated(changedProperties) {
        if (changedProperties.has("query")) {
            this.queryObserver();
        }
        if (changedProperties.has("opencgaSession")) {
            // this.updateVariableSets();
        }
    }

    onSearch() {
        this.notifySearch(this.preparedQuery);
    }

    queryObserver() {
        console.log("queryObserver()", this.query);
        this.preparedQuery = this.query || {};
        this.requestUpdate();
    }

    onFilterChange(key, value) {
        console.log("filterChange", {[key]: value});
        if (value && value !== "") {
            this.preparedQuery = {...this.preparedQuery, ...{[key]: value}};
        } else {
            console.log("deleting", key, "from preparedQuery");
            delete this.preparedQuery[key];
            this.preparedQuery = {...this.preparedQuery};
        }
        this.notifyQuery(this.preparedQuery);
        this.requestUpdate();
    }

    notifyQuery(query) {
        this.dispatchEvent(new CustomEvent("queryChange", {
            detail: {
                query: query
            },
            bubbles: true,
            composed: true
        }));
    }

    notifySearch(query) {
        this.dispatchEvent(new CustomEvent("querySearch", {
            detail: {
                query: query
            },
            bubbles: true,
            composed: true
        }));
    }

    _createSection(section) {
        const htmlFields = section.fields && section.fields.length && section.fields.map(subsection => this._createSubSection(subsection));
        return this.config.sections.length > 1 ? html`<section-filter .config="${section}" .filters="${htmlFields}">` : htmlFields;
    }

    _createSubSection(subsection) {
        let content = "";
        switch (subsection.id) {
            case "id":
                content = html`<text-field-filter placeholder="${subsection.placeholder}" .value="${this.preparedQuery[subsection.id]}" .separator="${",;"}" @filterChange="${e => this.onFilterChange(subsection.id, e.detail.value)}"></text-field-filter>`;
                break;
            case "geneName":
                content = html`<feature-filter placeholder="${subsection.placeholder}" .cellbaseClient="${this.cellbaseClient}" .value="${this.preparedQuery[subsection.id]}" .separator="${",;"}" @filterChange="${e => this.onFilterChange(subsection.id, e.detail.value)}"></feature-filter>`;
                break;
            case "cohort":
                content = html`<cohort-stats-filter .opencgaSession="${this.opencgaSession}" .onlyCohortAll=${true} .cohortStatsAlt="${this.preparedQuery[subsection.id]}" @filterChange="${e => this.onFilterChange(subsection.id, e.detail.value)}">
                            </cohort-stats-filter>`;
                break;
            case "populationFrequencyAlt":
                content = html`<population-frequency-filter .populationFrequencies="${populationFrequencies}" ?showSetAll="${subsection.showSetAll}" .populationFrequencyAlt="${this.preparedQuery[subsection.id]}" @filterChange="${e => this.onFilterChange("populationFrequencyAlt", e.detail.value)}"></population-frequency-filter>`;
                break;
            case "type":
                content = html`<variant-type-filter .type="${this.preparedQuery[subsection.id]}" .config="${subsection}" @filterChange="${e => this.onFilterChange(subsection.id, e.detail.value)}"></variant-type-filter>`;
                break;
            case "consequenceType":
                content = html`<consequence-type-select-filter .ct="${this.preparedQuery[subsection.id]}" .config="${subsection}" @filterChange="${e => this.onFilterChange(subsection.id, e.detail.value)}"></consequence-type-select-filter>`;
                break;
            case "clinicalSignificance":
                content = html`<clinvar-accessions-filter .config="${{clinvar: false}}" .clinicalSignificance="${this.preparedQuery[subsection.id]}" @filterChange="${e => this.onFilterChange(subsection.id, e?.detail?.value?.clinicalSignificance)}"></clinvar-accessions-filter>`;
                break;
            case "familyMember":
                content = html`<checkbox-field-filter .value="${this.preparedQuery[subsection.id]}" .data="${subsection.allowedValues}" @filterChange="${e => this.onFilterChange(subsection.id, e.detail.value)}"></checkbox-field-filter>`;
                break;
            case "probandOnly":
                content = html`
                    <div class="form-horizontal">
                        <div class="from-group form-inline">
                            <input class="magic-radio" type="radio" name="${subsection.id}" id="${this._prefix + subsection.id}yes" ?checked=${subsection.value === "yes"} value="yes" @change="${e => this.onFilterChange(subsection.id, "yes")}"><label class="magic-horizontal-label" for="${this._prefix + subsection.id}yes"> Yes </label>
                            <input class="magic-radio" type="radio" name="${subsection.id}" id="${this._prefix + subsection.id}no" ?checked=${subsection.value === "no"} value="no" @change="${e => this.onFilterChange(subsection.id, "yes")}"> <label class="magic-horizontal-label" for="${this._prefix + subsection.id}no"> No </label>
                        </div>
                    </div>
                `;
                break;
            default:
                console.error("Filter component not found", subsection?.id);
        }
        return html`
                    <div class="form-group">
                        <div class="browser-subsection" id="${subsection.id}">${subsection.name}
                            ${subsection.description ? html`
                                <div class="tooltip-div pull-right">
                                    <a tooltip-title="${subsection.name}" tooltip-text="${subsection.description}"><i class="fa fa-info-circle" aria-hidden="true"></i></a>
                                </div>` : null }
                        </div>
                        <div id="${this._prefix}${subsection.id}" class="subsection-content">
                            ${content}
                         </div>
                    </div>
                `;
    }

    render() {
        return html`${this.searchButton ? html`
            <div class="search-button-wrapper">
                <button type="button" class="btn btn-primary ripple" @click="${this.onSearch}">
                    <i class="fa fa-search" aria-hidden="true"></i> Search
                </button>
            </div>
            ` : null}

        <div class="panel-group" id="${this._prefix}Accordion" role="tablist" aria-multiselectable="true">
            <div class="">
                ${this.config.sections && this.config.sections.length ? this.config.sections.map(section => this._createSection(section)) : html`No filter has been configured.`}
            </div>
        </div>
        `;
    }

}

customElements.define("rga-gene-filter", RgaGeneFilter);
