/* eslint-disable cypress/no-unnecessary-waiting */
/**
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

import {login, goTo, getResult, checkResults, checkResultsOrNot, selectToken} from "../plugins/utils.js";
import {TIMEOUT} from "../plugins/constants.js";

const timeout = 180000; // 3 mins
let ENABLED = false;

context("16.  RGA Browser", () => {
    before(() => {
        login();
        goTo("iva");

        // Check availability for current study
        /* cy.get("a[data-id=rga]", {timeout: TIMEOUT}).click({force: true});
        cy.get("rga-browser", {timeout: TIMEOUT}).then($comp => {
            if (!Cypress.$("tool-header[title='Recessive Variant Browser']", $comp).length) {
                cy.get("div.guard-page h3").contains("not enabled to Recessive Variant Analysis");
            } else {
                ENABLED = true;
            }
        });*/
    });

    beforeEach(() => {
        // TODO use beforeEach to check ENABLED?
        // return;
    });

    it("16.0 - RGA Check availability for current study", () => {
        cy.get("a[data-id=rga]", {timeout: TIMEOUT}).click({force: true});
        cy.get("rga-browser", {timeout: TIMEOUT}).then($comp => {
            if (!Cypress.$("tool-header[title='Recessive Variant Browser']", $comp).length) {
                cy.get("div.guard-page h3").contains("not enabled to Recessive Variant Analysis");
            } else {
                ENABLED = true;
            }
        });
    });

    it("16.1 - Variant View", () => {
        if (!ENABLED) {
            cy.log("RGA Variant View Test skipped");
            return;
        }
        cy.get("a[data-id=rga]", {timeout: TIMEOUT}).click({force: true});
        cy.get("div.page-title h2", {timeout: TIMEOUT}).should("be.visible").and("contain", "Recessive Variant Browser");
        cy.get("button[data-tab-id='variant-tab']", {timeout: TIMEOUT}).click({force: true});

        checkResults("rga-variant-view", timeout);

        // checks columns togglability
        cy.get("rga-variant-view > .container-fluid .columns-toggle-wrapper button").should("be.visible").and("contain", "Columns").click();
        cy.get("rga-variant-view > .container-fluid .columns-toggle-wrapper ul li").and("have.length.gt", 1);

        cy.get("rga-variant-view > .container-fluid .columns-toggle-wrapper ul li a").click({multiple: true, timeout: TIMEOUT}); // deactivate all the columns
        cy.get("rga-variant-view div[data-cy='variant-view-grid'] .bootstrap-table .fixed-table-container tr[data-index=0] > td", {timeout: TIMEOUT}).should("have.lengthOf", 0);

        cy.get("rga-variant-view > .container-fluid .columns-toggle-wrapper ul li a").click({multiple: true, timeout: TIMEOUT}); // reactivate all the columns
        cy.get("rga-variant-view div[data-cy='variant-view-grid'] .bootstrap-table .fixed-table-container tr[data-index=0] > td", {timeout: TIMEOUT}).should("have.length.gt", 1);

        cy.get("button.active-filter-label").click();
        cy.get("a[data-action='active-filter-clear']").click();

        checkResults("rga-variant-view", timeout);

        cy.get("variant-type-filter input[value='SNV'] + label").click({force: true});
        cy.get("div.search-button-wrapper button").click();
        checkResults("rga-variant-view", timeout);

        // variantId
        let variantId;
        getResult("rga-variant-view", 0).then(v => {
            variantId = v.trim().match(/\d+:\d+\s{2}\w+\/\w+/)[0];
            const [, pos, ref, alt] = v.trim().match(/(\d+:\d+)\s{2}(\w+)\/(\w+)/);
            cy.get("div[data-cy='variants'] input").type(pos + ":" + ref + ":" + alt);
            cy.get("div.search-button-wrapper button").click();
            checkResults("rga-variant-view", timeout);
            getResult("rga-variant-view", 0).then($resultCell => {
                cy.wrap($resultCell).should("contain", variantId);
            });
        });
        cy.get("opencga-active-filters button[data-filter-name='variants']").click();
        checkResults("rga-variant-view", timeout);


        // gene Name
        // queries for the first gene and then check if the first result contains the gene.
        let geneName = "";
        getResult("rga-variant-view", 1).then($text => {
            geneName = $text.split(",")[0];
            selectToken("feature-filter", geneName, true);
            cy.get("div.search-button-wrapper button").click();
            checkResults("rga-variant-view", timeout);
            getResult("rga-variant-view", 1).then($resultCell => {
                cy.wrap($resultCell).should("contain", geneName);
            });
        });

        cy.get("opencga-active-filters button[data-filter-name='geneName']").click();
        checkResults("rga-variant-view", timeout);

        // detail-tabs allele pairs table
        cy.get("rga-variant-view detail-tabs ul.nav-tabs > li > a").contains("Allele Pairs").click();
        checkResults("rga-variant-allele-pairs", timeout);
        getResult("rga-variant-allele-pairs", 0).then($resultCell => {
            // check the variant id stored before
            const variant = $resultCell.trim();
            cy.wrap(variant).should("contain", variantId.trim());
        });

        // detail-tabs Individuals table
        // 1. get the first individual out of Individual View
        // 2. use it to filter Variant View
        // 3. check individual to be present in variant-individual-grid
        cy.get("button[data-tab-id='individual-tab']", {timeout: TIMEOUT}).click({force: true});
        checkResults("rga-individual-view", timeout);
        let IndividualId= "";
        getResult("rga-individual-view", 0).then($text => {
            IndividualId = $text;
            cy.get("button[data-tab-id='variant-tab']", {timeout: TIMEOUT}).click({force: true});
            checkResults("rga-variant-view", timeout);
            selectToken("individual-id-autocomplete", IndividualId);
            cy.get("div.search-button-wrapper button").click();
            checkResults("rga-variant-view", timeout);

            checkResults("rga-variant-individual", timeout);
            getResult("rga-variant-individual", 0).then($resultCell => {
                cy.wrap($resultCell).should("contain", IndividualId);
            });

            cy.get("opencga-active-filters button[data-filter-name='individualId']").click(); // remove individual id
            cy.get("opencga-active-filters button[data-filter-name='type']").click(); // remove variant type

            checkResults("rga-variant-individual", timeout);
        });
    });

    it("16.2 - Individual View", () => {
        if (!ENABLED) {
            cy.log("RGA Individual View Test skipped");
            return;
        }
        cy.get("a[data-id=rga]", {timeout: TIMEOUT}).click({force: true});
        cy.get("div.page-title h2", {timeout: TIMEOUT}).should("be.visible").and("contain", "Recessive Variant Browser");
        cy.get("button[data-tab-id='individual-tab']", {timeout: TIMEOUT}).click({force: true});

        checkResults("rga-individual-view");

        cy.get("rga-individual-view .columns-toggle-wrapper button").should("be.visible").and("contain", "Columns").click();
        cy.get("rga-individual-view .columns-toggle-wrapper ul li").and("have.length.gt", 1);

        cy.get("rga-individual-view .columns-toggle-wrapper ul li a").click({multiple: true, timeout: TIMEOUT}); // deactivate all the columns
        cy.get("rga-individual-view div[data-cy='individual-view-grid'] .bootstrap-table .fixed-table-container tr[data-index=0] > td", {timeout: TIMEOUT}).should("have.lengthOf", 1);

        cy.get("rga-individual-view .columns-toggle-wrapper ul li a").click({multiple: true, timeout: TIMEOUT}); // reactivate all the columns
        cy.get("rga-individual-view div[data-cy='individual-view-grid'] .bootstrap-table .fixed-table-container tr[data-index=0] > td", {timeout: TIMEOUT}).should("have.length.gt", 1);

        selectToken("feature-filter", "CR1", true);
        cy.get("div.search-button-wrapper button").click();
        checkResults("rga-individual-view");

        // queries for the first gene and then check if the first result contains the gene.
        let IndividualId;
        getResult("rga-individual-view", 0).then($text => {
            IndividualId = $text;
            console.log("IndividualId i", IndividualId);
            selectToken("individual-id-autocomplete", IndividualId);
            cy.get("div.search-button-wrapper button").click();
            checkResults("rga-individual-view");

            getResult("rga-individual-view", 0).then($resultCell => {
                console.log("$resultCell", $resultCell);
                cy.wrap($resultCell).should("contain", IndividualId);

            });

            // check detail-tabs family table
            // ensure `IndividualId` is present in table header
            cy.get("rga-individual-family table > thead > :nth-child(1) > :nth-child(7) > .th-inner").contains(IndividualId);

        });
        cy.get("button.active-filter-label").click();
        cy.get("a[data-action='active-filter-clear']").click();
        checkResults("rga-individual-view");

    });

    it("16.3 - Gene View", () => {
        if (!ENABLED) {
            cy.log("RGA Gene View Test skipped");
            return;
        }
        cy.get("a[data-id=rga]", {timeout: TIMEOUT}).click({force: true});
        cy.get("div.page-title h2", {timeout: TIMEOUT}).should("be.visible").and("contain", "Recessive Variant Browser");
        cy.get("button[data-tab-id='gene-tab']", {timeout: TIMEOUT}).click({force: true});

        cy.get("rga-gene-view .columns-toggle-wrapper button").should("be.visible").and("contain", "Columns").click();
        cy.get("rga-gene-view .columns-toggle-wrapper ul li").and("have.length.gt", 1);

        cy.get("rga-gene-view .columns-toggle-wrapper ul li a").click({multiple: true, timeout: TIMEOUT}); // deactivate all the columns
        cy.get("rga-gene-view div[data-cy='gene-view-grid'] .bootstrap-table .fixed-table-container tr[data-index=0] > td", {timeout: TIMEOUT}).should("have.lengthOf", 0);

        cy.get("rga-gene-view .columns-toggle-wrapper ul li a").click({multiple: true, timeout: TIMEOUT}); // reactivate all the columns
        cy.get("rga-gene-view div[data-cy='gene-view-grid'] .bootstrap-table .fixed-table-container tr[data-index=0] > td", {timeout: TIMEOUT}).should("have.length.gt", 1);

        checkResults("rga-gene-view");

        // gene Name
        // queries for the first gene and then check if the first result contains the gene.
        let geneName;
        getResult("rga-gene-view", 0).then($text => {
            geneName = $text;
            selectToken("feature-filter", geneName, true);
            cy.get("div.search-button-wrapper button").click();
            checkResults("rga-gene-view");
            getResult("rga-gene-view", 0).then($resultCell => {
                cy.wrap($resultCell).should("contain", geneName);

            });
        });

        // knockoutType
        cy.get("div[data-cy='knockoutType'] button").click();
        cy.get("div[data-cy='knockoutType'] .dropdown-menu a").contains("Compound Heterozygous").click();
        cy.get("div[data-cy='knockoutType'] .dropdown-menu a").contains("Homozygous").click();
        cy.get("div.search-button-wrapper button").click();
        checkResults("rga-gene-view");

        // set numParents=2
        cy.get("div[data-cy='numParents'] .magic-checkbox-wrapper > :nth-child(3) > label").click();
        cy.get("div.search-button-wrapper button").click();
        checkResults("rga-gene-view");

        // checking the number of CH Definite is > 0 (the current query is geneName=XXX,knockoutType=COMP_HET,numParents=2)
        getResult("rga-gene-view", 3).then($CHDefiniteNum => {
            const CHDef = $CHDefiniteNum.trim() !== "-" ? Number($CHDefiniteNum) : 0;
            assert.isAtLeast(Number(CHDef), 0, "Results");
        });

        // cy.get("opencga-active-filters button[data-filter-name='knockoutType']").click();

        cy.get("button.active-filter-label").click();
        cy.get("a[data-action='active-filter-clear']").click();
        checkResults("rga-gene-view");

    });
});
