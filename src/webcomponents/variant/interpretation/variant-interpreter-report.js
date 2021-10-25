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
import UtilsNew from "../../../core/utilsNew.js";
import "../../commons/forms/data-form.js";
import "../../file/file-preview.js";

class VariantInterpreterReport extends LitElement {

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
            clinicalAnalysisId: {
                type: String
            },
            clinicalAnalysis: {
                type: Object
            },
            opencgaSession: {
                type: Object
            },
            config: {
                type: Object
            }
        };
    }

    _init() {
        this.callersInfo = {
            "caveman": {type: "Substitutions", group: "somatic"},
            "pindel": {type: "Indels", group: "somatic"},
            "brass": {type: "Rearrangements", group: "somatic"},
            "ascat": {type: "Copy Number", group: "somatic"},
            "strelka": {type: "Substitutions and indels", group: "germline"},
            "manta": {type: "Rearrangements", group: "germline"},
        };

        this._config = this.getDefaultConfig();
        this._data = null;
        // Data-form is not capturing the update of the data property
        // For that reason, we need this flag to check when the data is ready (TODO)
        this._ready = false;
    }

    connectedCallback() {
        super.connectedCallback();

        this._config = {...this.getDefaultConfig(), ...this.config};
    }

    update(changedProperties) {
        if (changedProperties.has("clinicalAnalysisId")) {
            this.clinicalAnalysisIdObserver();
        }

        if (changedProperties.has("clinicalAnalysis")) {
            this.clinicalAnalysisObserver();
        }

        super.update(changedProperties);
    }

    clinicalAnalysisIdObserver() {
        if (this.opencgaSession && this.clinicalAnalysisId) {
            this.opencgaSession.opencgaClient.clinical().info(this.clinicalAnalysisId, {study: this.opencgaSession.study.fqn})
                .then(response => {
                    this.clinicalAnalysis = response.responses[0].results[0];
                })
                .catch(response => {
                    console.error("An error occurred fetching clinicalAnalysis: ", response);
                });
        }
    }

    clinicalAnalysisObserver() {
        if (this.opencgaSession && this.clinicalAnalysis) {
            console.log(this.opencgaSession);
            console.log(this.clinicalAnalysis);
            // We will assume that we always have a somatic and a germline sample
            // TODO: check if both samples exists
            const somaticSample = this.clinicalAnalysis.proband?.samples.find(s => s.somatic);
            const germlineSample = this.clinicalAnalysis.proband?.samples.find(s => !s.somatic);
            // Initialize report data
            this._data = {
                info: {
                    project: `${this.opencgaSession.project.name} (${this.opencgaSession.project.id})`,
                    study: `${this.opencgaSession.study.name} (${this.opencgaSession.study.id})`,
                    clinicalAnalysisId: this.clinicalAnalysis.id,
                    tumourId: somaticSample.id || null,
                    germlineId: germlineSample.id || null,
                    tumourType: "Ovarian", // TODO
                },
                // clinicalAnalysis: this.clinicalAnalysis,
                ascatMetrics: [],
                ascatPlots: [],
                ascatInterpretation: [
                    "Sunrise plot indicates a successful copy number analysis with estimated tumour content of and ploidy of XX.",
                    "The copy number profile (bottom right) shows a degree of over segmentation, however, the quality is acceptable.",
                    "The genome contains numerous copy number changes and regions of LOH (minor allele frequency of 0) suggestive of genomic instability.",
                ].join(" "),
                sequenceMetrics: [
                    {field: "Sequence methods", value: "WGS Illumina NovaSeq paired end"}
                ],
                processingInfo: [
                    // {field: "Alignment", value: "bwa mem 0.7.17-r1188"},
                    {field: "Genome build", value: this.opencgaSession.project.organism.assembly},
                ],
                somaticCallingInfo: [],
                germlineCallingInfo: [],
                customFilteringInfo: [],
                //     {field: "Substitutions", value: "ASMD >= 140, CLPM=0"},
                //     {field: "Indels", value: "QUAL >= 250, Repeats <10"},
                //     {field: "Rearrangements", value: "BRASSII reconstructed"},
                // ],
                overallText: [
                    "Sequence coverage is good. Duplicate read rate <10%.",
                    "There is adequate tumour cellularity, a correct copy number result and adequate mutation data to proceed",
                    "with an interpretation of this report.",
                ].join(" "),

            };
            const filesQuery = {
                sampleIds: [somaticSample.id, germlineSample.id].join(","),
                limit: 100,
                study: this.opencgaSession.study.fqn,
            };
            return this.opencgaSession.opencgaClient.files().search(filesQuery)
                .then(response => {
                    const files = response.responses[0].result;
                    console.log(files);
                    // Get processing alignment info from one BAM file
                    const bamFile = files.find(f => f.format === "BAM");
                    if (bamFile) {
                        this._data.processingInfo.push({
                            field: "Alignment",
                            value: `${bamFile.software.name} ${bamFile.software.version || ""}`,
                        });
                    }
                    // Fill tomour and normal stats fields
                    Object.entries({tumour: somaticSample, normal: germlineSample}).forEach(([field, sample]) => {
                        const sampleBamName = sample.fileIds.find(f => f.endsWith(".bam"));
                        const file = files.find(f => f.id === sampleBamName);
                        // Find annotation sets of this BAM file
                        const annotationSet = file.annotationSets.find(annotSet => annotSet.variableSetId === "bamQcStats");
                        if (annotationSet) {
                            this._data[`${field}Stats`] = [
                                {field: "Sequence coverage", value: annotationSet.annotations.avgSequenceDepth},
                                {field: "Duplicate reads rate", value: annotationSet.annotations.duplicateReadRate},
                                {field: "Insert size", value: `${annotationSet.annotations.avgInsertSize}bp`},
                            ];
                        }
                    });
                    // Fill somatic and germline Calling info
                    files.filter(f => f.format === "VCF").forEach(file => {
                        const info = this.callersInfo[file.software.name];
                        this._data[`${info.group}CallingInfo`].push({
                            type: info.type,
                            ...file.software,
                        });
                    });
                    // Fill ASCAT metrics
                    const ascatFile = files.find(f => f.software.name.toUpperCase() === "ASCAT");
                    if (ascatFile) {
                        const ascatMetrics = ascatFile.qualityControl.variant.ascatMetrics;
                        this._data.ascatMetrics = [
                            {field: "Ploidy", value: ascatMetrics.ploidy},
                            {field: "Aberrant cell fraction", value: ascatMetrics.aberrantCellFraction},
                        ];
                        this._data.ascatPlots = ascatMetrics.images
                            .filter(id => /(sunrise|profile|rawprofile)\.png$/.test(id))
                            .map(id => files.find(f => f.id === id));
                    }
                    // End filling report data
                    this._ready = true;
                    return this.requestUpdate();
                })
                .catch(error => {
                    console.error(error);
                });
        }
    }

    onFieldChange() {
        // TODO
    }

    getDefaultConfig() {
        return {
            id: "clinical-analysis",
            title: "Case Editor",
            icon: "fas fa-user-md",
            type: "form",
            buttons: {
                show: true,
                clearText: "Cancel",
                okText: "Save",
                classes: "col-md-offset-4 col-md-3"
            },
            display: {
                width: "8",
                showTitle: false,
                infoIcon: "",
                labelAlign: "left",
                labelWidth: "4",
                defaultLayout: "horizontal",
            },
            sections: [
                {
                    id: "info",
                    title: "",
                    display: {
                        style: "background-color: #f3f3f3; border-left: 4px solid #0c2f4c; margin: 16px 0px; padding-top: 10px; padding-left: 16px;",
                    },
                    elements: [
                        {
                            name: "Project",
                            field: "info.project",
                        },
                        {
                            name: "Study",
                            field: "info.study",
                        },
                        {
                            name: "Clinical analysis ID",
                            field: "info.clinicalAnalysisId",
                        },
                        {
                            name: "Tumour ID",
                            field: "info.tumourId",
                        },
                        {
                            name: "Germline ID",
                            field: "info.germlineId",
                        },
                        {
                            name: "Tumour type",
                            field: "info.tumourType",
                        },
                        {
                            name: "Genotyping check match and contamination",
                            field: "info.genotypingCheck",
                            defaultValue: "100% match (25/25 markers)",
                        },
                        {
                            name: "ASCAT Metrics",
                            field: "ascatMetrics",
                            type: "table",
                            display: {
                                hideHeader: true,
                                columns: [
                                    {field: "field"},
                                    {field: "value"},
                                ],
                            },
                        },
                    ],
                },
                {
                    id: "qc-metrics",
                    title: "1. QC Metrics",
                    elements: [
                        {
                            name: "Sequence metrics",
                            type: "table",
                            display: {
                                hideHeader: true,
                                columns: [
                                    {field: "field"},
                                    {field: "value"},
                                ],
                            },
                            field: "sequenceMetrics",
                        },
                        {
                            name: "Tumour",
                            type: "table",
                            display: {
                                hideHeader: true,
                                columns: [
                                    {field: "field"},
                                    {field: "value"},
                                ],
                            },
                            field: "tumourStats",
                        },
                        {
                            name: "Normal",
                            type: "table",
                            display: {
                                hideHeader: true,
                                columns: [
                                    {field: "field"},
                                    {field: "value"},
                                ],
                            },
                            field: "normalStats",
                        },
                        {
                            name: "Processing",
                            type: "table",
                            display: {
                                hideHeader: true,
                                columns: [
                                    {field: "field"},
                                    {field: "value"},
                                ],
                            },
                            field: "processingInfo",
                        },
                        {
                            name: "Somatic Calling",
                            type: "table",
                            display: {
                                hideHeader: true,
                                columns: [
                                    {field: "type"},
                                    {field: "name"},
                                    {field: "version"},
                                ],
                            },
                            field: "somaticCallingInfo",
                        },
                        {
                            name: "Custom filtering",
                            type: "table",
                            display: {
                                hideHeader: true,
                                columns: [
                                    {field: "field"},
                                    {field: "value"},
                                ],
                            },
                            field: "customFilteringInfo",
                        },
                        {
                            name: "Germline Calling",
                            type: "table",
                            display: {
                                hideHeader: true,
                                columns: [
                                    {field: "type"},
                                    {field: "name"},
                                    {field: "version"},
                                ],
                            },
                            field: "germlineCallingInfo",
                        },
                        {
                            name: "Overall",
                            type: "input-text",
                            display: {
                                rows: 3,
                            },
                            field: "overallText",
                        },
                        {type: "separator"},
                        {
                            name: "ASCAT copy number plots",
                            type: "custom",
                            display: {
                                render: images => images.length > 0 ? html`
                                    <div class="row">
                                        <div class="col-md-6">
                                            <file-preview
                                                .active="${true}"
                                                .file="${images[0]}"
                                                .opencgaSession="${this.opencgaSession}">
                                            </file-preview>
                                        </div>
                                        <div class="col-md-6">
                                            <file-preview
                                                .active="${true}"
                                                .file="${images[2]}"
                                                .opencgaSession="${this.opencgaSession}">
                                            </file-preview>
                                            <file-preview
                                                .active="${true}"
                                                .file="${images[1]}"
                                                .opencgaSession="${this.opencgaSession}">
                                            </file-preview>
                                        </div>
                                    </div>
                                ` : html``,
                            },
                            field: "ascatPlots",
                        },
                        {
                            name: "ASCAT plot interpretation",
                            type: "input-text",
                            display: {
                                rows: 3,
                            },
                            field: "ascatInterpretation",
                        },
                        {type: "separator"},
                        {
                            name: "Genome plot interpretation",
                            field: "description",
                            type: "input-text",
                            defaultValue: "",
                            display: {
                                rows: 3,
                                // updated: this.updateParams.description ?? false
                            },
                        },
                    ]
                },
                {
                    id: "results",
                    title: "2. Results",
                    elements: [

                    ]
                },
                {
                    id: "mutational-signatures",
                    title: "3. Mutational Signatures",
                    elements: [

                    ]
                },
                {
                    id: "final-summary",
                    title: "4. Final Summary",
                    elements: [

                    ]
                }
            ]
        };
    }

    render() {
        if (!this.clinicalAnalysis || !this._ready) {
            return html``;
        }

        return html`
            <data-form 
                .data="${this._data}"
                .config="${this._config}"
                @fieldChange="${e => this.onFieldChange(e)}"
                @clear="${this.onClear}"
                @submit="${this.onRun}">
            </data-form>
        `;
    }

}

customElements.define("variant-interpreter-report", VariantInterpreterReport);
