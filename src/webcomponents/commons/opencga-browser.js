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

import {LitElement, html, nothing} from "lit";
import UtilsNew from "../../core/utilsNew.js";
import "./opencga-facet-result-view.js";
import "./opencga-active-filters.js";
import "./forms/select-field-filter.js";
import "./opencb-facet-results.js";
import "./facet-filter.js";
import "../loading-spinner.js";
import "./tool-header.js";

export default class OpencgaBrowser extends LitElement {

    constructor() {
        super();

        // Set status and init private properties
        this._init();
    }

    createRenderRoot() {
        return this;
    }

    static get properties() {
        return {
            resource: {
                type: String
            },
            opencgaSession: {
                type: Object
            },
            cellbaseClient: {
                type: Object
            },
            query: {
                type: Object
            },
            // query object sent to Opencga client (includes this.selectedFacet serialised)
            facetQuery: {
                type: Object
            },
            // complex object that keeps track of the values of all facets
            selectedFacet: {
                type: Object
            },
            config: {
                type: Object
            }
        };
    }

    _init() {
        this._prefix = "facet" + UtilsNew.randomString(6);

        this.query = {};
        this.preparedQuery = {};
        this.executedQuery = {};

        this.checkProjects = false;

        this.activeFilterAlias = {
        };

        this.selectedFacet = {};
        this.preparedFacetQueryFormatted = {};
        this.activeTab = {};
        this.detail = {};
    }

    connectedCallback() {
        super.connectedCallback();
        // we don't need _config here
    }

    firstUpdated(_changedProperties) {
        $(".bootstrap-select", this).selectpicker();
        UtilsNew.initTooltip(this);
    }

    update(changedProperties) {
        if (changedProperties.has("opencgaSession")) {
            this.opencgaSessionObserver();
        }
        if (changedProperties.has("query")) {
            this.queryObserver();
        }
        if (changedProperties.has("selectedFacet")) {
            this.facetQueryBuilder();
        }
        super.update(changedProperties);
    }

    opencgaSessionObserver() {
        if (this?.opencgaSession?.study?.fqn) {
            this.checkProjects = true;
            this.query = {study: this.opencgaSession.study.fqn};

            this.preparedQuery = {study: this.opencgaSession.study.fqn};
            this.facetQuery = null;
            this.preparedFacetQueryFormatted = null;
            // this.requestUpdate();
            // this.onRun();

            // this.requestUpdate().then(() => $(".bootstrap-select", this).selectpicker());
        } else {
            this.checkProjects = false;
        }
    }

    queryObserver() {
        if (this?.opencgaSession?.study?.fqn) {
            // NOTE UtilsNew.objectCompare avoid repeating remote requests.
            if (!UtilsNew.objectCompare(this.query, this._query)) {
                this._query = this.query;
                if (this.query) {
                    this.preparedQuery = {study: this.opencgaSession.study.fqn, ...this.query};
                    this.executedQuery = {study: this.opencgaSession.study.fqn, ...this.query};
                } else {
                    this.preparedQuery = {study: this.opencgaSession.study.fqn};
                    this.executedQuery = {study: this.opencgaSession.study.fqn};
                }
                // onServerFilterChange() in opencga-active-filters fires an activeFilterChange event when the Filter dropdown is used
                this.dispatchEvent(new CustomEvent("queryChange", {
                    detail: this.preparedQuery
                }));
                this.detail = {};
            } else {
                // console.error("same queries")
            }
            // this.requestUpdate();
        }
    }

    facetQueryBuilder() {
        if (Object.keys(this.selectedFacet).length) {
            this.executedFacetQueryFormatted = {...this.preparedFacetQueryFormatted};

            this.facetQuery = {
                ...this.preparedQuery,
                study: this.opencgaSession.study.fqn,
                // timeout: 60000,
                field: Object.values(this.preparedFacetQueryFormatted).map(v => v.formatted).join(";")
            };
            this._changeView("facet-tab");
        } else {
            this.facetQuery = null;
        }
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

    async onRun() {
        // NOTE notifySearch() triggers this chain: notifySearch -> onQueryFilterSearch() on iva-app.js -> this.queries updated -> queryObserver() in opencga-browser
        // queryObserver() here stops the repetition of the remote request by checking if it has changed
        // TODO do the same with facetQuery
        this.query = {...this.preparedQuery};
        // updates this.queries in iva-app
        this.notifySearch(this.preparedQuery);

        this.facetQueryBuilder();
        // this.requestUpdate();

        /* if (Object.keys(this.selectedFacet).length) {
            this.facetQuery = {
                ...this.preparedQuery,
                study: this.opencgaSession.study.fqn,
                // timeout: 60000,
                field: Object.values(this.preparedFacetQueryFormatted).map(v => v.formatted).join(";")
            };
            this._changeView("facet-tab");
        } else {
            this.facetQuery = null;
        }*/
    }

    onFilterChange(e) {
        this.query = e.detail;
    }

    onClickPill(e) {
        this._changeView(e.currentTarget.dataset.id);
    }

    _changeView(tabId) {
        $(".content-pills", this).removeClass("active");
        $(".content-tab", this).removeClass("active");
        Object.keys(this.activeTab).forEach(tab => {
            this.activeTab[tab] = false;
        });
        $(`button.content-pills[data-id=${tabId}]`, this).addClass("active");
        $("#" + tabId, this).addClass("active");
        this.activeTab[tabId] = true;
        this.requestUpdate();
    }

    onQueryFilterChange(e) {
        // console.log("onQueryFilterChange")
        this.preparedQuery = e.detail.query;
        this.requestUpdate();
    }

    // TODO review
    // this is used only in case of Search button inside filter component. Only in Clinical Analysis Browser.
    onQueryFilterSearch(e) {
        this.dispatchEvent(new CustomEvent("querySearch", {
            detail: {
                query: e.detail.query
            }
        }));
    }

    onActiveFilterChange(e) {
        // console.log("onActiveFilterChange");
        this.preparedQuery = {study: this.opencgaSession.study.fqn, ...e.detail};
        this.query = {study: this.opencgaSession.study.fqn, ...e.detail};
        this.facetQueryBuilder();
    }

    onActiveFilterClear() {
        // console.log("onActiveFilterClear");
        this.query = {study: this.opencgaSession.study.fqn};
        this.preparedQuery = {...this.query};
        this.facetQueryBuilder();
    }

    onFacetQueryChange(e) {
        // console.log("onFacetQueryChange");
        this.preparedFacetQueryFormatted = e.detail.value;
        // this.facetQueryBuilder();
        this.requestUpdate();
    }

    onActiveFacetChange(e) {
        this.selectedFacet = {...e.detail};
        this.preparedFacetQueryFormatted = {...e.detail};
        // this.onRun(); // TODO the query should be repeated every action on active-filter (delete, clear, load from Saved filter)
        this.facetQueryBuilder();
        this.requestUpdate();
    }

    onActiveFacetClear(e) {
        this.selectedFacet = {};
        this.onRun();
        this.requestUpdate();
    }

    onClickRow(e, resource) {
        this.detail = {...this.detail, [resource]: e.detail.row};
        this.requestUpdate();
    }

    renderView() {

        if (!this.config.views) {
            return html`No view has been configured`;
        }

        const params = {
            opencgaSession: this.opencgaSession,
            config: this.config,
            executedQuery: this.executedQuery,
            detail: this.detail,
            resource: this.resource,
            facetQuery: this.facetQuery,
            facetResults: this.facetResults,
            eventNotifyName: this.eventNotifyName,
            activeTab: name => this.activeTab[name],
            onClickRow: (e, eventName) => this.onClickRow(e, eventName),
        };

        return this.config.views.map(view =>
            html`
                <div id="${view.id}" class="content-tab ${view?.active?"active":""}">
                    ${view.render(params)}
                </div>
            `);
    }

    renderfilter() {

        if (!this.config?.filter) {
            return html`${nothing}`;
        }

        const params = {
            opencgaSession: this.opencgaSession,
            config: this.config,
            query: this.query,
            onQueryFilterChange: this.onQueryFilterChange,
            onQueryFilterSearch: this.onQueryFilterSearch
        };

        return html`
            <div role="tabpanel" class="tab-pane active" id="filters_tab">
                ${this.config.filter.render(params)}
            </div>`;
    }

    renderAggregation() {

        if (!this.config?.aggregation) {
            return html`${nothing}`;
        }

        const params = {
            config: this.config,
            selectedFacet: this.selectedFacet,
            onFacetQueryChange: this.onFacetQueryChange
        };


        return html `
            <div role="tabpanel" class="tab-pane" id="facet_tab" aria-expanded="true">
                ${this.config.aggregation.render(params)}
            </div>`;
    }

    renderButtonViews() {

        if (!this.config.views) {
            return html`No view has been configured`;
        }

        return html `
            <div class="btn-group content-pills" role="toolbar" aria-label="toolbar">
                <div class="btn-group" role="group" style="margin-left: 0px">
                    ${this.config.views.map(tab => html`
                        <button
                            type="button"
                            class="btn btn-success content-pills ${tab.active ? "active" : ""}"
                            ?disabled=${tab.disabled}
                            @click="${this.onClickPill}"
                            data-id="${tab.id}">
                            <i class="${tab.icon ?? "fa fa-table"} icon-padding" aria-hidden="true"></i> ${tab.name}
                        </button>`
                    )}
                </div>
            </div>
        `;
    }

    render() {
        if (!this.opencgaSession?.study?.fqn) {
            return html`
                <div class="guard-page">
                    <i class="fas fa-lock fa-5x"></i>
                    <h3>No public projects available to browse. Please login to continue</h3>
                </div>
            `;
        }

        return html`
            <tool-header
                .title="${this.config.title}"
                .icon="${this.config.icon}">
            </tool-header>
            <div class="row">
                <div class="col-md-2">
                    <div class="search-button-wrapper">
                        <button type="button" class="btn btn-primary ripple" @click="${this.onRun}">
                            <i class="fa fa-arrow-circle-right" aria-hidden="true"></i> 
                            ${this.config.searchButtonText || "Search"}
                        </button>
                    </div>
                    <ul class="nav nav-tabs left-menu-tabs" role="tablist">
                        <li role="presentation" class="active">
                            <a href="#filters_tab" aria-controls="filter" role="tab" data-toggle="tab">Filters</a>
                        </li>
                        ${this.config.aggregation ? html`
                            <li role="presentation">
                                <a href="#facet_tab" aria-controls="aggregation" role="tab" data-toggle="tab">Aggregation</a>
                            </li>
                        ` : null}
                    </ul>
                    <div class="tab-content">
                        ${this.renderfilter()}
                        ${this.renderAggregation()}
                    </div>
                </div>
                <div class="col-md-10">
                    ${this.renderButtonViews()}
                    <div>
                        <opencga-active-filters
                            facetActive
                            .resource="${this.resource}"
                            .opencgaSession="${this.opencgaSession}"
                            .defaultStudy="${this.opencgaSession?.study?.fqn}"
                            .query="${this.preparedQuery}"
                            .executedQuery="${this.executedQuery}"
                            .facetQuery="${this.preparedFacetQueryFormatted}"
                            .executedFacetQuery="${this.executedFacetQueryFormatted}"
                            .alias="${this.activeFilterAlias}"
                            .config="${this.config.activeFilters}"
                            .filters="${this.config.filter.examples}"
                            @activeFilterChange="${this.onActiveFilterChange}"
                            @activeFilterClear="${this.onActiveFilterClear}"
                            @activeFacetChange="${this.onActiveFacetChange}"
                            @activeFacetClear="${this.onActiveFacetClear}">
                        </opencga-active-filters>

                        <div class="main-view">
                            ${this.renderView()}
                        </div>
                        <!-- Other option: return an {string, TemplateResult} map -->
                        <div class="v-space"></div>
                    </div>
                </div>
            </div>
        `;
    }

}

customElements.define("opencga-browser", OpencgaBrowser);
