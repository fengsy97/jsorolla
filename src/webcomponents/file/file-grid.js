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
import UtilsNew from "../../core/utils-new.js";
import GridCommons from "../commons/grid-commons.js";
import CatalogGridFormatter from "../commons/catalog-grid-formatter.js";
import "../commons/opencb-grid-toolbar.js";
import "../loading-spinner.js";
import NotificationUtils from "../commons/utils/notification-utils.js";
import OpencgaCatalogUtils from "../../core/clients/opencga/opencga-catalog-utils";


export default class OpencgaFileGrid extends LitElement {

    constructor() {
        super();

        this.#init();
    }

    createRenderRoot() {
        return this;
    }

    static get properties() {
        return {
            toolId: {
                type: String,
            },
            opencgaSession: {
                type: Object
            },
            query: {
                type: Object
            },
            files: {
                type: Array
            },
            active: {
                type: Boolean
            },
            config: {
                type: Object
            }
        };
    }

    #init() {
        this.COMPONENT_ID = "file-grid";
        this._prefix = UtilsNew.randomString(8);
        this.gridId = this._prefix + this.COMPONENT_ID;
        this.active = true;
        this._config = this.getDefaultConfig();
    }

    updated(changedProperties) {
        if ((changedProperties.has("opencgaSession") ||
            changedProperties.has("toolId") ||
            changedProperties.has("query") ||
            changedProperties.has("config") ||
            changedProperties.has("active")) && this.active) {
            this.propertyObserver();
        }
    }

    propertyObserver() {
        // With each property change we must updated config and create the columns again. No extra checks are needed.
        this._config = {
            ...this.getDefaultConfig(),
            ...this.config,
        };
        this.gridCommons = new GridCommons(this.gridId, this, this._config);

        // Settings for the grid toolbar
        const {toolbar, ...otherTableProps} = this._config;
        this.toolbarSetting = {
            ...otherTableProps,
            ...toolbar,
        };

        this.toolbarConfig = {
            toolId: this.toolId,
            resource: "FILE",
            columns: this._getDefaultColumns(),
            create: {
                display: {
                    modalTitle: "File Create",
                    modalDraggable: true,
                    disabled: true,
                    disabledTooltip: "This operation will be implemented soon. Thanks for your patience.",
                    modalCyDataName: "modal-create",
                },
                render: () => html `
                    <file-create
                        .displayConfig="${{mode: "page", type: "tabs", buttonsLayout: "upper"}}"
                        .opencgaSession="${this.opencgaSession}">
                    </file-create>`
            },
        };

        this.renderTable();
    }

    renderTable() {
        // If this.files is provided as property we render the array directly
        if (this.files?.length > 0) {
            this.renderLocalTable();
        } else {
            this.renderRemoteTable();
        }
        this.requestUpdate();
    }

    renderRemoteTable() {
        if (this.opencgaSession?.opencgaClient && this.opencgaSession?.study?.fqn) {
            if (this.lastFilters && JSON.stringify(this.lastFilters) === JSON.stringify(this.query)) {
                // Abort destroying and creating again the grid. The filters have not changed
                return;
            }

            this._columns = this._getDefaultColumns();
            this.table = $("#" + this.gridId);
            this.table.bootstrapTable("destroy");
            this.table.bootstrapTable({
                columns: this._columns,
                method: "get",
                sidePagination: "server",
                iconsPrefix: GridCommons.GRID_ICONS_PREFIX,
                icons: GridCommons.GRID_ICONS,
                uniqueId: "id",
                // Table properties
                pagination: this._config.pagination,
                pageSize: this._config.pageSize,
                pageList: this._config.pageList,
                paginationVAlign: "both",
                formatShowingRows: this.gridCommons.formatShowingRows,
                showExport: this._config.showExport,
                detailView: !!this.detailFormatter,
                formatLoadingMessage: () => "<div><loading-spinner></loading-spinner></div>",
                ajax: params => {
                    let filesResponse = null;
                    this.filters = {
                        study: this.opencgaSession.study.fqn,
                        type: "FILE",
                        limit: params.data.limit,
                        skip: params.data.offset || 0,
                        count: !this.table.bootstrapTable("getOptions").pageNumber || this.table.bootstrapTable("getOptions").pageNumber === 1,
                        include: "id,name,path,uuid,sampleIds,jobId,status,format,bioformat,size,creationDate,modificationDate,internal,annotationSets",
                        ...this.query
                    };
                    // When searching by directory we must also show directories
                    if (this.filters.directory) {
                        this.filters.type = "FILE,DIRECTORY";
                    }

                    // Store the current filters
                    this.lastFilters = {...this.filters};
                    this.opencgaSession.opencgaClient.files()
                        .search(this.filters)
                        .then(response => {
                            filesResponse = response;
                            // Prepare data for columns extensions
                            const rows = filesResponse.responses?.[0]?.results || [];
                            return this.gridCommons.prepareDataForExtensions(this.COMPONENT_ID, this.opencgaSession, this.filters, rows);
                        })
                        .then(() => params.success(filesResponse))
                        .catch(error => {
                            console.error(error);
                            params.error(error);
                        });
                },
                responseHandler: response => {
                    const result = this.gridCommons.responseHandler(response, $(this.table).bootstrapTable("getOptions"));
                    return result.response;
                },
                onClickRow: (row, selectedElement) => this.gridCommons.onClickRow(row.id, row, selectedElement),
                onDblClickRow: (row, element) => {
                    this.detailFormatter ?
                        this.table.bootstrapTable("toggleDetailView", element[0].dataset.index) :
                        nothing;
                },
                onCheck: row => {
                    this.gridCommons.onCheck(row.id, row);
                },
                onCheckAll: rows => {
                    this.gridCommons.onCheckAll(rows);
                },
                onUncheck: row => {
                    this.gridCommons.onUncheck(row.id, row);
                },
                onUncheckAll: rows => {
                    this.gridCommons.onUncheckAll(rows);
                },
                onLoadSuccess: data => {
                    this.gridCommons.onLoadSuccess(data, 1);
                },
                onLoadError: (e, restResponse) => this.gridCommons.onLoadError(e, restResponse),
            });
        }
    }

    renderLocalTable() {
        this.from = 1;
        this.to = Math.min(this.files.length, this._config.pageSize);
        this.numTotalResultsText = this.files.length.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

        this.table = $("#" + this.gridId);
        this.table.bootstrapTable("destroy");
        this.table.bootstrapTable({
            columns: this._getDefaultColumns(),
            // data: this.files,
            sidePagination: "server",
            // Josemi Note 2024-01-18: we have added the ajax function for local files also to support executing async calls
            // when getting additional data from columns extensions.
            ajax: params => {
                const tableOptions = $(this.table).bootstrapTable("getOptions");
                const limit = params.data.limit || tableOptions.pageSize;
                const skip = params.data.offset || 0;
                const rows = this.files.slice(skip, skip + limit);

                // Get data for extensions
                this.gridCommons.prepareDataForExtensions(this.COMPONENT_ID, this.opencgaSession, null, rows)
                    .then(() => params.success(rows))
                    .catch(error => params.error(error));
            },
            // Josemi Note 2024-01-18: we use this method to tell bootstrap-table how many rows we have in our data
            responseHandler: response => {
                return {
                    total: this.files.length,
                    rows: response,
                };
            },
            iconsPrefix: GridCommons.GRID_ICONS_PREFIX,
            icons: GridCommons.GRID_ICONS,

            // Set table properties, these are read from config property
            uniqueId: "id",
            pagination: this._config.pagination,
            pageSize: this._config.pageSize,
            pageList: this._config.pageList,
            showExport: this._config.showExport,
            detailView: !!this.detailFormatter,
            formatLoadingMessage: () => "<div><loading-spinner></loading-spinner></div>",
            onClickRow: (row, selectedElement) => this.gridCommons.onClickRow(row.id, row, selectedElement),
            onPageChange: (page, size) => {
                const result = this.gridCommons.onPageChange(page, size);
                this.from = result.from || this.from;
                this.to = result.to || this.to;
            },
            onPostBody: data => {
                // We call onLoadSuccess to select first row
                this.gridCommons.onLoadSuccess({rows: data, total: data.length}, 2);
            }
        });
    }

    onColumnChange(e) {
        this.gridCommons.onColumnChange(e);
    }

    async onActionClick(e, _, row) {
        const action = e.target.dataset.action?.toLowerCase();
        switch (action) {
            /*
            case "edit":
                this.fileUpdateId = row.id;
                this.requestUpdate();
                await this.updateComplete;
                ModalUtils.show(`${this._prefix}UpdateModal`);
                break;
             */
            case "copy-json":
                UtilsNew.copyToClipboard(JSON.stringify(row, null, "\t"));
                break;
            case "download-json":
                UtilsNew.downloadData([JSON.stringify(row, null, "\t")], row.id + ".json");
                break;
            case "qualityControl":
                alert("Not implemented yet");
                break;
        }
    }

    _getDefaultColumns() {
        // 1. Default columns
        this._columns = [
            {
                id: "name",
                title: "Name",
                field: "name",
                formatter: (fileName, row) => {
                    return `
                        <div>
                            <span style="font-weight: bold; margin: 5px 0">${fileName}</span>
                            <span class="help-block" style="margin: 5px 0">/${row.path.replace(row.name, "").replace("//", "/")}</span>
                        </div>`;
                },
                visible: this.gridCommons.isColumnVisible("name")
            },
            {
                id: "sampleIds",
                title: "Samples",
                field: "sampleIds",
                formatter: sampleIds => {
                    let html = "-";
                    if (sampleIds?.length > 0) {
                        html = `<div style="white-space: nowrap">`;
                        for (let i = 0; i < sampleIds.length; i++) {
                            // Display first 3 files
                            if (i < 3) {
                                html += `<div style="margin: 2px 0"><span style="font-weight: bold">${sampleIds[i]}</span></div>`;
                            } else {
                                html += `<a tooltip-title="Samples" tooltip-text='${sampleIds.join("<br>")}'>... view all samples (${sampleIds.length})</a>`;
                                break;
                            }
                        }
                        html += "</div>";
                    }
                    return html;
                },
                visible: this.gridCommons.isColumnVisible("sampleIds")
            },
            {
                id: "jobId",
                title: "Job ID",
                field: "jobId",
                formatter: jobId => {
                    if (jobId) {
                        return `<div>${jobId}</div>`;
                    } else {
                        return "-";
                    }
                },
                visible: this.gridCommons.isColumnVisible("jobId")
            },
            {
                id: "size",
                title: "Size",
                field: "size",
                formatter: size => UtilsNew.getDiskUsage(size),
                visible: this.gridCommons.isColumnVisible("size")
            },
            {
                id: "format",
                title: "Format",
                field: "format",
                visible: this.gridCommons.isColumnVisible("format")
            },
            {
                id: "index",
                title: "Variant Index Status",
                field: "internal.variant.index.status.id",
                visible: this.gridCommons.isColumnVisible("index"),
                // NOTE 20230310 Vero: Formatter for displaying in the future information
                // about annotation and secondary index in the column
                // formatter: (value, row) => {
                //     if (row.format === "VCF") {
                //         return `
                //             <div>${row.internal.variant.index?.status?.id}</div>
                //             <div>${row.internal.variant.annotationIndex?.status?.id}</div>
                //         `;
                //     } else {
                //         return `<div>NA</div>`;
                //     }
                // }
            },
            {
                id: "creationDate",
                title: "Creation Date",
                field: "creationDate",
                formatter: date => CatalogGridFormatter.dateFormatter(date),
                visible: this.gridCommons.isColumnVisible("creationDate")
            },
        ];

        // 2. Annotations
        if (this._config.annotations?.length > 0) {
            this.gridCommons.addColumnsFromAnnotations(this._columns, CatalogGridFormatter.customAnnotationFormatter, this._config);
        }

        // 3. Actions
        if (this.opencgaSession && this._config.showActions) {
            const downloadUrl = this.opencgaSession?.server? [
                this.opencgaSession?.server.host,
                "/webservices/rest/",
                this.opencgaSession?.server.version,
                "/files/",
                "FILE_ID",
                "/download?study=",
                this.opencgaSession?.study.fqn,
                "&sid=",
                this.opencgaSession?.token,
            ]:[];
            this._columns.push({
                id: "actions",
                title: "Actions",
                field: "actions",
                formatter: (value, row) => `
                    <div class="dropdown">
                        <button class="btn btn-default btn-sm dropdown-toggle" type="button" data-toggle="dropdown">
                            <i class="fas fa-toolbox icon-padding" aria-hidden="true"></i>
                            <span>Actions</span>
                            <span class="caret" style="margin-left: 5px"></span>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-right">
                            <li>
                                <a data-action="download" href="${downloadUrl.join("").replace("FILE_ID", row.id)}" class="btn force-text-left ${downloadUrl.length == 0 ? "disabled" : ""}">
                                    <i class="fas fa-download icon-padding"></i>Download
                                </a>
                            </li>
                            <li role="separator" class="divider"></li>
                            <li>
                                <a data-action="copy-json" href="javascript: void 0" class="btn force-text-left">
                                    <i class="fas fa-copy icon-padding" aria-hidden="true"></i> Copy JSON
                                </a>
                            </li>
                            <li>
                                <a data-action="download-json" href="javascript: void 0" class="btn force-text-left">
                                    <i class="fas fa-download icon-padding" aria-hidden="true"></i> Download JSON
                                </a>
                            </li>
                            <li role="separator" class="divider"></li>
                            <li>
                                <a data-action="qualityControl" class="btn force-text-left ${row.qualityControl?.metrics && row.qualityControl.metrics.length === 0 ? "" : "disabled"}"
                                        title="${row.qualityControl?.metrics && row.qualityControl.metrics.length === 0 ? "Launch a job to calculate Quality Control stats" : "Quality Control stats already calculated"}">
                                    <i class="fas fa-rocket icon-padding" aria-hidden="true"></i> Calculate Quality Control
                                </a>
                            </li>
                            <li role="separator" class="divider"></li>
                            <li>
                                <a data-action="edit" class="btn force-text-left disabled ${OpencgaCatalogUtils.isAdmin(this.opencgaSession.study, this.opencgaSession.user.id) || "disabled" }">
                                    <i class="fas fa-edit icon-padding" aria-hidden="true"></i> Edit ...
                                </a>
                            </li>
                            <li>
                                <a data-action="delete" href="javascript: void 0" class="btn force-text-left disabled">
                                    <i class="fas fa-trash icon-padding" aria-hidden="true"></i> Delete
                                </a>
                            </li>
                        </ul>
                    </div>`,
                // valign: "middle",
                events: {
                    "click a": this.onActionClick.bind(this)
                },
                visible: !this._config.columns?.hidden?.includes("actions")
            });
        }

        // 4. Extensions
        this._columns = this.gridCommons.addColumnsFromExtensions(this._columns);

        return this._columns;
    }

    async onDownload(e) {
        this.toolbarConfig = {...this.toolbarConfig, downloading: true};
        this.requestUpdate();
        await this.updateComplete;

        const filters = {
            ...this.filters,
            skip: 0,
            limit: 1000,
            count: false
        };
        this.opencgaSession.opencgaClient.files()
            .search(filters)
            .then(restResponse => {
                const results = restResponse.getResults();
                if (results) {
                    // Check if user clicked in Tab or JSON format
                    if (e.detail.option.toUpperCase() === "TAB") {
                        const fields = ["id", "name", "path", "format", "bioformat", "size", "creationDate", "modificationDate", "internal.status.name"];
                        const data = UtilsNew.toTableString(results, fields);
                        UtilsNew.downloadData(data, "files_" + this.opencgaSession.study.id + ".tsv", "text/plain");
                    } else {
                        UtilsNew.downloadData(JSON.stringify(results, null, "\t"), "files_" + this.opencgaSession.study.id + ".json", "application/json");
                    }
                } else {
                    console.error("Error in result format");
                }
            })
            .catch(response => {
                NotificationUtils.dispatch(this, NotificationUtils.NOTIFY_RESPONSE, response);
            })
            .finally(() => {
                this.toolbarConfig = {...this.toolbarConfig, downloading: false};
                this.requestUpdate();
            });
    }

    render() {
        return html`
            ${this._config.showToolbar ? html`
                <opencb-grid-toolbar
                    .query="${this.filters}"
                    .opencgaSession="${this.opencgaSession}"
                    .settings="${this.toolbarSetting}"
                    .config="${this.toolbarConfig}"
                    @columnChange="${this.onColumnChange}"
                    @download="${this.onDownload}"
                    @export="${this.onDownload}"
                    @actionClick="${e => this.onActionClick(e)}"
                    @fileCreate="${this.renderTable}">
                </opencb-grid-toolbar>` : nothing
            }

            <div id="${this._prefix}GridTableDiv">
                <table id="${this.gridId}"></table>
            </div>
        `;
    }

    getDefaultConfig() {
        return {
            pagination: true,
            pageSize: 10,
            pageList: [5, 10, 25],

            showToolbar: true,
            showActions: true,
            toolbar: {
                // Note Vero 20240108: It is not possible to create files.
                // However, it was decided a while ago to display the button "New"
                // for consistency with the rest of the browsers but disabled
                // (see L103: this.toolbarConfig.create.display.disabled: true)
                showCreate: true,
                showSettings: true,
                showExport: true,
                exportTabs: ["download", "link", "code"]
            },
            skipExtensions: false,

            // Annotations Example:
            // annotations: [
            //     {
            //         title: "Cardiology Tests",
            //         position: 3,
            //         variableSetId: "cardiology_tests_checklist",
            //         variables: ["ecg_test", "echo_test"]
            //     },
            //     {
            //         title: "Risk Assessment",
            //         position: 5,
            //         variableSetId: "risk_assessment",
            //         variables: ["vf_cardiac_arrest_events"]
            //     }
            // ]
        };
    }

}

customElements.define("file-grid", OpencgaFileGrid);
