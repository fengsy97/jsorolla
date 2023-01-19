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

import {login, goTo, randomString, checkResults, selectToken} from "../../plugins/utils.js";
import {TIMEOUT} from "../../plugins/constants.js";


context("6. Case Portal", () => {
    before(() => {
        login();
        goTo("iva");
    });

    it("6.1 - check query results", () => {
        cy.get("a[data-id=clinicalAnalysisPortal]", {timeout: TIMEOUT}).click({force: true});
        cy.get("div.page-title h2", {timeout: TIMEOUT}).should("be.visible").and("contain", "Case Portal");
        checkResults("clinical-analysis-grid");
    });

    it("6.2 - Filter: caseId", () => {
        // reading from the first row the case Id, the proband Id, and the Family Id and use them as filters
        cy.get("clinical-analysis-grid .bootstrap-table .fixed-table-container tr[data-index=0]", {timeout: TIMEOUT})
            .find("td:nth-child(1) a[data-cy='case-id']")
            .then($a => {
                const caseId = $a.text().trim();
                selectToken("div[data-cy='form-case']", caseId);
                checkResults("clinical-analysis-grid");

            });
    });

    it("6.3 - Filter: Proband Sample Id", () => {
        cy.get("clinical-analysis-grid .bootstrap-table .fixed-table-container tr[data-index=0]", {timeout: TIMEOUT})
            .find("td:nth-child(2) p[data-cy='proband-sample-id']").first()
            .then($p => {
                const probandSampleId = $p.text().trim();
                console.log("probandSampleId", probandSampleId);
                selectToken("div[data-cy='form-sample']", probandSampleId);
                checkResults("clinical-analysis-grid");

            });
    });

    it("6.4 - Filter: Proband Id", () => {
        cy.get("clinical-analysis-grid .bootstrap-table .fixed-table-container tr[data-index=0]", {timeout: TIMEOUT})
            .find("td:nth-child(2) span[data-cy='proband-id']")
            .then($span => {
                const probandId = $span.text().trim();
                console.log("probandId", probandId);
                selectToken("div[data-cy='form-proband']", probandId);
                checkResults("clinical-analysis-grid");

            });
    });

    it("6.5 - Filter: Disorder name", () => {
        // check whether there is a disorder-name, then it tests the filter itself (Cancer studies (type=SINGLE) doesn't have disorder names)
        cy.get("clinical-analysis-grid .bootstrap-table .fixed-table-container tr[data-index=0]", {timeout: TIMEOUT})
            .find("td:nth-child(4)")
            .then($td => {
                const span = Cypress.$("span[data-cy='disorder-name']", $td).first();
                const disorderName = span.text().trim();
                console.log("disorderName", disorderName);
                if (disorderName) {
                    selectToken("div[data-cy='form-disorder']", disorderName);
                    checkResults("clinical-analysis-grid");
                }
            });
    });

    it("6.6 - Filter: Family Id", () => {
        // check whether there is a family-id, then it tests the filter itself (Cancer studies doesn't have family ids)
        cy.get("clinical-analysis-grid .bootstrap-table .fixed-table-container tr[data-index=0]", {timeout: TIMEOUT})
            .find("td:nth-child(3)")
            .then($td => {
                const spans = Cypress.$("span[data-cy='family-id']", $td);
                if (spans.length) {
                    const familyId = spans.first().text().trim();
                    // console.log("familyId", familyId);
                    selectToken("div[data-cy='form-family']", familyId);
                    checkResults("clinical-analysis-grid");
                }
            });
    });

    it("6.7 - Filter: Priority Id", () => {
        // check whether priority filter is enabled and visible first, then it tests the filter itself
        cy.get("div.lhs", {timeout: 5000}).then($wc => {
            if (Cypress.$("div[data-cy='form-priority']", $wc).length) {
                cy.get("clinical-analysis-grid .bootstrap-table .fixed-table-container tr[data-index=0]", {timeout: TIMEOUT})
                    .find("td:nth-child(7) span.label").then($span => {
                        const priority = $span.text().trim();
                        // console.error("priority", priority);
                        cy.get("div[data-cy='form-priority'] button").click();
                        cy.get("div[data-cy='form-priority'] ul.dropdown-menu li").contains(priority).click({force: true});
                        checkResults("clinical-analysis-grid");
                    });
            }
        });
        cy.get("button[data-cy='filter-button']").click({force: true});
        cy.get(".saved-filter-wrapper a").contains("Clear").click({force: true});

    });


    it("6.2 - Columns Visibility", () => {
        cy.get("a[data-id=clinicalAnalysisPortal]", {timeout: TIMEOUT}).click({force: true});
        cy.get("div.page-title h2", {timeout: TIMEOUT}).should("be.visible").and("contain", "Case Portal");


        cy.get("clinical-analysis-grid .columns-toggle-wrapper button").should("be.visible").and("contain", "Columns").click();
        cy.get("clinical-analysis-grid .columns-toggle-wrapper ul li").should("have.length.gt", 1);


        cy.get("clinical-analysis-grid .columns-toggle-wrapper ul li a").click({multiple: true, timeout: TIMEOUT}); // deactivate all the columns
        cy.get("clinical-analysis-grid .bootstrap-table .fixed-table-container tr[data-index=0]", {timeout: TIMEOUT}).find("td", {timeout: TIMEOUT}).should("have.lengthOf", 1);

        cy.get("clinical-analysis-grid .columns-toggle-wrapper ul li a").click({multiple: true, timeout: TIMEOUT}); // reactivate all the columns
        cy.get("clinical-analysis-grid .bootstrap-table .fixed-table-container tr[data-index=0]", {timeout: TIMEOUT}).find("td", {timeout: TIMEOUT}).should("have.length.gt", 1);


    });

});

/* cy.get("variant-browser-grid .columns-toggle-wrapper ul li a").each(($li, index, $lis) => {
    //Cypress.$("a", $li)
});*/
