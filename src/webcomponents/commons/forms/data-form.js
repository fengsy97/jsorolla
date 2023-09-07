/* eslint-disable no-useless-escape */
/* eslint-disable valid-jsdoc */
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

import {html, LitElement, nothing} from "lit";
import UtilsNew from "../../../core/utils-new.js";
import LitUtils from "../utils/lit-utils.js";
import "../simple-chart.js";
import "../json-viewer.js";
import "../json-editor.js";
import "../../tree-viewer.js";
import "../../download-button.js";
import "../forms/text-field-filter.js";
import "./toggle-switch.js";
import "./toggle-buttons.js";
import "../data-table.js";

export default class DataForm extends LitElement {

    static re = /(?<arrayFieldName>[a-zA-Z.]+)\[\].(?<index>[0-9]+).(?<field>[a-zA-Z.]+)/;

    static NOTIFICATION_TYPES = {
        error: "alert alert-danger",
        info: "alert alert-info",
        success: "alert alert-success",
        warning: "alert alert-warning"
    };

    constructor() {
        super();

        this._init();
    }

    createRenderRoot() {
        return this;
    }

    static get properties() {
        return {
            data: {
                type: Object
            },
            originalData: {
                type: Object
            },
            updateParams: {
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
        this._prefix = UtilsNew.randomString(8);
        this.formSubmitted = false;
        this.showGlobalValidationError = false;
        this.emptyRequiredFields = new Set();
        this.invalidFields = new Set();
        this.activeSection = 0; // Initial active section (only for tabs and pills type)

        this.objectListItems = {};
        this.batchItems = {};

        // We need to initialise 'data' in case undefined value is passed
        this.data = {};
    }

    update(changedProperties) {
        if (changedProperties.has("data")) {
            // Undefined or null values are accepted only when rendering form.
            // Check if 'data' passed is undefined or null and initialised to empty object
            this.dataObserver();
        }

        // Reset required and invalid fields sets
        this.emptyRequiredFields = new Set();
        this.invalidFields = new Set();

        super.update(changedProperties);
    }

    dataObserver() {
        this.data = this.data ?? {};
    }

    getValue(field, object, defaultValue, format) {
        let value = object;
        if (field) {
            const _object = object ? object : this.data;
            // If field contains [] means the element type is object-list,
            // we need to get the value from the array, information is encoded as:
            //  phenotypes[].1.id: field id from second item of phenotypes
            if (field.includes("[]")) {
                const [parentItemArray, right] = field.split("[].");
                if (right?.includes(".")) {
                    const [itemIndex, ...itemFieldIds] = right.split(".");
                    // support object nested
                    if (itemFieldIds.length === 1) {
                        value = UtilsNew.getObjectValue(_object, parentItemArray, "")[itemIndex][itemFieldIds[0]];
                    } else {
                        value = UtilsNew.getObjectValue(_object, parentItemArray, "")[itemIndex][itemFieldIds[0]]?.[itemFieldIds[1]];
                    }
                } else {
                    // FIXME this should never be reached
                    console.error("this should never be reached");
                    // value = this.objectListItems[parentItemArray]?.[right];
                }
            } else {
                // Optional chaining is needed when "res" is undefined
                value = field.split(".").reduce((res, prop) => res?.[prop], _object);
            }

            // needed for handling falsy values
            if (value !== undefined && value !== "") {
                if (format) {
                    if (format.classes || format.style) {
                        value = html`<span class="${format.classes}" style="${format.style}">${value}</span>`;
                    }
                    if (format.link) {
                        value = html`<a href="${format.link.replace(field.toUpperCase(), value)}" target="_blank">${value}</a>`;
                    }
                    if (format.decimals && !isNaN(value)) {
                        value = value.toFixed(format.decimals);
                    }
                }
            } else {
                value = defaultValue;
            }
        } else if (defaultValue) {
            value = defaultValue;
        }
        return value;
    }

    applyTemplate(template, object, matches, defaultValue) {
        if (!matches) {
            // eslint-disable-next-line no-param-reassign
            matches = template.match(/\$\{[a-zA-Z_.\[\]]+\}/g).map(elem => elem.substring(2, elem.length - 1));
        }
        for (const match of matches) {
            const v = this.getValue(match, object, defaultValue);
            // eslint-disable-next-line no-param-reassign
            template = template.replace("${" + match + "}", v);
        }

        return template;
    }

    _getType() {
        // In case that we are using the deprecated form type, get type from display.mode.type
        return (this.config.type === "form") ? this.config.display?.mode?.type ?? "" : this.config.type ?? "";
    }

    // Get buttons layout
    // FIXME To be removed when deprecating old config.buttons.top property
    _getButtonsLayout() {
        const layout = this.config.display?.buttonsLayout || "";
        if (!layout || (layout !== "bottom" && layout !== "top")) {
            return this.config?.buttons?.top ? "top" : "bottom";
        }

        // Default: return layout from buttonsLayout or bottom
        return layout || "bottom";
    }

    _getDefaultValue(element) {
        // WARNING: element.defaultValue is deprecated, use element.display.defaultValue
        return element?.display?.defaultValue ?? element?.defaultValue ?? this.config?.display?.defaultValue ?? "";
    }

    _getErrorMessage(element, section) {
        const text = element?.display?.errorMessage ?? section?.display?.errorMessage ?? this.config?.display?.errorMessage ?? "Error: No valid data found";
        return html`<div><em>${text}</em></div>`;
    }

    /**
     * Check if visible field is defined and not null, be careful since 'visible' can be a 'boolean' or a 'function'.
     * @param value
     * @param defaultValue
     * @returns {boolean} Default value is 'true' so it is visible.
     * @private
     */
    _getBooleanValue(value, defaultValue, element) {
        let _value = typeof defaultValue !== "undefined" ? defaultValue : true;
        if (typeof value !== "undefined" && value !== null) {
            if (typeof value === "boolean") {
                _value = value;
            } else {
                if (typeof value === "function") {
                    // example: phenotypes[].1.description
                    if (element?.field?.includes("[].")) {
                        const match = element.field.match(DataForm.re);
                        if (match) {
                            const itemArray = UtilsNew.getObjectValue(this.data, match?.groups?.arrayFieldName, "")[match?.groups?.index];
                            _value = value(this.data, itemArray);
                        } else {
                            _value = value(this.data);
                        }
                    } else {
                        _value = value(this.data);
                    }
                } else {
                    console.error(`Expected boolean or function value, but got '${typeof value}'`);
                }
            }
        }
        return _value;
    }

    _getWidth(element) {
        return element?.display?.width ?? this.config?.display?.defaultWidth ?? null;
    }

    _getSectionWidth(section) {
        return section?.display?.width ?? this.config?.display?.width ?? 12;
    }

    _getElementTitleWidth(element, section) {
        return element?.display?.titleWidth ?? section?.display?.titleWidth ?? this.config?.display?.titleWidth ?? null;
    }

    // DEPRECATED: use _getElementTitleWidth instead
    _getLabelWidth(element, section) {
        return element?.display?.labelWidth ?? section?.display?.labelWidth ?? this.config?.display?.labelWidth ?? 3;
    }

    _getTitleHeader(header, title, classes, style) {
        switch (header) {
            case "h1":
                return html`<h1 class="${classes}" style="${style}">${title}</h1>`;
            case "h2":
                return html`<h2 class="${classes}" style="${style}">${title}</h2>`;
            case "h3":
                return html`<h3 class="${classes}" style="${style}">${title}</h3>`;
            case "h4":
                return html`<h4 class="${classes}" style="${style}">${title}</h4>`;
            case "h5":
                return html`<h5 class="${classes}" style="${style}">${title}</h5>`;
            case "h6":
                return html`<h6 class="${classes}" style="${style}">${title}</h6>`;
        }
    }

    _getHelpMessage(element) {
        return element.display?.helpMessage ?? element.display?.help?.text ?? null;
    }

    _getHelpMode(element) {
        return element.display?.helpMode ?? element.display?.help?.mode ?? "";
    }

    _getHelpIcon(element, section) {
        return element?.display?.helpIcon ?? section?.display?.helpIcon ?? this.config?.display?.helpIcon ?? "fas fa-info-circle";
    }

    _getErrorIcon(element, section) {
        return element?.display?.errorIcon ?? section?.display?.errorIcon ?? this.config?.display?.errorIcon ?? "fas fa-times-circle";
    }

    _getDefaultLayout(element, section) {
        return element?.display?.defaultLayout ?? section?.display?.defaultLayout ?? this.config?.display?.defaultLayout ?? "horizontal";
    }

    _getVisibleSections() {
        return this.config.sections
            .filter(section => section.elements[0].type !== "notification" || section.elements.length > 1)
            .filter(section => this._getBooleanValue(section?.display?.visible, true));
    }

    _isUpdated(element) {
        if (UtilsNew.isNotEmpty(this.updateParams)) {
            // 1. Check if element.field exists
            const fieldExists = this.updateParams[element.field];
            if (fieldExists) {
                return true;
            } else {
                // 2. Check if field is part of a new ADDED object-list, example:  'phenotypes[].1'  (no fields)
                if (element.field.includes("[]")) {
                    const match = element.field.match(DataForm.re);
                    return !!this.updateParams[match?.groups?.arrayFieldName + "[]." + match?.groups?.index]?.after?.[match?.groups?.field];
                } else {
                    // 3. To display object-list root elements check if the prefix exists, example: 'phenotypes'
                    // 3.1 Check if any original item has been deleted
                    if (this.updateParams[element.field + "[].deleted"]?.length > 0) {
                        return true;
                    } else {
                        // 3.2 Check if any original item has been edited
                        return Object.keys(this.updateParams)
                            .filter(key => key !== element.field + "[].deleted")
                            .some(key => key.startsWith(element.field + "[]."));
                    }
                }
            }
        }
    }

    _isRequiredEmpty(element, value) {
        if (!value) {
            // eslint-disable-next-line no-param-reassign
            value = this.getValue(element.field) || this._getDefaultValue(element);
        }

        if (element.required) {
            if (value) {
                this.emptyRequiredFields.delete(element.field);
                return false;
            } else {
                this.emptyRequiredFields.add(element.field);
                return true;
            }
        }

        // Field not required --> skip validation
        return false;
    }

    _isValid(element, value) {
        if (!value) {
            // eslint-disable-next-line no-param-reassign
            value = this.getValue(element.field) || this._getDefaultValue(element);
        }

        if (typeof element?.validation?.validate === "function") {
            // When an object-list, get the item being validated.
            let item;
            if (element.field.includes("[]")) {
                const match = element.field.match(DataForm.re);
                if (match) {
                    item = UtilsNew.getObjectValue(this.data, match?.groups?.arrayFieldName, "")[match?.groups?.index];
                }
            }
            if (element.validation.validate(value, this.data, item)) {
                this.invalidFields.delete(element.field);
                return true;
            } else {
                this.invalidFields.add(element.field);
                return false;
            }
        }

        // No validation function provided --> we assume value is valid
        return true;
    }

    renderData() {
        // WARNING: display.classes is deprecated, use display.className instead
        const className = this.config?.display?.className ?? this.config?.display?.classes ?? "";
        const style = this.config?.display?.style ?? "";
        const layout = this.config?.display?.defaultLayout || "";
        const layoutClassName = (layout === "horizontal") ? "form-horizontal" : "";

        if (this.config.type === "tabs" || this.config.type === "pills") {
            // Render all sections but display only active section
            return html`
                <div class="${layoutClassName} ${className}" style="${style}">
                    ${this._getVisibleSections().map((section, index) => html`
                        <div style="display:${this.activeSection === index ? "block": "none"}">
                            ${this._createSection(section)}
                        </div>
                    `)}
                </div>
            `;
        } else {
            if (this.config?.display?.layout && Array.isArray(this.config.display.layout)) {
                // Render with a specific layout
                return html`
                    <div class="${className}" style="${style}">
                        ${this.config?.display.layout.map(section => {
                            const sectionClassName = section.className ?? section.classes ?? "";
                            const sectionStyle = section.style ?? "";

                            if (section.id) {
                                return html`
                                    <div class="${layoutClassName} ${sectionClassName}" style="${sectionStyle}">
                                        ${this._createSection(this.config.sections.find(s => s.id === section.id))}
                                    </div>
                                `;
                            } else {
                                return html`
                                    <div class="${sectionClassName}" style="${sectionStyle}">
                                        ${(section.sections || []).map(subsection => {
                                            const subsectionClassName = subsection.className ?? subsection.classes ?? "";
                                            const subsectionStyle = subsection.style ?? "";
                                            return subsection.id && html`
                                                <div class="${layoutClassName} ${subsectionClassName}" style="${subsectionStyle}">
                                                    ${this._createSection(this.config.sections.find(s => s.id === subsection.id))}
                                                </div>
                                            `;
                                        })}
                                    </div>
                                `;
                            }
                        })}
                    </div>
                `;
            } else {
                // Render without layout
                return html`
                    <div class="${layoutClassName} ${className}" style="${style}">
                        ${this.config.sections.map(section => this._createSection(section))}
                    </div>
                `;
            }
        }
    }

    _createSection(section) {
        // Check if the section is visible
        if (section.display && !this._getBooleanValue(section.display.visible)) {
            return;
        }

        // Section values
        const sectionClassName = section?.display?.className ?? section?.display?.classes ?? "";
        const sectionStyle = section?.display?.style ?? "";
        const sectionWidth = "col-md-" + this._getSectionWidth(section);

        // Section title values
        const titleHeader = section?.display?.titleHeader ?? "h3";
        const titleClassName = section?.display?.titleClassName ?? section?.display?.titleClasses ?? "";
        const titleStyle = section?.display?.titleStyle ?? "";

        // Section description values
        const description = section.description ?? section.text ?? null;
        const descriptionClassName = section.display?.descriptionClassName ?? section.display?.textClass ?? "";
        const descriptionStyle = section.display?.descriptionStyle ?? section.display?.textStyle ?? "";

        const buttonsSectionVisible = this._getBooleanValue(section.display?.buttonsVisible ?? false);

        return html`
            <div class="row" style="margin-bottom: 12px;">
                <div class="${sectionWidth}">
                    ${section.title ? html`
                        <div style="margin-bottom:8px;">
                            ${this._getTitleHeader(titleHeader, section.title, titleClassName, titleStyle)}
                        </div>
                    ` : null}
                    ${description ? html`
                        <div style="margin-bottom:8px">
                            <div class="${descriptionClassName}" style="${descriptionStyle}">
                                <span>${description}</span>
                            </div>
                        </div>
                    ` : null}
                    <div class="${sectionClassName}" style="${sectionStyle}">
                        ${section.elements.map(element => this._createElement(element, section))}
                    </div>
                </div>
            </div>
            ${buttonsSectionVisible ? this.renderButtons(null, section?.id) : null}
        `;
    }

    _createElement(element, section) {
        // Check if the element is visible
        if (element.display && !this._getBooleanValue(element.display.visible, true, element)) {
            return;
        }

        // Check if type is 'separator', this is a special case, no need to parse 'name' and 'content'
        if (element.type === "separator") {
            return html`<hr style="${element.display?.style || ""}" />`;
        }

        // To store element content
        let content = "";

        // if not 'type' is defined we assumed is 'basic' and therefore field exist
        if (!element.type || element.type === "basic") {
            const format = element.display?.format ?? element.display; // 'format' is the old way, to be removed
            content = html`${this.getValue(element.field, this.data, this._getDefaultValue(element), format)}`;
        } else {
            // Other 'type' are rendered by specific functions
            switch (element.type) {
                case "text":
                case "title":
                case "notification":
                    content = this._createTextElement(element);
                    break;
                case "input-text":
                    content = this._createInputElement(element, "text");
                    break;
                case "input-num":
                    content = this._createInputElement(element, "number");
                    break;
                case "input-password":
                    content = this._createInputElement(element, "password");
                    break;
                case "input-number":
                    content = this._createInputNumberElement(element);
                    break;
                case "input-date":
                    content = this._createInputDateElement(element);
                    break;
                case "checkbox":
                    content = this._createCheckboxElement(element);
                    break;
                case "toggle-switch":
                    content = this._createToggleSwitchElement(element);
                    break;
                case "toggle-buttons":
                    content = this._createToggleButtonsElement(element);
                    break;
                case "select":
                    content = this._createInputSelectElement(element);
                    break;
                case "complex":
                    content = this._createComplexElement(element);
                    break;
                case "list":
                    content = this._createListElement(element);
                    break;
                case "table":
                    content = this._createTableElement(element);
                    break;
                case "chart":
                case "plot":
                    content = this._createPlotElement(element);
                    break;
                case "json":
                    content = this._createJsonElement(element);
                    break;
                case "json-editor":
                    content = this._createJsonEditorElement(element);
                    break;
                case "tree":
                    content = this._createTreeElement(element);
                    break;
                case "custom":
                    content = this._createCustomElement(element);
                    break;
                case "download":
                    content = this._createDownloadElement(element);
                    break;
                case "object":
                    content = this._createObjectElement(element);
                    break;
                case "object-list":
                    content = this._createObjectListElement(element);
                    break;
                default:
                    throw new Error("Element type not supported:" + element.type);
            }
        }

        // Only nested in 'object' and 'object-list', in these cases we do not want to create
        // the rest of the HTML
        if (element?.display?.nested) {
            return content;
        }

        // Initialize element values
        const layout = this._getDefaultLayout(element, section);
        const width = this._getWidth(element) || 12;

        // Initialize container values
        const elementContainerClassName = element.display?.containerClassName ?? "";
        const elementContainerStyle = element.display?.containerStyle ?? "";

        // Initialize title values
        let title = element.title ?? element.name; // element.name is deprecated --> use element.title
        const titleClassName = element.display?.titleClassName ?? element.display?.labelClasses ?? "";
        const titleStyle = element.display?.titleStyle ?? element.display?.labelStyle ?? "";
        const titleVisible = element.display?.titleVisible ?? element.showLabel ?? true;
        const titleWidth = title && titleVisible ? this._getElementTitleWidth(element, section) ?? this._getLabelWidth(element, section) : 0;
        const titleAlign = element.display?.titleAlign ?? element.display?.labelAlign ?? "left";
        const titleRequiredMark = element.required ? html`<b class="text-danger" style="margin-left:8px;">*</b>` : "";

        // Help message
        const helpMessage = this._getHelpMessage(element);
        const helpMode = this._getHelpMode(element);

        // Templates are allowed in the names
        if (title?.includes("${")) {
            title = this.applyTemplate(title);
        }

        // Check for horizontal layout
        if (layout === "horizontal") {
            return html`
                <div class="row form-group ${elementContainerClassName}" style="${elementContainerStyle}">
                    ${title && titleVisible ? html`
                        <div class="col-md-${titleWidth}">
                            <label class="control-label ${titleClassName}" style="padding-top: 0; text-align:${titleAlign};${titleStyle}">
                                ${title} ${titleRequiredMark}
                            </label>
                        </div>
                    ` : null}
                    <div class="col-md-${(width - titleWidth)}">
                        <div>${content}</div>
                        ${helpMessage && helpMode === "block" ? html`
                            <div class="col-md-1" style="padding:0; margin-top:8px" title="${helpMessage}">
                                <span><i class="${this._getHelpIcon(element, section)}"></i></span>
                            </div>
                        ` : null}
                    </div>
                </div>
            `;
        } else {
            return html`
                <div class="row form-group ${elementContainerClassName}" style="${elementContainerStyle}">
                    <div class="col-md-${width}">
                        ${title && titleVisible ? html`
                            <label class="control-label ${titleClassName}" style="padding-top: 0; ${titleStyle}">
                                ${title} ${titleRequiredMark}
                            </label>
                        ` : null}
                        <div>${content}</div>
                    </div>
                </div>
            `;
        }
    }

    _createElementTemplate(element, value, content, error) {
        const isValid = this._isValid(element, value);
        const isRequiredEmpty = this._isRequiredEmpty(element, value);
        const hasErrorMessages = this.formSubmitted && (!isValid || isRequiredEmpty);

        // Help message
        const helpMessage = this._getHelpMessage(element);
        const helpMode = this._getHelpMode(element);

        if (error) {
            return html `
                <span class="${error.className}">
                    ${error.message || "Error"}
                </span>
            `;
        }

        return html`
            <div class="${hasErrorMessages ? "has-error" : nothing}">
                <div data-testid="${this.config.test?.active ? `${this.config.test.prefix || "test"}-${element.field}` : nothing}">
                    ${content}
                </div>
                ${helpMessage && helpMode !== "block" ? html`
                    <div class="help-block" style="margin:8px">${helpMessage}</div>
                ` : null}
                ${hasErrorMessages ? html`
                    <div class="help-block" style="display:flex;margin-top:8px;">
                        <div style="margin-right:8px">
                            <i class="${this._getErrorIcon(element)}"></i>
                        </div>
                        <div style="font-weight:bold;">
                            ${isRequiredEmpty ? "This field is required." : element.validation?.message || ""}
                        </div>
                    </div>
                ` : null}
            </div>
        `;
    }

    _createTextElement(element) {
        const value= element.text;
        const textClass = element.display?.textClassName ?? "";
        const textStyle = element.display?.textStyle ?? "";
        const notificationClass = element.type === "notification" ? DataForm.NOTIFICATION_TYPES[element?.display?.notificationType] || "alert alert-info" : "";

        const content = html`
            <div class="${textClass} ${notificationClass}" style="${textStyle}">
                ${element.display?.icon ? html`
                    <i class="fas fa-${element.display.icon} icon-padding"></i>
                ` : null}
                <span>${UtilsNew.renderHTML(value || "")}</span>
            </div>
        `;

        return this._createElementTemplate(element, value, content);
    }

    // Josemi 20220202 NOTE: this function was prev called _createInputTextElement
    _createInputElement(element, type) {
        const value = this.getValue(element.field) || this._getDefaultValue(element);
        const disabled = this._getBooleanValue(element.display?.disabled, false, element);
        const [min = undefined, max = undefined] = element.allowedValues || [];
        const step = element.step || "1";
        const rows = element.display && element.display.rows ? element.display.rows : 1;

        const content = html`
            <text-field-filter
                placeholder="${element.display?.placeholder}"
                .rows="${rows}"
                .type="${type}"
                ?disabled="${disabled}"
                ?required="${element.required}"
                .min="${min}"
                .max="${max}"
                .step="${step}"
                .value="${value}"
                .classes="${this._isUpdated(element) ? "updated" : ""}"
                @filterChange="${e => this.onFilterChange(element, e.detail.value)}">
            </text-field-filter>
        `;

        return this._createElementTemplate(element, value, content);
    }

    _createInputNumberElement(element) {
        const value = this.getValue(element.field) ?? this._getDefaultValue(element);
        const disabled = this._getBooleanValue(element?.display?.disabled, false, element);
        const [min = "", max = ""] = element.allowedValues || [];
        const step = element.step || "1";

        const content = html`
            <number-field-filter
                label="Value"
                .value="${value ? value : ""}"
                .comparators="${element.comparators || null}"
                .allowedValues="${element.allowedValues || null}"
                .min="${min}"
                .max="${max}"
                .step="${step}"
                .placeholder="${element.display?.placeholder || ""}"
                .classes="${this._isUpdated(element) ? "updated" : ""}"
                @filterChange="${e => this.onFilterChange(element, e.detail.value)}">
            </number-field-filter>
        `;

        return this._createElementTemplate(element, value, content);
    }

    _createInputDateElement(element) {
        const value = this.getValue(element.field) || this._getDefaultValue(element);
        const disabled = this._getBooleanValue(element.display?.disabled, false, element);
        const parseInputDate = e => {
            // Date returned by <input> is in YYYY-MM-DD format, but we need YYYYMMDDHHmmss format
            return e.target.value ? moment(e.target.value, "YYYY-MM-DD").format("YYYYMMDDHHmmss") : "";
        };

        const content = html`
            <input
                type="date"
                value="${value ? UtilsNew.dateFormatter(value, "YYYY-MM-DD") : ""}"
                class="form-control ${this._isUpdated(element) ? "updated" : ""}"
                @change="${e => this.onFilterChange(element, parseInputDate(e))}"
                ?disabled="${disabled}">
        `;

        return this._createElementTemplate(element, value, content);
    }

    _createCheckboxElement(element) {
        let value = this.getValue(element.field); // || this._getDefaultValue(element);
        const disabled = this._getBooleanValue(element.display?.disabled, false, element);

        // TODO to be fixed.
        if (element.field === "FILTER") {
            value = value === "PASS";
            element.text = "Include only PASS variants";
        }

        const content = html`
            <label style="padding-top: 0; font-weight: normal;margin: 0">
                <input
                    type="checkbox"
                    class="${this._prefix}FilterCheckbox"
                    .checked="${value}"
                    ?disabled="${disabled}"
                    @click="${e => this.onFilterChange(element, e.currentTarget.checked)}">
                <span style="margin: 0 5px">${element.text}</span>
            </label>
        `;

        return this._createElementTemplate(element, value, content);
    }

    /**
     * This element accepts 4 main parameters: onText, offText, activeClass and inactiveClass.
     * Default values are: ON, OFF, btn-primary and btn-default, respectively.
     * @param {Object} element
     * @returns {TemplateResult}
     * @private
     */
    _createToggleSwitchElement(element) {
        const value = this.getValue(element.field); // || this._getDefaultValue(element);
        const disabled = this._getBooleanValue(element.display?.disabled, false, element);
        const activeClassName = element.display?.activeClassName ?? element.display?.activeClass ?? "";
        const inactiveClassName = element.display?.inactiveClassName ?? element.display?.inactiveClass ?? "";

        const content = html`
            <div class="">
                <toggle-switch
                    .disabled="${disabled}"
                    .value="${value}"
                    .onText="${element.display?.onText}"
                    .offText="${element.display?.offText}"
                    .activeClass="${activeClassName}"
                    .inactiveClass="${inactiveClassName}"
                    .classes="${this._isUpdated(element) ? "updated" : ""}"
                    @filterChange="${e => this.onFilterChange(element, e.detail.value)}">
                </toggle-switch>
                ${disabled && element.display?.helpMessage ? html`
                    <div class="help-block small">
                        ${element.display?.helpMessage}
                    </div>` : null
                }
            </div>
        `;

        return this._createElementTemplate(element, value, content);

    }

    _createToggleButtonsElement(element) {
        const value = this.getValue(element.field) || this._getDefaultValue(element);
        const names = element.allowedValues;
        const activeClassName = element.display?.activeClassName ?? element.display?.activeClass ?? "";
        const inactiveClassName = element.display?.inactiveClassName ?? element.display?.inactiveClass ?? "";

        const content = html`
            <div class="">
                <toggle-buttons
                    .names="${names}"
                    .value="${value}"
                    .activeClass="${activeClassName}"
                    .inactiveClass="${inactiveClassName}"
                    .classes="${this._isUpdated(element) ? "updated" : ""}"
                    @filterChange="${e => this.onFilterChange(element, e.detail.value)}">
                </toggle-buttons>
            </div>
        `;

        return this._createElementTemplate(element, value, content);
    }

    /**
     * Creates a select element given some values. You can provide:
     * i) 'allowedValues' is an array, optionally 'defaultValue' and 'display.apply'.
     * ii) 'allowedValues' is a string pointing to a data field
     * ii) 'allowedValues' function returning {allowedValues: [...], defaultValue: "..."}
     * @param element
     * @returns {*|TemplateResult}
     * @private
     */
    _createInputSelectElement(element) {
        let allowedValues = [];
        let defaultValue = null;

        // 1. Check if 'allowedValues' field is provided
        if (element.allowedValues) {
            if (Array.isArray(element.allowedValues)) {
                if (element.display?.apply) {
                    for (const value of element.allowedValues) {
                        allowedValues.push(element.display.apply(value));
                    }
                } else {
                    allowedValues = element.allowedValues;
                }
            } else {
                if (typeof element.allowedValues === "string") {
                    const values = this.getValue(element.allowedValues);
                    if (values && element.display?.apply) {
                        for (const value of values) {
                            allowedValues.push(element.display.apply(value));
                        }
                    } else {
                        allowedValues = values;
                    }
                } else {
                    if (typeof element.allowedValues === "function") {
                        let item;
                        if (element.field?.includes("[]")) {
                            const match = element.field.match(DataForm.re);
                            if (match) {
                                item = UtilsNew.getObjectValue(this.data, match?.groups?.arrayFieldName, "")[match?.groups?.index];
                            }
                        }
                        const values = element.allowedValues(this.data, item);
                        if (values) {
                            allowedValues = values;
                            if (values.defaultValue) {
                                defaultValue = values.defaultValue;
                            }
                        }
                    } else {
                        console.error("element.allowedValues must be an array, string or function");
                    }
                }
            }

            // Check if data field contains a value
            defaultValue = this.getValue(element.field);
            // Check if a defaultValue is set in element config
            if (!defaultValue && element.defaultValue) {
                defaultValue = element.defaultValue;
            }
            // Check if 'apply' must be executed
            // if (defaultValue && element.display?.apply) {
            //     defaultValue = element.display.apply(defaultValue);
            // }
        }

        // Default values
        const disabled = this._getBooleanValue(element?.display?.disabled, false, element);
        const content = html`
            <div class="">
                <select-field-filter
                    .data="${allowedValues}"
                    ?multiple="${element.multiple}"
                    ?all="${element.all}"
                    .maxOptions="${element.maxOptions || false}"
                    ?disabled="${disabled}"
                    ?required="${element.required}"
                    .value="${defaultValue}"
                    .classes="${this._isUpdated(element) ? "updated" : ""}"
                    @filterChange="${e => this.onFilterChange(element, e.detail.value)}">
                </select-field-filter>
            </div>
        `;

        return this._createElementTemplate(element, null, content);
    }

    _createComplexElement(element, data = this.data) {
        if (!element.display?.template) {
            return html`<span class="text-danger">No template provided</span>`;
        }
        const content = html`
            <span>
                ${UtilsNew.renderHTML(this.applyTemplate(element.display.template, data, null, this._getDefaultValue(element)))}
            </span>
        `;

        return this._createElementTemplate(element, null, content);
    }

    _createListElement(element) {
        // Get values
        const array = this.getValue(element.field);
        const contentLayout = element.display?.contentLayout || "horizontal";

        // Check values
        if (!array || !array.length) {
            const message = this._getDefaultValue(element);
            return this._createElementTemplate(element, null, null, {
                message: message,
            });
        }
        if (!Array.isArray(array)) {
            const message = `Field '${element.field}' is not an array`;
            return this._createElementTemplate(element, null, null, {
                message: message,
                classname: "text-danger"
            });
        }
        if (contentLayout !== "horizontal" && contentLayout !== "vertical" && contentLayout !== "bullets") {
            const message = "Content layout must be 'horizontal', 'vertical' or 'bullets'";
            return this._createElementTemplate(element, null, null, {
                message: message,
                className: "text-danger"
            });
        }

        // Apply the template to all Array elements and store them in 'values'
        let values = [];
        if (element.display?.render) {
            for (const object of array) {
                const value = element.display.render(object);
                values.push(value);
            }
        } else {
            if (element.display?.template) {
                const matches = element.display.template.match(/\$\{[a-zA-Z_.\[\]]+\}/g).map(elem => elem.substring(2, elem.length - 1));
                for (const object of array) {
                    const value = this.applyTemplate(element.display.template, object, matches, this._getDefaultValue(element));
                    values.push(value);
                }
            } else {
                // if 'display.template' does not exist means it is an array of scalars
                values = array;
            }
        }

        // Render element values
        let content = "-";
        switch (contentLayout) {
            case "horizontal":
                const separator = element?.display?.separator ?? ", ";
                content = html`
                    ${values.map(elem => html`
                        <span>${elem}</span>
                        ${separator ? html`<span>${separator}</span>` : ""}
                    `)}
                `;
                break;
            case "vertical":
                content = html`
                    ${values.map(elem => html`
                        <div>${elem}</div>
                    `)}
                `;
                break;
            case "bullets":
                content = html`
                    <ul class="pad-left-15">
                        ${values.map(elem => html`
                            <li>${elem}</li>
                        `)}
                    </ul>
                `;
                break;
        }
        return this._createElementTemplate(element, null, content);

    }

    _createTableElement(element) {
        // Get values
        let array = this.getValue(element.field, null, element.defaultValue);
        const errorMessage = this._getErrorMessage(element);
        const errorClassName = element.display?.errorClassName ?? element.display?.errorClasses ?? "text-danger";
        const headerVisible = this._getBooleanValue(element.display?.headerVisible, true);
        const tableClassName = element.display?.className || "";
        const tableStyle = element.display?.style || "";

        // Check values
        if (!array) {
            const message = errorMessage ?? `Type 'table' requires a valid array field: ${element.field} not found`;
            return this._createElementTemplate(element, null, null, {
                message: message,
                className: errorClassName,
            });
        }
        if (!Array.isArray(array)) {
            const message = `Field '${element.field}' is not an array`;
            return this._createElementTemplate(element, null, null, {
                message: message,
                className: errorClassName,
            });
        }
        if (typeof element.display?.transform === "function") {
            array = element.display.transform(array);
        }
        if (!array.length) {
            const message = this._getDefaultValue(element);
            return this._createElementTemplate(element, null, null, {
                message: message,
            });
        }
        if (!element.display && !element.display.columns) {
            const message = "Type 'table' requires a 'columns' array";
            return this._createElementTemplate(element, null, null, {
                message: message,
                className: errorClassName,
            });
        }

        const config = {
            pagination: element.display?.pagination ?? false,
            search: element.display?.search ?? false,
            searchAlign: element.display?.searchAlign ?? "right",
            showHeader: element.display?.showHeader ?? true,
        };

        const content = html `
            <data-table
                .data="${array}"
                .columns="${element.display.columns}"
                .config="${config}">
            </data-table>
        `;
        return this._createElementTemplate(element, null, content);
    }

    _createPlotElement(element) {
        // By default, we use data field in the element
        let data = element.data;

        // If a valid field object or arrays is defined we use it
        let value = this.getValue(element.field);
        if (value) {
            if (Array.isArray(value)) {
                const _data = {};
                for (const val of value) {
                    const k = val[element.display.data.key];
                    const v = val[element.display.data.value];
                    _data[k] = v;
                }
                data = _data;
            } else {
                if (typeof value === "object") {
                    // Sort Object by numeric values
                    if (element?.display?.sort === true) {
                        value = Object.entries(value)
                            .sort((a, b) => b[1] - a[1])
                            .reduce((sortedObj, [k, v]) => ({
                                ...sortedObj,
                                [k]: v
                            }), {});
                    }
                    data = value;
                }
            }
        }
        if (data) {
            const content = html`
                <simple-chart
                    .active="${true}"
                    .type="${element.display?.highcharts?.chart?.type || "column"}"
                    .title="${element.display?.highcharts?.title?.text || element.name}"
                    .data="${data}"
                    .config="${element.display?.highcharts}">
                </simple-chart>
            `;
            return this._createElementTemplate(element, null, content);
        } else {
            const message = this._getErrorMessage(element);
            const errorClassName = element.display?.errorClassName ?? element.display?.errorClasses ?? "text-danger";
            return this._createElementTemplate(element, null, null, {
                message: message,
                className: errorClassName,
            });
        }
    }

    _createJsonElement(element) {
        const json = this.getValue(element.field, this.data, this._getDefaultValue(element));
        let content = "";
        (json.length || UtilsNew.isObject(json)) ?
            content = html`
                <json-viewer
                    .data="${json}">
                </json-viewer>
            ` : content = this._getDefaultValue(element);
        return this._createElementTemplate(element, null, content);
    }

    _createJsonEditorElement(element) {
        const json = this.getValue(element.field, this.data, this._getDefaultValue(element));
        const config = {
            readOnly: this._getBooleanValue(element.display?.readOnly, false)
        };
        const jsonParsed = (UtilsNew.isObject(json) || UtilsNew.isEmpty(json)) ? json : JSON.parse(json);
        const content = html`
            <json-editor
                .data="${jsonParsed}"
                .config="${config}">
            </json-editor>
        `;

        return this._createElementTemplate(element, null, content);
    }

    _createTreeElement(element) {
        const json = this.getValue(element.field, this.data, this._getDefaultValue(element));
        if (typeof element.display.apply !== "function") {
            const errorClassName = element.display?.errorClassName ?? element.display?.errorClasses ?? "text-danger";
            const message = "apply() function that provides a 'text' property is mandatory in Tree-Viewer elements";
            return this._createElementTemplate(element, null, null, {
                message: message,
                classError: errorClassName,
            });
        } else {
            if (Array.isArray(json)) {
                if (json.length > 0) {
                    // return html`<tree-viewer .data="${json.map(element.display.apply)}"></tree-viewer>`;
                    const content = html `
                        <tree-viewer
                            .data="${json.map(element.display.apply)}">
                        </tree-viewer>
                    `;
                    return this._createElementTemplate(element, null, content);
                } else {
                    const content = this._getDefaultValue(element);
                    return this._createElementTemplate(element, null, content);
                }
            } else if (UtilsNew.isObject(json)) {
                const content = html `
                    <tree-viewer
                        .data="${element.display.apply.call(null, json)}">
                    </tree-viewer>
                `;
                return this._createElementTemplate(element, null, content);
            } else {
                const message = "Unexpected JSON format";
                const errorClassName = element.display?.errorClassName ?? element.display?.errorClasses ?? "text-danger";
                return this._createElementTemplate(element, null, null, {
                    message: message,
                    classError: errorClassName,
                });
            }
        }
    }

    _createCustomElement(element) {
        if (typeof element.display?.render !== "function") {
            return "All 'custom' elements must implement a 'display.render' function.";
        }

        // If 'field' is defined then we pass it to the 'render' function, otherwise 'data' object is passed
        const data = element.field ? this.getValue(element.field) : this.data;

        // When an object-list, get the item being validated.
        let item;
        if (element.field?.includes("[]")) {
            const match = element.field.match(DataForm.re);
            if (match) {
                item = UtilsNew.getObjectValue(this.data, match?.groups?.arrayFieldName, "")[match?.groups?.index];
            }
        }

        // Call to render function, it must be defined!
        // We also allow to call to 'onFilterChange' function.
        const content = element.display.render(data, value => this.onFilterChange(element, value), this.updateParams, this.data, item);
        if (content) {
            return this._createElementTemplate(element, data, content);
        } else {
            const message = this._getErrorMessage(element);
            const errorClassName = element.display?.errorClassName ?? element.display?.errorClasses ?? "text-danger";
            return this._createElementTemplate(element, null, null, {
                message: message,
                classError: errorClassName,
            });
        }
    }

    _createDownloadElement(element) {
        const content = html`
            <download-button
                .json="${this.data}"
                name="${element.title ?? element.name}">
            </download-button>
        `;
        return this._createElementTemplate(element, null, content);
    }

    _createObjectElement(element) {
        const isDisabled = this._getBooleanValue(element.display?.disabled, false, element);
        const contents = [];
        for (const childElement of element.elements) {
            // 1. Check if this filed is visible
            const isVisible = this._getBooleanValue(childElement.display?.visible, true, childElement);
            if (!isVisible) {
                continue;
            }

            // 2. Check if the element is disabled
            childElement.display = {
                ...childElement.display,
                nested: true
            };

            // 2.1 If parent is disabled then we must overwrite disabled field
            if (isDisabled) {
                childElement.display.disabled = isDisabled;
            }

            // 3. Call to createElement to get HTML content
            const elemContent = this._createElement(childElement);

            // 4. Read Help message and Render assuming vertical layout for nested forms
            const helpMessage = this._getHelpMessage(element);
            const helpMode = this._getHelpMode(element);
            contents.push(
                html`
                    <div class="row form-group" style="margin-left: 0;margin-right: 0">
                        ${childElement.title ? html`
                            <div>
                                <label class="control-label" style="padding-top: 0;">
                                    ${childElement.title}
                                </label>
                            </div>
                        ` : null
                        }
                        <div>
                            <div>${elemContent}</div>
                            ${helpMessage && helpMode === "block" ? html`
                                <div class="col-md-1" style="padding:0; margin-top:8px" title="${helpMessage}">
                                    <span><i class="${this._getHelpIcon(element)}"></i></span>
                                </div>
                            ` : null
                            }
                        </div>
                    </div>
                `);
        }
        const content = html`${contents}`;
        return this._createElementTemplate(element, null, content);
    }

    _createObjectListElement(element) {
        const items = this.getValue(element.field);
        const isUpdated = this._isUpdated(element);
        const isDisabled = this._getBooleanValue(element.display?.disabled, false, element);
        const contents = [];

        // Get initial collapsed status, only executed the first time
        const collapsable = this._getBooleanValue(element.display?.collapsable, true);
        if (typeof element.display.collapsed === "undefined") {
            // eslint-disable-next-line no-param-reassign
            element.display.collapsed = collapsable;
        }

        let maxNumItems;
        if (element.display.collapsed) {
            maxNumItems = element.display.maxNumItems ?? 5;
            if (maxNumItems >= items?.length || this.editOpen >= 0) {
                // eslint-disable-next-line no-param-reassign
                element.display.collapsed = false;
                maxNumItems = items?.length;
            }
        } else {
            maxNumItems = items?.length;
        }

        // Render all existing items
        if (!items || items?.length === 0) {
            const view = html`
                <div style="padding-bottom: 5px; ${isUpdated ? "border-left: 2px solid darkorange; padding-left: 12px; margin-bottom:24px" : ""}">
                    <span>No items found.</span>
                </div>
            `;
            contents.push(view);
        } else {
            if (maxNumItems > 0) {
                const view = html`
                    <div style="padding-bottom: 5px; ${isUpdated ? "border-left: 2px solid darkorange; padding-left: 12px; margin-bottom:24px" : ""}">
                        ${items?.slice(0, maxNumItems)
                            .map((item, index) => {
                                const _element = JSON.parse(JSON.stringify(element));
                                // We create 'virtual' element fields:  phenotypes[].1.id, by doing this all existing
                                // items have a virtual element associated, this will allow to get the proper value later.
                                for (let i = 0; i< _element.elements.length; i++) {
                                    // This support object nested
                                    const [left, right] = _element.elements[i].field.split("[].");
                                    _element.elements[i].field = left + "[]." + index + "." + right;
                                    if (_element.elements[i].type === "custom") {
                                        _element.elements[i].display.render = element.elements[i].display.render;
                                    }
                                    if (_element.elements[i].type === "select" && typeof element.elements[i].allowedValues === "function") {
                                        _element.elements[i].allowedValues = element.elements[i].allowedValues;
                                    }
                                    if (typeof element.elements[i]?.validation?.validate === "function") {
                                        _element.elements[i].validation.validate = element.elements[i].validation.validate;
                                    }
                                    if (typeof element.elements[i]?.save === "function") {
                                        _element.elements[i].save = element.elements[i].save;
                                    }
                                    // if (typeof element.elements[i]?.validation?.message === "function") {
                                    //     _element.elements[i].validation.message = element.elements[i].validation.message;
                                    // }
                                    // Copy JSON stringify and parse ignores functions, we need to copy them
                                    if (typeof element.elements[i]?.display?.disabled === "function") {
                                        _element.elements[i].display.disabled = element.elements[i].display.disabled;
                                    }
                                    if (typeof element.elements[i]?.display?.visible === "function") {
                                        _element.elements[i].display.visible = element.elements[i].display.visible;
                                    }
                                }
                                return html`
                                    <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                                        <div>
                                            ${element.display.view(item)}
                                        </div>
                                        <div>
                                            ${this._getBooleanValue(element.display.showEditItemListButton, true) ? html`
                                                <button type="button" title="Edit item" class="btn btn-sm btn-primary"
                                                        ?disabled="${isDisabled}"
                                                        @click="${e => this.#toggleEditItemOfObjectList(e, item, index, element)}">
                                                    <i aria-hidden="true" class="fas fa-edit"></i>
                                                </button>` : null
                                            }
                                            ${this._getBooleanValue(element.display.showDeleteItemListButton, true) ? html`
                                                <button type="button" title="Remove item from list" class="btn btn-sm btn-danger"
                                                        ?disabled="${isDisabled}"
                                                        @click="${e => this.#removeFromObjectList(e, item, index, element)}">
                                                    <i aria-hidden="true" class="fas fa-trash-alt"></i>
                                                </button>` : null
                                            }
                                        </div>
                                    </div>
                                    <div id="${element?.field}_${index}"
                                         style="border-left: 2px solid #0c2f4c; margin-left: 10px; padding-left: 12px; display: ${index === this.editOpen ? "block" : "none"}">
                                        ${this._createObjectElement(_element)}
                                        <div style="display:flex; flex-direction:row-reverse; margin-bottom: 6px">
                                            <button type="button" class="btn btn-xs btn-primary"
                                                    @click="${e => this.#toggleEditItemOfObjectList(e, item, index, element)}">
                                                Close
                                            </button>
                                        </div>
                                    </div>`;
                            })
                        }
                    </div>

                    ${element.display.collapsed && items?.length > 0 ? html`
                        <div style="padding: 0 0 10px 0">
                            <button type="button" class="btn btn-link" style="padding: 0"
                                    @click="${e => this.#toggleObjectListCollapse(element, false)}">
                                Show more ... (${items?.length} items)
                            </button>
                        </div>` : null
                    }

                    ${collapsable && !element.display.collapsed && (element.display.maxNumItems ?? 5) < items?.length ? html`
                        <div style="padding: 0 0 10px 0">
                            <button type="button" class="btn btn-link" style="padding: 0"
                                    @click="${e => this.#toggleObjectListCollapse(element, true)}">
                                Show less ...
                            </button>
                        </div>` : null
                    }
                `;
                contents.push(view);
            }
        }

        // Add the form to create the next item
        if (this._getBooleanValue(element.display.showAddItemListButton, true) || this._getBooleanValue(element.display.showAddBatchListButton, true)) {
            const createHtml = html`
                <div>
                    <div class="help-block" style="float: left; margin-bottom: 6px">
                        ${items?.length > 0 ? html`Items: ${items.length}` : nothing}
                    </div>
                    <div class="text-right" style="float: right; margin-bottom: 6px">
                        ${this._getBooleanValue(element.display.showAddItemListButton, true) ? html`
                            <button type="button" class="btn btn-sm btn-primary"
                                    ?disabled="${isDisabled}"
                                    @click="${e => this.#addToObjectList(e, element)}">
                                <i aria-hidden="true" class="fas fa-plus icon-padding"></i>
                                Add Item
                            </button>`: nothing
                        }
                        ${this._getBooleanValue(element.display.showAddBatchListButton, true) ? html`
                            <button type="button" class="btn btn-sm btn-primary"
                                    ?disabled="${isDisabled}"
                                    @click="${e => this.#toggleAddBatchToObjectList(e, element)}">
                                <i aria-hidden="true" class="fas fa-file-import icon-padding"></i>
                                Add Batch
                            </button>`: nothing
                        }
                        ${this._getBooleanValue(element.display.showResetListButton, false) ? html`
                            <button type="button" class="btn btn-sm btn-primary" title="Discord changes in this list"
                                    ?disabled="${isDisabled}"
                                    @click="${e => this.#resetObjectList(e, element)}">
                                <i aria-hidden="true" class="fas fa-undo icon-padding"></i>
                                Reset
                            </button>`: nothing
                        }
                    </div>
                    ${this._getBooleanValue(element.display.showAddBatchListButton, true) ? html`
                        <div id="${this._prefix}-${element?.field}" style="margin-left: 10px; padding-left: 12px; display: none">
                            <text-field-filter
                                value="${this.batchItems[element?.field] || ""}"
                                placeholder="${element.elements.map(el => el.field.split(".").at(-1)).join(",")}"
                                .rows="${3}"
                                @filterChange="${e => this.#addBatchTextChange(element, e.detail.value)}"></text-field-filter>
                            <div style="display:flex; flex-direction:row-reverse; margin: 5px">
                                <button type="button" class="btn btn-xs btn-primary"
                                        ?disabled="${!this.batchItems[element.field]}"
                                        @click="${e => this.#addBatchToObjectList(e, element)}">
                                    OK
                                </button>
                            </div>
                        </div>`: nothing
                    }
                </div>`;
            contents.push(createHtml);
        }
        return this._createElementTemplate(element, null, contents);
    }

    #toggleEditItemOfObjectList(e, item, index, element) {
        // We must reset this variable after editing the new item.
        this.editOpen = -1;

        const htmlElement = document.getElementById(element?.field + "_" + index);
        htmlElement.style.display = htmlElement.style.display === "none" ? "block" : "none";
    }

    #removeFromObjectList(e, item, index, element) {
        // Notify change to provoke the update
        const event = {
            action: "REMOVE",
            index: index,
        };
        this.onFilterChange(element, null, event);
    }

    #toggleObjectListCollapse(element, collapsed) {
        // eslint-disable-next-line no-param-reassign
        element.display.collapsed = collapsed;
        this.requestUpdate();
    }

    #resetObjectList(e, element) {
        const event = {
            action: "RESET",
        };
        this.onFilterChange(element, null, event);
    }

    #addToObjectList(e, element) {
        const event = {
            action: "ADD",
        };
        this.onFilterChange(element, {}, event);

        const dataElementList = UtilsNew.getObjectValue(this.data, element.field, []);
        this.editOpen = dataElementList.length - 1;
    }

    #toggleAddBatchToObjectList(e, element) {
        const htmlElement = document.getElementById(`${this._prefix}-${element?.field}`);
        htmlElement.style.display = htmlElement.style.display === "none" ? "block" : "none";
    }

    #addBatchTextChange(element, text) {
        if (element?.field) {
            this.batchItems[element.field] = text;
            this.requestUpdate();
        }
    }

    #addBatchToObjectList(e, element) {
        if (this.batchItems[element.field]) {
            const lines = this.batchItems[element.field].split("\n");
            for (const line of lines) {
                const value = {};
                const fields = line.split(",");
                for (let i = 0; i < fields.length; i++) {
                    const fieldName = element.elements[i].field.split(".").at(-1);
                    value[fieldName] = fields[i];
                }
                const event = {
                    action: "ADD",
                };
                this.onFilterChange(element, value, event);
            }
            delete this.batchItems[element.field];
            this.#toggleAddBatchToObjectList(e, element);
        }
    }

    parseValue(element, value) {
        if (typeof element.save === "function") {
            let currentValue;
            if (element.field.includes("[]")) {
                const match = element.field.match(DataForm.re);
                if (match) {
                    currentValue = UtilsNew.getObjectValue(this.data, match?.groups?.arrayFieldName, "")[match?.groups?.index];
                }
            } else {
                currentValue = UtilsNew.getObjectValue(this.data, element.field);
            }

            return element.save(value, this.data, currentValue);
        } else {
            return value;
        }
    }

    onFilterChange(element, value, objectListEvent) {
        let eventDetail;

        // Check field exists
        if (!element.field) {
            return;
        }

        // Process the value to save it correctly.
        value = this.parseValue(element, value);

        // 1. Check if ADD, SAVE, REMOVE has been clicked, this happens in 'object-list'
        if (objectListEvent) {
            const dataElementList = UtilsNew.getObjectValue(this.data, element.field, []);
            switch (objectListEvent.action) {
                case "ADD":
                    UtilsNew.setObjectValue(this.data, element.field, [...dataElementList, value]);
                    eventDetail = {
                        param: element.field + "[]." + dataElementList.length,
                        value: value,
                        action: objectListEvent.action
                    };
                    break;
                case "CLOSE":
                    // nothing to do
                    break;
                case "REMOVE":
                    value = dataElementList[objectListEvent.index];
                    dataElementList.splice(objectListEvent.index, 1);
                    eventDetail = {
                        param: element.field + "[]." + objectListEvent.index,
                        value: value,
                        index: objectListEvent.index,
                        action: objectListEvent.action
                    };
                    break;
                case "RESET":
                    const originalDataElementList = UtilsNew.getObjectValue(this.originalData, element.field, []);
                    UtilsNew.setObjectValue(this.data, element.field, UtilsNew.objectClone(originalDataElementList));
                    eventDetail = {
                        param: element.field + "[]",
                        value: value,
                        action: objectListEvent.action
                    };
                    break;
            }
        } else {
            // 2. Check if the element field is part of an object-list
            if (element.field.includes("[]")) {
                const [parentArrayField, itemField] = element.field.split("[].");
                if (itemField.includes(".")) {
                    // 2.1 Updating a field in an existing item in the array
                    const [index, ...fields] = itemField.split(".");
                    const currentElementList = UtilsNew.getObjectValue(this.data, parentArrayField, []);
                    if (fields.length === 1) {
                        currentElementList[index][fields[0]] = value;
                    } else {
                        currentElementList[index][fields[0]] = {
                            [fields[1]]: value
                        };
                    }

                    UtilsNew.setObjectValue(this.data, parentArrayField, currentElementList);
                    eventDetail = {
                        param: element.field,
                        value: value,
                        action: "EDIT"
                    };
                } else {
                    // FIXME To be deleted: 2.2 Updating a field in a "Create New Item" form
                    console.error("This code should never be reached!");
                    if (value) {
                        this.objectListItems[parentArrayField] = {...this.objectListItems[parentArrayField], [itemField]: value};
                    } else {
                        delete this.objectListItems[parentArrayField][itemField];
                    }
                }
            } else {
                // 3. Normal field: primitive or object
                UtilsNew.setObjectValue(this.data, element.field, value);
                eventDetail = {
                    param: element.field,
                    value: value
                };
            }
        }

        // 4. Send the custom event if eventDetail has been created, this is not created when a new item is being updated
        if (eventDetail) {
            this.dispatchEvent(new CustomEvent("fieldChange", {
                detail: {
                    ...eventDetail,
                    data: this.data
                },
                bubbles: true,
                composed: true
            }));
        }
    }

    onPreview(e) {
        $("#" + this._prefix + "PreviewDataModal").modal("show");
    }

    onClear(e) {
        this.formSubmitted = false;
        this.showGlobalValidationError = false;
        LitUtils.dispatchCustomEvent(this, "clear", null, {}, null);
    }

    onSubmit(e, section=null) {
        // Check if it has invalid fields (not valid or required not filled)
        const hasInvalidFields = this.emptyRequiredFields.size > 0 || this.invalidFields.size > 0;
        if (hasInvalidFields) {
            this.formSubmitted = true; // Form has been submitted, display errors
            return this.requestUpdate();
        }

        // Check for final validation
        if (typeof this.config?.validation?.validate === "function") {
            if (!this.config.validation.validate(this.data)) {
                this.showGlobalValidationError = true;
                return this.requestUpdate();
            }
        }

        // Form valid --> dispatch submit event
        this.formSubmitted = false;
        this.showGlobalValidationError = false;
        LitUtils.dispatchCustomEvent(this, "submit", section, {}, null);
    }

    onCustomEvent(e, eventName, data) {
        LitUtils.dispatchCustomEvent(this, eventName, data);
    }

    onSectionChange(e) {
        e.preventDefault();
        this.activeSection = parseInt(e.target.dataset.sectionIndex) || 0;
        this.requestUpdate();
    }

    onCopyPreviewClick() {
        UtilsNew.copyToClipboard(JSON.stringify(this.data, null, 4));
    }

    renderGlobalValidationError() {
        if (this.showGlobalValidationError) {
            return html`
                <div class="help-block" style="display:flex;margin-bottom:16px;">
                    <div class="text-danger" style="margin-right:16px">
                        <i class="${this._getErrorIcon(null, null)}"></i>
                    </div>
                    <div class="text-danger" style="font-weight:bold;">
                        ${this.config?.validation?.message || "There are some invalid fields..."}
                    </div>
                </div>
            `;
        }

        // No validation error to display
        return null;
    }

    renderButtons(dismiss, sectionId=null) {
        const btnClassName = this.config.display?.buttonsClassName ?? this.config.buttons?.classes ?? "";
        const btnStyle = this.config.display?.buttonsStyle ?? this.config.buttons?.style ?? "";
        const btnWidth = this.config.display?.buttonsWidth ?? this.config.display?.width ?? 12;
        const btnAlign = this.config.display?.buttonsAlign ?? "right";

        // buttons.okText, buttons.clearText and buttons.cancelText are deprecated
        const buttonPreviewText = this.config.buttons?.previewText ?? "Preview";
        const buttonClearText = this.config.display?.buttonClearText ?? this.config.buttons?.clearText ?? this.config.buttons?.cancelText ?? "Clear";
        const buttonOkText = this.config.display?.buttonOkText ?? this.config.buttons?.okText ?? "OK";
        const buttonPreviewVisible = !!this.config.buttons?.previewText;
        const buttonClearVisible = this.config.display?.buttonClearText !== "";
        const buttonOkVisible = this.config.display?.buttonOkText !== "";
        const buttonPreviewDisabled = this._getBooleanValue(this.config.display?.buttonPreviewDisabled, false);
        const buttonClearDisabled = this._getBooleanValue(this.config.display?.buttonClearDisabled, false);
        const buttonOkDisabled = this._getBooleanValue(this.config.display?.buttonOkDisabled, false);

        return html`
            ${this.renderGlobalValidationError()}
            <div class="row">
                <div align="${btnAlign}" class="col-md-${btnWidth}" style="padding-top:16px;">
                    ${buttonPreviewVisible ? html`
                        <button type="button" class="btn btn-default ${btnClassName}" data-dismiss="${dismiss}" style="${btnStyle}" ?disabled=${buttonPreviewDisabled}
                                @click="${this.onPreview}">
                            ${buttonPreviewText}
                        </button>
                    `: null
                    }
                    ${buttonClearVisible ? html`
                        <button type="button" class="btn btn-default ${btnClassName}" data-dismiss="${dismiss}" style="${btnStyle}" ?disabled=${buttonClearDisabled}
                                @click="${this.onClear}">
                            ${buttonClearText}
                        </button>
                    `: null
                    }
                    ${buttonOkVisible ? html`
                        <button type="button" class="btn btn-primary ${btnClassName}" data-dismiss="${dismiss}" style="${btnStyle}" ?disabled=${buttonOkDisabled}
                                @click="${e => this.onSubmit(e, sectionId)}">
                            ${buttonOkText}
                        </button>
                    `: null
                    }
                </div>
            </div>
        `;
    }

    render() {
        // Check configuration
        if (!this.config) {
            return html`
                <div class="guard-page">
                    <i class="fas fa-exclamation fa-5x"></i>
                    <h3>No valid configuration provided. Please check configuration:</h3>
                    <div style="padding: 10px">
                        <pre>${JSON.stringify(this.config, null, 2)}</pre>
                    </div>
                </div>
            `;
        }

        // Global values
        const type = this._getType(); // Get form type
        const icon = this.config?.icon ?? "fas fa-info-circle";

        // Title values
        const titleClassName = this.config.display?.titleClassName ?? this.config.display?.title?.class ?? "";
        const titleStyle = this.config.display?.titleStyle ?? this.config.display?.title?.style ?? "";
        const titleVisible = this._getBooleanValue(this.config.display?.titleVisible ?? this.config.display?.showTitle, true);

        // Buttons values
        const buttonsVisible = this._getBooleanValue(this.config.display?.buttonsVisible ?? this.config.buttons?.show, true);
        const buttonsLayout = this._getButtonsLayout();

        // Check for card type
        if (type === "card") {
            return html`
                <div class="row">
                    <button type="button" class="btn btn-primary" data-toggle="collapse" data-target="#${this._prefix}Help">
                        <i class="${icon} icon-padding" aria-hidden="true"></i>
                        ${this.config.title}
                    </button>
                    <div class="">
                        <div id="${this._prefix}Help" class="collapse">
                            <div class="well">
                                ${this.renderData()}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        // Check for modal type
        if (type === "modal") {
            const modalBtnClassName = this.config.display?.modalButtonClassName ?? this.config.display?.mode?.buttonClass ?? "";
            const modalBtnStyle = this.config.display?.modalButtonStyle ?? this.config.display?.mode?.buttonStyle ?? "";
            const modalWidth = this.config.display?.modalWidth ?? this.config.display?.mode?.width ?? "768px";
            const isDisabled = this._getBooleanValue(this.config.display?.modalDisabled, false);

            return html`
                <button type="button"
                        title="${this.config.description}"
                        class="btn ${modalBtnClassName} ${isDisabled ? "disabled" : ""}"
                        style="${modalBtnStyle}"
                        data-toggle="modal"
                        ?disabled="${isDisabled}"
                        data-target="#${this._prefix}DataModal">
                    <i class="${icon} icon-padding" aria-hidden="true"></i>
                    ${this.config.title}
                </button>

                <div class="modal fade" id="${this._prefix}DataModal" tabindex="-1" role="dialog" aria-labelledby="${this._prefix}DataModalLabel"
                     aria-hidden="true">
                    <div class="modal-dialog" style="width: ${modalWidth}">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h4 class="modal-title ${titleClassName}" style="${titleStyle}">${this.config.title}</h4>
                            </div>
                            <div class="modal-body">
                                <div class="container-fluid">
                                    ${this.renderData()}
                                </div>
                            </div>
                            ${buttonsVisible ? html`
                                <div class="modal-footer">
                                    ${this.renderButtons("modal")}
                                </div>
                            ` : null}
                        </div>
                    </div>
                </div>
            `;
        }

        // Check for tabs style
        if (type === "tabs") {
            return html`
                <div>
                    <ul class="nav nav-tabs">
                        ${this._getVisibleSections()
                            .map((section, index) => {
                                const active = index === this.activeSection;
                                return html`
                                    <li role="presentation" class="${active ? "active" : ""}">
                                        <a style="cursor:pointer" data-section-index="${index}" @click="${e => this.onSectionChange(e)}">
                                            ${section.title || ""}
                                        </a>
                                    </li>
                                `;
                            })}
                    </ul>
                    ${buttonsVisible && buttonsLayout?.toUpperCase() === "TOP" ? this.renderButtons(null, this.activeSection) : null}
                </div>
                <div style="margin-top:24px;">
                    ${this.renderData()}
                </div>
                ${buttonsVisible && buttonsLayout?.toUpperCase() === "BOTTOM" ? this.renderButtons(null) : null}
            `;
        }

        // Check for pills style
        if (type === "pills") {
            return html`
                ${buttonsVisible && buttonsLayout?.toUpperCase() === "TOP" ? this.renderButtons(null) : null}
                <div class="row">
                    <div class="${this.config?.display?.pillsLeftColumnClass || "col-md-3"}">
                        <ul class="nav nav-pills nav-stacked">
                            ${this._getVisibleSections().map((section, index) => {
                                const active = index === this.activeSection;
                                return html`
                                    <li role="presentation" class="${active ? "active" : ""}">
                                        <a style="cursor:pointer" data-section-index="${index}" @click="${e => this.onSectionChange(e)}">
                                            ${section.title || ""}
                                        </a>
                                    </li>
                                `;
                            })}
                        </ul>
                    </div>
                    <div class="col-md-9">
                        ${this.renderData()}
                    </div>
                </div>
                ${buttonsVisible && buttonsLayout?.toUpperCase() === "BOTTOM" ? this.renderButtons(null) : null}
            `;
        }

        // Default form style
        return html`
            <!-- Header -->
            ${this.config.title && titleVisible ? html`
                <div style="display: flex; margin-bottom: 12px;">
                    <div>
                        <h2 class="${titleClassName}" style="${titleStyle}">${this.config.title}</h2>
                    </div>
                    ${this.config.logo ? html`
                        <div style="margin-left:auto;">
                            <img src="${this.config.logo}" />
                        </div>` : null
                    }
                </div>` : null
            }

            <!-- Render buttons -->
            ${buttonsVisible && buttonsLayout?.toUpperCase() === "TOP" ? this.renderButtons(null) : null}

            <!-- Render data form -->
            ${this.data ? this.renderData() : null}

            <!-- Render buttons -->
            ${buttonsVisible && buttonsLayout?.toUpperCase() === "BOTTOM" ? this.renderButtons(null) : null}

            <!-- PREVIEW modal -->
            <div class="modal fade" id="${this._prefix}PreviewDataModal" tabindex="-1" role="dialog" aria-labelledby="${this._prefix}PreviewDataModalLabel"
                 aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h4 class="modal-title">JSON Preview</h4>
                        </div>
                        <div class="modal-body">
                            <div style="display:flex; flex-direction:row-reverse">
                                <button type="button" class="btn btn-link" @click="${this.onCopyPreviewClick}">
                                    <i class="fas fa-copy icon-padding" aria-hidden="true"></i>Copy JSON
                                </button>
                            </div>
                            <div>
                                <pre>${JSON.stringify(this.data, null, 4)}</pre>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

}

customElements.define("data-form", DataForm);
