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

const endpoints = [
    "Users", "Projects", "Studies", "Files", "Jobs", "Samples", "Individuals", "Families", "Cohorts", "Disease Panels",
    "Analysis - Alignment", "Analysis - Variant", "Analysis - Clinical", "Operations - Variant Storage", "Meta", "GA4GH", "Admin"
];

context("15 - Rest API", () => {
    before(() => {
        login();
        goTo("iva");
    });

    it("15.0 - Check existence and order of endpoints", () => {
        cy.get("a[data-user-menu='rest-api']").click({force: true});

        cy.get("div[data-cy=rest-api-endpoints] .panel-title").each((item, i) => {
            cy.wrap(item).should("contain.text", endpoints[i]);
        });
    });
});
