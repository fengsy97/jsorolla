import UtilsNew from "../../../core/utils-new.js";

export class CellBaseClientMock {

    constructor(config) {
        this._config = {
            ...this.getDefaultConfig(),
            ...config,
        };
    }

    getDefaultConfig() {
        return {
            host: "https://ws.zettagenomics.com/cellbase",
            version: "v5.1",
            species: "hsapiens",
            testDataVersion: "",
        };
    }

    // eslint-disable-next-line no-unused-vars
    getMeta(param, options) {
        return Promise.reject(new Error("Not implemented"));
    }

    // eslint-disable-next-line no-unused-vars
    get(category, subcategory, ids, resource, params, options) {
        if (category === "genomic") {
            // Genome browser: import chromosomes
            if (subcategory === "chromosome" && resource === "search") {
                return UtilsNew.importJSONFile(`./test-data/${this._config.testDataVersion}/genome-browser-chromosomes.json`);
            }
            // Genome browser: import genes in specified region
            if (subcategory === "region" && resource === "gene") {
                if (ids === "17:42677465-43531295" || ids === "17:43051016-43157744") {
                    return UtilsNew.importJSONFile(`./test-data/${this._config.testDataVersion}/genome-browser-region-17-42677465-43531295-genes.json`);
                }
            }
            // Genome browser: import variants in specified region
            if (subcategory === "region" && resource === "variant") {
                if (ids === "17:43051016-43157744") {
                    return UtilsNew.importJSONFile(`./test-data/${this._config.testDataVersion}/genome-browser-region-17-42677465-43531295-variants.json`);
                }
            }
        }
        // Other request
        return Promise.reject(new Error("Not implemented"));
    }

}
