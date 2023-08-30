/**
 * Copyright 2015-2023 OpenCB
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

import UtilsTest from "../../support/utils-test.js";
import BrowserTest from "../../support/browser-test.js";

context("Cohort Browser Grid", () => {
    const browserGrid = "cohort-grid";
    const browserDetail = "cohort-detail";

    beforeEach(() => {
        cy.visit("#cohort-browser-grid");
        cy.waitUntil(() => {
            return cy.get(browserGrid)
                .should("be.visible");
        });
    });

    context("Grid", () => {
        it("should render", () => {
            cy.get(browserGrid)
                .should("be.visible");
        });

        it("should change page", () => {
            UtilsTest.changePage(browserGrid,2);
            UtilsTest.changePage(browserGrid,3);
        });

        it("should move modal setting", () => {
            cy.get("button[data-action='settings']")
                .click()

            cy.get('cohort-grid opencb-grid-toolbar')
                .then($element => {
                const prefix = $element.prop('_prefix');
                cy.get(`div[id='${prefix}SettingModal']`).as("settingModal");

                cy.get("@settingModal")
                    .then(($modal) => {
                        const startPosition = $modal.position()
                        // Drag the modal to a new position using Cypress's drag command
                        cy.get("@settingModal")
                            .find('.modal-header')
                            .trigger('mousedown', { which: 1 }) // Trigger mouse down event
                            .trigger('mousemove', { clientX: 100, clientY: 100 }) // Move the mouse
                            .trigger('mouseup') // Release the mouse

                        // Get the final position of the modal
                        cy.get(`@settingModal`)
                            .find('.modal-header')
                            .then(($modal) => {
                                const finalPosition = $modal.position();
                                // Assert that the modal has moved
                                expect(finalPosition.left).to.not.equal(startPosition.left);
                                expect(finalPosition.top).to.not.equal(startPosition.top);
                    });
                });
            });
        })
    });

    context("Row", () => {
        it("should display row #3 as selected", () => {
            // eslint-disable-next-line cypress/unsafe-to-chain-command
            cy.get("tbody tr")
                .eq(3)
                .click()
                .should("have.class","success");
            });
    });

    context("extension", () => {
        it("should display 'Extra Column' column", () => {
            cy.get("thead th")
                .contains("Extra column")
                .should('be.visible');
        });

        it("should display 'New Catalog Tab' Tab", () => {
            // eslint-disable-next-line cypress/unsafe-to-chain-command
            cy.get(`detail-tabs > div.detail-tabs > ul`)
                .find("li")
                .contains("New Catalog Tab")
                .click()
                .should('be.visible');
        });
    });

    context("detail tab", () => {
        it("should render", () => {
            cy.get(browserDetail)
                .should("be.visible");
        });

        it("should display info from the selected row",() => {
            BrowserTest.getColumnIndexByHeader("Cohort ID")
            cy.get("@indexColumn")
                .then((indexColumn) => {
                    const indexRow = 2
                    // eslint-disable-next-line cypress/unsafe-to-chain-command
                    cy.get(`tbody tr`)
                        .eq(indexRow)
                        .click() // select the row
                        .find("td")
                        .eq(indexColumn)
                        .invoke("text")
                        .as("textRow")
                    });

            cy.get("@textRow")
                .then((textRow) => {
                    cy.get("detail-tabs > div.panel")
                        .invoke("text")
                        .then((text) => {
                            const textTab = text.trim().split(" ");
                            expect(textRow).to.equal(textTab[1].trim());
                        });
                });
        });

        it("should display 'JSON Data' Tab", () => {
            // eslint-disable-next-line cypress/unsafe-to-chain-command
            cy.get(`detail-tabs > div.detail-tabs > ul`)
                .find("li")
                .contains("JSON Data")
                .click()
                .should('be.visible');
        });
    });
});
