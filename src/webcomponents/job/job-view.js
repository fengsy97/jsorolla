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
import AnalysisRegistry from "../variant/analysis/analysis-registry.js";
import "../commons/forms/data-form.js";
import "./job-detail-log.js";

export default class JobView extends LitElement {

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
            jobId: {
                type: String
            },
            job: {
                type: Object
            },
            mode: {
                type: String
            },
            config: {
                type: Object
            }
        };
    }

    _init() {
        this._config = this.getDefaultConfig();
    }

    connectedCallback() {
        super.connectedCallback();

        this._config = {...this.getDefaultConfig(), ...this.config};
    }

    updated(changedProperties) {
        if (changedProperties.has("jobId")) {
            this.jobIdObserver();
        }

        if (changedProperties.has("config")) {
            this._config = {...this.getDefaultConfig(), ...this.config};
            this.requestUpdate();
        }

        /* if (changedProperties.has("mode")) {
        }*/
    }

    jobIdObserver() {
        if (this.opencgaSession && this.jobId) {
            this.opencgaSession.opencgaClient.jobs().info(this.jobId, {study: this.opencgaSession.study.fqn})
                .then(response => {
                    this.job = response.getResult(0);
                    this.requestUpdate();
                })
                .catch(reason => {
                    console.error(reason);
                });
        }
    }

    dependsOnMap(node) {
        console.log("node", node);
        return {text: node.id, nodes: node.elements?.map(n => this.dependsOnMap(n))};
    }

    renderResults() {
        /** alternative solutions:
         *  1. using the switch to render a result component like <opencga-knockout-analysis-result>. At that point having a `result` field in analysis configuration makes no sense anymore.
         *  2. using the switch to dynamic import the config and call render
         */

        console.log("this.job.tool.id", this.job.tool.id);
        switch (this.job.tool.id) {
            case "knockout":
                return html`<opencga-knockout-analysis-result></opencga-knockout-analysis-result>`;
            /* case "knockout":
                let config = await import("./../variant/analysis/opencga-knockout-analysis.js")
                return config.default.config().result();
                break*/
            default:
                return "results";
        }


    }

    getDefaultConfig() {
        return {
            title: "Summary",
            icon: "",
            nullData: "",
            display: {
                collapsable: true,
                showTitle: false,
                labelWidth: 3,
                defaultLayout: "horizontal",
                defaultValue: "-"
            },
            sections: [
                {
                    title: "Summary",
                    display: {
                    },
                    elements: [
                        {
                            name: "Job ID",
                            field: "id"
                        },
                        {
                            name: "User",
                            field: "userId"
                        },
                        {
                            name: "Tool ID",
                            field: "tool.id"
                        },
                        {
                            name: "Status",
                            // field: "internal",
                            type: "custom",
                            display: {
                                render: job => UtilsNew.renderHTML(UtilsNew.jobStatusFormatter(job.internal.status, true))
                            }
                        },
                        {
                            name: "Priority",
                            field: "priority"
                        },
                        {
                            name: "Tags",
                            field: "tags",
                            type: "list",
                            display: {
                                render: field => UtilsNew.renderHTML(`<span class="badge badge-pill badge-primary">${field}</span>`)
                            },
                            defaultValue: "-"
                        },
                        {
                            name: "Submitted Date",
                            type: "custom",
                            display: {
                                render: job => html`${UtilsNew.dateFormatter(job.creationDate, "D MMM YYYY, h:mm:ss a")}`
                            }
                        },
                        {
                            name: "Description",
                            field: "description"
                        }
                    ]
                },
                {
                    title: "Execution",
                    display: {

                    },
                    elements: [
                        {
                            name: "Start-End Date",
                            // field: "execution",
                            type: "custom",
                            display: {
                                render: job => job.execution ? html`
                                    ${job.execution.start ? moment(job.execution.start).format("D MMM YYYY, h:mm:ss a") : "-"} ${job.execution.end ? html`- ${moment(job.execution.end).format("D MMM YYYY, h:mm:ss a")}` : html`-` }
                                ` :
                                    "-"
                            }
                        },
                        {
                            name: "Input Parameters",
                            // field: "params",
                            type: "custom",
                            display: {
                                render: job => job.params ? Object.entries(job.params).map(([param, value]) => html`<div><label>${param}</label>: ${value ? value : "-"}</div>`) : "-"
                            }
                        },
                        {
                            name: "Input Files",
                            field: "input",
                            type: "list",
                            defaultValue: "N/A",
                            display: {
                                template: "${name}",
                                contentLayout: "bullets"
                            }
                        },
                        // {
                        //     name: "Output Files",
                        //     field: "output",
                        //     type: "table",
                        //     defaultValue: "N/A",
                        //     display: {
                        //         columns: [
                        //             {
                        //                 name: "File Name", field: "name"
                        //             },
                        //             {
                        //                 name: "Size", field: "size"
                        //             },
                        //             {
                        //                 name: "Download", display: {
                        //                     render: file => {
                        //                         debugger
                        //                         return html`<download-button .name="${file.name}" .json="${file}"></download-button>`
                        //                     },
                        //                 }
                        //                 //format: ${UtilsNew.renderHTML(this.statusFormatter(status.name))}
                        //             }
                        //         ],
                        //         border: true
                        //         // contentLayout: "bullets",
                        //     }
                        // },
                        {
                            name: "Output Directory",
                            field: "outDir.path"
                        },
                        {
                            name: "Output Files",
                            field: "output",
                            type: "list",
                            defaultValue: "N/A",
                            display: {
                                template: "${name}",
                                contentLayout: "bullets"
                            }
                        },
                        {
                            name: "Command Line",
                            type: "complex",
                            display: {
                                template: "<div class='cmd'>${commandLine}</div>"
                            }
                        }

                    ]
                },
                {
                    title: "Results",
                    elements: [
                        {
                            type: "custom",
                            name: "",
                            display: {
                                name: "",
                                defaultLayout: "vertical",
                                render: () => AnalysisRegistry.get(this.job.tool.id)?.result(this.job, this.opencgaSession)
                            }
                        }
                    ]
                },
                {
                    title: "Job Dependencies",
                    display: {
                    },
                    elements: [
                        {
                            name: "Dependencies",
                            field: "dependsOn",
                            type: "table",
                            defaultValue: "No Job dependencies",
                            display: {
                                columns: [
                                    {
                                        name: "Job ID", field: "id"
                                    },
                                    {
                                        name: "Name", field: "uuid"
                                    },
                                    {
                                        name: "Status", field: "internal.status.name"
                                        // format: ${UtilsNew.renderHTML(this.statusFormatter(status.name))}
                                    }
                                ],
                                border: true
                            }
                        }

                    ]
                }, {
                    title: "Job log",
                    visible: this.mode === "full",
                    elements: [
                        {
                            name: "",
                            type: "custom",
                            display: {
                                defaultLayout: "vertical",
                                render: job => html`<job-detail-log
                                                        .opencgaSession=${this.opencgaSession}
                                                        .active="${true}"
                                                        .job="${job}">
                                                    </job-detail-log>`
                            }
                        }
                    ]
                }
            ]
        };
    }

    render() {
        return html`
            <data-form
                .data=${this.job}
                .config="${this._config}">
            </data-form>
        `;
    }

}

customElements.define("job-view", JobView);

