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
import UtilsNew from "../../core/utilsNew.js";
import PolymerUtils from "../PolymerUtils.js";

import LitUtils from "../commons/utils/lit-utils.js";
import NotificationUtils from "../commons/utils/notification-utils.js";

import "./clinical-analysis-grid.js";
import "./clinical-analysis-view.js";
import "../commons/filters/clinical-analysis-id-autocomplete.js";
import "../commons/filters/sample-id-autocomplete.js";
import "../commons/filters/family-id-autocomplete.js";
import "../commons/filters/catalog-distinct-autocomplete.js";
import "./filters/clinical-priority-filter.js";
import "./filters/clinical-status-filter.js";
import "../commons/view/detail-tabs.js";

export default class OpencgaClinicalReviewCases extends LitElement {

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
            query: {
                type: Object
            },
            config: {
                type: Object
            },
            settings: {
                type: Object
            }
        };
    }

    _init() {
        this._prefix = "ocrc-" + UtilsNew.randomString(6);
        this._filters = [];
        this.resource = "CLINICAL_ANALYSIS";
        this.query = {};
        this.checkProjects = false;
    }

    connectedCallback() {
        super.connectedCallback();
        // settings is a prop, therefore the first render is performed without it
        this._config = {...this.getDefaultConfig(), ...this.config};

    }

    update(changedProperties) {
        if (changedProperties.has("settings")) {
            this.settingsObserver();
        }
        if (changedProperties.has("opencgaSession")) {
            this.opencgaSessionObserver();
        }
        if (changedProperties.has("opencgaSession") || changedProperties.has("query") || changedProperties.has("config")) {
            this.propertyObserver();
        }
        super.update(changedProperties);
    }

    opencgaSessionObserver() {
        // console.error(this._config.filter)
        this.filters = this._config?.filter?.examples;
        if (this?.opencgaSession?.study) {
            this.checkProjects = true;
            this.refreshFilters();
            this.users = this.opencgaSession.study.groups.find(group => group.id === "@members" || group.name === "@members").userIds;
        } else {
            this.checkProjects = false;
        }
    }

    propertyObserver() {
        this.settingsObserver();

        if (UtilsNew.isNotUndefinedOrNull(this.query)) {
            this._query = {...this.query};
        }
        // this.requestUpdate();
    }

    settingsObserver() {
        this._config = {...this.getDefaultConfig(), ...this.config};
        // filter list and canned filters
        if (this.settings?.menu) {
            this._config.filter = UtilsNew.mergeFiltersAndDetails(this._config?.filter, this.settings);
        }

        if (this.settings?.table) {
            this._config.grid = {...this._config.grid, ...this.settings.table};
        }
        if (this.settings?.table?.toolbar) {
            this._config.grid.toolbar = {...this._config.grid.toolbar, ...this.settings.table.toolbar};
        }

        // this.requestUpdate();
    }

    isLoggedIn() {
        return !!this?.opencgaSession?.token;
    }

    clear(e) {
        this._filters = this._filters.map(f => ({...f, active: false}));
        this.query = {};
    }

    onSelectClinicalAnalysis(e) {
        this.clinicalAnalysis = e.detail.row;
        this.requestUpdate();
    }

    onServerFilterChange(e) {
        // suppress if I have clicked on an action buttons
        if (e.target?.dataset?.action === "delete-filter") {
            return;
        }
        const {filterId} = e.currentTarget.dataset;
        this._filters = this._filters.map(f => {
            if (f.id === filterId) {
                this.query = f.query;
                return ({...f, active: true});
            } else {
                return ({...f, active: false});
            }
        });
        this.requestUpdate();
    }

    serverFilterDelete(e) {
        const {filterId} = e.currentTarget.dataset;
        Swal.fire({
            title: "Are you sure?",
            text: "The filter will be deleted. The operation cannot be reverted.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes"
        }).then(result => {
            if (result.value) {
                const data = {
                    id: filterId,
                    resource: this.resource,
                    options: {}
                };
                this.opencgaSession.opencgaClient.users().updateFilters(this.opencgaSession.user.id, data, {
                    action: "REMOVE",
                })
                    .then(() => {
                        // console.log("response", response);
                        NotificationUtils.dispatch(this, NotificationUtils.NOTIFY_SUCCESS, {
                            message: "Filter has been deleted",
                        });
                        this.refreshFilters();
                    }).catch(response => {
                        NotificationUtils.dispatch(this, NotificationUtils.NOTIFY_RESPONSE, response);
                    });
            }
        });
    }

    launchModal() {
        $("#" + this._prefix + "SaveModal").modal("show");
    }

    refreshFilters() {
        this.opencgaSession.opencgaClient.users().filters(this.opencgaSession.user.id).then(restResponse => {
            const result = restResponse.getResults();
            // (this.filters || []) in case this.filters (prop) is undefined
            if (result.length > 0) {
                this._filters = [...(this.filters || []), ...result.filter(f => f.resource === this.resource)];
            } else {
                this._filters = [...(this.filters || [])];
            }
            this.requestUpdate();
            this.updateComplete.then(() => UtilsNew.initTooltip(this));
        });
    }

    save() {
        const filterName = PolymerUtils.getValue(this._prefix + "filterName");
        const filterDescription = PolymerUtils.getValue(this._prefix + "filterDescription");

        const query = this.query;
        if (query.study) {
            // filters out the current active study
            const studies = query.study.split(",").filter(fqn => fqn !== this.opencgaSession.study.fqn);
            if (studies.length) {
                query.study = studies.join(",");
            } else {
                delete query.study;
            }
        }
        // console.log("QUERY SAVED:", query)

        this.opencgaSession.opencgaClient.users().filters(this.opencgaSession.user.id)
            .then(restResponse => {
                const savedFilters = restResponse.getResults() || [];

                if (savedFilters.find(savedFilter => savedFilter.id === filterName)) {
                    // updating an existing filter
                    const data = {
                        description: filterDescription,
                        query: query,
                        options: {},
                    };

                    Swal.fire({
                        title: "Are you sure?",
                        text: "A Filter with the same name is already present. You are going to overwrite it.",
                        icon: "warning",
                        showCancelButton: true,
                        confirmButtonColor: "#d33",
                        cancelButtonColor: "#3085d6",
                        confirmButtonText: "Yes"
                    }).then(result => {
                        if (result.value) {
                            this.opencgaSession.opencgaClient.users().updateFilter(this.opencgaSession.user.id, filterName, data)
                                .then(response => {
                                    if (response?.getEvents?.("ERROR")?.length) {
                                        return NotificationUtils.dispatch(this, NotificationUtils.NOTIFY_RESPONSE, response);
                                    }

                                    // Update filters
                                    for (const i in this._filters) {
                                        if (this._filters[i].id === filterName) {
                                            this._filters[i] = response.response[0].result[0];
                                        }
                                    }
                                    $("#" + this._prefix + "filterName").val("");
                                    $("#" + this._prefix + "filterDescription").val("");

                                    // Display confirmation message
                                    NotificationUtils.dispatch(this, NotificationUtils.NOTIFY_SUCCESS, {
                                        message: "Filter has been saved",
                                    });

                                    this.requestUpdate();
                                    this.updateComplete.then(() => UtilsNew.initTooltip(this));
                                }).catch(response => {
                                    NotificationUtils.dispatch(this, NotificationUtils.NOTIFY_RESPONSE, response);
                                });
                        }
                    });

                } else {
                    // saving a new filter
                    const data = {
                        id: filterName,
                        description: filterDescription,
                        resource: this.resource,
                        query: query,
                        options: {}
                    };
                    this.opencgaSession.opencgaClient.users().updateFilters(this.opencgaSession.user.id, data, {action: "ADD"})
                        .then(response => {
                            if (response.getEvents?.("ERROR")?.length) {
                                return NotificationUtils.dispatch(this, NotificationUtils.NOTIFY_RESPONSE, response);
                            }

                            // Update filters
                            this._filters = [...this._filters, data];
                            $("#" + this._prefix + "filterName").val("");
                            $("#" + this._prefix + "filterDescription").val("");

                            // Display confirmation message
                            NotificationUtils.dispatch(this, NotificationUtils.NOTIFY_SUCCESS, {
                                message: "Filter has been saved",
                            });

                            this.requestUpdate();
                            this.updateComplete.then(() => UtilsNew.initTooltip(this));
                        }).catch(response => {
                            NotificationUtils.dispatch(this, NotificationUtils.NOTIFY_RESPONSE, response);
                        });
                }

            })
            .catch(response => {
                NotificationUtils.dispatch(this, NotificationUtils.NOTIFY_RESPONSE, response);
            });
    }

    onFilterChange(key, value) {
        if (value && value !== "") {
            this.query = {...this.query, ...{[key]: value}};
        } else {
            delete this.query[key];
            this.query = {...this.query};
        }
    }

    getDefaultConfig() {
        return {
            title: "Review Portal",
            showTitle: true,
            filter: {
                sections: [
                    {
                        id: "main",
                        title: "",
                        filters: [
                            {
                                id: "case"
                            },
                            {
                                id: "sample"
                            },
                            {
                                id: "proband"
                            },
                            {
                                id: "family"
                            },
                            {
                                id: "disorder"
                            },
                            {
                                id: "type"
                            },
                            {
                                id: "status"
                            },
                            {
                                id: "priority"
                            },
                            {
                                id: "assignee"
                            }
                        ]
                    }
                ],
                examples: [
                    {
                        id: "Intellectual disability",
                        active: false,
                        query: {
                            disorder: "Intellectual disability"
                        }
                    }
                ],
                detail: {
                    title: "Case Study",
                    showTitle: true,
                    items: [
                        {
                            id: "clinical-analysis-view",
                            name: "Overview",
                            active: true,
                            render: (clinicalAnalysis, active, opencgaSession) => html`
                                <clinical-analysis-view
                                    .opencgaSession="${opencgaSession}"
                                    .clinicalAnalysisId="${clinicalAnalysis.id}"
                                    .settings="${OPENCGA_CLINICAL_ANALYSIS_VIEW_SETTINGS}">
                                </clinical-analysis-view>
                            `,
                        },
                        {
                            id: "proband-view",
                            name: "Proband",
                            render: (clinicalAnalysis, active, opencgaSession) => html`
                                <individual-view
                                    .opencgaSession="${opencgaSession}"
                                    .individual="${clinicalAnalysis.proband}">
                                </individual-view>
                            `,
                        }
                    ]
                }
            },
            grid: {
                pageSize: 5,
                pageList: [5, 10, 25, 50],
                detailView: false,
                multiSelection: false,
                showActions: true,
                toolbar: {
                    showColumns: true,
                    showCreate: true,
                    showExport: true,
                    showDownload: true
                }
            },
            view: {}
        };
    }

    render() {
        return this.checkProjects ? html`
            <style>

                .filter-button {
                    color: rgb(153, 153, 153);
                }

                .ocap-text-button {
                    display: inline-block;
                    overflow: hidden;
                    width: 90px;
                    text-align: left;
                    float: left !important;
                }

                .filter-label {
                    margin: auto 10px;
                    white-space: nowrap
                }

                .browser-variant-tab-title {
                    font-size: 115%;
                    font-weight: bold;
                }

                .horizontal-flex {
                    display: flex;
                }

                .horizontal-flex > div {
                    padding: 5px;
                    flex: 1;
                    box-sizing: border-box;
                }

                .horizontal-flex > div label {
                    display: block
                }

                .clinical-right-buttons {
                    float: right;
                    padding: 7px;
                }
            </style>

            <div class="row">
                <div class="col-md-10 col-md-offset-1">
                    <div style="">
                        <form @submit="${() => console.log("submit")}">
                            <div class="panel panel-default" style="margin-bottom: 10px">
                                <!--<div class="panel-heading">Case Filters</div>-->
                                <div class="panel-body" style="padding: 10px">
                                    <div class="lhs case-portal">

                                        <div class="dropdown saved-filter-dropdown" style="margin-right: 5px">
                                            <button type="button" class="active-filter-label ripple no-shadow" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"
                                                    data-cy="filter-button">
                                                <i class="fa fa-filter icon-padding" aria-hidden="true"></i> Filters <span class="caret"></span>
                                            </button>
                                            <ul class="dropdown-menu saved-filter-wrapper">
                                                ${this._filters && this._filters.length ? html`
                                                        <li>
                                                            <a><i class="fas fa-cloud-upload-alt icon-padding"></i> <strong>Saved Filters</strong></a>
                                                        </li>

                                                        ${this._filters.map(item => item.separator ?
                                                            html`
                                                                <li role="separator" class="divider"></li>` :
                                                            html`
                                                                <li>
                                                                    <a data-filter-id="${item.id}" class="filtersLink" style="cursor: pointer;color: ${!item.active ? "black" : "green"}"
                                                                        @click="${this.onServerFilterChange}">
                                                                        <span class="id-filter-button">${item.id}</span>
                                                                        <span class="action-buttons">
                                                                    <span tooltip-title="${item.id}"
                                                                            tooltip-text="${(item.description ? item.description + "<br>" : "") + Object.entries(item.query).map(([k, v]) => `<b>${k}</b> = ${v}`).join("<br>")}"
                                                                            data-filter-id="${item.id}">
                                                                        <i class="fas fa-eye"></i>
                                                                    </span>
                                                                    <i data-cy="delete" tooltip-title="Delete filter" class="fas fa-trash" data-filter-id="${item.id}"
                                                                        @click="${this.serverFilterDelete}"></i>
                                                                </span>
                                                                    </a>
                                                                </li>`
                                                        )}
                                                        <li role="separator" class="divider"></li>
                                                    ` :
                                                    ""}


                                                <li>
                                                    <a href="javascript: void 0" @click="${this.clear}" data-action="active-filter-clear">
                                                        <i class="fa fa-eraser icon-padding" aria-hidden="true"></i> <strong>Clear</strong>
                                                    </a>
                                                </li>
                                                ${this.isLoggedIn() ? html`
                                                    <li>
                                                        <a style="cursor: pointer" @click="${this.launchModal}" data-action="active-filter-save"><i class="fas fa-save icon-padding"></i> <strong>Save current filter</strong></a>
                                                    </li>
                                                ` : null}
                                            </ul>
                                        </div>
                                        ${~this._config.filter.sections[0].filters.findIndex(field => field.id === "case") ? html`
                                            <!-- Case ID -->
                                            <div class="btn-group" data-cy="form-case">
                                                <clinical-analysis-id-autocomplete
                                                    .config=${{placeholder: "Case Id"}}
                                                    .value="${this.query?.id}"
                                                    .opencgaSession="${this.opencgaSession}"
                                                    @filterChange="${e => this.onFilterChange("id", e.detail.value)}">
                                                </clinical-analysis-id-autocomplete>
                                            </div>
                                        ` : null}

                                        ${~this._config.filter.sections[0].filters.findIndex(field => field.id === "sample") ? html`
                                            <!-- Sample -->
                                            <div class="btn-group" data-cy="form-sample">
                                                <catalog-search-autocomplete
                                                    .value="${this.query?.sample}"
                                                    .resource="${"SAMPLE"}"
                                                    .opencgaSession="${this.opencgaSession}"
                                                    .config=${{placeholder: "Sample Id"}}
                                                    @filterChange="${e => this.onFilterChange("sample", e.detail.value)}">
                                                </catalog-search-autocomplete>
                                                    <!--<button type="button" class="dropdown-toggle btn btn-default filter-button"
                                                        id="\${this._prefix}sampleMenu"
                                                        data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">
                                                    <span class="ocap-text-button">Sample: <span>\${this.query.sample ?? "All"}</span></span>&nbsp;<span class="caret"></span>
                                                </button>
                                                <ul class="dropdown-menu" aria-labelledby="\${this._prefix}caseMenu">
                                                    <li style="padding: 5px;">
                                                        <div style="display: inline-flex; width: 300px;">
                                                            <label class="filter-label">Sample ID:</label>
                                                            <sample-id-autocomplete .config=\${{showList: true}} .value="\${this.query?.sample}" .opencgaSession="\${this.opencgaSession}"
                                                                                    @filterChange="\${e => this.onFilterChange("sample", e.detail.value)}"></sample-id-autocomplete>
                                                        </div>
                                                    </li>
                                                </ul> -->
                                            </div>
                                        ` : null}

                                        ${~this._config.filter.sections[0].filters.findIndex(field => field.id === "proband") ? html`
                                            <!-- Proband -->
                                            <div class="btn-group" data-cy="form-proband">
                                                <catalog-distinct-autocomplete
                                                    .value="${this.query?.proband}"
                                                    .queryField="${"proband"}"
                                                    .distinctField="${"proband.id"}"
                                                    .resource="${"CLINICAL_ANALYSIS"}"
                                                    .opencgaSession="${this.opencgaSession}"
                                                    .config=${{placeholder: "Proband Id"}}
                                                    @filterChange="${e => this.onFilterChange("proband", e.detail.value)}">
                                                </catalog-distinct-autocomplete>
                                                    <!--<button type="button" class="btn btn-default dropdown-toggle filter-button"
                                                        id="\${this._prefix}probandMenu" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">
                                                    <span class="ocap-text-button">Proband: <span>\${this.query.proband ?? "All"}</span></span>&nbsp; <span class="caret"></span>
                                                </button>
                                                <ul class="dropdown-menu" aria-labelledby="\${this._prefix}probandMenu">
                                                    <li style="padding: 5px;">
                                                        <div style="display: inline-flex;width: 300px">
                                                            <label class="filter-label">Proband ID:</label>
                                                            <proband-id-autocomplete .config=\${{showList: true}} .value="\${this.query?.proband}" .opencgaSession="\${this.opencgaSession}"
                                                                                    @filterChange="\${e => this.onFilterChange("proband", e.detail.value)}"></proband-id-autocomplete>
                                                        </div>
                                                    </li>
                                                </ul> -->
                                            </div>
                                        ` : null}

                                        ${~this._config.filter.sections[0].filters.findIndex(field => field.id === "family") ? html`
                                            <!-- Family -->
                                            <div class="btn-group" data-cy="form-family">
                                                <family-id-autocomplete .config=${{placeholder: "Family Id"}}  .value="${this.query?.family}" .opencgaSession="${this.opencgaSession}"
                                                                        @filterChange="${e => this.onFilterChange("family", e.detail.value)}"></family-id-autocomplete>

                                                    <!--<button type="button" class="dropdown-toggle btn btn-default filter-button"
                                                        id="\${this._prefix}familyMenu" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">
                                                    <span class="ocap-text-button">Family: <span>\${this.query.family ?? "All"}</span></span>&nbsp; <span class="caret"></span>
                                                </button>
                                                <ul class="dropdown-menu" aria-labelledby="\${this._prefix}FamilyMenu">
                                                    <li style="padding: 5px;">
                                                        <div style="display: inline-flex; width: 300px;">
                                                            <label class="filter-label">Family ID:</label>
                                                            <family-id-autocomplete .config=\${{showList: true}} .value="\${this.query?.family}" .opencgaSession="\${this.opencgaSession}"
                                                                                    @filterChange="\${e => this.onFilterChange("family", e.detail.value)}"></family-id-autocomplete>
                                                        </div>
                                                    </li>
                                                </ul> -->
                                            </div>
                                        ` : null}

                                        ${~this._config.filter.sections[0].filters.findIndex(field => field.id === "disorder") ? html`
                                            <!-- Disorder -->
                                            <div class="btn-group" data-cy="form-disorder">
                                                <catalog-distinct-autocomplete
                                                    .value="${this.query?.disorder}"
                                                    .queryField="${"disorders"}"
                                                    .distinctField="${"disorders.name"}"
                                                    .resource="${"INDIVIDUAL"}"
                                                    .opencgaSession="${this.opencgaSession}"
                                                    .config=${{placeholder: "Disorders", freeTag: true}}
                                                    @filterChange="${e => this.onFilterChange("disorder", e.detail.value)}">
                                                </catalog-distinct-autocomplete>

                                                    <!--<button type="button" class="dropdown-toggle btn btn-default filter-button"
                                                        id="\${this._prefix}disorderMenu" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">
                                                    <span class="ocap-text-button">Disorder: <span>\${this.query?.disorder ?? "All"}</span></span>&nbsp; <span class="caret"></span>
                                                </button>
                                                <ul class="dropdown-menu" aria-labelledby="\${this._prefix}DisorderMenu">
                                                    <li style="padding: 5px;">
                                                        <div style="display: inline-flex; width: 300px;">
                                                            <label class="filter-label">Disorder:</label>
                                                            <disorder-id-individuals-autocomplete .config=\${{showList: true}} .value="\${this.query?.disorder}" .opencgaSession="\${this.opencgaSession}"
                                                                @filterChange="\${e => this.onFilterChange("disorder", e.detail.value)}"></disorder-id-individuals-autocomplete>
                                                        </div>
                                                    </li>
                                                </ul> -->
                                            </div>
                                        ` : null}

                                        ${~this._config.filter.sections[0].filters.findIndex(field => field.id === "type") ? html`
                                            <!-- Type -->
                                            <div class="btn-group" data-cy="form-type">
                                                <select-field-filter
                                                    placeholder="Type"
                                                    multiple .data="${["SINGLE", "FAMILY", "CANCER"]}"
                                                    .value=${this.query?.type}
                                                    @filterChange="${e => this.onFilterChange("type", e.detail.value)}">
                                                </select-field-filter>
                                            </div>
                                        ` : null}

                                        ${~this._config.filter.sections[0].filters.findIndex(field => field.id === "status") ? html`
                                            <!-- Status -->
                                            <div class="btn-group" data-cy="form-status">
                                                <clinical-status-filter
                                                    placeholder="${"Status: All"}"
                                                    .statuses="${this.opencgaSession?.study?.internal?.configuration?.clinical?.status["CANCER"] ?? []}"
                                                    .status=${this.query?.status}
                                                    @filterChange="${e => this.onFilterChange("status", e.detail.value)}">
                                                </clinical-status-filter>
                                        ` : null}

                                        ${~this._config.filter.sections[0].filters.findIndex(field => field.id === "priority") ? html`
                                            <!-- Priority -->
                                            <div class="btn-group" data-cy="form-priority">
                                                <clinical-priority-filter
                                                    placeholder="${"Priority: All"}"
                                                    .priorities="${Object.values(this.opencgaSession?.study?.internal?.configuration?.clinical?.priorities ?? {})}"
                                                    .priority=${this.query?.priority}
                                                    @filterChange="${e => this.onFilterChange("priority", e.detail.value)}">
                                                </clinical-priority-filter>
                                            </div>
                                        ` : null}

                                        ${~this._config.filter.sections[0].filters.findIndex(field => field.id === "assignee") ? html`
                                            <!-- Assignees -->
                                            <div class="btn-group" data-cy="form-assignees">
                                                <select-field-filter
                                                    placeholder="Assignee: All"
                                                    multiple
                                                    .data="${this.users}"
                                                    .value=${this.query?.analystId}
                                                    @filterChange="${e => this.onFilterChange("analystId", e.detail.value)}">
                                                </select-field-filter>
                                            </div>
                                        ` : null}

                                        <!-- Buttons
                                <button type="button" class="btn btn-primary btn-sm ripple" @click="\${this.updateQuery}">
                                        <i class="fa fa-search icon-padding" aria-hidden="true"></i> Filter
                                </button>-->
                                    </div>

                                </div>
                            </div>
                        </form>
                        <div style="margin-top: 25px">
                            <clinical-analysis-grid
                                .query="${this.query}"
                                .opencgaSession="${this.opencgaSession}"
                                .config="${this._config.grid}"
                                @selectrow="${this.onSelectClinicalAnalysis}">
                            </clinical-analysis-grid>

                            <!-- Bottom tabs with specific variant information -->
                            ${this.clinicalAnalysis ? html`
                                <div>
                                    <detail-tabs
                                        .data="${this.clinicalAnalysis}"
                                        .config="${this._config.filter.detail}"
                                        .opencgaSession="${this.opencgaSession}">
                                    </detail-tabs>
                                </div>
                            ` : null}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Modal -->
            <div class="modal fade" id="${this._prefix}SaveModal" tabindex="-1" role="dialog"
                aria-labelledby="${this._prefix}SaveModalLabel" aria-hidden="true">
                <div class="modal-dialog" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                            <h4 class="modal-title" id="${this._prefix}SaveModalLabel">Filter</h4>
                        </div>
                        <div class="modal-body">
                            <div class="form-group row">
                                <label for="filterName" class="col-xs-2 col-form-label">Name</label>
                                <div class="col-xs-10">
                                    <input class="form-control" type="text" id="${this._prefix}filterName">
                                </div>
                            </div>
                            <div class="form-group row">
                                <label for="${this._prefix}filterDescription" class="col-xs-2 col-form-label">Description</label>
                                <div class="col-xs-10">
                                    <input class="form-control" type="text" id="${this._prefix}filterDescription">
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-primary" data-dismiss="modal" @click="${this.save}">Save</button>
                        </div>
                    </div>
                </div>
            </div>
        ` : html`
            <div class="guard-page">
                <i class="fas fa-lock fa-5x"></i>
                <h3>No public projects available to browse. Please login to continue</h3>
            </div>
        `;
    }

}

customElements.define("opencga-clinical-review-cases", OpencgaClinicalReviewCases);
