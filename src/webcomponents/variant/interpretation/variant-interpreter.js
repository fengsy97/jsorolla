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

import {LitElement, html} from "lit";
import UtilsNew from "../../../core/utils-new.js";
import ClinicalAnalysisManager from "../../clinical/clinical-analysis-manager.js";
import NotificationUtils from "../../commons/utils/notification-utils.js";
import OpencgaCatalogUtils from "../../../core/clients/opencga/opencga-catalog-utils.js";
import "./variant-interpreter-landing.js";
import "./variant-interpreter-qc.js";
import "./variant-interpreter-browser.js";
import "./variant-interpreter-browser-rd.js";
import "./variant-interpreter-browser-cancer.js";
import "./variant-interpreter-review.js";
import "./variant-interpreter-review.js";
import "./variant-interpreter-methods.js";
import "../../commons/tool-header.js";
import "../custom/steiner-variant-interpreter-analysis.js";
import "../custom/steiner-report.js";
import "../../commons/opencga-active-filters.js";
import "../../clinical/clinical-analysis-review.js";
import "../../clinical/clinical-analysis-review-info.js";
import "../../download-button.js";
import "../../loading-spinner.js";
import "./case-sms-report.js";

class VariantInterpreter extends LitElement {

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
            opencgaSession: {
                type: Object
            },
            clinicalAnalysisId: {
                type: String
            },
            clinicalAnalysis: {
                type: Object
            },
            cellbaseClient: {
                type: Object
            },
            settings: {
                type: Object
            }
        };
    }

    _init() {
        this._prefix = UtilsNew.randomString(8);
        this.activeTab = {};
        this.clinicalAnalysisManager = null;
    }

    connectedCallback() {
        super.connectedCallback();
        this._config = {...this.getDefaultConfig()};
    }

    update(changedProperties) {
        if (changedProperties.has("settings")) {
            this.settingsObserver();
        }

        if (changedProperties.has("opencgaSession")) {
            this.opencgaSessionObserver();
        }

        if (changedProperties.has("clinicalAnalysisId")) {
            this.clinicalAnalysisIdObserver();
        }

        if (changedProperties.has("clinicalAnalysis")) {
            this.clinicalAnalysisObserver();
        }

        super.update(changedProperties);
    }

    settingsObserver() {
        this._config = this.getDefaultConfig();
        this._config.tools = UtilsNew.mergeArray(this._config.tools, this.settings?.tools, false, true);
        // this._config = {...this._config};
        this.requestUpdate();
    }

    opencgaSessionObserver() {
        if (this.opencgaSession?.study?.fqn) {
            // With each property change we must update config and create the columns again. No extra checks are needed.
            // this._config = {...this.getDefaultConfig(), ...this.config};
            this.clinicalAnalysis = null;
            this._changeView(this._config?.tools[0].id);
            this.requestUpdate();

            // To delete
            // this.clinicalAnalysisId = "NA12877";
            // this.clinicalAnalysisId = "CA-2";
            // this.clinicalAnalysisId = "C-TMV2OCT20_121978_S57_L005_TUMOR";
            // this.clinicalAnalysisId = "C-MA6250";
            // this.clinicalAnalysisIdObserver();
        }
    }

    clinicalAnalysisIdObserver() {
        if (this.opencgaSession?.opencgaClient && this.clinicalAnalysisId) {
            this.opencgaSession.opencgaClient.clinical()
                .info(this.clinicalAnalysisId, {study: this.opencgaSession.study.fqn})
                .then(response => {
                    this.clinicalAnalysis = response.responses[0].results[0];
                })
                .catch(response => {
                    NotificationUtils.dispatch(this, NotificationUtils.NOTIFY_RESPONSE, response);
                });
        } else {
            this.clinicalAnalysis = null;
        }
    }

    clinicalAnalysisObserver() {
        if (this.clinicalAnalysis) {
            this.clinicalAnalysisManager = new ClinicalAnalysisManager(this, this.clinicalAnalysis, this.opencgaSession);
            //  TODO: replace interpretation attributes to case attributes
            if (UtilsNew.isEmpty(this.clinicalAnalysis?.interpretation?.attributes?.reportTest)) {
                this.opencgaSession.opencgaClient.clinical()
                    .updateInterpretation(this.clinicalAnalysis.id, this.clinicalAnalysis.interpretation.id,
                        {attributes: UtilsNew.initClinicalAnalysisReport()}, {study: this.opencgaSession.study.fqn})
                    .then(response => {
                        NotificationUtils.dispatch(this, NotificationUtils.NOTIFY_SUCCESS, {
                            message: `successfully created report metadata ${response}`
                        });
                    })
                    .catch(response => {
                        NotificationUtils.dispatch(this, NotificationUtils.NOTIFY_ERROR, {
                            message: `Failed to create report metadata.</br>Cause: ${response.events[0].message}`
                        });
                    });
            }
        }
    }

    onClickSection(e) {
        e.preventDefault();
        if (e.currentTarget?.dataset?.view && !e.currentTarget.className.split(" ").includes("disabled")) {
            this._changeView(e.currentTarget.dataset.view);
        }
    }

    _changeView(tabId) {
        $(".variant-interpreter-step", this).removeClass("active");
        // $(".clinical-portal-content", this).removeClass("active");
        for (const tab in this.activeTab) {
            if (Object.prototype.hasOwnProperty.call(this.activeTab, tab)) {
                this.activeTab[tab] = false;
            }
        }
        $(`button.content-pills[data-id=${tabId}]`, this).addClass("active");
        $("#" + tabId, this).addClass("active");
        this.activeTab[tabId] = true;
        this.requestUpdate();
    }

    onClinicalAnalysisUpdate() {
        console.log("onClinicalAnalysisUpdate called");
        return this.opencgaSession.opencgaClient.clinical()
            .info(this.clinicalAnalysis.id, {study: this.opencgaSession.study.fqn})
            .then(response => {
                this.clinicalAnalysis = response.responses[0].results[0];
            });
    }

    onClinicalAnalysis(e) {
        this.clinicalAnalysis = e.detail.clinicalAnalysis;
        this.requestUpdate();
    }

    onClinicalAnalysisDownload = () => {
        UtilsNew.downloadJSON(this.clinicalAnalysis,
            `variant_interpreter_CASE_${this.opencgaSession?.study?.id}_${this.clinicalAnalysis?.id}_${this.clinicalAnalysis?.interpretation?.id ?? ""}_${UtilsNew.dateFormatter(new Date(), "YYYYMMDDhhmm")}` + ".json");
    }

    onClinicalAnalysisRefresh = () => {
        this.onClinicalAnalysisUpdate().then(() => {
            NotificationUtils.dispatch(this, NotificationUtils.NOTIFY_INFO, {
                message: "Clinical analysis refreshed",
            });
        });
    }

    onClinicalAnalysisLock = () => {
        if (OpencgaCatalogUtils.isAdmin(this.opencgaSession?.study, this.opencgaSession?.user?.id)) {
            const id = this.clinicalAnalysis.id;
            const updateParams = {
                locked: !this.clinicalAnalysis.locked,
            };

            return this.opencgaSession.opencgaClient.clinical()
                .update(id, updateParams, {study: this.opencgaSession.study.fqn})
                .then(() => this.onClinicalAnalysisUpdate())
                .then(() => {
                    NotificationUtils.dispatch(this, NotificationUtils.NOTIFY_SUCCESS, {
                        message: `Case '${id}' has been ${updateParams.locked ? "locked" : "unlocked"}.`,
                    });
                })
                .catch(response => {
                    NotificationUtils.dispatch(this, NotificationUtils.NOTIFY_RESPONSE, response);
                });
        }
    };

    onChangePrimaryInterpretation = e => {
        const interpretationId = e.currentTarget.dataset.id;
        this.clinicalAnalysisManager.setInterpretationAsPrimary(interpretationId, () => {
            this.onClinicalAnalysisUpdate();
        });
    }

    renderCustomAnalysisTab() {
        const analysisSettings = (this.settings?.tools || []).find(tool => tool?.id === "custom-analysis");
        if (analysisSettings?.component === "steiner-analysis") {
            return html`
                <steiner-variant-interpreter-analysis
                    .opencgaSession="${this.opencgaSession}"
                    .clinicalAnalysis="${this.clinicalAnalysis}">
                </steiner-variant-interpreter-analysis>
            `;
        }

        // No custom anaysis content available
        return html`
            <div class="col-md-6 col-md-offset-3" style="padding: 20px">
                <div class="alert alert-warning" role="alert">
                    No custom analysis available at this time.
                </div>
            </div>
        `;
    }

    renderReportTab() {
        const settingReporter = this.settings?.tools?.filter(tool => tool?.id === "report")[0];
        if (settingReporter && settingReporter?.component === "steiner-report") {
            return html`
                <div class="col-md-10 col-md-offset-1">
                    <tool-header
                        class="bg-white"
                        title="Interpretation - ${this.clinicalAnalysis?.interpretation?.id}">
                    </tool-header>
                    <steiner-report
                        .clinicalAnalysis="${this.clinicalAnalysis}"
                        .opencgaSession="${this.opencgaSession}">
                    </steiner-report>
                </div>
            `;
        } else {
            return html`
                <div class="col-md-10 col-md-offset-1">
                    <tool-header
                        class="bg-white"
                        title="Interpretation - ${this.clinicalAnalysis?.interpretation?.id}">
                    </tool-header>
                    <clinical-analysis-review
                        @clinicalAnalysisUpdate="${e => this.onClinicalAnalysisUpdate(e)}"
                        .clinicalAnalysis="${this.clinicalAnalysis}"
                        .opencgaSession="${this.opencgaSession}">
                    </clinical-analysis-review>
                </div>
            `;
        }
    }

    render() {
        // Check Project exists
        if (!this.opencgaSession || !this.opencgaSession.study) {
            return html`
                <div class="guard-page">
                    <i class="fas fa-lock fa-5x"></i>
                    <h3>No project available to browse. Please login to continue</h3>
                </div>
            `;
        }

        // Note: this a temporal
        const configReportTabs = {
            display: {
                align: "center",
            },
            items: []
        };

        const settingReporter = this.settings?.tools?.filter(tool => tool?.id === "report")[0];
        const reportReviewConfig = {
            id: "caseReport",
            name: "Case Report Review",
            active: true,
            render: (clinicalAnalysis, active, opencgaSession) => {
                return html`
                    <div class="col-md-10 col-md-offset-1">
                        <tool-header
                            class="bg-white"
                            title="Interpretation - ${clinicalAnalysis?.interpretation?.id}">
                        </tool-header>
                        <clinical-analysis-review
                            @clinicalAnalysisUpdate="${e => this.onClinicalAnalysisUpdate(e)}"
                            .clinicalAnalysis="${clinicalAnalysis}"
                            .opencgaSession="${opencgaSession}">
                        </clinical-analysis-review>
                    </div>
                `;
            }
        };

        // reportReviewConfig
        const caseReviewInfo = {
            id: "caseReviewInfo",
            name: "Case Review Info (Beta)",
            active: false,
            render: (clinicalAnalysis, active, opencgaSession) => {
                return html`
                    <div class="col-md-12">
                        <tool-header
                            class="bg-white"
                            title="Case - ${clinicalAnalysis.id}">
                        </tool-header>
                        <clinical-analysis-review-info
                            @clinicalAnalysisUpdate="${e => this.onClinicalAnalysisUpdate(e)}"
                            .clinicalAnalysis="${clinicalAnalysis}"
                            .opencgaSession="${opencgaSession}">
                        </clinical-analysis-review-info>
                    </div>
                `;
            }
        };

        switch (settingReporter && settingReporter?.component) {
            case "steiner-report":
                configReportTabs.items.push({
                    id: "variantReport",
                    name: "Variant Report",
                    active: false,
                    render: (clinicalAnalysis, active, opencgaSession) => {
                        return html`
                        <div class="col-md-10 col-md-offset-1">
                            <tool-header
                                class="bg-white"
                                title="Interpretation - ${clinicalAnalysis?.interpretation?.id}">
                            </tool-header>
                            <case-steiner-report
                                .clinicalAnalysis="${clinicalAnalysis}"
                                .opencgaSession="${opencgaSession}">
                            </case-steiner-report>
                        </div>
                    `;
                    }
                });
                break;
            case "sms-report":
                // configReportTabs.items.push(reportReviewConfig, caseReviewInfo, {
                configReportTabs.items.push(caseReviewInfo, {
                    id: "reviewReport",
                    name: "Review",
                    active: false,
                    render: (clinicalAnalysis, active, opencgaSession) => {
                        return html`
                        <div class="col-md-10 col-md-offset-1">
                            <tool-header
                                class="bg-white"
                                title="Interpretation - ${clinicalAnalysis?.interpretation?.id}">
                            </tool-header>
                            <case-sms-report
                                .clinicalAnalysis="${clinicalAnalysis}"
                                .opencgaSession="${opencgaSession}"
                                @clinicalAnalysisUpdate="${e => this.onClinicalAnalysisUpdate(e)}">
                            </case-sms-report>

                        </div>
                    `;
                    }
                });
                break;
            default:
                configReportTabs.items.push(reportReviewConfig);
                break;
        }

        // if (settingReporter && settingReporter?.component === "steiner-report") {
        //     configReportTabs.items.push({
        //         id: "variantReport",
        //         name: "Variant Report",
        //         active: false,
        //         render: (clinicalAnalysis, active, opencgaSession) => {
        //             return html`
        //             <div class="col-md-10 col-md-offset-1">
        //                 <tool-header
        //                     class="bg-white"
        //                     title="Interpretation - ${clinicalAnalysis?.interpretation?.id}">
        //                 </tool-header>
        //                 <case-steiner-report
        //                     .clinicalAnalysis="${clinicalAnalysis}"
        //                     .opencgaSession="${opencgaSession}">
        //                 </case-steiner-report>
        //                 <case-sms-report
        //                     .clinicalAnalysis="${clinicalAnalysis}"
        //                     .opencgaSession="${opencgaSession}">
        //                 </case-sms-report>
        //             </div>
        //         `;
        //         }
        //     });
        // } else {
        //     configReportTabs.items.push({
        //         id: "caseReport",
        //         name: "Case Report Review",
        //         active: true,
        //         render: (clinicalAnalysis, active, opencgaSession) => {
        //             return html`
        //                 <div class="col-md-10 col-md-offset-1">
        //                     <tool-header
        //                         class="bg-white"
        //                         title="Interpretation - ${clinicalAnalysis?.interpretation?.id}">
        //                     </tool-header>
        //                     <clinical-analysis-review
        //                         @clinicalAnalysisUpdate="${e => this.onClinicalAnalysisUpdate(e)}"
        //                         .clinicalAnalysis="${clinicalAnalysis}"
        //                         .opencgaSession="${opencgaSession}">
        //                     </clinical-analysis-review>
        //                 </div>
        //             `;
        //         }
        //     });
        // }
        // Used to check if lock is enabled for the current user
        const isAdmin = OpencgaCatalogUtils.isAdmin(this.opencgaSession?.study, this.opencgaSession?.user?.id);

        return html`
            <div class="variant-interpreter-tool">
                ${this.clinicalAnalysis?.id ? html`
                    <tool-header
                        icon="${this._config.icon}"
                        .title="${`
                        ${this._config.title}
                        <span class="inverse">
                            Case ${this.clinicalAnalysis?.id}
                            ${this.clinicalAnalysis?.locked ? "<span class=\"fa fa-lock icon-padding\"></span>" : ""}
                        </span>
                    `}"
                        .rhs="${html`
                            <div style="align-items:center;display:flex;">
                                ${this.clinicalAnalysis?.interpretation ? html`
                                    <div align="center" style="margin-right:3rem;">
                                        <div style="font-size:1.5rem" title="${this.clinicalAnalysis.interpretation.description}">
                                            ${this.clinicalAnalysis.interpretation.locked ? html`<span class="fa fa-lock icon-padding"></span>` : ""}
                                            <strong>${this.clinicalAnalysis.interpretation.id}</strong>
                                        </div>
                                        ${this.clinicalAnalysis.interpretation?.method?.name ? html`
                                            <div style="font-size:0.875em;">
                                                <strong>${this.clinicalAnalysis.interpretation.method.name}</strong>
                                            </div>
                                        ` : null}
                                        <div class="text-muted">
                                            Primary Findings: <strong>${this.clinicalAnalysis.interpretation?.primaryFindings?.length ?? 0}</strong>
                                        </div>
                                    </div>
                                ` : null}
                                <div class="dropdown">
                                    <button class="btn btn-default btn-lg" data-toggle="dropdown">
                                        <i class="fa fa-toolbox" aria-hidden="true"></i>
                                        <span style="margin-left:4px;margin-right:4px;font-weight:bold;">Actions</span>
                                        <span class="caret"></span>
                                    </button>
                                    <ul class="dropdown-menu dropdown-menu-right">
                                        ${this.clinicalAnalysis.secondaryInterpretations?.length > 0 ? html`
                                            <li>
                                                <a style="background-color:white!important;">
                                                    <strong>Change interpretation</strong>
                                                </a>
                                            </li>
                                            ${this.clinicalAnalysis.secondaryInterpretations.map(item => html`
                                                <li>
                                                    <a style="cursor:pointer;padding-left: 25px" data-id="${item.id}" @click="${this.onChangePrimaryInterpretation}">
                                                        ${item.id}
                                                        <i class="fa ${item.locked ? "fa-lock" : "fa-unlock"} icon-padding" style="padding-left: 5px"></i>
                                                    </a>
                                                </li>
                                            `)}
                                            <li role="separator" class="divider"></li>
                                        ` : null}
                                        <li>
                                            <a style="background-color:white!important;">
                                                <strong>Case Actions</strong>
                                            </a>
                                        </li>
                                        <li>
                                            <a style="padding-left:25px;${isAdmin ? "cursor:pointer" : "pointer-events:none;opacity:0.6"}" @click="${this.onClinicalAnalysisLock}">
                                                <i class="fa ${this.clinicalAnalysis.locked ? "fa-unlock" : "fa-lock"} icon-padding"></i>
                                                ${this.clinicalAnalysis.locked ? "Case Unlock" : "Case Lock"}
                                            </a>
                                        </li>
                                        <li>
                                            <a style="cursor:pointer;padding-left: 25px" @click="${this.onClinicalAnalysisRefresh}">
                                                <i class="fa fa-sync icon-padding"></i> Refresh
                                            </a>
                                        </li>
                                        <li>
                                            <a style="cursor:pointer;padding-left: 25px" @click="${this.onClinicalAnalysisDownload}">
                                                <i class="fa fa-download icon-padding"></i> Download
                                            </a>
                                        </li>
                                        <li>
                                            <a style="padding-left: 25px" href="#clinicalAnalysisPortal/${this.opencgaSession.project.id}/${this.opencgaSession.study.id}">
                                                <i class="fa fa-times icon-padding"></i> Close
                                            </a>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        `}">
                    </tool-header>
                ` : html`
                    <tool-header .title="${this._config.title}" icon="${this._config.icon}"></tool-header>
                `}

                <div class="col-md-10 col-md-offset-1">
                    <nav class="navbar" style="margin-bottom: 5px; border-radius: 0">
                        <div class="container-fluid">
                            <!-- Brand and toggle get grouped for better mobile display -->
                            <div class="navbar-header">
                                <!--
                                <a class="navbar-brand" href="#home" @click="\${this.changeTool}">
                                    <b>\${this._config.title} <sup>\${this._config.version}</sup></b>
                                </a>
                            -->
                            </div>
                            <div>
                                <!-- Controls aligned to the LEFT -->
                                <div class="row hi-icon-wrap wizard hi-icon-animation variant-interpreter-wizard">
                                    ${this._config?.tools?.map(item => html`
                                        ${!item.hidden ? html`
                                            <a class="icon-wrapper variant-interpreter-step ${!this.clinicalAnalysis && item.id !== "select" || item.disabled ? "disabled" : ""} ${this.activeTab[item.id] ? "active" : ""}"
                                               href="javascript: void 0" data-view="${item.id}"
                                               @click="${this.onClickSection}">
                                                <div class="interpreter-hi-icon ${item.icon}"></div>
                                                <p>${item.title}</p>
                                                <span class="smaller"></span>
                                            </a>
                                        ` : ""}
                                    `)}
                                </div>
                            </div>
                        </div>
                    </nav>
                </div>

                <div id="${this._prefix}MainWindow" class="col-md-12">
                    <div>
                        ${this._config.tools ? html`
                            ${this.activeTab["select"] ? html`
                                <div id="${this._prefix}select" class="clinical-portal-content">
                                    <variant-interpreter-landing
                                        .opencgaSession="${this.opencgaSession}"
                                        .clinicalAnalysis="${this.clinicalAnalysis}"
                                        .config="${this._config.tools.find(tool => tool.id === "select")}"
                                        @clinicalAnalysisUpdate="${this.onClinicalAnalysisUpdate}"
                                        @selectClinicalAnalysis="${this.onClinicalAnalysis}">
                                    </variant-interpreter-landing>
                                </div>` : null}

                            ${this.activeTab["qc"] ? html`
                                <div id="${this._prefix}qc" class="clinical-portal-content">
                                    <variant-interpreter-qc
                                        .opencgaSession="${this.opencgaSession}"
                                        .cellbaseClient="${this.cellbaseClient}"
                                        .clinicalAnalysis="${this.clinicalAnalysis}"
                                        .settings="${this._config.tools.find(tool => tool.id === "qc")}"
                                        @clinicalAnalysisUpdate="${this.onClinicalAnalysisUpdate}">
                                    </variant-interpreter-qc>
                                </div>
                            ` : null}

                            ${this.activeTab["custom-analysis"] ? html`
                                <div id="${this._prefix}customAnalysis" class="clinical-portal-content">
                                    ${this.renderCustomAnalysisTab()}
                                </div>
                            ` : null}

                            ${this.activeTab["methods"] ? html`
                                <div id="${this._prefix}methods" class="clinical-portal-content">
                                    <variant-interpreter-methods
                                        .opencgaSession="${this.opencgaSession}"
                                        .clinicalAnalysis="${this.clinicalAnalysis}"
                                        .config="${this._config}">
                                    </variant-interpreter-methods>
                                </div>
                            ` : null}

                            ${this.activeTab["variant-browser"] ? html`
                                <div id="${this._prefix}variant-browser" class="clinical-portal-content">
                                    <variant-interpreter-browser
                                        .opencgaSession="${this.opencgaSession}"
                                        .clinicalAnalysis="${this.clinicalAnalysis}"
                                        .cellbaseClient="${this.cellbaseClient}"
                                        .settings="${this._config.tools.find(tool => tool.id === "variant-browser")}"
                                        @clinicalAnalysisUpdate="${this.onClinicalAnalysisUpdate}">
                                    </variant-interpreter-browser>
                                </div>
                            ` : null}

                            ${this.activeTab["review"] ? html`
                                <div id="${this._prefix}review" class="clinical-portal-content">
                                    <variant-interpreter-review
                                        .opencgaSession="${this.opencgaSession}"
                                        .clinicalAnalysis="${this.clinicalAnalysis}"
                                        .cellbaseClient="${this.cellbaseClient}"
                                        .populationFrequencies="${this._config.populationFrequencies}"
                                        .proteinSubstitutionScores="${this._config.proteinSubstitutionScores}"
                                        .consequenceTypes="${this._config.consequenceTypes}"
                                        .settings="${this._config.tools.find(tool => tool.id === "variant-browser")}"
                                        @gene="${this.geneSelected}"
                                        @samplechange="${this.onSampleChange}"
                                        @clinicalAnalysisUpdate="${this.onClinicalAnalysisUpdate}">
                                    </variant-interpreter-review>
                                </div>
                            ` : null}

                            ${this.activeTab["report"] ? html`
                                <!-- class="col-md-10 col-md-offset-1 clinical-portal-content" -->
                                <div id="${this._prefix}report" >
                                    <detail-tabs
                                        .data="${this.clinicalAnalysis}"
                                        .config="${configReportTabs}"
                                        .opencgaSession="${this.opencgaSession}">
                                    </detail-tabs>
                                </div>
                            ` : null}
                        ` : null}
                    </div>
                </div>
            </div>

            <div class="v-space"></div>
        `;
    }

    getDefaultConfig() {
        return {
            title: "Case Interpreter",
            icon: "fas fa-user-md",
            active: false,
            tools: [
                {
                    id: "select",
                    title: "Case Info",
                    acronym: "VB",
                    description: "",
                    icon: "fa fa-folder-open"
                },
                {
                    id: "qc",
                    title: "Quality Control",
                    acronym: "VB",
                    description: "",
                    icon: "fa fa-chart-bar"
                },
                {
                    id: "custom-analysis",
                    title: "Custom Analysis",
                    acronym: "VB",
                    description: "",
                    icon: "fa fa-sync",
                },
                {
                    id: "methods",
                    title: "Interpretation Methods",
                    acronym: "VB",
                    description: "",
                    icon: "fa fa-sync"
                },
                {
                    id: "variant-browser",
                    title: "Sample Variant Browser",
                    acronym: "VB",
                    description: "",
                    icon: "fa fa-search"
                },
                {
                    id: "review",
                    title: "Interpretation Review",
                    acronym: "VB",
                    description: "",
                    icon: "fa fa-edit"
                },
                {
                    id: "report",
                    title: "Observations",
                    acronym: "VB",
                    description: "",
                    // disabled: true,
                    icon: "fa fa-file-alt"
                }
            ]
        };
    }

}

customElements.define("variant-interpreter", VariantInterpreter);
