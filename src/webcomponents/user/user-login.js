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

import {LitElement, html, nothing} from "lit";
import LitUtils from "../commons/utils/lit-utils.js";
import NotificationUtils from "../commons/utils/notification-utils.js";
import UtilsNew from "../../core/utils-new.js";
import "../commons/forms/select-token-filter-static.js";

export default class UserLogin extends LitElement {

    constructor() {
        super();
        this.#init();
    }

    createRenderRoot() {
        return this;
    }

    static get properties() {
        return {
            opencgaSession: {
                type: Object
            },
        };
    }

    #init() {
        this.hasEmptyUser = false;
        this.hasEmptyPassword = false;
        this.organizationId = "";
    }

    firstUpdated() {
        if (this.opencgaSession?.study) {
            this.redirect("home");
        }
    }

    updated(changedProperties) {
        if (changedProperties.has("opencgaSession") && this.opencgaSession?.study) {
            this.redirect("home");
        }
    }

    redirect(to) {
        LitUtils.dispatchCustomEvent(this, "redirect", null, {hash: to});
    }

    onSubmit() {
        const user = (this.querySelector("#user").value || "").trim();
        const password = (this.querySelector("#password").value || "").trim();
        const organization = this.organizationId || ""; // this.querySelector("#organization")?.value || "";

        this.hasEmptyUser = user.length === 0;
        this.hasEmptyPassword = password.length === 0;
        if (this.hasEmptyUser || this.hasEmptyPassword) {
            return this.requestUpdate();
        }

        if (this.opencgaSession) {
            this.requestUpdate(); // Remove errors
            this.opencgaSession.opencgaClient.login(user, password, organization)
                .then(response => {
                    if (response && !UtilsNew.isError(response)) {
                        if (response.getEvents?.("ERROR")?.length) {
                            NotificationUtils.dispatch(this, NotificationUtils.NOTIFY_RESPONSE, response);
                        } else {
                            const token = response?.getResult?.(0)?.token;
                            // eslint-disable-next-line no-undef
                            const decoded = jwt_decode(token);
                            const dateExpired = new Date(decoded.exp * 1000);
                            // eslint-disable-next-line no-undef
                            const validTimeSessionId = moment(dateExpired, "YYYYMMDDHHmmss").format("D MMM YY HH:mm:ss");

                            LitUtils.dispatchCustomEvent(this, "login", null, {
                                userId: user,
                                token: token
                            }, null);

                            NotificationUtils.dispatch(this, NotificationUtils.NOTIFY_SUCCESS, {
                                message: `Welcome back, <b>${user}</b>. Your session is valid until ${validTimeSessionId}`,
                            });
                        }
                    } else if (response) {
                        // Sometimes response is an instance of an Error, for example when the connection is lost before submitting the login.
                        // In this case we will display the returned error instead of displaying a 'Generic Server Error' message.
                        // TODO: check why this error is not captured in the 'catch'
                        NotificationUtils.dispatch(this, NotificationUtils.NOTIFY_RESPONSE, response);
                    } else {
                        // This is a very strange situation when the response object is empty.
                        // In this case, as we do not have any error message we need to use this generic server error message.
                        NotificationUtils.dispatch(this, NotificationUtils.NOTIFY_ERROR, {
                            title: "Generic Server Error",
                            message: "Unexpected response format. Please check your host is up and running.",
                        });
                    }
                })
                .catch(response => {
                    NotificationUtils.dispatch(this, NotificationUtils.NOTIFY_RESPONSE, response);
                });
        } else {
            NotificationUtils.dispatch(this, NotificationUtils.NOTIFY_ERROR, {
                title: "Error retrieving OpencgaSession",
                message: `
                    There was an error retrieving the OpencgaSession.
                    Please try again later or contact the administrator if the problem persists.
                `,
            });
        }
    }

    // Handle keyup event --> check for enter key to submit the form
    onKeyUp(e) {
        if (e.key === "Enter") {
            return this.onSubmit(e);
        }
    }

    onOrganizationChange(e) {
        this.organizationId = e.detail.value;
    }

    // NOTE Josemi 20220317: reset password is disabled until we have an endpoint in OpenCGA to allow users
    // to reset it's password
    renderResetPasswordLink() {
        return null;
        // return html`
        //     <div align="center">
        //         <a @click="${() => this.redirect("#reset-password")}" style="cursor:pointer;">Forgot your password?</a>
        //     </div>
        // `;
    }

    render() {
        return html`
            <style>
                /* Josemi NOTe 2024-02-01 */
                /* Terrible style hack to fix rounded corners in organization field */
                .organization-field .select2-selection {
                    border-top-left-radius: 0px !important;
                    border-bottom-left-radius: 0px !important;
                }
            </style>
            <div class="container-fluid" style="max-width:480px;">
                <div class="panel panel-default">
                    <div class="panel-body" style="padding:32px;">
                        <div class="form-group ${this.hasEmptyUser ? "has-error" : ""}">
                            <label for="user" class="control-label label-login">User ID</label>
                            <div class="input-group">
                                <span class="input-group-addon" id="username">
                                    <i class="fa fa-user fa-lg"></i>
                                </span>
                                <input id="user" type="text" class="form-control" placeholder="User ID" @keyup="${e => this.onKeyUp(e)}">
                            </div>
                        </div>
                        <div class="form-group ${this.hasEmptyPassword ? "has-error" : ""}">
                            <label for="pass" class="control-label label-login">Password</label>
                            <div class="input-group">
                                <span class="input-group-addon" id="username">
                                    <i class="fa fa-key fa-lg"></i>
                                </span>
                                <input id="password" type="password" class="form-control" placeholder="Password" @keyup="${e => this.onKeyUp(e)}">
                            </div>
                        </div>
                        <div class="form-group organization-field">
                            <label for="organization" class="control-label label-login">Organization</label>
                            <div class="input-group">
                                <span class="input-group-addon" id="username">
                                    <i class="fa fa-building fa-lg"></i>
                                </span>
                                <select-token-filter-static
                                    .data="${this.opencgaSession?.opencgaClient?._config?.organizations || []}"
                                    .value="${""}"
                                    .config="${{multiple: false}}">
                                </select-token-filter-static>
                            </div>
                        </div>
                        <button class="btn btn-primary btn-block" @click="${e => this.onSubmit(e)}">
                            <strong>Sign In</strong>
                        </button>
                    </div>
                </div>
                ${this.renderResetPasswordLink()}
            </div>
        `;
    }

}

customElements.define("user-login", UserLogin);
