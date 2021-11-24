export default class Lollipop {

    constructor(div, tracks, config) {
        this.canvasPadding = 0;
        this.canvasWidth = document.querySelector(div).clientWidth;
        this.outerCanvasWidth = this.canvasWidth + 50;
        this.tracks = tracks;

        this.proteinStart = 0;
        this.proteinEnd = 10000;

        this.draw = new SVG().addTo(div).size(this.canvasWidth, 500);

        this.currentTrackOffset = 0; // temp solution

        tracks.forEach(track => {
            this.renderTrack(track);
        });

        document.addEventListener("mouseup", e => {
            /* console.log("mouseup");
            mouseDown = false;
            this.resizeVariant(this.bar, e);*/
            this.clearTooltips();

        });

    }

    renderTrack(track) {
        switch (track.id) {
            case "positionBar":
                this.draw.size(this.outerCanvasWidth, this.currentTrackOffset + track.view.height);
                this.positionBarOrigin = this.currentTrackOffset;
                this.positionBarRender(track);
                this.currentTrackOffset += track.view.height;
                break;
            case "variants":
                // circle and line can have different coordinates (due to collisions)
                this.draw.size(this.outerCanvasWidth, this.currentTrackOffset + track.view.scaleHeight + track.view.variantAreaHeight);
                this.variantsOrigin = this.currentTrackOffset;
                track.view.height = track.view.scaleHeight + track.view.variantAreaHeight;
                this.variantsRender(track);
                this.currentTrackOffset += track.view.height;

                break;
            default:
                break;
        }
    }

    variantsRender(track, viewRange, redrawTicks = true) {

        [this.proteinStart, this.proteinEnd] = this.initProteinBoundaries(track);
        this.circles = this.preprocessData(track);

        if (this.variantsG) {
            this.variantsG.draggable(false);
            this.variantsG.off("dragstart");
            this.variantsG.off("dragend");
            this.variantsG.clear();
            this.scaleG.clear();
        } else {
            this.variantsG = this.draw.group().addClass("variants").transform({translateX: this.canvasPadding});
        }

        this.nodePadding = 1;// space between circles
        this.clusterFactor = .2; // cluster distance factor: merge 2 nodes if they overlap more than 80%

        // rescaling px to protein position
        // Only the variants within the position range are rendered
        if (viewRange) {
            this.viewRange = viewRange;
            const minProteinRange = this.rescaleLinear(this.viewRange[0], 0, this.canvasWidth, this.proteinStart, this.proteinEnd);
            const maxProteinRange = this.rescaleLinear(this.viewRange[1], 0, this.canvasWidth, this.proteinStart, this.proteinEnd);
            this.viewProteinRange = [minProteinRange, maxProteinRange];
        } else {
            this.viewRange = [0, this.canvasWidth];
            this.viewProteinRange = [this.proteinStart, this.proteinEnd];
        }

        this.scaleG = this.variantsG.group().addClass("scale").transform({translateX: -this.canvasWidth, translateY: this.variantsOrigin});
        // this.scaleG.rect(this.canvasWidth * 3 - this.canvasPadding, track.view.scaleHeight).attr({stroke: "#9d9d9d", fill: "#fff"});
        this.ticksWrapper = this.scaleG.group().transform({translateX: this.canvasWidth});
        this.ticksBackground = this.ticksWrapper.rect(this.canvasWidth - this.canvasPadding, track.view.scaleHeight).attr({
            "fill": "#fff",
            "stroke": "#9d9d9d",
            // "stroke-dasharray": `${this.canvasWidth}, ${track.view.scaleHeight}`,
        });
        this.drawTicks(this.ticksWrapper, 10, track.view.scaleHeight, this.viewProteinRange[0], this.viewProteinRange[1]);

        this.drawVariants(track);

        this.dragPos = [];
        // enable horizontal drag in variantArea only if this.viewProteinRange is different that default
        if (this.viewProteinRange[0] !== this.proteinStart && this.viewProteinRange[1] !== this.proteinEnd) {
            // this.variantsG.draggable(false);
            this.variantsG.off("dragstart");
            this.variantsG.off("dragend");
            this.variantsG.off("dragmove");
            this.variantsG
                .draggable()
                .on("dragstart", e => {
                    console.log("dragstart");
                    // console.log("dragstart", e.detail.event.offsetX)
                    this.dragPos[0] = e.detail.event.offsetX;
                    this.deltaPosStart = this.rescaleLinear(this.dragPos[0], 0, this.canvasWidth, this.viewProteinRange[0], this.viewProteinRange[1]);
                    // console.log("dragstart", e.detail.event.offsetX)

                })
                .on("dragend", e => {
                    console.log("dragend");
                    // NOTE dragend is fired called on simple click too
                    this.dragPos[1] = e.detail.event.offsetX;
                    const deltaPx = this.dragPos[1] - this.dragPos[0];
                    if (Math.abs(deltaPx) < 5) {
                        // avoid rescaling if delta is too small
                        return;
                    }
                    // we need to rescale delta in px in protein coords and in the (already reduced from full length) viewFrame
                    const deltaProtein = this.rescaleLinear(deltaPx, 0, this.canvasWidth, this.viewProteinRange[0], this.viewProteinRange[1]) - this.viewProteinRange[0];
                    const deltaView = this.rescaleLinear(deltaPx, 0, this.canvasWidth, this.viewRange[0], this.viewRange[1]) - this.viewRange[0];
                    // NOTE delta must be subtracted because a positive delta means the scale has been dragged to right
                    this.viewProteinRange[0] = this.viewProteinRange[0] - deltaProtein;
                    this.viewProteinRange[1] = this.viewProteinRange[1] - deltaProtein;

                    this.viewRange[0] = this.viewRange[0] - deltaView;
                    this.viewRange[1] = this.viewRange[1] - deltaView;
                    // this.resizeVariant(this.viewRange, delta);


                    console.log("this.viewRange", this.viewRange);
                    // this.drawVariants(track);
                    // FIX SCALE redraw and offset application (it must be idempotent)
                    this.variantsRender(track, [this.viewRange[0], this.viewRange[1]]);
                })
                .on("dragmove", e => {
                    e.preventDefault();
                    console.log("dragmove");
                    const {handler, box} = e.detail;
                    const deltaPx = e.detail.event.offsetX - this.dragPos[0];
                    const deltaProtein = this.rescaleLinear(deltaPx, 0, this.canvasWidth, this.viewProteinRange[0], this.viewProteinRange[1]) - this.viewProteinRange[0];
                    const deltaView = this.rescaleLinear(deltaPx, 0, this.canvasWidth, this.viewRange[0], this.viewRange[1]) - this.viewRange[0];
                    // console.log("deltaProtein", deltaProtein)
                    // console.log("deltaView", deltaView)
                    // TODO add constraints on proteinStart and proteinEnd
                    // e.preventDefault();
                    handler.move(box.x, null);
                });
        } else {
            this.variantsG.draggable(false);
            this.variantsG.off("dragstart");
            this.variantsG.off("dragend");
            this.variantsG.off("dragmove");

        }
        // const path = variantArea.path('M 50 50 150 150').stroke("#000").animate({delay: 2000}).plot('M 50 50 50 0')
    }

    drawVariants(track) {
        this.circles = this.filterVisible(this.circles);
        this.circles = this.prepareVariants(this.circles, track); // add viewPos, size (default) and offset (0)
        this.circles = this.clusterVariants(this.circles, track);
        const main = this.variantsG.group().addClass("variants-area-wrapper").transform({translateY: this.variantsOrigin + track.view.scaleHeight});
        const variantAreaWrapper = main.rect(this.outerCanvasWidth - this.canvasPadding * 2, track.view.variantAreaHeight).attr({fill: "#fff" /* stroke: "#9d9d9d"*/});
        const variantArea = main.group().addClass("variant-area").transform({translateX: this.canvasPadding});
        const variantAreaBackground = variantArea.rect(this.outerCanvasWidth - this.canvasPadding * 2, track.view.variantAreaHeight)
            .addClass("variant-area-background")
            .attr({fill: "#fff"})
            .transform({translateX: this.canvasPadding});
        const width = variantAreaWrapper.width();

        this.circles.forEach((variant, i) => {

            const v = variantArea.group()
                .addClass("variant")
                .attr({"text-anchor": "left"});
            // .transform({translateX: variant.viewPos, translateY: y});

            v.transform({translateX: variant.viewPos, translateY: track.view.height + variant.size});
            v.delay(i * 50);
            v.animate({duration: 500}).transform({translateX: variant.viewPos, translateY: track.view.height / 2}).ease(">");


            const edge = this.edge(v, variant, track.view.height / 2, variant.viewPos, variant.offset);

            const circleWrapper = v.group().addClass("circle-wrapper").attr({"text-anchor": "middle"});
            const circle = circleWrapper.circle(variant.size)
                .dx(-variant.size / 2 + variant.offset)
                .dy(-variant.size / 2)
                .fill(variant.color ?? "#6872ff")
                .stroke({color: "#000", opacity: 0})
                .scale(1);

            // .delay(i * 200)
            // .animate()
            // .size(size).dx(-size/2)*/;

            if (variant.type === "cluster") {
                circleWrapper.text(variant.variants.length).dy(variant.size*.1).dx(variant.offset).font({size: variant.size * .5 + "px"});
            } else {
                // single variant
                // const label = circleWrapper.text(`${variant.id}`).dy(-variant.size / 2 - 20).dx(variant.offset).font({size: "12px"});

                const label = circleWrapper.text(`${variant.id}`).dx(variant.offset).font({size: "12px"});
                label.rotate(-45).dx(variant.size * 2);
            }

            v.click(e => this.onClickVariantGroup(e, circle, variant, track));
            variant.domRef = circleWrapper;
            variant.domRefCircle = circle;
            variant.domRefEdge = edge;


        });
        this.layoutVariants(this.circles, track);
        this.updateVariants(track);

        this.log(null, null, null, this.viewRange, this.viewProteinRange, this.circles);

    }

    /*
     * Before the layout step, use the offset to move the nodes near the viewFrame boundaries to avoid them to be left out.
     */
    moveFromBoundaries(variants) {
        const boundaries = [0, this.canvasWidth];
        variants.forEach(el => {
            if (el.viewPos + el.offset - el.size / 2 < boundaries[0]) {
                el.offset = boundaries[0] + el.size / 2;
            }
            if (el.viewPos + el.size / 2 > boundaries[1]) {
                el.offset = -(el.viewPos - boundaries[1]) - el.size / 2;
            }
        });
        return variants;
    }

    updateVariants(track) {
        const height = (track.view.scaleHeight + track.view.variantAreaHeight) / 2;
        // TODO maybe use svg.js timeline
        const delay = this.circles.length * 100;
        this.circles.forEach((variant, i) => {
            variant.domRef.animate({delay, duration: 1000}).dx(variant.offset).ease("<");
            variant.domRefEdge.animate({delay, duration: 1000}).plot(`M ${0} ${height} V ${height * .5} L ${variant.offset} ${height * .4} V ${variant.size / 2 + 5}`);
        });
    }

    explodeCluster(node, track) {
        // NOTE variant is a cluster
        const height = (track.view.scaleHeight + track.view.variantAreaHeight) / 2;
        const delay = 100;
        if (node.exploded) {
            node.exploded = false;
            node.domRef.animate().dy(+node.size * 2).ease("<");
            node.domRefEdge.animate().plot(`M ${0} ${height} V ${height * .5} L ${node.offset} ${height * .4} V ${node.size / 2 + 5}`);
            node.domClusterRef.clear();
        } else {
            node.exploded = true;
            node.domRef.animate().dy(-node.size * 2).ease("<");
            node.domRefEdge.animate().plot(`M ${0} ${height} V ${height * .5} L ${node.offset} ${height * .4} V ${-node.size * 1.5 + 5}`);
            node.domClusterRef = node.domRef.group().addClass("cluster").transform({translateX: node.offset});

            // getting how many circles (radius r) can be drawn around a bigger circle (radius R):
            // n * arcsin(r/(R-r)) = PI
            // R - r must be > r => R > r*2
            const R = node.size * 2;
            const r = track.view.circleSize * .8;
            const n = Math.round((1 / (Math.asin(r / (R - r)))) * Math.PI);
            node.variants.slice(0, n).forEach((variant, i) => {
                const circleSectorAngle = i / node.variants.slice(0, n).length * Math.PI * 2;
                const radius = r * 1.8;
                node.domClusterRef.circle(1)
                    .dx(-r / 2) // variant.size
                    .dy(-r / 2)
                    // .dx(Math.cos(circleSectorAngle)*radius -variant.size/2)
                    // .dy(Math.sin(circleSectorAngle)*radius -variant.size/2)
                    .fill(variant.color ?? "#6872ff")
                    .animate({delay: 1000})
                    .dmove(
                        Math.cos(circleSectorAngle) * radius,
                        Math.sin(circleSectorAngle) * radius,
                    )
                    .size(r);


            });
        }
        // this.layoutVariants(this.circles, track);
        // this.updateVariants(track);
    }

    drawSubsection(g, gene, data, track) {
        const _start = this.rescaleLinear(data.start, this.proteinStart, this.proteinEnd, 0, this.canvasWidth);
        const _end = this.rescaleLinear(data.end, this.proteinStart, this.proteinEnd, 0, this.canvasWidth);
        const subsection = g.group().transform({translateX: _start}).attr({"text-anchor": "middle"});
        subsection.rect(_end - _start, track.view.positionBarHeight).attr({"fill": data.color ?? "#fff1e3", "fill-opacity": .4});
        subsection.text(gene).dy(track.view.positionBarHeight + 10).dx((_end - _start) / 2).font({size: "10px"});
    }

    positionBarRender(track) {
        if (this.bar) {
            this.bar.clear();
        } else {
            this.bar = this.draw.group().addClass("positionBar").transform({translateY: this.positionBarOrigin, translateX: this.canvasPadding}).attr({"shape-rendering": "crispedges"});
        }

        track.view.positionBarHeight = track.view.height - 10;
        this.bar.rect(this.canvasWidth, track.view.positionBarHeight).attr({fill: "#e3f2ff", stroke: "#000"});
        this.bar.rect(this.canvasWidth, 12).attr({fill: "#fff", stroke: "#000"}).y(track.view.positionBarHeight);

        // this.bar.draggable();
        Object.entries(track.genes).forEach(([geneName, data]) => {
            this.drawSubsection(this.bar, geneName, data, track);
        });

        this.drawTicks(this.bar, 10, track.view.positionBarHeight, this.proteinStart, this.proteinEnd);

        const cursorStart = this.bar.line(0, 0, 0, track.view.positionBarHeight).stroke({
            color: "#000",
            width: 0.2,
        }).attr({"shape-rendering": "crispEdges"});

        /* cursorStart.on('beforedrag', e => {
            console.log("cursorStart drag")
        })

        bar.on('beforedrag', e => {
            console.log("bar drag")
        })*/

        let mouseDown = false;

        const rangeBarWrapper = this.bar.group().addClass("range-bar");

        const rangeBar = rangeBarWrapper.rect(0, track.view.positionBarHeight).attr({"fill": "#a1a1a1", "stroke": "black", "fill-opacity": .4}).addClass("range");
        let rangeBarWidth = 0;
        const handleXPos = track.view.positionBarHeight/2 - 7;
        const handlePath = "M -4.5 0.5 L 3.5 0.5 L 3.5 15.5 L -4.5 15.5 L -4.5 0.5 M -1.5 4 L -1.5 12 M 0.5 4 L 0.5 12";
        const startHandle = rangeBarWrapper.path(handlePath)
            .stroke({color: "#636363", width: 1})
            .fill("#e7e7e7")
            .attr({shapeRendering: "crispEdges"})
            .y(track.view.positionBarHeight/2)
            .addClass("bar-handle");
        const endHandle = rangeBarWrapper.path(handlePath)
            .stroke({color: "#636363", width: 1})
            .fill("#e7e7e7")
            .attr({shapeRendering: "crispEdges"})
            .y(track.view.positionBarHeight/2)
            .addClass("bar-handle");


        this.bar.mousemove(e => {
            cursorStart.show();
            const dim = e.currentTarget.getBoundingClientRect();
            const mouseX = e.offsetX;
            if (mouseDown) {

                const start = (cursorStart.x() <= mouseX) ? cursorStart.x() : mouseX;
                const w = Math.abs(cursorStart.x() - mouseX);
                this.viewRange = [start, start + w];
                rangeBarWrapper.show();

                // avoids 0 width and > this.canvasWidth
                rangeBarWidth = Math.min(w + 1, this.canvasWidth);
                rangeBar.size(rangeBarWidth, track.view.positionBarHeight).move(start); // +1 is for avoid 0 range

                startHandle.move(start - 4, handleXPos); // the size of the handle is 8x15
                endHandle.move(start + w - 4, handleXPos);

            } else {
                cursorStart.move(mouseX + 1, 0);
            }

            this.log(cursorStart.x(), rangeBar.width(), mouseX, this.viewRange, this.viewProteinRange, this.circles);
        });

        rangeBarWrapper.draggable()
            .on("dragmove", e => {
                const {handler, box} = e.detail;
                e.preventDefault();
                let x;
                if (box.x < 10) {
                    x = 0; // avoid viewRange[0] < 0 and snap to 0 in case you are close to 0
                } else if (box.x > this.canvasWidth - rangeBarWidth - 10) {
                    x = this.canvasWidth - rangeBarWidth; // avoid viewRange[1] > this.canvasWidth and snap to it when you are close the limit
                } else {
                    x = box.x;
                }
                this.viewRange[0] = x;
                this.viewRange[1] = x + rangeBarWidth;
                handler.move(x - 4, null);
            });

        startHandle.draggable()
            .on("dragmove", e => {
                const {handler, box} = e.detail;
                e.preventDefault();
                let x;
                if (box.x < 10) {
                    x = 0; // avoid viewRange[0] < 0 and snap to 0 in case you are close to 0
                } else if (box.x > this.viewRange[1] - 12) {
                    x = this.viewRange[1] - 12; // avoid start > end
                } else {
                    x = box.x;
                }
                handler.el.cx(x);
                // handler.move(x - 4, handleXPos);
                this.viewRange[0] = x;
                rangeBarWidth = this.viewRange[1] - x;
                rangeBar.size(rangeBarWidth, track.view.positionBarHeight).move(x); // +4 is half of the size of the handle (on the startHandle)
            });

        endHandle.draggable()
            .on("dragmove", e => {
                const {handler, box} = e.detail;
                e.preventDefault();
                let x;
                if (box.x > this.canvasWidth - 10) {
                    x = this.canvasWidth; // avoid viewRange[1] > canvasWidth and snap to canvasWidth
                } else if (box.x < this.viewRange[0] + 12) {
                    x = this.viewRange[0] + 12; // avoid end < start
                } else {
                    x = box.x;
                }
                handler.el.cx(x);
                // handler.move(x - 4, handleXPos);
                this.viewRange[1] = x;
                rangeBarWidth = x - this.viewRange[0];
                rangeBar.size(rangeBarWidth, track.view.positionBarHeight);
            });

        this.bar.mouseout(e => {
            cursorStart.hide();
        });

        this.bar.mousedown(e => {
            console.log(e);
            mouseDown = true;
        });

        this.bar.mouseup(e => {
            mouseDown = false;
            console.log("single click", this.viewRange);
            this.resizeVariant(this.viewRange);
        });

        this.bar.dblclick(e => {
            e.preventDefault();
            console.log("db click");
            cursorStart.hide();
            rangeBarWrapper.hide();
            this.variantsG.draggable(false);
            this.variantsG.off("dragstart");
            this.variantsG.off("dragend");
            this.viewRange = [0, this.canvasWidth];
            this.resizeVariant(this.viewRange);

        });


    }

    prepareVariants(variants, track) {
        const _variants = [...variants].sort((a, b) => a.pos - b.pos);
        return _variants.map(variant => {
            return {
                ...variant,
                size: track.view.circleSize,
                viewPos: this.rescaleLinear(variant.pos, this.viewProteinRange[0], this.viewProteinRange[1], 0, this.canvasWidth),
                offset: 0,
            };
        });
    }

    initProteinBoundaries(track) {
        // return [41193423,41195811]
        const minPos = Math.min(...track.variants.map(variant => variant.start));
        const maxPos = Math.max(...track.variants.map(variant => variant.start));
        return [minPos, maxPos];
    }

    preprocessData(track) {
        // TODO remove this once data model is defined
        return track.variants.map((variant, i) => ({id: i+"_"+variant.id.slice(0, 8), pos: variant.start}));
    }

    filterVisible(variants) {
        return variants.filter(variant => {
            return variant.pos >= this.viewProteinRange[0] && variant.pos <= this.viewProteinRange[1];
        });
    }

    /*
     * return the object in the structure expected for the plot (either a single variant or a cluster)
    */
    clusterVariants(variants, track) {
        const addResult = (pool, offset) => {

            if (pool.length > 1) {
                const id = pool[0].id + "_" + pool[pool.length - 1].id;
                const poolPos = pool.reduce((acc, curr) => curr.pos + acc, 0) / pool.length; // unweighted avg linkage
                const variantViewFramePos = this.rescaleLinear(poolPos, this.viewProteinRange[0], this.viewProteinRange[1], 0, this.canvasWidth);
                return {
                    id: "cluster_" + id,
                    viewPos: variantViewFramePos,
                    pos: poolPos,
                    variants: [...pool],
                    type: "cluster",
                    size: Math.min((Math.log(pool.length) * 10) + track.view.circleSize, track.view.circleSize * 5), // max size is 3 times default
                    offset: 0,
                    exploded: false,
                };
            } else {
                return {...pool[0], type: "variant"};
            }
        };


        const circles = [];
        const _variants = [...variants].sort((a, b) => a.pos - b.pos);
        let pool = [];
        let poolViewFramePos = 0;
        _variants.forEach(variant => {
            // 1. check and generate clusters (dynamic on current viewFrame). Collision detection to get what circle to merge
            // 2. calculate x coordinate (keeping original and new). Collision detection to get where to render the circles

            // convert original gene position into viewFrame position
            // const variantViewFramePos = this.rescaleLinear(variant.pos, this.viewFrame[0], this.viewFrame[1], 0, this.canvasWidth);

            const clusteringMaxDistance = poolViewFramePos + variant.size * this.clusterFactor;
            if (!pool.length) {
                pool.push(variant);
                poolViewFramePos = variant.viewPos;
            } else {
                if (variant.viewPos < clusteringMaxDistance) {
                    pool.push(variant);
                    poolViewFramePos = (poolViewFramePos + variant.viewPos) / 2;
                } else {
                    circles.push(addResult(pool));
                    pool = [variant];
                    poolViewFramePos = variant.viewPos;

                }
            }
        });

        // TODO temp solution. there is still something in the pool
        if (pool.length) {
            circles.push(addResult(pool));
        }

        // CHECK if the current solution satisfies the frame constraints (the sum of the diameter of the circles + padding is < of this.canvasWidth)
        // this will avoid an infinite loop in layoutVariants() (which would keep moving nodes left around without solving collisions)
        const totalWidth = circles.reduce((acc, curr) => acc+curr.size, 0) + this.nodePadding * circles.length;
        if (totalWidth < this.canvasWidth) {
            return circles;
        } else {
            this.clusterFactor += .1;
            console.warn("no layout solution available with the current clusterFactor, incrementing factor", this.clusterFactor);
            return this.clusterVariants(variants, track);
        }
    }


    /*
     *
     * NOTE: layoutVariants() have to be iterative, circles can be moved more than once (the offset can be negative and a circle can collide with the previous one)
     * NOTE: we preemptively check if a solution exists with the current boundaries (clusterFactor and canvasWidth)
     * // TODO in progress
     */
    layoutVariants(circles, track) {

        this.circles = this.moveFromBoundaries(this.circles);

        // to detect infinite loops in layout
        // this.loopDetector = {};

        let i = 0;
        // eslint-disable-next-line no-constant-condition
        while (true) {
            console.log("i", i++);
            // console.log("it", i++);
            const state = this.moveIntersected(this.circles, i++);
            if (state === -1) {
                // increase cluster distance
                console.error("no solution");
                break;
            }
            if (state === 0) {
                // console.log("collision solved")
                break;
            }
        }
    }

    // returns false until either collision are solved or there is no valid solution
    moveIntersected(arr = [], it = 0) {
        // hard stop
        /* if (it > 20000) {
            console.error(it, " iteration exceeded");
            return -1;
        } */

        const boundaries = [0, this.canvasWidth];

        const step = 1;
        const collisions = this.detectCollisions(arr);

        if (collisions.length < 1 /* || it > 30*/) {
            return 0;
        }

        const mostIntersected = collisions.sort((a, b) => a[1] - b[1])[0];

        const left = arr[Math.floor(mostIntersected[0])];
        const right = arr[Math.ceil(mostIntersected[0])];

        // check left boundary
        // console.log(`${left.viewPos} ${left.offset} ${left.size}`);
        if ((left.viewPos + left.offset) - (left.size) - step >= boundaries[0]) {
            left.offset -= step;
        } else {
            right.offset += step * 2;
        }

        // check right boundary
        if ((right.viewPos + right.offset) + (right.size) + step <= boundaries[1]) {
            right.offset += step;
        } else {
            left.offset -= step * 2;
        }

        /* const k = `${mostIntersected[0]} ${right.offset}-${left.offset}`;
        if (this.loopDetector[k]) {
            this.loopDetector[k] += 1;
            if (this.loopDetector[k] > 30) {
                console.error("K present > 3", k);
                // return -1;
            }
        } else {
            this.loopDetector[k] = 1;
        }*/

        // this.moveIntersected(arr, it+1);
        return 1;


    }

    detectCollisions(arr = []) {

        const result = [];
        for (let i = 0; i < arr.length - 1; i++) {

            // compare pairs of nodes
            const rightNodePos = (arr[i + 1].viewPos + arr[i + 1].offset) - (arr[i + 1].exploded ? arr[i + 1].size * 1.9 : arr[i + 1].size / 2);
            const leftNodePos = (arr[i].viewPos + arr[i].offset) + (arr[i].exploded ? arr[i].size * 1.9 : arr[i].size / 2);
            const dist = rightNodePos - leftNodePos;
            if (dist < this.nodePadding) {
                result.push([i + 0.5, dist]);
            }
            // TODO improve boundary detect collision [0, 1000]
        }
        return result;
    }


    onClickVariantGroup(e, circle, variant, track) {
        console.log(e);
        console.log(circle);
        console.log(variant);

        // at the moment, in order to avoid overlaps, 1 node can be exploded at a time
        this.circles.forEach(circle => {
            if (circle.type === "cluster" && (circle.exploded || circle.id === variant.id)) {
                this.explodeCluster(circle, track);
            }
        });
        /* if (variant.type === "cluster") {
            this.explodeCluster(variant, track);
        }*/

        // circle.animate().ease(SVG.easing.beziere(10,20,30,40)).scale(1.1);

        /* this.clearTooltips();
        const tooltip = parent.group().addClass("tooltip");

        tooltip.text("Tooltip").font({size: "20px"});
        // tooltip.path("M 0 0 A 93 100 0 1 1 50 100").fill("none").stroke("#000")
        tooltip.circle(20).fill("none").stroke("#000");


        tooltip.animate({
            duration: 100,
            delay: 0,
            when: "now",
            swing: true,
            times: 1,
            wait: 200
        }).ease("<>").scale(2);*/


        // variantData.active = !variantData.active;

    }

    clearTooltips() {
        SVG.find(".tooltip").remove();
    }

    edge(parent, circle, height, position, offset) {
        // path is drawn from bottom to top
        // last 30 is last point of the path


        return parent.path(`M ${0} ${height} V ${height * .5} L ${offset} ${height * .4} V ${circle.size / 2 + 5}`)
            .fill("none")
            .addClass("edge-animate")
            .stroke(circle.color ?? "#000");
    }

    /*
     * Draw the ticks of the progressBar track and the scale in Variants track
     * @param {SVGElement} g parent group
     * @param {Number} num Number of major ticks
     * @param {Number} barHeight height of the bar
     * @param {Number} startPos Original start position
     * @param {Number} endPos Original end position
     * @returns void
     */
    drawTicks = (g, num, barHeight, startPos, endPos) => {
        // g.replace(this.draw.group().addClass("scale").transform({translateY: this.currentTrackOffset}))
        // document.querySelector(".scale")
        const tickHeight = barHeight * .2; // * 0.2;
        const w = this.canvasWidth;
        const tickSpace = w / num;
        const x = 0;
        const y = 0;
        for (let i = 0; i <= num; i++) {
            const group = g.group().addClass("tick").attr({"text-anchor": "middle"}).transform({translateX: tickSpace * i});
            const position = this.rescaleLinear(i, 0, num, startPos, endPos); // reverse normalisation

            // skip position regative and > of the area of interest
            if (position < 0 || position > this.proteinEnd) {
                continue;
            }
            // not rendering the first and last major tick
            // if (i !== 0 && i !== num) {
            group.line(0, barHeight - tickHeight, 0, barHeight).stroke({
                color: "#000",
                width: 1,
            }).attr({shapeRendering: "crispEdges", z: 120});

            group.text(position).dy(barHeight - tickHeight - 2).font({size: "10px"}).attr({z: 120});
            // }

            // minor tick
            group.line(0, barHeight - tickHeight / 2, 0, barHeight)
                .stroke({
                    color: "#000",
                    width: 1,
                })
                .attr({shapeRendering: "crispEdges", z: 120})
                .dx(-tickSpace / 2);


        }
    };

    resizeVariant(newViewRange, delta = 0) {
        console.log("resize");
        const minScreen = 0;
        const maxScreen = this.canvasWidth;
        const minProtein = this.proteinStart;
        const maxProtein = this.proteinEnd;
        const minOldRange = this.viewRange[0];
        const maxOldRange = this.viewRange[1];
        const newMinRange = this.rescaleLinear(minOldRange, minScreen, maxScreen, minProtein, maxProtein);
        const newMaxRange = this.rescaleLinear(maxOldRange, minScreen, maxScreen, minProtein, maxProtein);

        console.log("new this.viewRange", this.viewRange);
        this.variantsRender(this.tracks.find(t => t.id === "variants"), [newViewRange[0], newViewRange[1]]); // TODO temp solution
    }

    variant(data) {

    }

    // min-max normalization
    rescaleLinear(value, oldMin, oldMax, newMin, newMax) {
        const oldRange = oldMax - oldMin;
        const newRange = newMax - newMin;
        const rescaled = newMin + ((value - oldMin) * newRange / oldRange);
        return Math.round(rescaled);
    }

    log(start, range, mouseX, viewRange, viewProteinRange, nodes = []) {
        document.querySelector("#console").innerHTML = `
            start:  ${start}
            mouseX (end): ${mouseX}
            range:  ${range}
            viewRange: ${viewRange}
            viewProteinRange: ${viewProteinRange}
            nodes: ${nodes.map(_ => _.id).join(" ")}
        `;
    }

}

class Variant {

    constructor() {

    }

}
