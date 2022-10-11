/**
 * Copyright 2015-2020 OpenCB
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * WARNING: AUTOGENERATED CODE
 * 
 * This code was generated by a tool.
 * Autogenerated on: 2022-08-11 16:30:01
 * 
 * Manual changes to this file may cause unexpected behavior in your application.
 * Manual changes to this file will be overwritten if the code is regenerated. 
 *
**/

import OpenCGAParentClass from "./../opencga-parent-class.js";


/**
 * This class contains the methods for the "User" resource
 */

export default class User extends OpenCGAParentClass {

    constructor(config) {
        super(config);
    }

    /** Create a new user
    * @param {Object} data - JSON containing the parameters.
    * @returns {Promise} Promise object in the form of RestResponse instance.
    */
    create(data) {
        return this._post("users", null, null, null, "create", data);
    }

    /** Get identified and gain access to the system
    * @param {Object} [data] - JSON containing the authentication parameters.
    * @returns {Promise} Promise object in the form of RestResponse instance.
    */
    login(data) {
        return this._post("users", null, null, null, "login", data);
    }

    /** Change the password of a user
    * @param {Object} data - JSON containing the change of password parameters.
    * @returns {Promise} Promise object in the form of RestResponse instance.
    */
    password(data) {
        return this._post("users", null, null, null, "password", data);
    }

    /** Return the user information including its projects and studies
    * @param {String} users - Comma separated list of user IDs.
    * @param {Object} [params] - The Object containing the following optional parameters:
    * @param {String} [params.include] - Fields included in the response, whole JSON path must be provided.
    * @param {String} [params.exclude] - Fields excluded in the response, whole JSON path must be provided.
    * @returns {Promise} Promise object in the form of RestResponse instance.
    */
    info(users, params) {
        return this._get("users", users, null, null, "info", params);
    }

    /** Fetch a user configuration
    * @param {String} user - User ID.
    * @param {Object} [params] - The Object containing the following optional parameters:
    * @param {String} [params.name] - Unique name (typically the name of the application).
    * @returns {Promise} Promise object in the form of RestResponse instance.
    */
    configs(user, params) {
        return this._get("users", user, null, null, "configs", params);
    }

    /** Add or remove a custom user configuration
    * @param {String} user - User ID.
    * @param {Object} data - JSON containing anything useful for the application such as user or default preferences. When removing, only
    *     the id will be necessary.
    * @param {Object} [params] - The Object containing the following optional parameters:
    * @param {"ADD REMOVE"} [params.action = "ADD"] - Action to be performed: ADD or REMOVE a group. The default value is ADD.
    * @returns {Promise} Promise object in the form of RestResponse instance.
    */
    updateConfigs(user, data, params) {
        return this._post("users", user, "configs", null, "update", data, params);
    }

    /** Fetch user filters
    * @param {String} user - User ID.
    * @param {Object} [params] - The Object containing the following optional parameters:
    * @param {String} [params.id] - Filter id. If provided, it will only fetch the specified filter.
    * @returns {Promise} Promise object in the form of RestResponse instance.
    */
    filters(user, params) {
        return this._get("users", user, null, null, "filters", params);
    }

    /** Add or remove a custom user filter
    * @param {String} user - User ID.
    * @param {Object} data - Filter parameters. When removing, only the 'name' of the filter will be necessary.
    * @param {Object} [params] - The Object containing the following optional parameters:
    * @param {"ADD REMOVE"} [params.action = "ADD"] - Action to be performed: ADD or REMOVE a group. The default value is ADD.
    * @returns {Promise} Promise object in the form of RestResponse instance.
    */
    updateFilters(user, data, params) {
        return this._post("users", user, "filters", null, "update", data, params);
    }

    /** Update a custom filter
    * @param {String} user - User ID.
    * @param {String} filterId - Filter id.
    * @param {Object} data - Filter parameters.
    * @returns {Promise} Promise object in the form of RestResponse instance.
    */
    updateFilter(user, filterId, data) {
        return this._post("users", user, "filters", filterId, "update", data);
    }

    /** Reset password
    * @param {String} user - User ID.
    * @returns {Promise} Promise object in the form of RestResponse instance.
    */
    resetPassword(user) {
        return this._get("users", user, "password", null, "reset");
    }

    /** Retrieve the projects of the user
    * @param {String} user - User ID.
    * @param {Object} [params] - The Object containing the following optional parameters:
    * @param {String} [params.include] - Fields included in the response, whole JSON path must be provided.
    * @param {String} [params.exclude] - Fields excluded in the response, whole JSON path must be provided.
    * @param {Number} [params.limit] - Number of results to be returned.
    * @param {Number} [params.skip] - Number of results to skip.
    * @returns {Promise} Promise object in the form of RestResponse instance.
    */
    projects(user, params) {
        return this._get("users", user, null, null, "projects", params);
    }

    /** Update some user attributes
    * @param {String} user - User ID.
    * @param {Object} data - JSON containing the params to be updated.
    * @param {Object} [params] - The Object containing the following optional parameters:
    * @param {String} [params.include] - Fields included in the response, whole JSON path must be provided.
    * @param {String} [params.exclude] - Fields excluded in the response, whole JSON path must be provided.
    * @param {Boolean} [params.includeResult = "false"] - Flag indicating to include the created or updated document result in the response.
    *     The default value is false.
    * @returns {Promise} Promise object in the form of RestResponse instance.
    */
    update(user, data, params) {
        return this._post("users", user, null, null, "update", data, params);
    }

}