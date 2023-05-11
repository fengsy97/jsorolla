import {html} from "lit";
import NotificationUtils from "../utils/notification-utils";
import UtilsNew from "../../../core/utils-new";


export default class ModalUtils {

    static _getTitleHeader(header, title, classes, style) {
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

    static create(id, config) {
        // Parse modal parameters, all of them must start with prefix 'modal'
        const modalWidth = config.display?.modalWidth || "768px";
        const modalTitle = config.display?.modalTitle || "";
        const modalTitleHeader = config.display?.modalTitleHeader || "h4";
        const modalTitleClassName = config.display?.modalTitleClassName || "";
        const modalTitleStyle = config.display?.modalTitleStyle || "";

        return html `
            <div class="modal fade" id="${id}"
                 tabindex="-1" role="dialog"
                 aria-labelledby="DataModalLabel" aria-hidden="true">
                <div class="modal-dialog" style="width: ${modalWidth}">
                    <div class="modal-content">
                        <div class="modal-header">
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                            ${ModalUtils._getTitleHeader(modalTitleHeader, modalTitle, "modal-title " + modalTitleClassName, modalTitleStyle)}
                        </div>
                        <div class="modal-body">
                            <div class="container-fluid">
                                ${config.render()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    static show(id) {
        $(`#${id}`).modal("show");
    }

}