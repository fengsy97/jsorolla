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
 * Autogenerated on: 2020-06-29 14:37:38
 * 
 * Manual changes to this file may cause unexpected behavior in your application.
 * Manual changes to this file will be overwritten if the code is regenerated. 
 *
**/

import OpenCGAParentClass from "./../opencga-parent-class.js";


/**
 * This class contains the methods for the "Project" resource
 */

export default class Project extends OpenCGAParentClass {

    constructor(config) {
        super(config);
    }

    /** Create a new project
    * @param {Object} data - JSON containing the mandatory parameters.
    * @returns {Promise} Promise object in the form of RestResponse instance.
    */
    create(data) {
        return this._post("projects", null, null, null, "create", data);
    }

    /** Search projects
    * @param {Object} [params] - The Object containing the following optional parameters:
    * @param {String} [params.include] - Fields included in the response, whole JSON path must be provided.
    * @param {String} [params.exclude] - Fields excluded in the response, whole JSON path must be provided.
    * @param {Number} [params.limit] - Number of results to be returned.
    * @param {Number} [params.skip] - Number of results to skip.
    * @param {String} [params.owner] - Owner of the project.
    * @param {String} [params.id] - Project [user@]project where project can be either the ID or the alias.
    * @param {String} [params.name] - Project name.
    * @param {String} [params.fqn] - Project fqn.
    * @param {String} [params.organization] - Project organization.
    * @param {String} [params.description] - Project description.
    * @param {String} [params.study] - Study id.
    * @param {String} [params.creationDate] - Creation date. Format: yyyyMMddHHmmss. Examples: >2018, 2017-2018, <201805.
    * @param {String} [params.modificationDate] - Modification date. Format: yyyyMMddHHmmss. Examples: >2018, 2017-2018, <201805.
    * @param {String} [params.status] - Status.
    * @param {String} [params.attributes] - Attributes.
    * @returns {Promise} Promise object in the form of RestResponse instance.
    */
    search(params) {
        return this._get("projects", null, null, null, "search", params);
    }

    /** Fetch catalog project stats
    * @param {String} projects - Comma separated list of projects [user@]project up to a maximum of 100.
    * @param {Object} [params] - The Object containing the following optional parameters:
    * @param {Boolean} [params.default = "true"] - Calculate default stats. The default value is true.
    * @param {String} [params.fileFields] - List of file fields separated by semicolons, e.g.: studies;type. For nested fields use >>, e.g.:
    *     studies>>biotype;type.
    * @param {String} [params.individualFields] - List of individual fields separated by semicolons, e.g.: studies;type. For nested fields
    *     use >>, e.g.: studies>>biotype;type.
    * @param {String} [params.familyFields] - List of family fields separated by semicolons, e.g.: studies;type. For nested fields use >>,
    *     e.g.: studies>>biotype;type.
    * @param {String} [params.sampleFields] - List of sample fields separated by semicolons, e.g.: studies;type. For nested fields use >>,
    *     e.g.: studies>>biotype;type.
    * @param {String} [params.cohortFields] - List of cohort fields separated by semicolons, e.g.: studies;type. For nested fields use >>,
    *     e.g.: studies>>biotype;type.
    * @param {String} [params.jobFields] - List of job fields separated by semicolons, e.g.: studies;type. For nested fields use >>, e.g.:
    *     studies>>biotype;type.
    * @returns {Promise} Promise object in the form of RestResponse instance.
    */
    aggregationStats(projects, params) {
        return this._get("projects", projects, null, null, "aggregationStats", params);
    }

    /** Fetch project information
    * @param {String} projects - Comma separated list of projects [user@]project up to a maximum of 100.
    * @param {Object} [params] - The Object containing the following optional parameters:
    * @param {String} [params.include] - Fields included in the response, whole JSON path must be provided.
    * @param {String} [params.exclude] - Fields excluded in the response, whole JSON path must be provided.
    * @returns {Promise} Promise object in the form of RestResponse instance.
    */
    info(projects, params) {
        return this._get("projects", projects, null, null, "info", params);
    }

    /** Increment current release number in the project
    * @param {String} project - Project [user@]project where project can be either the ID or the alias.
    * @returns {Promise} Promise object in the form of RestResponse instance.
    */
    incRelease(project) {
        return this._post("projects", project, null, null, "incRelease");
    }

    /** Fetch all the studies contained in the project
    * @param {String} project - Project [user@]project where project can be either the ID or the alias.
    * @param {Object} [params] - The Object containing the following optional parameters:
    * @param {String} [params.include] - Fields included in the response, whole JSON path must be provided.
    * @param {String} [params.exclude] - Fields excluded in the response, whole JSON path must be provided.
    * @param {Number} [params.limit] - Number of results to be returned.
    * @param {Number} [params.skip] - Number of results to skip.
    * @returns {Promise} Promise object in the form of RestResponse instance.
    */
    studies(project, params) {
        return this._get("projects", project, null, null, "studies", params);
    }

    /** Update some project attributes
    * @param {String} project - Project [user@]project where project can be either the ID or the alias.
    * @param {Object} data - JSON containing the params to be updated. It will be only possible to update organism fields not previously
    *     defined.
    * @returns {Promise} Promise object in the form of RestResponse instance.
    */
    update(project, data) {
        return this._post("projects", project, null, null, "update", data);
    }

}
