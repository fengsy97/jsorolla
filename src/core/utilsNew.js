import {html} from "../../../../web_modules/lit-element.js";

export default class UtilsNew {

    static get MESSAGE_SUCCESS() {
        return "success";
    }

    static get MESSAGE_ERROR() {
        return "danger";
    }

    static get MESSAGE_INFO() {
        return "info";
    }

    static get MESSAGE_WARNING() {
        return "warning";
    }

    static isUndefined(obj) {
        return typeof obj === "undefined";
    }

    static isNotUndefined(obj) {
        return typeof obj !== "undefined";
    }

    static isNull(obj) {
        return obj === null;
    }

    static isNotNull(obj) {
        return obj !== null;
    }

    static isUndefinedOrNull(obj) {
        return typeof obj === "undefined" || obj === null;
    }

    static isNotUndefinedOrNull(obj) {
        return typeof obj !== "undefined" && obj !== null;
    }

    static isEmpty(obj) {
        if (typeof obj === "undefined" || obj === null) {
            return true;
        }

        // obj is an actual Object
        if (typeof obj === "object") {
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    return false;
                }
            }
            return true;
        } else {
            // obj is a String
            if (typeof obj === "string") {
                return obj === "";
            }
        }
    }

    static isNotEmpty(obj) {
        return !this.isEmpty(obj);
    }

    static isEmptyArray(arr) {
        return typeof arr !== "undefined" && arr !== null && arr.length === 0;
    }

    static isNotEmptyArray(arr) {
        return typeof arr !== "undefined" && arr !== null && arr.length > 0;
    }

    static defaultString(str, str2) {
        return this.isNotEmpty(str) ? str : str2;
    }

    static containsArray(arr, item) {
        if (UtilsNew.isNotEmptyArray(arr) && UtilsNew.isNotUndefinedOrNull(item)) {
            return arr.indexOf(item) > -1;
        }

        return false;
    }

    static removeDuplicates(array, prop) {
        const newArray = [];
        const lookupObject = {};

        for (const i in array) {
            lookupObject[array[i][prop]] = array[i];
        }

        for (const i in lookupObject) {
            newArray.push(lookupObject[i]);
        }
        return newArray;
    }

    static checkPermissions(project) {
        return UtilsNew.isUndefinedOrNull(project) || (UtilsNew.isNotUndefinedOrNull(project) && Object.keys(project).length === 0);
    }

    static isNotEqual(str, str2) {
        return str !== str2;
    }

    static isEqual(str, str2) {
        return str === str2;
    }

    /*  Utils refactoring in progress */

    static randomString(length) {
        let result = "";
        const _length = length || 6;
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (let i = 0; i < _length; i++ ) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }

    // safe check if the field is an object (NOTE null is an object, the constructor check is not enough)
    static isObject(o) {
        return o != null && o.constructor.name === "Object";
    }

    static getDiskUsage(bytes, numDecimals) {
        if (bytes === 0) {
            return "0 Byte";
        }
        let k = 1000;
        let dm = numDecimals ? numDecimals : 2;
        let sizes = [" Bytes", " KB", " MB", " GB", " TB", " PB", " EB", " ZB", " YB"];
        let i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + sizes[i];
    }

    static getDatetime(timestamp) {
        function pad2(n) {  // always returns a string
            return (n < 10 ? "0" : "") + n;
        }
        let date = timestamp ? new Date(timestamp) : new Date();
        return date.getFullYear() +
            pad2(date.getMonth() + 1) +
            pad2(date.getDate()) +
            pad2(date.getHours()) +
            pad2(date.getMinutes()) +
            pad2(date.getSeconds());
    }

    static initTooltip(scope) {
        $("a[tooltip-title]", scope).each(function() {
            $(this).qtip({
                content: {
                    title: $(this).attr("tooltip-title"),
                    text: $(this).attr("tooltip-text")
                },
                position: {target: "mouse", adjust: {x: 2, y: 2, mouse: false}},
                style: {width: true, classes: "qtip-light qtip-rounded qtip-shadow qtip-custom-class"},
                show: {delay: 200},
                hide: {fixed: true, delay: 300}
            });
        });
    }

    static dateFormatter(date, format) {
        let _format = format ? format : "D MMM YYYY";
        return moment(date, "YYYYMMDDHHmmss").format(_format);
    }

    static arrayDimension(array) {
        const shape = (array, i) => Array.isArray(array) ? shape(array[0],i+1) : i;
        return shape(array,0);
    }

    static renderHTML(html) {
        return document.createRange().createContextualFragment(`${html}`);
    }

    static jobStatusFormatter(status) {
        switch (status) {
            case "PENDING":
            case "QUEUED":
            case "REGISTERING":
            case "UNREGISTERED":
                return `<span class="text-primary"><i class="far fa-clock"></i> ${status}</span>`
            case "RUNNING":
                return `<span class="text-primary"><i class="fas fa-sync-alt anim-rotate"></i> ${status}</span>`
            case "DONE":
                return `<span class="text-success"><i class="fas fa-check-circle"></i> ${status}</span>`
            case "ERROR":
                return `<span class="text-danger"><i class="fas fa-exclamation-circle"></i> ${status}</span>`;
            case "UNKNOWN":
                return `<span class="text-danger"><i class="fas fa-exclamation-circle"></i> ${status}</span>`;
            case "ABORTED":
                return `<span class="text-warning"><i class="fas fa-ban"></i> ${status}</span>`;
            case "DELETED":
                return `<span class="text-primary"><i class="fas fa-trash-alt"></i> ${status}</span>`;
        }
        return "-";
    }

}
