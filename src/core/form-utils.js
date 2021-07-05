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

export default class FormUtils {


    static updateObject(original, _original, updateParams, params, value) {
        const [field, prop] = params.split(".");
        if (_original?.[field]?.[prop] !== value && value !== null) {

            original[field] = {
                ...original[field],
                [prop]: value
            };

            updateParams[field] = {
                ...updateParams[field],
                [prop]: value
            };
        } else {
            delete updateParams[field][prop];
        }
    }

    static createObject(object, params, value, includeField=false) {
        const [field, prop] = params.split(".");
        if (includeField) {
            object[field] = {
                ...object[field],
                [prop]: value
            };
        } else {
            object = {
                ...object,
                [prop]: value
            };
            console.log("Object:", object);
        }
    }

    static showAlert(title, message, type) {
        Swal.fire(
            title,
            message,
            type,
        );
    }

}