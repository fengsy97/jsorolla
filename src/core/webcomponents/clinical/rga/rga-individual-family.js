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
import "./../../commons/view/detail-tabs.js";
import GridCommons from "../../commons/grid-commons.js";
import VariantInterpreterGridFormatter from "../../variant/interpretation/variant-interpreter-grid-formatter.js";
import VariantGridFormatter from "../../variant/variant-grid-formatter.js";


export default class RgaIndividualFamily extends LitElement {

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
            individual: {
                type: Object
            },
            active: {
                type: Boolean
            },
            config: {
                type: Object
            }
        };
    }

    _init() {
        this._prefix = UtilsNew.randomString(8);
        this._config = this.getDefaultConfig();
        this.gridId = this._prefix + "KnockoutIndividualFamGrid";
        this.tableDataMap = {};
        this.individual = null;
        this.wip = false;
    }

    connectedCallback() {
        super.connectedCallback();
        this.gridCommons = new GridCommons(this.gridId, this, this._config);

    }

    async updated(changedProperties) {
        if (changedProperties.has("opencgaSession")) {
        }

        if ((changedProperties.has("individual") || changedProperties.has("active")) && this.active) {
            this.prepareData();
            this.renderTable();
        }

        if (changedProperties.has("config")) {
            this._config = {...this.getDefaultConfig(), ...this.config};
        }
    }

    async prepareData() {
        if (this.individual) {
            try {
                // motherId: "115000155", fatherId: "115000154"
                // motherSampleId:LP3000021-DNA_B04
                // fatherSampleId:LP3000018-DNA_A03

                this.sampleIds = [
                    this.individual.sampleId,
                    this.individual.fatherSampleId,
                    this.individual.motherSampleId
                ];
                // in case fatherSampleId is missing, the response studies[].samples[] of variants().query() would contains only 2 entries
                this.motherSampleIndx = this.individual.fatherSampleId && this.individual.motherSampleId ? 2 : 1;

                /**
                 * this.tableDataMap is the full list of unique variants per individual
                 */
                if (UtilsNew.isEmpty(this.tableDataMap)) {
                    for (const gene of this.individual.genes) {
                        for (const transcript of gene.transcripts) {
                            for (const variant of transcript.variants) {
                                this.tableDataMap[variant.id] = {
                                    ...variant,
                                    geneName: gene.name
                                };
                            }
                        }
                    }
                    this.variantIds = Object.keys(this.tableDataMap);
                    this.tableDataLn = this.variantIds.length;
                }

            } catch (e) {

            }
        }

    }

    /**
     * Queries variant WS only for the subset defined by startVariant and endVariant.
     */
    async getVariantInfo(sampleIds, startVariant, endVariant) {
        // formatter: VariantInterpreterGridFormatter.sampleGenotypeFormatter,
        try {
            const slicedVariant = this.variantIds.slice(startVariant, endVariant);
            if (slicedVariant.length && sampleIds.length) {
                const params = {
                    study: this.opencgaSession.study.fqn,
                    id: slicedVariant.join(","),
                    includeSample: sampleIds.join(",")
                };
                return await this.opencgaSession.opencgaClient.variants().query(params);
            } else {
                console.error("params error");
            }

        } catch (e) {
            UtilsNew.notifyError(e);
        }

    }

    /**
     * update tableData with new variant data (it happens on pagination)
     */
    updateTableData(tableDataMap, variantData) {
        const _tableDataMap = tableDataMap;
        variantData.forEach(variant => {
            _tableDataMap[variant.id].variantData = variant;
        });
        return Object.values(_tableDataMap);
    }

    renderTable() {
        this.table = $("#" + this.gridId);
        this.table.bootstrapTable("destroy");
        this.table.bootstrapTable({
            columns: this._initTableColumns(),
            sidePagination: "server",
            uniqueId: "id",
            pagination: true,
            // pageSize: this._config.pageSize,
            // pageList: this._config.pageList,
            paginationVAlign: "both",
            // formatShowingRows: this.gridCommons.formatShowingRows,
            gridContext: this,
            formatLoadingMessage: () => "<div><loading-spinner></loading-spinner></div>",
            ajax: async params => {
                try {
                    const pageNumber = this.table.bootstrapTable("getOptions").pageNumber || this.table.bootstrapTable("getOptions").pageNumber === 1;
                    const pageSize = this.table.bootstrapTable("getOptions").pageSize;
                    const startVariant = pageNumber * pageSize - pageSize;
                    const endVariant = pageNumber * pageSize;
                    const variantResponse = await this.getVariantInfo(this.sampleIds, startVariant, endVariant);
                    this.tableData = this.updateTableData(this.tableDataMap, variantResponse.getResults());
                    params.success({
                        total: this.tableDataLn,
                        rows: this.tableData.slice(startVariant, endVariant)
                    });
                } catch (e) {
                    console.error(e);
                    params.error(e);
                }
            },
            onClickRow: (row, selectedElement, field) => {
            },
            onLoadSuccess: data => {
                // this is not triggered in case of static data
            },
            onLoadError: (e, restResponse) => this.gridCommons.onLoadError(e, restResponse),
            onPostBody: () => UtilsNew.initTooltip(this),
            onPageChange: (number, size) => {
                console.error("page change", number, size);
            }
        });
    }

    geneFormatter(value, row) {
        return value.length ? (value.length > 20 ? `${value.length} genes` : value.map(gene => gene.name)) : "-";
    }

    _initTableColumns() {
        return [
            [
                {
                    title: "id",
                    field: "id",
                    rowspan: 2,
                    formatter: (value, row, index) => row.chromosome ? VariantGridFormatter.variantFormatter(value, row, index, this.opencgaSession.project.organism.assembly) : value
                },
                {
                    title: "Gene",
                    field: "geneName",
                    rowspan: 2
                    // formatter: this.geneFormatter
                },
                {
                    title: "Knockout Type",
                    field: "knockoutType",
                    rowspan: 2
                    /* formatter: row => {
                        this.table.bootstrapTable("updateRow", {index: 1, row: {id: "123"}});
                    }*/
                },
                {
                    title: "Proband<br>" + this.sampleIds[0],
                    field: "",
                    colspan: 2
                },
                {
                    title: "Father<br>" + this.sampleIds[1],
                    field: "id",
                    colspan: 2,
                    visible: !!this.sampleIds[1]
                },
                {
                    title: "Mother<br>" + this.sampleIds[2],
                    field: "",
                    colspan: 2,
                    visible: !!this.sampleIds[2]
                }
            ],
            [
                // proband
                {
                    title: "GT",
                    field: "variantData",
                    formatter: value => this.gtFormatter(value, 0)
                },
                {
                    title: "Filter",
                    field: "variantData",
                    formatter: value => this.filterFormatter(value, 0)
                },
                // father
                {
                    title: "GT",
                    field: "variantData",
                    visible: !!this.sampleIds[1],
                    formatter: value => this.gtFormatter(value, 1)
                },
                {
                    title: "Filter",
                    field: "variantData",
                    visible: !!this.sampleIds[1],
                    formatter: value => this.filterFormatter(value, 1)

                },
                // mother
                {
                    title: "GT",
                    field: "variantData",
                    visible: !!this.sampleIds[2],
                    formatter: value => this.gtFormatter(value, this.motherSampleIndx)
                },
                {
                    title: "Filter",
                    field: "variantData",
                    visible: !!this.sampleIds[2],
                    formatter: value => this.filterFormatter(value, this.motherSampleIndx)

                }
            ]
        ];
    }

    filterFormatter(value, sampleIndex) {
        const fileIndex = value?.studies?.[0]?.samples?.[sampleIndex]?.fileIndex;
        if (fileIndex !== undefined) {
            return `<span class="badge">${value?.studies?.[0]?.files[fileIndex].data.FILTER}</span>`;
        }
    }

    gtFormatter(value, sampleIndex) {
        if (value?.studies?.[0]?.sampleDataKeys.length) {
            const gtIndex = value.studies[0].sampleDataKeys.indexOf("GT");
            if (~gtIndex) {
                return value.studies[0].samples?.[sampleIndex]?.data?.[gtIndex];
            }
        }
    }

    getDefaultConfig() {
        return {
            title: "Individual"
        };
    }

    render() {
        if (this.wip) {
            return html`<div class="alert alert-warning"><i class="fas fa-3x fa-info-circle align-middle"></i> WIP </div>`;
        }
        return html`
            
            <div class="row">
                <table id="${this.gridId}"></table>
            </div>
        `;
    }

}

customElements.define("rga-individual-family", RgaIndividualFamily);