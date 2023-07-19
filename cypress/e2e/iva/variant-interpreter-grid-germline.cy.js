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


import UtilsTest from "../../support/utils-test.js";
import BrowserTest from "../../support/browser-test.js";


context("Variant Interpreter Grid Germiline", () => {
    const browserInterpreterGrid = "variant-interpreter-grid";

    beforeEach(() => {
        // cy.intercept("#variant-interpreter-grid-germline").as("getBrowserGrid") //Not Working
        cy.visit("#variant-interpreter-grid-germline")
        cy.waitUntil(() => cy.get(browserInterpreterGrid).should("be.visible"))
        // cy.wait("@getBrowserGrid") // Not working
    });

    context("Grid", () => {
        it("Should be render variant-interpreter-grid", () => {
            cy.get(browserInterpreterGrid).should("be.visible")
        })

        it("Should change page variant-interpreter-grid", () => {
            UtilsTest.changePage(browserInterpreterGrid,2)
            UtilsTest.changePage(browserInterpreterGrid,3)
        })
    })

    context("Tooltip",() => {
        it("Check variant tooltip", () => {
            BrowserTest.getColumnIndexByHeader("id")
            cy.get("@indexColumn").then(index => {
                cy.get("tbody tr:first > td").eq(index).within(() => {
                    cy.get("a").trigger("mouseover")
                })
                cy.get(".qtip-content").should('be.visible')
            })
        })

        it("Check gene", () => {
            BrowserTest.getColumnIndexByHeader("gene")
            cy.get("@indexColumn").then(indexColumn => {
                cy.get("tbody tr:first > td").eq(indexColumn).within(() => {
                    cy.get("a").eq(0).trigger("mouseover")
                })
                cy.get(".qtip-content").should('be.visible')
            })
        })

        it("Check Sample Genotype (Variant Call Information)", () => {
            BrowserTest.getColumnIndexByHeader("consequenceType")
            cy.get("@indexColumn").then(indexColumn => {
                cy.get("tbody tr:first > td").eq(indexColumn).within(() => {
                    cy.get("a").eq(0).trigger("mouseover")
                })
                cy.get(".qtip-content").should('be.visible')
            })
        })

        it("Check Cohort Stats (Population Frequencies)", () => {
            cy.get("tbody tr:first > td").eq(8).within(() => {
                cy.get("a").trigger("mouseover")
            })
            cy.get(".qtip-content").should('be.visible')
        })

        it("Check Reference population frequencies", () => {
            cy.get("tbody tr:first > td").eq(9).within(() => {
                cy.get("a").trigger("mouseover")
            })
            cy.get(".qtip-content").should('be.visible')
        })

        it("Check ACMG Prediction (Classification)", () => {
            cy.get("tbody tr:first > td").eq(14).within(() => {
                cy.get("a").trigger("mouseover")
            })
            cy.get(".qtip-content").should('be.visible')
        })
    })

    context("Helpers", () => {

        it("Check Deleteriousness column", () => {
            cy.get("thead th").contains("div","Deleteriousness").within(() => {
                cy.get("a").trigger("mouseover")
            })
            cy.get(".qtip-content").should('be.visible')
        })

        it("Check Reference Population Frequencies column", () => {
            cy.get("thead th").contains("div","Reference Population Frequencies").within(() => {
                cy.get("a").trigger("mouseover")
            })
            cy.get(".qtip-content").should('be.visible')
        })

        it("Check Clinical Info column", () => {
            cy.get("thead th").contains("div","Clinical Info").within(() => {
                cy.get("a").trigger("mouseover")
            })
            cy.get(".qtip-content").should('be.visible')
        })

        it("Check Interpretation column", () => {
            cy.get("thead th").contains("div","Interpretation").within(() => {
                cy.get("a").trigger("mouseover")
            })
            cy.get(".qtip-content").should('be.visible')
        })
    })

    context("Row", () => {
        it("Row: Copy Variant Json", () => {
            cy.get("tbody tr:first > td").eq(17).within(() => {
                cy.get("button").click()
                cy.get("ul[class='dropdown-menu dropdown-menu-right']")
                    .contains("a","Copy JSON")
                    .click()
                UtilsTest.assertValueCopiedToClipboard().then(content => {
                    const dataClipboard = JSON.parse(content);
                    expect(dataClipboard.id).eq("1:187378:A:G")
                    expect(dataClipboard.type).eq("SNV")
                })
            })
        })

        it("Row: Download Variant Json", () => {
            cy.get("tbody tr:first > td").eq(17).within(() => {
                cy.get("button").click()
                cy.get("ul[class='dropdown-menu dropdown-menu-right']")
                    .contains("a","Download JSON")
                    .click()
                cy.readFile("cypress/downloads/1_187378_A_G.json")
                    .should("exist")
            })
        })

        it.skip("Row: External Links", () => {
            cy.get("tbody tr:first > td").eq(17).within(() => {
                cy.get("button").click()
                cy.get("ul[class='dropdown-menu dropdown-menu-right']")
                    .contains("a","Ensembl Genome Browser").click()
            })
        })
    })

});
