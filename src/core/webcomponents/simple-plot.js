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
import UtilsNew from "../utilsNew.js";

export default class SimplePlot extends LitElement {

    constructor() {
        super();
        this._init();
    }

    createRenderRoot() {
        return this;
    }

    static get properties() {
        return {
            active: {
                type: Boolean
            },
            title: {
                type: String
            },
            data: {
                type: Object
            },
            categories: {
                type: Object
            },
            type: {
                type: String
            }
        }
    }

    _init(){
        this._prefix = "plot-" + UtilsNew.randomString(6) + "_";

    }

    connectedCallback() {
        super.connectedCallback();
        this._config = {...this.getDefaultConfig(), ...this.config};
    }

    firstUpdated(_changedProperties) {
        switch (this.type) {
            case "column":
                this.barChart({title: this.title, categories: this.categories, data: this.data});
                break;
            case "pie":
                this.pieChart({title: this.title, categories: this.categories, data: this.data});
                break;
        }
    }

    updated(changedProperties) {
        if(changedProperties.has("property")) {
            this.propertyObserver();
        }
    }

    barChart(param) {
        Highcharts.chart(this._prefix + "chart", {
            chart: {
                type: "column"
            },
            title: {
                text: param.title
            },
            xAxis: {
                categories: param.categories,
                title: {
                    text: null
                }
            },
            yAxis: {
                min: 0,
                title: {
                    text: ""
                },
                labels: {
                    overflow: "justify"
                }
            },
            plotOptions: {
                bar: {
                    dataLabels: {
                        enabled: true
                    }
                }
            },
            credits: {
                enabled: false
            },
            series: [{
                colorByPoint: true,
                data: param.data
            }]
        });
    }

    pieChart(param) {
        Highcharts.chart(this._prefix + "chart", {
            chart: {
                plotBackgroundColor: null,
                plotBorderWidth: null,
                plotShadow: false,
                type: "pie"
            },
            title: {
                text: param.title
            },
            tooltip: {
                //pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
            },
            accessibility: {
                point: {
                    valueSuffix: "%"
                }
            },
            plotOptions: {
                pie: {
                    allowPointSelect: true,
                    cursor: "pointer",
                    dataLabels: {
                        enabled: false
                    },
                    showInLegend: true
                }
            },
            series: [{
                name: "Brands",
                colorByPoint: true,
                data: [{
                    name: "Chrome",
                    y: 61.41,
                    sliced: true,
                    selected: true
                }, {
                    name: "Internet Explorer",
                    y: 11.84
                }, {
                    name: "Firefox",
                    y: 10.85
                }, {
                    name: "Edge",
                    y: 4.67
                }, {
                    name: "Safari",
                    y: 4.18
                }, {
                    name: "Other",
                    y: 7.05
                }]
            }]
        });
    }

    getDefaultConfig() {
        return {
        }
    }

    render() {
        return html`
        <div id="${this._prefix}chart"></div>
        `;
    }

}

customElements.define("simple-plot", SimplePlot);
