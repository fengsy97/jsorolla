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
            query: {
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
        this.gridId = this._prefix + "KnockoutIndividualFamGrid";
        this.tableDataMap = {};
        this.individual = null;
        this.wip = false;
    }

    connectedCallback() {
        super.connectedCallback();
        this.gridCommons = new GridCommons(this.gridId, this, this._config);
        this._config = {...this.getDefaultConfig(), ...this.config};
    }

    async updated(changedProperties) {
        if (changedProperties.has("opencgaSession")) {
        }

        if ((changedProperties.has("individual") || changedProperties.has("active")) && this.active) {
            // this.prepareData();
            // this.renderTableLocale();
            this.renderTable();
        }

        if (changedProperties.has("config")) {
            this._config = {...this.getDefaultConfig(), ...this.config};
        }
    }

    async getTrio(individual) {
        const trio = {};
        if (individual?.attributes?.OPENCGA_CLINICAL_ANALYSIS) {
            const clinicalAnalysis = individual.attributes.OPENCGA_CLINICAL_ANALYSIS?.[0];
            if (clinicalAnalysis) {
                trio.proband = clinicalAnalysis.family.members.find(m => m.id === clinicalAnalysis.proband.id);
                trio.father = clinicalAnalysis.family.members.find(m => m.id === trio.proband.father.id);
                trio.mother = clinicalAnalysis.family.members.find(m => m.id === trio.proband.mother.id);
            }
        } else {
            trio.proband = this.individual;
        }
        return trio;
    }

    async renderTable() {

        this.trio = await this.getTrio(this.individual);

        this.sampleIds = [
            this.trio?.proband?.samples?.[0]?.id ?? this.individual.sampleId, // in case there is no clinical analysis available
            this.trio?.father?.samples?.[0]?.id,
            this.trio?.mother?.samples?.[0]?.id
        ];

        // in case father is missing, the response studies[].samples[] of variants().query() would contains only 2 entries
        // this.sampleIds[1] is undefined

        if (this.sampleIds[1] && this.sampleIds[2]) {
            this.motherSampleIndx = 2;
        } else if (!this.sampleIds[1] && this.sampleIds[2]) {
            this.motherSampleIndx = 1;
        } else {
            this.motherSampleIndx = null;
        }

        this._query = {
            ...this.query,
            study: this.opencgaSession.study.fqn,
            individualId: this.individual.id,
            includeIndividual: this.individual.id,
            include: "individuals.genes.transcripts.variants,individuals.genes.name"
        };
        // Checks if the component is not visible or the query hasn't changed
        if (!this.active || UtilsNew.objectCompare(this._query, this.prevQuery)) {
            // console.warn("query suppressed");
            return;
        }
        this.prevQuery = {...this._query};

        this.table = $("#" + this.gridId);
        this.table.bootstrapTable("destroy");
        this.table.bootstrapTable({
            columns: this._initTableColumns(),
            method: "get",
            sidePagination: "server",
            uniqueId: "id",
            // Table properties
            pagination: this._config.pagination,
            pageSize: this._config.pageSize,
            pageList: this._config.pageList,
            paginationVAlign: "both",
            formatShowingRows: this.gridCommons.formatShowingRows,
            showExport: this._config.showExport,
            detailView: this._config.detailView,
            detailFormatter: this._config.detailFormatter,
            formatLoadingMessage: () => "<div><loading-spinner></loading-spinner></div>",
            ajax: async params => {
                const _filters = {
                    study: this.opencgaSession.study.fqn,
                    limit: params.data.limit,
                    skip: params.data.offset || 0,
                    count: !this.table.bootstrapTable("getOptions").pageNumber || this.table.bootstrapTable("getOptions").pageNumber === 1,
                    ...this._query
                };
                this.opencgaSession.opencgaClient.clinical().queryRgaVariant(_filters)
                    .then(async rgaVariantResponse => {
                        const variantIds = rgaVariantResponse.getResults().map(variant => variant.id);
                        if (variantIds.length) {
                            const variantResponse = await this.getVariantInfo(this.sampleIds, variantIds);
                            // merging RGA Variant data with Variant data
                            const map = {};
                            for (const variant of variantResponse.getResults()) {
                                map[variant.id] = variant;
                            }
                            for (const variant of rgaVariantResponse.getResults()) {
                                if (map[variant.id]) {
                                    variant.attributes = {
                                        VARIANT: map[variant.id]
                                    };
                                }
                            }
                            params.success(rgaVariantResponse);
                        }
                    })
                    .catch(e => {
                        console.error(e);
                        params.error(e);
                    });
            },
            responseHandler: response => {
                const result = this.gridCommons.responseHandler(response, $(this.table).bootstrapTable("getOptions"));
                return result.response;
            },
            onClickRow: (row, selectedElement, field) => {
                console.log(row);
                // console.log("variant facet", this.restResponse.getResult(1).buckets.find(gene => gene.value === row.value))
                this.gridCommons.onClickRow(row.id, row, selectedElement);
            },
            onCheck: (row, $element) => this.gridCommons.onCheck(row.id, row),
            onLoadSuccess: data => this.gridCommons.onLoadSuccess(data, 1),
            onLoadError: (e, restResponse) => this.gridCommons.onLoadError(e, restResponse)
        });

    }

    /**
     * @deprecated
     * useful in case rga-individual-grid uses /analysis/clinical/rga/individual/query
     */
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
    async getVariantInfo(sampleIds, variantIds) {
        // formatter: VariantInterpreterGridFormatter.sampleGenotypeFormatter,
        try {
            if (sampleIds.length && variantIds.length) {
                const params = {
                    study: this.opencgaSession.study.fqn,
                    id: variantIds.join(","),
                    includeSample: sampleIds.filter(Boolean).join(",")
                };
                return await this.opencgaSession.opencgaClient.variants().query(params);
            } else {
                console.log(sampleIds, variantIds);
                console.error("params error");
            }

        } catch (e) {
            UtilsNew.notifyError(e);
        }

    }

    mergeData(rgaVariantResponse, variantResponse) {
        const resultMap = {};
        rgaVariantResponse.getResults().forEach(variant => resultMap[variant.id] = variant);
        variantResponse.getResults().forEach(variant => {
            resultMap[variant.id].variantData = variant;
        });
        return Object.values(resultMap);
    }

    /**
     * @deprecated
     * update tableData with new variant data (it happens on pagination)
     */
    updateTableData(tableDataMap, variantData) {
        const _tableDataMap = tableDataMap;
        variantData.forEach(variant => {
            _tableDataMap[variant.id].variantData = variant;
        });
        return Object.values(_tableDataMap);
    }

    /**
     * @deprecated
     * useful in case rga-individual-grid uses /analysis/clinical/rga/individual/query
     */
    renderTableLocale() {
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

    _initTableColumns() {
        return [
            [
                {
                    title: "Id",
                    field: "id",
                    rowspan: 2,
                    formatter: (value, row, index) => row.chromosome ? VariantGridFormatter.variantFormatter(value, row, index, this.opencgaSession.project.organism.assembly) : value
                },
                {
                    title: "Gene",
                    field: "geneName",
                    rowspan: 2,
                    formatter: this.geneFormatter
                },
                {
                    title: "Alternate allele frequency",
                    field: "populationFrequencies",
                    rowspan: 2,
                    formatter: (value, row) => this.clinicalPopulationFrequenciesFormatter(value, row)
                },
                {
                    title: "Type",
                    field: "type",
                    rowspan: 2
                },
                {
                    title: "Consequence type",
                    field: "individuals",
                    rowspan: 2,
                    formatter: (value, row) => this.consequenceTypeFormatter(value, row)
                },
                {
                    title: "Knockout Type",
                    field: "knockoutType",
                    rowspan: 2,
                    formatter: (value, row) => this.uniqueFieldFormatter(value, row, "knockoutType")
                },
                {
                    title: `Proband (${this.trio?.proband?.id})<br> ${this.sampleIds[0]}`,
                    field: "",
                    colspan: 2
                },
                {
                    title: `Father (${this.trio?.father?.id})<br>${this.sampleIds[1]}`,
                    field: "id",
                    colspan: 2,
                    visible: !!this.sampleIds[1]
                },
                {
                    title: `Mother (${this.trio?.mother?.id})<br>${this.sampleIds[2]}`,
                    field: "",
                    colspan: 2,
                    visible: !!this.sampleIds[2]
                }
            ],
            [
                // proband
                {
                    title: "GT",
                    field: "attributes.VARIANT",
                    formatter: value => this.gtFormatter(value, 0)
                },
                {
                    title: "Filter",
                    field: "attributes.VARIANT",
                    formatter: value => this.filterFormatter(value, 0)
                },
                // father
                {
                    title: "GT",
                    field: "attributes.VARIANT",
                    visible: !!this.sampleIds[1],
                    formatter: value => this.gtFormatter(value, 1)
                },
                {
                    title: "Filter",
                    field: "attributes.VARIANT",
                    visible: !!this.sampleIds[1],
                    formatter: value => this.filterFormatter(value, 1)

                },
                // mother
                {
                    title: "GT",
                    field: "attributes.VARIANT",
                    visible: !!this.sampleIds[2],
                    formatter: value => this.gtFormatter(value, this.motherSampleIndx)
                },
                {
                    title: "Filter",
                    field: "attributes.VARIANT",
                    visible: !!this.sampleIds[2],
                    formatter: value => this.filterFormatter(value, this.motherSampleIndx)

                }
            ]
        ];
    }

    clinicalPopulationFrequenciesFormatter(value, row) {
        if (row) {
            const popFreqMap = new Map();
            if (row?.populationFrequencies?.length > 0) {
                for (const popFreq of row.populationFrequencies) {
                    popFreqMap.set(popFreq.study + ":" + popFreq.population, Number(popFreq.altAlleleFreq).toFixed(4));
                }
            }
            return VariantGridFormatter.createPopulationFrequenciesTable(this._config.populationFrequencies, popFreqMap, populationFrequencies.style);
        }
    }

    consequenceTypeFormatter(value, row) {
        const uniqueCT = {};
        const filteredUniqueCT = {};
        for (const individual of row.individuals) {
            for (const gene of individual.genes) {
                for (const transcript of gene.transcripts) {
                    for (const variant of transcript.variants) {
                        if (row.id === variant.id && variant?.sequenceOntologyTerms?.length) {
                            for (const ct of variant.sequenceOntologyTerms) {
                                if (~this._config.consequenceTypes.indexOf(ct.name)) {
                                    uniqueCT[ct.name] = {...ct};
                                } else {
                                    filteredUniqueCT[ct.name] = {...ct};
                                }
                            }
                        }
                    }
                }
            }
        }
        if (Object.values(uniqueCT).length) {
            return `
            ${Object.values(uniqueCT).map(ct => `<span>${ct.name} (${ct.accession})</span>`).join(", ")}
            ${Object.values(filteredUniqueCT).length ? `
                <br>
                <a tooltip-title="Terms Filtered" tooltip-text="${Object.values(filteredUniqueCT).map(ct => `<span>${ct.name} (${ct.accession})</span>`).join(", ")}">
                    <span style="color: darkgray;font-style: italic">${Object.values(filteredUniqueCT).length} terms filtered</span>
                </a>`
                : ""}
        `;
        }
    }

    geneFormatter(value, row) {
        const uniqueValues = new Set();
        for (const individual of row.individuals) {
            for (const gene of individual.genes) {
                uniqueValues.add(gene.name);
            }
        }
        return uniqueValues.size ? Array.from(uniqueValues.keys()).join(", ") : "-";
    }

    uniqueFieldFormatter(value, row, field) {
        const uniqueValues = new Set();
        for (const individual of row.individuals) {
            for (const gene of individual.genes) {
                for (const transcript of gene.transcripts) {
                    for (const variant of transcript.variants) {
                        if (row.id === variant.id) {
                            if (variant[field]) {
                                uniqueValues.add(variant[field]);
                            }
                        }
                    }
                }
            }
        }
        return uniqueValues.size ? Array.from(uniqueValues.keys()).join(", ") : "-";
    }

    filterFormatter(value, sampleIndex) {
        const fileIndex = value?.studies?.[0]?.samples?.[sampleIndex]?.fileIndex;
        if (fileIndex !== undefined) {
            const terms = value?.studies?.[0]?.files[fileIndex].data.FILTER;
            if (terms) {
                return terms.split(";").map(term => `<span class="badge">${term}</span>`).join("");
            }
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
            title: "Individual",
            pagination: true,
            pageSize: 10,
            pageList: [10, 25, 50],
            populationFrequencies: [
                "GNOMAD_EXOMES:ALL",
                "GNOMAD_GENOMES:ALL",
                "ESP6500:ALL",
                "GONL:ALL",
                "EXAC:ALL",
                "1kG_phase3:ALL",
                "MGP:ALL",
                "DISCOVER:ALL",
                "UK10K:ALL"
            ]
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