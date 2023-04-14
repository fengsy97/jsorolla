/*
 * Copyright 2015-present OpenCB
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
import {unsafeHTML} from "lit/directives/unsafe-html.js";

export default class HtmlViewer extends LitElement {

    static get properties() {
        return {
            contentHtml: {
                type: String
            },
        };
    }

    render() {
        if (!this.contentHtml) {
            return html`<div>No content provided</div>`;
        }

        return html`
            ${unsafeHTML(this.contentHtml)}
        `;
    }

}

customElements.define("html-viewer", HtmlViewer);
