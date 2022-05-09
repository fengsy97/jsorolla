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

// TODO check functionality, ready() and connectedCallback() methods
// TODO migrate to litelement import "../catalog/samples/opencga-family-editor-new.js";

import {LitElement, html} from "lit";
import UtilsNew from "../../core/utilsNew.js";
import PolymerUtils from "../PolymerUtils.js";


export default class VariantSampleSelector extends LitElement {

    constructor() {
        super();

        this._init();
    }

    createRenderRoot() {
        return this;
    }

    static get properties() {
        return {
            opencgaClient: {
                type: Object
            },
            project: {
                type: Object
            },
            study: {
                type: Object
            },
            mode: {
                type: String
            },
            samples: {
                type: Array,
                notify: true
            },
            family: {
                type: Object,
                notify: true
            },
            filters: {
                type: Object,
                notify: true
            },
            query: {
                type: Object
            },
            search: {
                type: Object,
                notify: true
            }
        };
    }

    _init() {
        this.mode = "sample";
    }

    updated(changedProperties) {
        if (changedProperties.has("mode")) {
            this._onUpdateMode();
        }
        if (changedProperties.has("samples")) {
            this.sampleChanged();
        }
        if (changedProperties.has("filters")) {
            this.onFilterUpdate();
        }

        // TODO check : observer was on filteredVariables.variables.*
        if (changedProperties.has("filteredVariables")) {
            this.calculateFilters();
        }
    }

    ready() {
        super.ready();

        this.compact = true;
        this.fixedFilters = ["studies"];
        this.initFamily();
    }

    connectedCallback() {
        super.connectedCallback();

        this.table = PolymerUtils.getElementById(this.prefix + "FamilySelector");
    }

    initFamily() {
        const family = {};
        if (UtilsNew.isNotUndefinedOrNull(this.samples)) {
            family.name = "";
            family.description = "";
            family.diseases = [];
            family.members = [];
            family.annotationSets = [];
            //                    this.family.createDate = new Date();
            family.attributes = {};
            const _this = this;
            this.samples.forEach(sample => {
                family.members[sample.id] = {
                    father: undefined,
                    mother: undefined,
                    phenotypes: [],
                    //                            multiples: [],
                    //                            samples: [],
                    parentalConsanguinity: false
                };
            });
        }
        return family;
    }

    sampleChanged(e) {

        if (UtilsNew.isUndefinedOrNull(this.family)) {
            this.family = this.initFamily();
        } else {
            const members = [];
            this.samples.forEach(sample => {
                if (UtilsNew.isNotUndefinedOrNull(this.family.members[sample.id])) {
                    members[sample.id] = this.family.members[sample.id];
                } else {
                    members[sample.id] = {
                        father: undefined,
                        mother: undefined,
                        phenotypes: [],
                        parentalConsanguinity: false
                    };
                }
            });
            this.family.members = members;
            this.family = Object.assign({}, this.family);
        }

        this._samples = this.samples;
    }


    _onUpdateMode() {
        switch (this.mode) {
        default:
        case "sample":
            this.isSampleMode = true;
            this.isFamilyMode = false;
            break;
        case "family":
            this.isSampleMode = false;
            this.isFamilyMode = true;
            break;
        case "cancer":
            this.isCancerMode = true;
            this.isFamilyMode = false;
            break;
        }
    }

    /**
     * If filters have been removed, clean the values from the form.
     */
    onFilterUpdate() {
        this.updateForms(this.filters);
    }

    updateForms(filters) {
        // This is just to avoid entering here when it has just been initialized
        if (UtilsNew.isUndefined(this.prefix)) {
            return;
        }

        const sampleName = PolymerUtils.getValue(this.prefix + "NameTextarea");
        if (!filters.hasOwnProperty("name") && UtilsNew.isNotUndefined(sampleName) && sampleName.length > 0) {
            PolymerUtils.setValue(this.prefix + "NameTextarea", "");
        }

        const individual = PolymerUtils.getValue(this.prefix + "IndividualTextarea");
        if (!filters.hasOwnProperty("individual.id") && UtilsNew.isNotUndefined(individual) && individual.length > 0) {
            PolymerUtils.setValue(this.prefix + "IndividualTextarea", "");
        }

        if (this.filteredVariables.variables.length > 0) {
            if (!filters.hasOwnProperty("annotation")) {
                // Remove the filter variableSetId as it won't make more sense.
                //                        delete filters.variableSetId;
                this.set("filteredVariables.variables", []);

            } else if (filters.annotation.length < this.filteredVariables.variables.length) {
                const tmpVariables = [];
                filters.annotation.forEach(function(variable) {
                    tmpVariables.push(variable);
                });

                this.set("filteredVariables.variables", tmpVariables);
            }

        }
    }

    /**
     * Read from the values in the form, and sets the filters.
     */
    calculateFilters() {
        const filters = {};
        let sampleName = "";
        let individual = "";

        if (PolymerUtils.getElementById(this.prefix + "NameTextarea") !== null) {
            sampleName = PolymerUtils.getValue(this.prefix + "NameTextarea");
        }
        if (this.$$("#" + this.prefix + "IndividualTextarea") !== null) {
            individual = PolymerUtils.getValue(this.prefix + "IndividualTextarea");
        }

        if (UtilsNew.isNotUndefined(sampleName) && sampleName.length > 0) {
            filters["name"] = "~" + sampleName;
        }

        if (UtilsNew.isNotUndefined(individual) && individual.length > 0) {
            filters["individual.id"] = "~" + individual;
        }

        if (UtilsNew.isNotUndefined(this.filteredVariables.variables) && this.filteredVariables.variables.length > 0) {
            //                    filters["variableSetId"] = this.filteredVariables.variableSet;
            const annotations = [];
            this.filteredVariables.variables.forEach(function(variable) {
                annotations.push(variable);
            });
            filters["annotation"] = annotations;
        }
        this.filters = filters;
    }

    onSearch() {
        // Convert the filters to an objectParam that can be directly send to the sample search
        const filterParams = {};

        const keys = Object.keys(this.filters);
        for (let i = 0; i < keys.length; i++) {
            // Some filters can come as an array of things.
            // annotation = [{name: name, value: Smith}, {name: age, value: >5}]
            if (Array.isArray(this.filters[keys[i]])) {
                const myArray = this.filters[keys[i]];

                let myArrayFilter = [];

                // The elements in the array can be either an object
                if (Object.getPrototypeOf(myArray[0]) === Object.prototype) {
                    const myArray = this.filters[keys[i]];
                    for (let j = 0; j < myArray.length; j++) {
                        // TODO: We have to check if the value already has an operand
                        myArrayFilter.push(myArray[j].name + "=" + myArray[j].value);
                    }
                } else {
                    // Or an array of strings or numbers
                    myArrayFilter = this.filters[keys[i]];
                }

                filterParams[keys[i]] = myArrayFilter.join(";");
            } else {
                filterParams[keys[i]] = this.filters[keys[i]];
            }
        }

        if (this.filters.hasOwnProperty("annotation")) {
            // Add the variable set whose annotations will be queried
            filterParams["variableSetId"] = this.filteredVariables.variableSet;
        }

        this.search = filterParams;
    }

    onClear() {
        this.query = {studies: this.project.alias + ":" + this.study.alias};
        this.search = {};
    }

    onFilterChange(e) {
        this.query = e.detail;
        this.search = e.detail;
    }

    render() {
        return html`
        <div>
            <div class="col-md-3">
                <opencga-sample-filter .opencgaClient="${this.opencgaClient}" .query="${this.query}" .search="${this.search}}"></opencga-sample-filter>
            </div>

            <div class="col-md-9">
                <opencga-active-filters .opencgaSession="${this.opencgaSession}"
                                        .query="${this.query}"
                                        .defaultStudy="${this.study.alias}"
                                        alias="${this.activeFilterAlias}"
                                        .executedQuery="${this.search}"
                                        @activeFilterClear="${this.onClear}"
                                        @activeFilterChange="${this.onFilterChange}">
                </opencga-active-filters>

                <!--<h3>Sample results</h3>-->
                <variant-sample-grid .opencgaClient="${this.opencgaClient}" .study="${this.study}" .samples="${this.samples}" .search="${this.search}"></variant-sample-grid>

                ${this.isFamilyMode ? html`
                    <div style="padding: 20px 5px">
                        <h3>Family editor</h3>
                        <opencga-family-editor-new .opencgaClient="${this.opencgaClient}" .samples="${this._samples}" .study="${this.study}"
                                                   .family="${this.family}"></opencga-family-editor-new>
                    </div>
                ` : null }
            </div>
        </div>
        `;
    }

}

customElements.define("variant-sample-selector", VariantSampleSelector);
