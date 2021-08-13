import "./threed-viewer/js/coverageFake.js";
import "./threed-viewer/js/coverage.js";
import "./threed-viewer/js/3D.js";
import "./threed-viewer/js/main.js";
import "./threed-viewer/js/chr.js";
import "./threed-viewer/js/torus.js";
import "./threed-viewer/threed-viewer.js";
import "./threed-viewer/threedv-config.js";
import Utils from "./core/utils.js";
import "./core/clients/opencga/opencga-client.js";
import "./core/clients/rest-client-axios.js";
import "./core/clients/rest-response.js";
import "./core/clients/cellbase/cellbase-client.js";
import "./core/clients/rest-client-xmlhttp.js";
import "./core/clients/rest-client.js";
// import "./core/clients/test/tests.js";
/*import "./core/clients/reactome-client.js";
import "./core/region.js";
import "./core/data-adapter/cellbase-adapter.js";
import "./core/data-adapter/opencga-adapter.js";
import "./core/data-adapter/reactome-adapter.js";
import "./core/data-adapter/network/json-network-data-adapter.js";
import "./core/data-adapter/network/xlsx-network-data-adapter.js";
import "./core/data-adapter/network/dot-network-data-adapter.js";
import "./core/data-adapter/network/attribute-network-data-adapter.js";
import "./core/data-adapter/network/text-network-data-adapter.js";
import "./core/data-adapter/network/sif-network-data-adapter.js";
import "./core/data-adapter/feature-adapter.js";
import "./core/data-adapter/feature-template-adapter.js";
import "./core/cellbase-manager.js";
import "./core/visualisation/lollipop.js";
import "./core/visualisation/pedigree.js";
import "./core/visualisation/exonViewer.js";
import "./core/visualisation/test/resources/BRCA2.js";
import "./core/opencga-manager.js";
import "./core/loading-spinner.js";
import "./core/webcomponents/variant/opencga-variant-facet_meta.js";
import "./core/webcomponents/variant/variant-interpreter-browser-rd.js";
import "./core/webcomponents/variant/variant-beacon-network.js";
import "./core/webcomponents/variant/opencga-variant-interpreter-genome-browser.js";
import "./core/webcomponents/variant/annotation/cellbase-population-frequency-grid.js";
import "./core/webcomponents/variant/annotation/cellbase-variantannotation-view.js";
import "./core/webcomponents/variant/annotation/variant-consequence-type-view.js";
import "./core/webcomponents/variant/annotation/cellbase-variant-annotation-summary.js";
import "./core/webcomponents/variant/variant-browser.js";
import "./core/webcomponents/variant/opencga-variant-facet-query.js";
import "./core/webcomponents/variant/opencga-variant-samples.js";
import "./core/webcomponents/variant/opencga-variant-detail-template.js";
import "./core/webcomponents/variant/analysis/opencga-gwas-analysis.js";
import "./core/webcomponents/variant/variant-sample-selector.js";
import "./core/webcomponents/variant/variant-family-genotype-filter.js";
import "./core/webcomponents/variant/variant-utils.js";
import "./core/webcomponents/variant/opencga-variant-interpretation-grid.js";
import "./core/webcomponents/variant/variant-browser-detail.js";
import "./core/webcomponents/variant/variant-cohort-stats.js";
import "./core/webcomponents/variant/variant-browser-grid.js";
import "./core/webcomponents/variant/variant-genome-browser.js";
import "./core/webcomponents/variant/variant-grid-formatter.js";
import "./core/webcomponents/variant/variant-protein-view.js";
import "./core/webcomponents/variant/opencga-variant-facet.js";
import "./core/webcomponents/variant/variant-beacon.js";
import "./core/webcomponents/variant/opencga-variant-family-analysis.js";
import "./core/webcomponents/variant/test/config.js";
import "./core/webcomponents/variant/test/tools.js";
import "./core/webcomponents/variant/opencga-variant-interpretation-detail.js";
import "./core/webcomponents/variant/opencga-variant-filter.js";
import "./core/webcomponents/variant/opencga-variant-interpretation-editor.js";
import "./core/webcomponents/variant/opencga-variant-file-metrics.js";
import "./core/webcomponents/variant/clinical-interpretation-variant-review.js";
import "./core/webcomponents/cellbase/core/cellbase-gene-filter.js";
import "./core/webcomponents/opencga/panels_example.js";
import "./core/webcomponents/opencga/opencga-active-filters.js";
import "./core/webcomponents/opencga/catalog/files/opencga-file-browser.js";
import "./core/webcomponents/opencga/catalog/files/opencga-file-grid.js";
import "./core/webcomponents/opencga/catalog/files/opencga-file-facet.js";
import "./core/webcomponents/opencga/catalog/files/opencga-file-filter.js";
import "./core/webcomponents/opencga/catalog/date-filter.js";
import "./core/webcomponents/opencga/catalog/panel/opencga-panel-browser.js";
import "./core/webcomponents/opencga/catalog/panel/opencga-panel-grid.js";
import "./core/webcomponents/opencga/catalog/panel/opencga-panel-summary.js";
import "./core/webcomponents/opencga/catalog/panel/opencga-panel-editor.js";
import "./core/webcomponents/opencga/catalog/panel/opencga-panel-filter.js";
import "./core/webcomponents/opencga/catalog/cohorts/opencga-cohort-grid.js";
import "./core/webcomponents/opencga/catalog/cohorts/opencga-cohort-filter.js";
import "./core/webcomponents/opencga/catalog/cohorts/opencga-cohort-facet.js";
import "./core/webcomponents/opencga/catalog/cohorts/opencga-cohort-browser.js";
import "./core/webcomponents/opencga/catalog/samples/opencga-sample-grid.js";
import "./core/webcomponents/opencga/catalog/samples/sample-view.js";
import "./core/webcomponents/opencga/catalog/samples/opencga-sample-browser.js";
import "./core/webcomponents/opencga/catalog/samples/opencga-sample-facet.js";
import "./core/webcomponents/opencga/catalog/samples/opencga-sample-filter.js";
import "./core/webcomponents/opencga/catalog/individual/opencga-individual-filter.js";
import "./core/webcomponents/opencga/catalog/individual/opencga-individual-facet.js";
import "./core/webcomponents/opencga/catalog/individual/opencga-individual-browser.js";
import "./core/webcomponents/opencga/catalog/individual/opencga-individual-grid.js";
import "./core/webcomponents/opencga/catalog/variableSets/opencga-annotation-viewer.js";
import "./core/webcomponents/opencga/catalog/variableSets/opencga-variable-selector.js";
import "./core/webcomponents/opencga/catalog/variableSets/opencga-annotation-comparator.js";
import "./core/webcomponents/opencga/catalog/variableSets/opencga-annotation-filter.js";
import "./core/webcomponents/opencga/catalog/opencga-projects.js";
import "./core/webcomponents/opencga/catalog/family/opencga-family-editor.js";
import "./core/webcomponents/opencga/catalog/family/opencga-family-grid.js";
import "./core/webcomponents/opencga/catalog/family/opencga-family-browser.js";
import "./core/webcomponents/opencga/catalog/family/opencga-family-filter.js";
import "./core/webcomponents/opencga/catalog/family/opencga-family-facet.js";
import "./core/webcomponents/opencga/catalog/opencga-login.js";
import "./core/webcomponents/opencga/opencga-genome-browser.js";
import "./core/webcomponents/opencga/opencga-gene-view.js";
import "./core/webcomponents/opencga/opencga-transcript-coverage-view.js";
import "./core/webcomponents/opencga/opencga-protein-view.js";
import "./core/webcomponents/opencga/clinical/clinical-interpretation-view.js";
import "./core/webcomponents/opencga/clinical/opencga-clinical-analysis-facet.js";
import "./core/webcomponents/opencga/clinical/opencga-clinical-analysis-browser.js";
import "./core/webcomponents/opencga/clinical/obsolete/opencga-variant-clinical.js";
import "./core/webcomponents/opencga/clinical/opencga-clinical-analysis-grid.js";
import "./core/webcomponents/opencga/clinical/opencga-clinical-analysis-view.js";
import "./core/webcomponents/opencga/clinical/opencga-clinical-analysis-filter.js";
import "./core/webcomponents/opencga/clinical/test/interpretation.js";
import "./core/webcomponents/opencga/clinical/opencga-clinical-review-cases.js";
import "./core/webcomponents/opencga/clinical/opencga-clinical-analysis-editor.js";
import "./core/webcomponents/opencga/commons/opencga-facet-view-selector.js";
import "./core/webcomponents/opencga/commons/opencga-facet-result-view.js";
import "./core/webcomponents/opencga/commons/opencga-facet-view.js";
import "./core/webcomponents/opencga/commons/opencga-facet.js";
import "./core/webcomponents/opencga/commons/CatalogUIUtils.js";
import "./core/webcomponents/opencga/alignment/gene-coverage-view.js";
import "./core/webcomponents/PolymerUtils.js";
import "./core/webcomponents/reactome/reactome-variant-network.js";
import "./core/webcomponents/commons/opencb-facet-results.js";
import "./core/webcomponents/commons/analysis/opencga-analysis-tool-form.js";
import "./core/webcomponents/commons/analysis/opencga-analysis-tool.js";
import "./core/webcomponents/commons/analysis/opencga-analysis-tool-form-field.js";
import "./core/webcomponents/commons/analysis/test/test-configurations.js";
import "./core/webcomponents/commons/opencb-grid-toolbar.js";
import "./core/webcomponents/commons/opencb-facet-query.js";
import "./core/webcomponents/commons/filters/region-filter.js";
import "./core/webcomponents/commons/filters/somatic-filter.js";
import "./core/webcomponents/commons/filters/file-quality-filter.js";
import "./core/webcomponents/commons/filters/select-field-filter.js";
import "./core/webcomponents/commons/filters/conservation-filter.js";
import "./core/webcomponents/commons/filters/protein-substitution-score-filter.js";
import "./core/webcomponents/commons/filters/clinvar-accessions-filter.js";
import "./core/webcomponents/commons/filters/file-pass-filter.js";
import "./core/webcomponents/commons/filters/sample-filter.js";
import "./core/webcomponents/commons/filters/variant-type-filter.js";
import "./core/webcomponents/commons/filters/fulltext-search-accessions-filter.js";
import "./core/webcomponents/commons/filters/feature-filter.js";
import "./core/webcomponents/commons/filters/cadd-filter.js";
import "./core/webcomponents/commons/filters/hpo-accessions-filter.js";
import "./core/webcomponents/commons/filters/consequence-type-filter.js";
import "./core/webcomponents/commons/filters/file-filter.js";
import "./core/webcomponents/commons/filters/cohort-filter.js";
import "./core/webcomponents/commons/filters/population-frequency-filter.js";
import "./core/webcomponents/commons/filters/study-filter.js";
import "./core/webcomponents/commons/filters/disease-panel-filter.js";
import "./core/webcomponents/commons/filters/biotype-filter.js";
import "./core/webcomponents/commons/filters/go-accessions-filter.js";
import "./core/webcomponents/commons/filters/text-field-filter.js";
import "./core/webcomponents/commons/variant-modal-ontology.js";
import "./core/tracks/GeneTrack.js";
import "./core/tracks/CoverageTrack.js";
import "./core/tracks/FeatureTrack.js";
import "./core/tracks/renderers/CoverageRenderer.js";
import "./core/tracks/renderers/GeneRenderer.js";
import "./core/svg.js";
import "./core/utilsNew.js";
import "./core/segregations.js";
import "./core/network/vertex.js";
import "./core/network/point.js";
import "./core/network/graph-layout.js";
import "./core/network/edge.js";
import "./core/network/default-vertex-renderer.js";
import "./core/network/default-edge-renderer.js";
import "./core/network/circos-vertex-renderer.js";
import "./core/validator/expression-validator.js";
import "./core/validator/vcf-validator.js";
import "./core/validator/bed-validator.js";
import "./core/validator/validator.js";
import "./core/validator/experimental-design-validator.js";
import "./core/NotificationUtils.js";
import "./core/widgets/input-list-widget.js";
import "./core/widgets/chart-widget.js";
import "./core/widgets/feature/info/tf-info-widget.js";
import "./core/widgets/feature/info/snp-info-widget.js";
import "./core/widgets/feature/info/protein-info-widget.js";
import "./core/widgets/feature/info/vcf-variant-info-widget.js";
import "./core/widgets/feature/info/transcript-info-widget.js";
import "./core/widgets/feature/info/info-widget.js";
import "./core/widgets/feature/info/mirna-info-widget.js";
import "./core/widgets/feature/info/geneorange-info-widget.js";
import "./core/widgets/feature/info/transcriptorange-info-widget.js";
import "./core/widgets/feature/info/gene-info-widget.js";
import "./core/widgets/feature/file/track-settings-widget.js";
import "./core/widgets/feature/file/vcf-file-widget.js";
import "./core/widgets/feature/file/gtf-file-widget.js";
import "./core/widgets/feature/file/bed-file-widget.js";
import "./core/widgets/feature/file/url-widget.js";
import "./core/widgets/feature/file/file-widget.js";
import "./core/widgets/feature/file/gff-file-widget.js";
import "./core/widgets/feature/variant/variant-widget.js";
import "./core/widgets/feature/variant/variant-browser-grid.js";
import "./core/widgets/feature/variant/variant-effect-grid.js";
import "./core/widgets/feature/variant/variant-genotype-grid.js";
import "./core/widgets/feature/variant/variant-stats-panel.js";
import "./core/widgets/feature/variant/variant-file-browser-panel.js";
import "./core/widgets/feature/form/segregation-filter-forms-panel.js";
import "./core/widgets/feature/form/form-panel.js";
import "./core/widgets/feature/form/consequence-type-filter-forms-panel.js";
import "./core/widgets/feature/form/maf-filter-forms-panel.js";
import "./core/widgets/feature/form/go-filter-forms-panel.js";
import "./core/widgets/feature/form/position-filter-forms-panel.js";
import "./core/widgets/feature/form/study-filter-forms-panel.js";
import "./core/widgets/ux-window.js";
import "./core/widgets/widget.js";
import "./core/widgets/opencga/header-widget.js";
import "./core/widgets/opencga/job-list-widget.js";
import "./core/widgets/opencga/opencga-browser-widget.js";
import "./core/widgets/opencga/check-browser.js";
import "./core/widgets/opencga/upload-widget.js";
import "./core/widgets/opencga/result-widget.js";
import "./core/widgets/opencga/profile-widget.js";
import "./core/widgets/opencga/login-widget.js";
import "./core/widgets/opencga/generic-forms-panel.js";
import "./core/widgets/opencga/result-table.js";
import "./core/widgets/text-window-widget.js";
import "./core/cache/feature-cache.js";
import "./core/cache/indexedDB-store.js";
import "./core/cache/indexeddb-cache.js";
import "./core/cache/feature-chunk-cache.js";
import "./core/cache/test/tests.js";
import "./core/cache/file-feature-cache.js";
import "./core/cache/memory-store.js";
import "./core/cache/bam-cache.js";
import "./genome-browser/feature-binary-search-tree.js";
import "./genome-browser/config.js";
import "./genome-browser/navigation-bar.js";
import "./genome-browser/status-bar.js";
import "./genome-browser/genome-browser.js";
import "./genome-browser/tracks/variant-track.js";
import "./genome-browser/tracks/tracklist-panel.js";
import "./genome-browser/tracks/alignment-track.js";
import "./genome-browser/tracks/gene-track.js";
import "./genome-browser/tracks/feature-track.js";
import "./genome-browser/chromosome-panel.js";
import "./genome-browser/karyotype-panel.js";
import "./genome-browser/webcomponent/genome-browser.js";
import "./genome-browser/vendor/ChemDoodleWeb.js";
import "./genome-browser/renderers/alignment-renderer.js";
import "./genome-browser/renderers/histogram-renderer.js";
import "./genome-browser/renderers/sequence-renderer.js";
import "./genome-browser/renderers/obsolete/conserved-renderer.js";
import "./genome-browser/renderers/obsolete/feature-cluster-renderer.js";
import "./genome-browser/renderers/obsolete/bam-renderer.js";
import "./genome-browser/renderers/obsolete/vcf-multisample-renderer.js";
import "./genome-browser/renderers/obsolete/variant-renderer_old.js";
import "./genome-browser/renderers/gene-renderer.js";
import "./genome-browser/renderers/variant-renderer.js";
import "./genome-browser/renderers/feature-renderer.js";
import "./genome-browser/renderers/renderer.js";
import "./circular-genome-viewer/circular-karyotype.js";
import "./circular-genome-viewer/circular-genome-viewer.js";
import "./circular-genome-viewer/circular-navigation-bar.js";
import "./circular-genome-viewer/lib/gv-config.js";
import "./circular-genome-viewer/lib/genome-viewer.js";
import "./circular-genome-viewer/genome.js";
import "./circular-genome-viewer/circular-chromosome-widget.js";*/

// depends on genome-viewer
/*import "./core/data-adapter/feature/ensembl-adapter.js";
import "./core/data-adapter/feature/gtf-data-adapter.js";
import "./core/data-adapter/feature/obsolete/cellbase-adapter.js";
import "./core/data-adapter/feature/obsolete/das-adapter.js";
import "./core/data-adapter/feature/obsolete/opencga-adapter.js";
import "./core/data-adapter/feature/feature-template-adapter_backup.js";
import "./core/data-adapter/feature/bed-data-adapter.js";
import "./core/data-adapter/feature/bam-adapter.js";
import "./core/data-adapter/feature/gff3-data-adapter.js";
import "./core/data-adapter/feature/feature-data-adapter.js";
import "./core/data-adapter/feature/vcf-data-adapter.js";
import "./core/data-adapter/feature/gff2-data-adapter.js";
import "./core/data-source/string-data-source.js";
import "./core/data-source/data-source.js";
import "./core/data-source/tabular-data-adapter.js";
import "./core/data-source/url-data-source.js";
import "./core/data-source/file-data-source.js";*/

export {Utils} from "./core/utils.js";
