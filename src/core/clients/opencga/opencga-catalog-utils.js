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

import UtilsNew from "../../utils-new.js";
import "../../../sites/iva/conf/browsers.settings.js";

export default class OpencgaCatalogUtils {

    static getUsers(study) {
        const users = study?.groups
            .find(group => group.id === "@members")
            .userIds.filter(user => user !== "*");
        return UtilsNew.sort(users);
    }

    static getUserIds(study, groups = ["@members"]) {
        const groupsList = !Array.isArray(groups) ? [groups] : groups;
        return study?.groups
            .filter(g => groupsList.includes(g))
            .map(g => g.userIds)
            .filter(user => user !== "*");
    }

    static getProjectOwner(project) {
        return project ? project.fqn.split("@")[0] : null;
    }

    // Return a unique list of owners
    static getProjectOwners(projects) {
        return projects ? [...new Set(projects.map(project => project.fqn.split("@")[0]))] : null;
    }

    _checkParam(param, defaultValue) {
        if (!param) {
            return defaultValue;
        }
    }

    static checkUserAccountView(user, loggedUser) {
        return loggedUser === "opencga" || loggedUser === user;
    }

    static checkProjectPermissions(project, user) {
        return user === "opencga" || OpencgaCatalogUtils.getProjectOwner(project) === user;
    }

    // Check if the user has the right the permissions in the study.
    static checkPermissions(study, user, permissions) {
        if (!study || !user || !permissions) {
            console.error(`No valid parameters, study: ${study}, user: ${user}, permissions: ${permissions}`);
            return false;
        }
        // Check if user is the Study owner
        const studyOwner = study.fqn.split("@")[0];
        if (user === studyOwner) {
            return true;
        } else {
            // Check if user is a Study admin, belongs to @admins group
            const admins = study.groups.find(group => group.id === "@admins");
            if (admins.userIds.includes(user)) {
                return true;
            } else {
                // Check if user is in acl
                const aclUserIds = study.groups
                    .filter(group => group.userIds.includes(user))
                    .map(group => group.id);
                aclUserIds.push(user);
                for (const aclId of aclUserIds) {
                    // Find the permissions for this user
                    const userPermissions = study?.acl
                        ?.find(acl => acl.member === user)?.groups
                        ?.find(group => group.id === aclId)?.permissions || [];
                    if (Array.isArray(permissions)) {
                        for (const permission of permissions) {
                            if (userPermissions?.includes(permission)) {
                                return true;
                            }
                        }
                    } else {
                        if (userPermissions?.includes(permissions)) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    // Check if the user has the right the permissions in the study.
    static isAdmin(study, userLogged) {
        if (!study || !userLogged) {
            console.error(`No valid parameters, study: ${study}, user: ${userLogged}`);
            return false;
        }
        // Check if user is the Study owner
        const studyOwner = study.fqn.split("@")[0];
        if (userLogged === studyOwner) {
            return true;
        } else {
            // Check if user is a Study admin, belongs to @admins group
            const admins = study.groups.find(group => group.id === "@admins");
            if (admins.userIds.includes(userLogged)) {
                return true;
            }
        }
        return false;
    }

    // Update grid configuration of the specified browser
    static updateGridConfig(opencgaSession, browserName, newGridConfig) {
        const newConfig = {
            ...opencgaSession.user.configs?.IVA,
            [browserName]: {
                ...opencgaSession.user.configs?.IVA[browserName],
                grid: newGridConfig,
            },
        };
        return opencgaSession.opencgaClient.updateUserConfigs(newConfig)
            .then(response => {
                // Update user configuration in opencgaSession object
                // eslint-disable-next-line no-param-reassign
                opencgaSession.user.configs.IVA = response.responses[0].results[0];
            });
    }

    /** Prepares the study tool settings params that will be updated. If no settings are provided,
     * it will restore its default settings.
     * @param {object} opencgaSession   Session
     * @param {string} toolName         Tool name
     * @param {object} settings         OPTIONAL: if no settings, the default settings will be stored
     * @returns {Object}                Tool settings to be updated
     */
    static getNewToolIVASettings(opencgaSession, toolName, settings) {

        // 1. Retrieve other study attributes to avoid overwriting
        const otherAttributes = UtilsNew.objectCloneExclude(
            opencgaSession.study.attributes,
            [
                // eslint-disable-next-line no-undef
                `${SETTINGS_NAME}_BACKUP`,
                // eslint-disable-next-line no-undef
                SETTINGS_NAME
            ]
        );
        // 2. The params that will be updated
        return {
            attributes: {
                // 1. Other attributes that the study might have
                ...otherAttributes,
                // 2. BACKUP previous settings
                // eslint-disable-next-line no-undef
                [SETTINGS_NAME + "_BACKUP"]:
                    // eslint-disable-next-line no-undef
                    UtilsNew.objectClone(opencgaSession.study.attributes[SETTINGS_NAME]),
                // 3. New tool settings
                // eslint-disable-next-line no-undef
                [SETTINGS_NAME]: {
                    userId: opencgaSession.user.id,
                    version: opencgaSession.ivaDefaultSettings.version.split("-")[0],
                    date: UtilsNew.getDatetime(), // Update date
                    settings: {
                        ...(
                        // If settings param exists, save settings. If not, save defaultSettings
                            UtilsNew.objectCloneReplace(
                                // eslint-disable-next-line no-undef
                                opencgaSession.study.attributes[SETTINGS_NAME].settings,
                                `${[toolName]}`,
                                settings ?? opencgaSession.ivaDefaultSettings)
                        )
                    },
                },
            },
        };
    }

    /** Gets study IVA DEFAULT settings
     * @param {object} opencgaSession Session
     * @param {object} study Study
     * @returns {object} Study attributes with default IVA settings
     */
    static getDefaultIVASettings(opencgaSession, study) {
        return {
            attributes: {
                ...study.attributes,
                // eslint-disable-next-line no-undef
                [SETTINGS_NAME]: {
                    userId: opencgaSession.user.id,
                    version: opencgaSession.ivaDefaultSettings.version.split("-")[0],
                    date: UtilsNew.getDatetime(),
                    settings: UtilsNew.objectClone(opencgaSession.ivaDefaultSettings.settings),
                },
            }
        };

    }

}
