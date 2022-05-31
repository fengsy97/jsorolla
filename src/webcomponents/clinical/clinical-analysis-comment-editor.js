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

import {LitElement, html} from "lit";

import UtilsNew from "../../core/utilsNew.js";

class ClinicalAnalysisCommentEditor extends LitElement {

    constructor() {
        super();

        // Set status and init private properties
        this._init();
    }

    createRenderRoot() {
        return this;
    }

    static get properties() {
        return {
            comments: {
                type: Array,
            },
            disabled: {
                type: Boolean,
            },
            config: {
                type: Object,
            },
        };
    }

    _init() {
        this._prefix = UtilsNew.randomString(8);
        this.commentStatus = {};
        if (!this.comments) {
            this.comments = [];
        }
    }

    connectedCallback() {
        super.connectedCallback();

        this._config = {...this.getDefaultConfig(), ...this.config};
    }

    updated(changedProperties) {
        if (changedProperties.has("comments")) {
            this.commentsObserver();
        }

        if (changedProperties.has("config")) {
            this._config = {...this.getDefaultConfig(), ...this.config};
        }
    }

    commentsObserver() {
        if (!this.comments || this.comments.length === 0) {
            this.comments = [{message: "", tags: []}];
        }

        if (this.comments) {
            // Keep a internal copy to reset vales
            this._comments = JSON.parse(JSON.stringify(this.comments));

            // Init the status with status NONE
            this.commentStatus = Object.fromEntries(this.comments.map(comment => {
                return [comment.date, "NONE"];
            }));

            this.requestUpdate();
        }
    }

    onAddChange(field, e) {

        // When cancel a comments with onAddDelete it's remove the entire object so the comment item haven't the properties message and tags..
        if (!this.comments[this.comments.length - 1]) {
            this.comments[this.comments.length - 1] = {message: "", tags: []};
        }

        // Only one new Comment allowed, it is added at the end of the comments array. No date is set for the new comment.
        // If last element contains a 'date' then we need to add a new comment.
        if (this.comments[this.comments.length - 1]?.date) {
            this.comments.push({
                message: "",
                tags: []
            });
        }

        if (field === "message") {
            this.comments[this.comments.length - 1].message = e.detail.value;
        } else {
            this.comments[this.comments.length - 1].tags = e.detail.value?.split(" ") ?? [];
        }

        if (this.comments[this.comments.length - 1].message || this.comments[this.comments.length - 1].tags.length > 0) {
            this.commentStatus["ADD"] = "ADD";
        } else {
            delete this.commentStatus["ADD"];
        }

        this.requestUpdate();
        this.notify();
    }

    onAddDelete(e) {
        // Delete the new ADDED comment
        this.comments.splice(this.comments.length - 1, 1);
        delete this.commentStatus["ADD"];

        this.requestUpdate();
        this.notify();
    }

    onEditChange(comment, field, e) {
        // Store the comment being UPDATED
        const editIndex = this.comments.findIndex(c => c.date === comment.date);
        if (field === "message") {
            this.comments[editIndex].message = e.detail.value;
        } else {
            this.comments[editIndex].tags = e.detail.value?.split(" ") ?? [];
        }
        this.notify();
    }

    onActionClick(comment, status, reset, e) {
        // Reset value in case it was UPDATED
        if (reset) {
            const index = this.comments.findIndex(c => c.date === comment.date);
            this.comments[index] = {...this._comments[index]};
        }

        // Set new status and refresh
        this.commentStatus[comment.date] = status;
        this.requestUpdate();
        this.notify();
    }

    onStarClick(comment, action, e) {
        // If the comments are disabled, prevent any update action
        if (this.disabled) {
            return;
        }

        if (action === "REMOVE") {
            const index = comment.tags?.indexOf("STARRED");
            comment.tags.splice(index, 1);
        } else {
            comment.tags ? comment.tags.push("STARRED") : comment.tags = ["STARRED"];
        }

        // NOTE: This active edit mode comment.
        // this.commentStatus[comment.date] = "UPDATED"; //
        this.requestUpdate();
        this.notify();
    }

    notify() {
        // Process all changes
        const newComments = [];
        const addedComments = [];
        const updatedComments = [];
        const deletedComments = [];

        this.comments.forEach(comment => {
            if (comment.date) {
                switch (this.commentStatus[comment.date]) {
                    case "NONE":
                        newComments.push(comment);
                        break;
                    case "UPDATED":
                        newComments.push(comment);
                        updatedComments.push(
                            {
                                date: comment.date,
                                message: comment.message,
                                tags: comment.tags
                            }
                        );
                        break;
                    case "DELETED":
                        deletedComments.push(
                            {
                                date: comment.date
                            }
                        );
                        break;
                }
            } else {
                newComments.push(comment);
                addedComments.push(comment);
            }
        });

        this.dispatchEvent(new CustomEvent("commentChange", {
            detail: {
                value: this.comments,
                newComments: newComments,
                added: addedComments,
                updated: updatedComments,
                deleted: deletedComments,
            },
        }));
    }

    getDefaultConfig() {
        return {
            add: true,
            styles: {
                NONE: "border-left: 2px solid #0c2f4c; padding-left:2px",
                ADD: "border-left: 2px solid green; padding-left:2px",
                UPDATED: "border-left: 2px solid darkorange; padding-left:2px",
                DELETED: "border-left: 2px solid red; color: grey; padding-left:2px"
            }
        };
    }

    render() {
        // if (!this.comments) {
        //     return html`
        //         <div>
        //             <h3><i class="fas fa-lock"></i> No available comments</h3>
        //         </div>`;
        // }

        let lastComment = {};
        if (this.comments?.length) {
            lastComment = this.comments[this.comments.length - 1] || null;
        }

        return html`
            ${this.comments?.filter(c => c.date)?.map(comment => html`
            <!-- ${this._config.styles[this.commentStatus[comment.date]]};  -->
                <div style="margin: 15px 0px">
                    <div class="panel panel-default">
                        <div class="panel-heading">
                            <div>
                                <span style="font-weight:bold;">${comment.author}</span><span style="color: darkgrey; margin: 0px 10px">${UtilsNew.dateFormatter(comment.date)}</span>
                                <div class="pull-right">
                                        ${comment.tags && comment.tags.includes("STARRED") ? html`
                                            <span style="color: darkgoldenrod; padding: 2px" @click="${e => this.onStarClick(comment, "REMOVE", e)}">
                                                <i class="fas fa-star"></i>
                                            </span>
                                        ` : html`
                                            <span style="padding: 2px" @click="${e => this.onStarClick(comment, "ADD", e)}">
                                                <i class="far fa-star"></i>
                                            </span>
                                        `}
                                        ${!this.disabled ? html`
                                        <span>
                                            <a style="color: black; cursor: pointer; padding: 2px" @click="${e => this.onActionClick(comment, "UPDATED", false, e)}">
                                                <i class="fas fa-edit"></i>
                                            </a>
                                        </span>
                                        <span>
                                            <a style="color: black; cursor: pointer; padding: 2px" @click="${e => this.onActionClick(comment, "DELETED", true, e)}">
                                                <i class="fas fa-trash"></i>
                                            </a>
                                        </span>
                                            ${this.commentStatus[comment.date] === "UPDATED" || this.commentStatus[comment.date] === "DELETED"? html`
                                                <span>
                                                    <a style="color: darkgrey; cursor: pointer; padding: 2px" @click="${e => this.onActionClick(comment, "NONE", true, e)}">
                                                        <i class="fas fa-times"></i>
                                                    </a>
                                                </span>
                                            ` : null}
                                        ` : null}
                                </div>
                            </div>
                        </div>
                        <div class="panel-body">
                            ${comment.message}"
                        <div>
                            <br/>
                            ${comment.tags?.filter(t => t !== "STARRED").map(tag => html`
                                <span class="label label-info" style="font-size: 95%">${tag}</span>
                            `)}
                        </div>
                        </div>
                    </div>
                    <div style="margin: 5px 10px">
                        ${this.commentStatus[comment.date] === "UPDATED" ? html`
                            <div style="margin: 10px 0px">
                                <text-field-filter
                                    .value="${comment.message}"
                                    .rows="${2}"
                                    @filterChange="${e => this.onEditChange(comment, "message", e)}">
                                </text-field-filter>
                            </div>
                            <div style="margin: 10px 0px">
                                <text-field-filter
                                    .value="${comment.tags?.filter(t => t !== "STARRED").join(" ")}"
                                    .rows="${1}"
                                    @filterChange="${e => this.onEditChange(comment, "tags", e)}">
                                </text-field-filter>
                            </div>
                        ` : html`
                            <!-- <div style="margin: 10px 0px">${comment.message}</div> -->
                            <!-- <div style="margin: 10px 0px">
                                ${comment.tags?.filter(t => t !== "STARRED").map(tag => html`
                                    <span class="label label-info" style="font-size: 95%">${tag}</span>
                                `)}
                            </div> -->
                        `}
                    </div>
                    <!-- ${!this.disabled ? html`
                        <div style="margin: 5px 10px">
                            <span>
                                <a style="color: darkgrey; cursor: pointer" @click="${e => this.onActionClick(comment, "UPDATED", false, e)}">Edit</a>
                            </span>
                            <span> - </span>
                            <span>
                                <a style="color: darkgrey; cursor: pointer" @click="${e => this.onActionClick(comment, "DELETED", true, e)}">Delete</a>
                            </span>
                            ${this.commentStatus[comment.date] === "UPDATED" || this.commentStatus[comment.date] === "DELETED"? html`
                                <span> - </span>
                                <span>
                                    <a style="color: darkgrey; cursor: pointer" @click="${e => this.onActionClick(comment, "NONE", true, e)}">Cancel</a>
                                </span>
                            ` : null}
                        </div>
                    ` : null} -->
                </div>
            `)}

            ${this._config.add ? html`
            <!-- ${this.commentStatus["ADD"] === "ADD" ? this._config.styles.ADD : this._config.styles.NONE} -->
                <div style="margin: 15px 0px">
                    <div style="margin-bottom: 5px">
                        <span style="font-weight: bold">New comment</span>
                    </div>
                    <div style="margin-bottom:5px">
                        <text-field-filter
                            .value="${this.comments?.length ? (lastComment?.date ? "" : lastComment ?.message) : ""}"
                            ?disabled="${this.disabled}"
                            placeholder="Add comment..." .rows=${2}
                            @filterChange="${e => this.onAddChange("message", e)}">
                        </text-field-filter>
                    </div>
                    <div style="margin-bottom:5px">
                        <text-field-filter
                            .value="${this.comments?.length ? (lastComment?.date ? "" : lastComment?.tags.join(" ")) : ""}"
                            ?disabled="${this.disabled}"
                            placeholder="Add tags..." .rows=${1}
                            @filterChange="${e => this.onAddChange("tags", e)}">
                        </text-field-filter>
                    </div>
                    ${this.commentStatus["ADD"] === "ADD" ? html`
                        <div style="margin: 5px 10px">
                            <span>
                                <a style="color: darkgrey; cursor: pointer" @click="${e => this.onAddDelete(e)}">Cancel</a>
                            </span>
                    ` : null}
                    <div style="margin: 5px 10px; float: right; display: none">
                        <span>
                            <button type="button" class="btn btn-default">Cancel</button>
                        </span>
                        <span>
                            <button type="button" class="btn btn-primary">Add</button>
                        </span>
                    </div>
                </div>
            `: null}
        `;
    }

}

customElements.define("clinical-analysis-comment-editor", ClinicalAnalysisCommentEditor);
