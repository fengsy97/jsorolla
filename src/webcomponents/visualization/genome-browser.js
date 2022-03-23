import {LitElement, html} from "lit";
import UtilsNew from "./../../core/utilsNew.js";
import Region from "../../core/bioinfo/region.js";
import GenomeBrowser from "../../genome-browser/genome-browser.js";

import FeatureTrack from "../../genome-browser/tracks/feature-track.js";
import GeneOverviewTrack from "../../genome-browser/tracks/gene-overview-track.js";
import GeneTrack from "../../genome-browser/tracks/gene-track.js";
import SequenceTrack from "../../genome-browser/tracks/sequence-track.js";
import VariantTrack from "../../genome-browser/tracks/variant-track.js";
import OpenCGAVariantTrack from "../../genome-browser/tracks/opencga-variant-track.js";


export default class GenomeBrowserComponent extends LitElement {

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
                type: Object,
            },
            region: {
                type: Object,
            },
            species: {
                type: Object,
            },
            tracks: {
                type: Array,
            },
            active: {
                type: Boolean,
            },
            config: {
                type: Object,
            },
        };
    }

    #init() {
        this._prefix = UtilsNew.randomString(8);

        this.genomeBrowser = null;
        this.active = true;
        this.config = this.getDefaultConfig();
    }

    updated(changedProperties) {
        if (changedProperties.has("active")) {
            this.activeObserver();
        }

        if (changedProperties.has("region")) {
            this.regionObserver();
        }

        super.updated(changedProperties);
    }

    activeObserver() {
        if (this.active && this.genomeBrowser) {
            const parent = this.querySelector(`div#${this._prefix}GenomeBrowser`);
            const width = parent.getBoundingClientRect().width;

            this.genomeBrowser.setWidth(width);
        }
    }

    regionObserver() {
        if (this.genomeBrowser) {
            this.genomeBrowser.setRegion(this.region);
        }
    }

    firstUpdated() {
        this.initGenomeBrowser();
    }

    initGenomeBrowser() {
        const parent = this.querySelector(`div#${this._prefix}GenomeBrowser`);

        this.genomeBrowser = new GenomeBrowser(parent, {
            width: parent.getBoundingClientRect().width || 100,
            region: new Region(this.region),
            resizable: true,
            ...this.config,
        });

        // When GB is ready add tracks and draw
        this.genomeBrowser.on("ready", () => {
            this.genomeBrowser.addTracks(this.getDetailTracks());
            this.genomeBrowser.addOverviewTracks(this.getOverviewTracks());
            this.genomeBrowser.draw();
        });
    }

    // Get only detail tracks
    getDetailTracks() {
        return this.parseTracks(this.tracks.filter(track => !track.overview));
    }

    // Get only overview tracks
    getOverviewTracks() {
        return this.parseTracks(this.tracks.filter(track => !!track.overview));
    }

    parseTracks(tracks) {
        return tracks.map(track => {
            switch (track.type || "feature") {
                case "sequence":
                    return new SequenceTrack({
                        cellBaseClient: this.config.cellBaseClient,
                        ...track.config,
                    });
                case "gene":
                    return new GeneTrack({
                        cellBaseClient: this.config.cellBaseClient,
                        ...track.config,
                    });
                case "gene-overview":
                    return new GeneOverviewTrack({
                        cellBaseClient: this.config.cellBaseClient,
                        ...track.config,
                    });
                case "variant":
                    return new VariantTrack({
                        cellBaseClient: this.config.cellBaseClient,
                        ...track.config,
                    });
                case "opencga-variant":
                    return new OpenCGAVariantTrack({
                        opencgaClient: this.opencgaSession.opencgaClient,
                        ...track.config,
                    });
                default:
                    return new FeatureTrack({
                        cellBaseClient: this.config.cellBaseClient,
                        ...track.config,
                    });
            }
        });
    }

    render() {
        return html`
            <div id="${this._prefix}GenomeBrowser" style="width:100%;"></div>
        `;
    }

    getDefaultConfig() {
        return {};
    }

}

customElements.define("new-genome-browser", GenomeBrowserComponent);
