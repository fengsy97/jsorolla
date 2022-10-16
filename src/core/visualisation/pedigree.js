/*
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

import UtilsNew from "../utils-new.js";
import {SVG} from "../svg.js";


export default class Pedigree {

    constructor(pedigree, settings) {
        this.pedigree = pedigree;
        this.settings = settings;
    }

    isDuo() {
        return (typeof this.pedigree.father !== "undefined" || typeof this.pedigree.mother !== "undefined")
            && typeof this.pedigree.children !== "undefined" && this.pedigree.children.length === 1;
    }

    isTrio() {
        return typeof this.pedigree.father !== "undefined" && typeof this.pedigree.mother !== "undefined"
            && typeof this.pedigree.children !== "undefined" && this.pedigree.children.length === 1;
    }

    isFamily() {
        return typeof this.pedigree.father !== "undefined" && typeof this.pedigree.mother !== "undefined"
            && typeof this.pedigree.children !== "undefined" && this.pedigree.children.length > 1;
    }

    render(settings) {
        return this._render(this.pedigree, settings);
    }

    static renderFromPed(pedigree, settings) {
        return this._render(pedigree, settings);
    }

    _render(ped, set) {
        // We merge user's setting with default settings, by doing this users do not have to write al possible settings
        const settings = {...this.getDefaultSetting(), ...this.settings, ...set};

        let pedigree = this._preprocessFamily(ped);

        let svg = SVG.create("svg", {
            width: settings.width,
            height: settings.height,
            viewBox: "0 0 " + settings.width + " " + settings.height,
            style: "fill: white",
            xmlns: "http://www.w3.org/2000/svg"
        });

        if (settings.border) {
            SVG.addChild(svg, "rect", {width: settings.width, height: settings.height, style: "fill: white;stroke: black"});
        }

        svg.appendChild(this._createSvgDefs(pedigree, settings));

        let xCenter = settings.width / 2;
        let radius = settings.box / 2;

        // Draw the lines between parents and children
        if (pedigree.father || pedigree.mother) {
            let verticalBarOffset = 0;
            if (pedigree.father && pedigree.mother && (pedigree.father.partnerConsaguinity || pedigree.mother.partnerConsaguinity)) {
                verticalBarOffset = 2;
                SVG.addChild(svg, "line", {
                    x1: xCenter - settings.box, y1: 10 + radius - verticalBarOffset,
                    x2: xCenter + settings.box, y2: 10 + radius - verticalBarOffset,
                    style: "stroke: black;stroke-width: 2"
                });
                SVG.addChild(svg, "line", {
                    x1: xCenter - settings.box, y1: 10 + radius + verticalBarOffset,
                    x2: xCenter + settings.box, y2: 10 + radius + verticalBarOffset,
                    style: "stroke: black;stroke-width: 2"
                });

            } else {
                SVG.addChild(svg, "line", {
                    x1: xCenter - settings.box, y1: 10 + radius,
                    x2: xCenter + settings.box, y2: 10 + radius,
                    style: "stroke: black;stroke-width: 2"
                });
            }

            // Vertical bar for children
            SVG.addChild(svg, "line", {
                x1: xCenter, y1: 10 + radius + verticalBarOffset,
                x2: xCenter, y2: 10 + radius + (1.5 * settings.box),
                style: "stroke: black;stroke-width: 2"
            });
        }

        // Draw the FATHER
        if (pedigree.father) {
            // pedigree.father.sex = "male";
            this._addFamilyMember(pedigree.father, xCenter - 1.5 * settings.box, 10, settings.box, radius, settings.selectShowSampleNames, svg);
        }

        // Draw the MOTHER
        if (pedigree.mother) {
            // pedigree.mother.sex = "female";
            this._addFamilyMember(pedigree.mother, xCenter + 1.5 * settings.box, 10, settings.box, radius, settings.selectShowSampleNames, svg);
        }

        // Draw the CHILDREN
        if (pedigree?.children?.length > 0) {
            if (pedigree.children.length === 1) {
                this._addFamilyMember(pedigree.children[0], xCenter, 2 * settings.box + 10, settings.box, radius, settings.selectShowSampleNames, svg);
            } else {
                let numChildren = pedigree.children.length;
                let w = (numChildren + numChildren - 1) * settings.box;

                //svg.setAttribute("width", w * 2) // TODO recheck
                //svg.setAttribute("viewBox", "0 0 " + w + " 240")

                // Add horizontal bar
                SVG.addChild(svg, "line", {
                    x1: xCenter - w / 2, y1: 10 + radius + (1.5 * settings.box),
                    x2: xCenter + w / 2, y2: 10 + radius + (1.5 * settings.box),
                    style: "stroke: black;stroke-width: 2"
                });

                let left = xCenter - w / 2;
                let interval = w / (numChildren - 1);
                for (let i = 0; i < pedigree.children.length; i++) {
                    SVG.addChild(svg, "line", {
                        x1: left + (i * interval), y1: 10 + radius + (1.5 * settings.box),
                        x2: left + (i * interval), y2: 10 + radius + (1.5 * settings.box) + 15,
                        style: "stroke: black;stroke-width: 2"
                    });
                    this._addFamilyMember(pedigree.children[i], left + (i * interval), (1.5 * settings.box) + 15 + 10 + radius, settings.box, radius, settings.selectShowSampleNames, svg);
                }
            }
        }

        return svg;
    }

    _addFamilyMember(object, x, y, width, radius, showSampleNames, svg) {
        // No defined sex
        let memberSVG;
        if (typeof object.sex === "undefined" || object.sex === "undefined") {
            SVG.addChild(svg, "rect", {
                x: x - radius, y: y,
                width: width * 0.8, height: width * 0.8,
                transform: "translate(" + radius + ") rotate(45 " + (x - radius) + " " + (10 + radius + (1.5 * width) + y) + ")",
                style: "fill: " + object.colorPattern + ";stroke: black;stroke-width: 2"
            });
        } else {
            // Member is a male
            if (object.sex === "male" || object.sex === "MALE") {
                SVG.addChild(svg, "rect", {
                    x: x - radius,
                    y: y,
                    width: width,
                    height: width,
                    // fill: "url(#Pattern2)",
                    style: "fill: url(#" + object.colorPattern + ");stroke: black;stroke-width: 2"
                });
            } else {
                // Member is a female
                memberSVG = SVG.addChild(svg, "circle", {
                    cx: x, cy: y + radius,
                    r: radius,
                    style: "fill: url(#" + object.colorPattern + ");stroke: black;stroke-width: 2"
                });
            }
        }

        if ((typeof object.lifeStatus !== "undefined" && object.lifeStatus !== null) && object.lifeStatus.toUpperCase() === "DECEASED") {
            SVG.addChild(svg, "line", {
                x1: x - radius - 10, y1: y + radius + 30,
                x2: x + radius + 10, y2: y - radius + 10,
                style: "stroke: black;stroke-width: 2"
            });
        }

        if (showSampleNames) {
            let text = SVG.addChild(svg, "text", {
                x: x - radius + 2,
                y: y + width + 15,
                style: "fill: black;font-size:11px"
            });
            text.textContent = object.name;
        }

        // $(memberSVG).qtip({
        //     content: {text: "3:1000123:A:T: " + "<span style='font-weight: bold'>0/1</span>", title: object.member.name},
        //     position: {target: "mouse", adjust: {x: 25, y: 15}, effect: false},
        //     // position: {viewport: $(window), target: "mouse", adjust: {x: 25, y: 15}},
        //     style: {width: true, classes: "ui-tooltip ui-tooltip-shadow"},
        //     show: {delay: 300},
        //     hide: {delay: 300}
        // });
    }

    _preprocessFamily(fam) {
        // Create, edit and return a deep copy of the user object, this prevents us of modifying user's object
        let family = JSON.parse(JSON.stringify(fam));

        // refactored from pedigree-view
        if (family?.members?.length > 0) {
            family.members = family.members.map(member => {
                let father = null;
                let mother = null;
                if (member?.father?.id) {
                    father = family.members.find(ind => {
                        return ind.id === member.father.id;
                    }).id;
                }
                if (member?.mother?.id) {
                    mother = family.members.find(ind => {
                        return ind.id === member.mother.id;
                    }).id;
                }
                const disorders = member?.disorders?.map(disorder => disorder.id);
                return {
                    ...member,
                    father,
                    mother,
                    disorders: disorders

                };
            });
        }
        // /from pedigree-view

        let map = {};
        for (let m of family.members) {
            map[m.name] = m;
        }

        let colorMap = {};
        for (let idx in family.disorders) {
            colorMap[family.disorders[idx].id] = idx;
        }


        console.log(map);
        family.children = [];
        for (let m of family.members) {

            if (m.father || m.mother) {
                if (m.father) {
                    map[m.father].partner = m.mother;
                    map[m.father].partnerConsaguinity = m.parentalConsanguinity;
                }

                if (m.mother) {
                    map[m.mother].partner = m.father;
                    map[m.mother].partnerConsaguinity = m.parentalConsanguinity;
                }

                if (m.father && this._isOrphan(map[m.father])) {
                    family.father = map[m.father];
                }

                if (m.mother && this._isOrphan(map[m.mother])) {
                    family.mother = map[m.mother];
                }

                family.children.push(m);
            }

            // We save the corresponding disease color pattern for each sample
            if (m.disorders && m.disorders.length > 0) {
                let colorIdx = [];
                for (let c of m.disorders) {
                    colorIdx.push(colorMap[c]);
                }
                // Pattern suffix IDs must be sorted, eg. Pattern_01
                colorIdx = colorIdx.sort();
                m.colorPattern = "Pattern_" + colorIdx.join("");
            } else {
                m.colorPattern = "PatternWhite";
            }
        }
        return family;
    }

    // This function create the different color Patterns in a SVG 'defs' section
    _createSvgDefs(family, settings) {
        let svgDefs = SVG.create("defs");

        // Default color pattern when no disease exist
        let pattern = SVG.create("pattern", {id: "PatternWhite", x: 0, y: 0, width: 1, height: 1});
        let rect = SVG.create("rect", {
            x: 0, y: 0,
            width: settings.box, height: settings.box,
            fill: "white"
        });
        pattern.appendChild(rect);
        svgDefs.appendChild(pattern);

        // We create all possible combination (incrementally with no reptition, eg. 0, 01, 02, 1, 12, ...)
        for (let i = 0; i < family.disorders.length; i++) {
            // Add the single disease color, eg. 0, 1, 2
            let pattern = SVG.create("pattern", {id: "Pattern_" + i, x: 0, y: 0, width: 1, height: 1});
            let rect = SVG.create("rect", {
                x: 0, y: 0,
                width: settings.box, height: settings.box,
                fill: settings.colors[i]
            });
            pattern.appendChild(rect);
            svgDefs.appendChild(pattern);

            // Add the double disease color, eg. 01, 02, 12, ...
            for (let j = i + 1; j < family.disorders.length; j++) {
                let pattern = SVG.create("pattern", {id: "Pattern_" + i + j, x: 0, y: 0, width: 1, height: 1});
                let rect1 = SVG.create("rect", {
                    x: 0, y: 0,
                    width: settings.box / 2, height: settings.box,
                    fill: settings.colors[i]
                });
                let rect2 = SVG.create("rect", {
                    x: settings.box / 2, y: 0,
                    width: settings.box / 2, height: settings.box,
                    fill: settings.colors[j]
                });
                pattern.appendChild(rect1);
                pattern.appendChild(rect2);
                svgDefs.appendChild(pattern);
            }
        }

        return svgDefs;
    }

    _isOrphan(member) {
        return !member?.father?.id && !member?.mother?.id;
    }

    parseFamilyToPedigree(family) {
        let newMembers = family.members.map((member) => {
            let newMember = {};
            newMember.name = member.id;

            if (typeof member.disorders !== "undefined" && member.disorders.length > 0) {
                newMember.disorders = member.disorders.map((disorder) => {
                    return disorder.id;
                });
            }
            if (UtilsNew.isNotUndefinedOrNull(member.father) && UtilsNew.isUndefinedOrNull(member.father.id)) {
                newMember.father = member.father;
            }
            if (UtilsNew.isNotUndefinedOrNull(member.mother) && UtilsNew.isUndefinedOrNull(member.mother.id)) {
                newMember.mother = member.mother;
            }
            newMember.sex = member.sex;
            newMember.lifeStatus = member.lifeStatus;
            newMember.parentalConsanguinity = member.parentalConsanguinity;

            return newMember;
        });
        let pedigreFromFamily = {
            name: family.name,
            disorders: family.disorders,
            members: newMembers
        };

        this.pedigree = pedigreFromFamily;
    }

    pedigreeFromFamily(family, settings = null) {
        //this.parseFamilyToPedigree(family);
        return this.render(settings);
    }

    getDefaultSetting() {
        return {
            width: 600, //width is dynamic on the max number of siblings
            height: 240,
            box: 60,
            colors: ["black", "red", "blue"]
        };
    }

}
