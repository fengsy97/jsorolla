import {html, nothing} from "lit";
import LitUtils from "../utils/lit-utils";
import UtilsNew from "../../../core/utils-new";


export default class ModalUtils {

    static show(id) {
        // id & config.display.draggable
        const modalElm = document.querySelector(`#${id}`);
        ModalUtils.draggableModal(modalElm);
        $(`#${id}`).modal("show");
    }

    static close(id) {
        $(`#${id}`).modal("hide");
    }

    static create(self, id, config) {
        // Parse modal parameters, all of them must start with prefix 'modal'
        const modalWidth = config.display?.modalWidth || "768px";
        const modalTitle = config.display?.modalTitle || "";
        const modalTitleHeader = config.display?.modalTitleHeader || "h4";
        const modalTitleClassName = config.display?.modalTitleClassName || "";
        const modalTitleStyle = config.display?.modalTitleStyle || "";
        const btnsVisible = config.display?.modalbtnsVisible;

        return html `
            <div class="modal fade" id="${id}"
                tabindex="-1" role="dialog"
                aria-labelledby="DataModalLabel" aria-hidden="true">
                <div class="modal-dialog" style="width: ${modalWidth}">
                    <div class="modal-content">
                        <div class="modal-header">
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close"
                                    @click="${e => LitUtils.dispatchCustomEvent(self, "modalClose", null, e)}">
                                <span aria-hidden="true">&times;</span>
                            </button>
                            ${ModalUtils.#getTitleHeader(modalTitleHeader, modalTitle, "modal-title " + modalTitleClassName, modalTitleStyle)}
                        </div>
                        <div class="modal-body">
                            <div class="container-fluid">
                                ${config?.render(self)}
                            </div>
                        </div>
                        ${btnsVisible? html`
                            <div class="modal-footer">
                                <button type="button" class="btn btn-primary" data-dismiss="modal"
                                        @click="${e => LitUtils.dispatchCustomEvent(self, "modalCancel", null, e)}">Cancel</button>
                                <button type="button" class="btn btn-primary" data-dismiss="modal"
                                        @click="${e => LitUtils.dispatchCustomEvent(self, "modalOk", null, e)}">Save</button>
                            </div>`: nothing}
                    </div>
                </div>
            </div>
        `;
    }

    static #getTitleHeader(header, title, classes, style) {
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

    static draggableModal(modalElm) {
        let offset = [0, 0];
        let isDown = false;
        const modalDialog = modalElm.querySelector(".modal-dialog");
        const modalHeader = modalElm.querySelector(".modal-header");
        modalHeader.style.cursor = "move";

        if (modalDialog) {
            modalDialog.style.margin = "0";
            modalDialog.style.left = (window.innerWidth * 0.30) + "px";
            modalDialog.style.top = (window.innerHeight * 0.05) + "px";
        }
        modalHeader.addEventListener("mousedown", e => {
            isDown = true;
            offset = [
                modalDialog.offsetLeft - e.clientX,
                modalDialog.offsetTop - e.clientY
            ];
        }, true);

        modalHeader.addEventListener("mouseup", () => {
            isDown = false;
        }, true);

        modalHeader.addEventListener("mousemove", e => {
            e.preventDefault();
            if (isDown) {
                modalDialog.style.left = (e.clientX + offset[0]) + "px";
                modalDialog.style.top = (e.clientY + offset[1]) + "px";
            }
        }, true);
    }

}
