import {html, nothing} from "lit";
import LitUtils from "../utils/lit-utils";
import UtilsNew from "../../../core/utils-new";

export default class ModalUtils {

    static show(id) {
        const modalElm = document.querySelector(`#${id}`);
        if (modalElm.dataset?.draggable === "true") {
            ModalUtils.draggableModal(modalElm);
        }
        $(`#${id}`).modal("show");
    }

    static close(id) {
        $(`#${id}`).modal("hide");
    }

    static create(self, id, config) {
        // Parse modal parameters, all of them must start with prefix 'modal'
        const modalWidth = config.display?.modalWidth || "768px";
        const modalSize = config.display?.modalSize || "";
        const modalTitle = config.display?.modalTitle || "";
        const modalTitleHeader = config.display?.modalTitleHeader || "h4";
        const modalTitleClassName = config.display?.modalTitleClassName || "";
        const modalTitleStyle = config.display?.modalTitleStyle || "";
        const btnsVisible = config.display?.modalbtnsVisible;
        const modalDraggable = config.display?.modalDraggable || false;
        const modalCyDataName = config.display?.modalCyDataName || "";

        return html `
            <div class="modal fade" id="${id}" data-draggable="${modalDraggable}"
                tabindex="-1" role="dialog"
                aria-labelledby="DataModalLabel" aria-hidden="true" data-cy="${modalCyDataName}">
                <!-- alternative: To use the width per style, it should look like this -> --bs-modal-width: 800px -->
                <div class="modal-dialog ${modalSize}" style="width: ${modalWidth}">
                    <div class="modal-content">
                        <div class="modal-header">
                            ${ModalUtils.#getTitleHeader(modalTitleHeader, modalTitle, "modal-title " + modalTitleClassName, modalTitleStyle)}
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"
                                    @click="${e => LitUtils.dispatchCustomEvent(self, "modalClose", null, e)}">
                            </button>
                        </div>
                        <div class="modal-body">
                            <div class="container-fluid">
                                ${config?.render(self)}
                            </div>
                        </div>
                        ${btnsVisible? html`
                            <div class="modal-footer">
                                <button type="button" class="btn btn-primary" data-bs-dismiss="modal"
                                        @click="${e => LitUtils.dispatchCustomEvent(self, "modalCancel", null, e)}">Cancel</button>
                                <button type="button" class="btn btn-primary" data-bs-dismiss="modal"
                                        @click="${e => LitUtils.dispatchCustomEvent(self, "modalOk", null, e)}">Save</button>
                            </div>`: nothing}
                    </div>
                </div>
            </div>
        `;
    }

    static #getTitleHeader(header, title, classes, style) {
        const titleCap = UtilsNew.capitalize(title);
        switch (header) {
            case "h1":
                return html`<h1 class="${classes}" style="${style}">${titleCap}</h1>`;
            case "h2":
                return html`<h2 class="${classes}" style="${style}">${titleCap}</h2>`;
            case "h3":
                return html`<h3 class="${classes}" style="${style}">${titleCap}</h3>`;
            case "h4":
                return html`<h4 class="${classes}" style="${style}">${titleCap}</h4>`;
            case "h5":
                return html`<h5 class="${classes}" style="${style}">${titleCap}</h5>`;
            case "h6":
                return html`<h6 class="${classes}" style="${style}">${titleCap}</h6>`;
        }
    }

    static draggableModal(modalElm) {
        const offset = [0, 0, 0, 0];
        const modalDialog = modalElm.querySelector(".modal-dialog");
        const modalHeader = modalElm.querySelector(".modal-header");

        if (modalDialog) {
            modalDialog.style.margin = "0";
            modalDialog.style.left = (window.innerWidth * 0.30) + "px";
            modalDialog.style.top = (window.innerHeight * 0.05) + "px";
        }

        const elementDrag = e => {
            e.preventDefault();

            // calculate the new cursor position:
            offset[0] = offset[2] - e.clientX;
            offset[1] = offset[3] - e.clientY;
            offset[2] = e.clientX;
            offset[3] = e.clientY;

            // set the element's new position:
            modalDialog.style.top = (modalDialog.offsetTop - offset[1]) + "px";
            modalDialog.style.left = (modalDialog.offsetLeft - offset[0]) + "px";
        };

        const closeDragElement = e => {
            e.preventDefault();
            // stop moving when mouse button is released:
            document.onmouseup = null;
            document.onmousemove = null;
        };

        const dragMouseDown = e => {
            e.preventDefault();

            // get the mouse cursor position at startup:
            offset[2] = e.clientX;
            offset[3] = e.clientY;
            document.onmouseup = closeDragElement;

            // call a function whenever the cursor moves:
            document.onmousemove = elementDrag;
        };

        modalHeader.onmousedown = dragMouseDown;
        modalHeader.style.cursor = "move";
    }

}
