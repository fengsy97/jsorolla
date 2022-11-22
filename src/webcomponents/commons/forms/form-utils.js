/*
 * Copyright 2015-2021 OpenCB
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

import UtilsNew from "../../../core/utils-new.js";
import NotificationUtils from "../../commons/utils/notification-utils.js";
import LitUtils from "../utils/lit-utils";

export default class FormUtils {

    static capitalize = ([first, ...rest]) => first.toUpperCase() + rest.join('').toLowerCase();

    // TODO: move back to opencga-update.js
    static async update({target, params, payload}) {
        let error = null;
        let result = null;

        const resourceName = FormUtils.capitalize(target.resource);
        try {
            target.setLoading(true);
            const response = await target.endpoint.update(target.component.id, payload, params);
            NotificationUtils.dispatch(target, NotificationUtils.NOTIFY_SUCCESS, {
                title: `${resourceName} Update`,
                message: `${resourceName} updated correctly`,
            });
            result = UtilsNew.objectClone(response.responses[0].results[0]);
        } catch (reason) {
            error = reason;
            NotificationUtils.dispatch(target, NotificationUtils.NOTIFY_RESPONSE, reason);
        }

        LitUtils.dispatchCustomEvent(target, target.updateEventId, result, {}, error);
        target.setLoading(false);

        if (error) {
            throw error;
        } else {
            return result;
        }
    }

    static getUpdateParams(original, updatedFields, customisations) {
        const params = {};
        const updatedFieldKeyPrefixes = Object.keys(updatedFields)
            .map(key => key.replace(/[.[].*$/, ""));
        const uniqueUpdateFieldKeys = [...new Set(updatedFieldKeyPrefixes)];

        uniqueUpdateFieldKeys.forEach(key => {
            params[key] = original[key];
        });

        // 'customisations' array allows to perform some modifications in the updateParams object
        if (customisations?.length > 0) {
            customisations.forEach(field => {
                // 1. You can pass a lambda function
                if (field instanceof Function) {
                    field(params);
                } else {
                    // 2. When String then we delete the field
                    if (UtilsNew.getObjectValue(params, field, undefined)) {
                        UtilsNew.deleteObjectValue(params, field);
                    }
                }
            });
        }
        return params;
    }

    static getUpdatedFields(_original, updatedFields, param, value) {
        const _updatedFields = {
            ...updatedFields
        };

        // 1. Check if are updating an object-list
        if (param.includes("[].")) {
            // Parse 'param' in 3 parts, in this example 'collection.from[].1.name':
            //  - arrayFieldName: collection.from
            //  - index: 1
            //  - field: name
            const re = /(?<arrayFieldName>[a-zA-Z.]+)\[\].(?<index>[0-9]+).(?<field>[a-zA-Z.]+)/;
            const match = param.match(re);

            // 1.1 If field exist we are just updating an existing field, example: 'phenotypes[].0.name' where 'name' is the field
            if (match?.groups?.field) {
                // 1.1.1 Check if we are updating an item just ADDED, example: 'phenotypes[].1'
                if (_updatedFields[match?.groups?.arrayFieldName + "[]." + match?.groups?.index]) {
                    _updatedFields[match?.groups?.arrayFieldName + "[]." + match?.groups?.index].after[match.groups.field] = value;
                } else {
                    // 1.1.2 We are updating an existing field, example: 'phenotypes[].0.name'
                    const originalArray = UtilsNew.getObjectValue(_original, match?.groups?.arrayFieldName, undefined);
                    _updatedFields[param] = {
                        before: originalArray[match.groups.index][match.groups.field],
                        after: value
                    };
                    if (_updatedFields[param].before === _updatedFields[param].after) {
                        delete _updatedFields[param];
                    }
                }
            } else {
                // 1.2 Check 'value' to decide if we are adding or removing a new item
                if (value) {
                    // 1.2.1 New item ADDED
                    _updatedFields[param] = {
                        before: undefined,
                        after: value
                    };
                } else {
                    // 1.2.2 Item REMOVED
                    let [arrayFieldName, removedIndex] = param.split("[].");
                    removedIndex = Number.parseInt(removedIndex);
                    const originalArray = UtilsNew.getObjectValue(_original, arrayFieldName, undefined);
                    _updatedFields[param] = {
                        before: originalArray[removedIndex],
                        after: undefined
                    };

                    const keys = Object.keys(_updatedFields).filter(key => key.startsWith(arrayFieldName + "[]."));
                    for (const key of keys) {
                        const split = key.split("[].")[1];
                        let keyIndex, newKey;
                        if (split.includes(".")) {
                            const [index, field] = split.split(".");
                            keyIndex = Number.parseInt(index);
                            newKey = arrayFieldName + "[]." + (keyIndex - 1) + "." + field;
                        } else {
                            keyIndex = Number.parseInt(key.split("[].")[1]);
                            newKey = arrayFieldName + "[]." + (keyIndex - 1);
                        }

                        if (keyIndex > removedIndex) {
                            _updatedFields[newKey] = _updatedFields[key];
                            delete _updatedFields[key];

                            // If we rename a bigger version we need to delete the original item deleted
                            delete _updatedFields[param];
                        }
                    }
                }
            }
        } else {
            // 2. This works well for both objects and primitives
            const originalValue = UtilsNew.getObjectValue(_original, param, undefined);
            _updatedFields[param] = {
                before: originalValue,
                after: value
            };

            if ((_updatedFields[param].before === undefined && !_updatedFields[param].after) || _updatedFields[param].before === _updatedFields[param].after) {
                delete _updatedFields[param];
            }
        }

        return _updatedFields;
    }

    static createObject(object, params, value) {
        let data = {...object};
        const [field, prop] = params.split(".");

        // Rodiel (07/03/22): For object type values it is necessary to check if it is empty.
        // otherwise it would create an empty object instead of removing the empty object.
        if (UtilsNew.isNotEmpty(value)) {
            if (prop) {
                data[field] = {
                    ...data[field],
                    [prop]: value
                };
            } else {
                data = {
                    ...data,
                    [field]: value
                };
            }
        } else {
            if (prop) {
                delete data[field][prop];
            } else {
                delete data[field];
            }
        }
        return data;
    }


    //  Rodiel 2022-05-16 DEPRECATED use updateObjectParams
    /**
     * ! Rodiel 2022-09-27 DEPRECATED use updateObjectParams
     * TODO Before removing updateScalar change to updateObjectParams to these components
     * Clinical-analysis-update
     * Clinical-interpretation-update
     * exomiser-analysis
     * rd-tiering-analysis
     * clinical-interpretation-variant-review
     */
    //
    static updateScalar(_original, original, updateParams, param, value) {
        // Prepare an internal object to store the updateParams.
        // NOTE: it is important to create a new object reference to force a new render()
        const _updateParams = {
            ...updateParams
        };

        if (_original?.[param] !== value && value !== null) {
            original[param] = value; // This the problem
            _updateParams[param] = value;
        } else {
            // We need to restore the original value in our copy
            original[param] = _original[param];
            delete _updateParams[param];
        }

        // We need to create a new 'updateParams' reference to force an update
        return _updateParams;
    }

    // ! Rodiel 2022-09-27 DEPRECATED is only used by ontology-term-annotation-update is also deprecated
    static updateScalarParams(_original, original, updateParams, param, value) {
        // Prepare an internal object to store the updateParams.
        // NOTE: it is important to create a new object reference to force a new render()
        // Rodiel 22-05-17: avoid override original data and updateParams. (ontology-term-annotation-update)
        const _data = {
            original: {...original},
            updateParams: {...updateParams}
        };

        if (_original?.[param] !== value && value !== null) {
            _data.original[param] = value; // This the problem
            _data.updateParams[param] = value;
        } else {
            // We need to restore the original value in our copy
            _data.original[param] = _original[param];
            delete _data.updateParams[param];
        }

        // We need to create a new 'updateParams' reference to force an update
        return _data;
    }

    /**
     * !DEPRECATED
     * TODO Before removing updateObject change to updateObjectParams to these components
     * Clinical-analysis-update
     * Clinical-interpretation-update
     */
    //
    static updateObject(_original, original, updateParams, param, value) {
        const [field, prop] = param.split(".");

        // Prepare an internal object to store the updateParams.
        // NOTE: it is important to create a new object reference to force a new render()
        const _updateParams = {
            ...updateParams
        };

        if (_original?.[field]?.[prop] !== value && value !== null) {
            original[field] = {
                ...original[field],
                [prop]: value
            };

            _updateParams[field] = {
                ..._updateParams[field],
                [prop]: value
            };
        } else {
            delete _updateParams[field];
        }

        // We need to create a new 'updateParams' reference to force an update
        return _updateParams;
    }

    // Update object with Object as props
    static updateObjectWithObj(_original, original, updateParams, param, value) {
        const [field, prop] = param.split(".");
        // Prepare an internal object to store the updateParams.
        // NOTE: it is important to create a new object reference to force a new render()
        const _updateParams = {
            ...updateParams
        };

        // The value it's object too.
        const childKey = Object.keys(value)[0];
        const childValue = Object.values(value)[0];

        if (prop) {
            if (_original?.[field]?.[prop]?.[childKey] !== childValue && childValue !== null) {
                original[field][prop] = {
                    ...original[field][prop],
                    ...value
                };

                // init new object
                _updateParams[field] = {
                    ...updateParams[field],
                    [prop]: {}
                };

                _updateParams[field][prop] = {
                    ..._updateParams[field][prop],
                    ...value
                };
            } else {
                delete _updateParams[field][prop];

                if (UtilsNew.isEmpty(_updateParams[field])) {
                    delete _updateParams[field];
                }
            }
        } else {
            if (_original?.[field]?.[childKey] !== childValue && childValue !== null) {
                original[field] = {
                    ...original[field],
                    ...value
                };

                _updateParams[field] = {
                    ..._updateParams[field],
                    ...value
                };
            } else {
                delete _updateParams[field];
            }
        }

        // We need to create a new 'updateParams' reference to force an update
        return _updateParams;
    }

    // Rodiel 2022-05-16 DEPRECATED use updateObjectParams
    // update object with props has primitive type
    // ! Rodiel 2022-09-27 DEPRECATED is only used by annotation-update is also deprecated
    static updateObjectWithProps(_original, original, updateParams, param, value) {
        const [field, prop] = param.split(".");

        // Prepare an internal object to store the updateParams.
        // NOTE: it is important to create a new object reference to force a new render()
        const _updateParams = {
            ...updateParams
        };


        if (_original?.[field]?.[prop] !== value && value !== null && (_original?.[field]?.[prop] !== undefined || value !== "")) {
            original[field] = {
                ...original[field],
                [prop]: value
            };

            _updateParams[field] = {
                ..._updateParams[field],
                [prop]: value
            };
        } else {
            // original[param][prop] = _original[param][prop];
            delete _updateParams[field][prop];

            // if the object is entire emtpy well delete it
            if (UtilsNew.isEmpty(_updateParams[field])) {
                delete _updateParams[field];
            }
        }

        // We need to create a new 'updateParams' reference to force an update
        return _updateParams;
    }
    static updateObjectParams(_original, original, updateParams, param, value) {
        const [field, prop] = param.split(".");

        // Prepare an internal object to store the updateParams.
        // NOTE: it is important to create a new object reference to force a new render()
        const _updateParams = {
            ...updateParams
        };

        const isValueDifferent = (_obj, val) => _obj !== val && val !== null;

        // sometimes original object come as value undefined or empty but is not the same.
        const isNotEmtpy = (_obj, val) => typeof _obj !== "undefined" || val !== "";

        if (prop) {
            if (isValueDifferent(_original?.[field]?.[prop], value) && isNotEmtpy(_original?.[field]?.[prop], value)) {
                original[field] = {
                    ...original[field],
                    [prop]: value
                };

                _updateParams[field] = {
                    ..._updateParams[field],
                    [prop]: value
                };
            } else {
                // Josemi (2022-07-29) uncommented this as is not restoring the initial value in the original object
                // Added this if check to prevent rare cases where original[field] is not defined
                if (typeof original?.[field]?.[prop] !== "undefined") {
                    original[field][prop] = _original?.[field]?.[prop];
                }

                delete _updateParams?.[field]?.[prop];

                if (UtilsNew.isEmpty(_updateParams[field])) {
                    delete _updateParams[field];
                }
            }
        } else {
            if (isValueDifferent(_original?.[field], value)) {
                original[field] = value;
                _updateParams[field] = value;
            } else {
                original[field] =_original[field];
                delete _updateParams[field];
            }
        }

        return _updateParams;
    }

    static updateObjExperimental(_original, original, updateParams, param, value) {
        const isValueDifferent = (_obj, val) => _obj !== val && val !== null;
        const isNotEmpty = (_obj, val) => typeof _obj !== "undefined" || val !== "";
        const arraysEqual = (a, b) => a.length === b.length && a.every(
            (o, idx) => UtilsNew.objectCompare(o, b[idx])
        );

        // 1. Make a deep copy of the updateParams
        const _updateParams = {
            ...updateParams
        };

        // 2. Get current value in the original object, this will be used to check if the value has changed
        const currentValue = UtilsNew.getObjectValue(_original, param, "");

        // 3. Check if the values are actually different.
        // We must implement different comparison depending on the field type.
        let isDifferent;
        if (Array.isArray(currentValue)) {
            isDifferent = !arraysEqual(currentValue, value);
        } else {
            if (typeof currentValue === "object") {
                isDifferent = !UtilsNew.objectCompare(currentValue, value);
            } else {
                // Compare primitive fields: string, number, boolean
                isDifferent = isValueDifferent(currentValue, value) && isNotEmpty(currentValue, value);
            }
        }

        // 4. Set or delete values
        if (isDifferent) {
            // 4.1 If value isDifferent we must set the new value in the _updateParams
            UtilsNew.setObjectValue(original, param, value);

            // 4.2 We must return the root parent object. OpenCGA needs the root object!
            const rootFieldName = param.split(".")[0];
            UtilsNew.setObjectValue(_updateParams, rootFieldName, original[rootFieldName]);

            // Deprecated:
            // Use spread operator to avoid reference between original and _updateParams
            // If it's object, use spread operator
            // const originalValue = UtilsNew.isObject(original[rootFieldName]) ? {...original[rootFieldName]} : original[rootFieldName];
            // UtilsNew.setObjectValue(_updateParams, rootFieldName, originalValue);
        } else {
            // 4.1 Values are equals, so we must restore the original value in our copy.
            const restoredOriginalValue = UtilsNew.getObjectValue(_original, param, undefined);
            if (restoredOriginalValue) {
                UtilsNew.setObjectValue(original, param, JSON.parse(JSON.stringify(restoredOriginalValue)));
            } else {
                UtilsNew.deleteObjectValue(original, param);
            }

            // 4.2 Check if any parent object is empty or equals to original data, then we must remove from _updateParams
            if (param.includes(".")) {
                // 4.2.1 Check all parents
                const props = param.split(".").slice(0, -1);
                const length = props.length;
                for (let i = 0; i < length; i++) {
                    const prefix = props.join(".");
                    const originalDataValue = UtilsNew.getObjectValue(_original, prefix, "");
                    const updateValue = UtilsNew.getObjectValue(_updateParams, prefix, "");
                    if (UtilsNew.isEmpty() || UtilsNew.objectCompare(originalDataValue, updateValue)) {
                        UtilsNew.deleteObjectValue(_updateParams, prefix);
                        props.pop();
                    } else {
                        break;
                    }
                }
            } else {
                // 4.2.2 We need to remove from _updateParams after the loop above, delete this??
                UtilsNew.deleteObjectValue(_updateParams, param);
            }
        }
        return _updateParams;
    }

    // This function implements a general method for object array updates in forms.
    // Usage example, updating: panels.id or flags.id
    static updateObjectArray(_original, original, updateParams, param, values, data) {
        const [field, prop] = param.split(".");

        // Prepare an internal object to store the updateParams.
        // NOTE: it is important to create a new object reference to force a new render()
        const _updateParams = {
            ...updateParams
        };

        const valuesSplit = values?.split(",") || [];

        // Set array of objects WITH only THE 'prop' field
        _updateParams[field] = valuesSplit.map(value => ({[prop]: value}));

        // If possible we store the complete objects in 'original'
        if (data) {
            original[field] = [];
            for (const value of valuesSplit) {
                const item = data.find(d => d[prop] === value);
                original[field].push(item);
            }
        } else {
            original[field] = valuesSplit.map(value => ({[prop]: value}));
        }

        // Let's find out if the content of the array is different from the '_original' array in the server
        let hasChanged = false;
        if (original[field]?.length === _original[field]?.length) {
            for (const v of original[field]) {
                const index = _original[field].findIndex(vv => vv[prop] === v[prop]);
                if (index === -1) {
                    hasChanged = true;
                    break;
                }
            }
        } else {
            hasChanged = true;
        }

        // Delete updateParams field if nothing has changed
        if (!hasChanged) {
            delete _updateParams[field];
        }

        return _updateParams;
    }

    static updateArraysObject(_original, original, updateParams, param, value) {
        const [field, prop] = param.split(".");
        const _updateParams = {
            ...updateParams,
        };

        const arraysEqual = (a, b) => a.length === b.length && a.every(
            (o, idx) => UtilsNew.objectCompare(o, b[idx])
        );

        if (prop) {
            if (!arraysEqual(_original[field][prop], value)) {
                original[field] = {
                    ...original[field],
                    [prop]: value
                };

                _updateParams[field] = {
                    ..._updateParams[field],
                    [prop]: value
                };
            } else {
                original[field][prop] = _original[field][prop];
                delete _updateParams[field][prop];
                if (UtilsNew.isEmpty(_updateParams[field])) {
                    delete _updateParams[field];
                }
            }
        } else {
            if (!arraysEqual(_original[field], value)) {
                original[field] = value;
                _updateParams[field] = value;
            } else {
                original[field] = _original[field];
                delete _updateParams[field];
            }
        }

        return _updateParams;
    }

}
