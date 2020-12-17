import mergeImages from 'merge-images';

import Utils from "../utils";

export default class Node {

    constructor(nodeData = null) {
        if (Utils.isNotNullOrUndefined(nodeData)) {
            this.id = nodeData.id.replace(/(\.)|(,)/g, '_');
            this.title = nodeData.title;
            this.ardisId = nodeData.ardisId;
            this.subnodeIdList = nodeData.subnodeIDList;
            this.avatarOriginal = Utils.getNodeImage(nodeData);
            this.avatar = Utils.getNodeImage(nodeData);
            this.avatarMerged = Utils.getNodeImage(nodeData);
            this.hasImage = !Utils.isNullOrUndefined(nodeData.image);
            this.pie = null;
            this.endpoint = !Utils.isNullOrUndefined(nodeData.endpoint) ? true : false;
            this.b64 = '';
            this.type = nodeData.nodeType;
            this.fromFirstLayer = false;
            this.isMainNode = nodeData.isMainNode;
            this.parentPos = Utils.isNotNullOrUndefined(nodeData.parentPos) ? {
                x: nodeData.parentPos.x,
                y: nodeData.parentPos.y
            } : {x: Math.random() * 1000, y: Math.random() * 1000};
            this.moreRelation = Utils.isNullOrUndefined(nodeData.moreRelations) ? null : nodeData.moreRelations;
            this.category = Utils.isNullOrUndefined(nodeData.category) ? null : nodeData.category.map(item => {
                let newItem = item.startsWith("#") ? item.substr(1) : item;
                if (newItem.toLowerCase().startsWith("shareholding")) newItem = "shareholding";
                return newItem.toLowerCase();
            });
            this.filterEles = this.category || [];

            Object.keys(nodeData).forEach((dataKey) => {
                if (dataKey == 'pie') {

                    if (Utils.isNullOrUndefined(this.pie)) {
                        this.pie = {};
                    }
                    this.pie = nodeData[dataKey];
                    let pieKeys = Object.keys(nodeData[dataKey]);
                    this.filterEles = this.filterEles.concat(pieKeys);

                }
                if (dataKey == 'service') {
                    this.service = true;
                }
            });
        } else {
            this.hasImage = false;
        }
        this.isVisible = false;
        this.checked = false;
        this.subNodes = [];
    }

    getCyElement(parentId = null, parent = null) {

        return new Promise((resolve) => {
            if (Utils.isNullOrUndefined(parentId)) {
                parentId = this.parentId;
            } else {
                this.parentId = parentId;
            }
            if (Utils.isNullOrUndefined(parent)) {
                parent = this.parent;
            } else {
                this.parent = parent;
            }
            let elementOptions = {
                group: "nodes",
                data: {
                    id: this.id,
                    label: this.title,
                    parentNodeId: parentId,
                    parent: parent,
                    filterEles: this.category ? this.category : [],
                    pie: this.pie ? Object.keys(this.pie) : []
                },
                css: {},
                selectable: true,
                position: this.parentPos,
                classes: this.addClasses()
            };

            if (Utils.isNullOrUndefined(this.pie) && this.hasImage) {
                elementOptions.classes = elementOptions.classes + ' border';
            }
            let name = '';
            let pies = [];
            let xPos = 0;
            let yPos = 0;
            let xmPos = 95;
            let ymPos = 250;
            let dotname = 'dots_md';
            if (Utils.isNotNullOrUndefined(this.pie) || this.pie !== null) {
                Object.keys(this.pie).forEach(pieItem => {
                    pies.push(pieItem);
                });
                pies.sort();
                for (let i = 0; i < pies.length; i++) {
                    if (name.indexOf(pies[i]) == -1) {
                        name += pies[i] + '_';
                    }
                }
                xPos = 120;
                yPos = 120;
                xmPos = 48;
                ymPos = 95;
                dotname = 'dots_sm';

            } else if (this.hasImage) {
                xmPos = 95;
                ymPos = 250;
                name = 'node-bg';
                dotname = 'dots_md';

            } else {
                name = 'node-bg';
            }

            let results = [];
            Object.keys(this.pie).map((keyName) => {
                return results.push({keyName: keyName, count: 1, color: this.pie[keyName].color});
            });
            this.currentResultsLength = results.length;

            let img = new Image();
            img.crossOrigin = "Anonymous";

            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                if (Utils.isNotNullOrUndefined(this.pie) || this.pie !== null) {

                    canvas.width = 400;
                    canvas.height = 400;

// ===============================================================NEW CODE======================================================================

                    let total = results.reduce((sum, {count}) => sum + count, 0);
                    let currentAngle = -0.5 * Math.PI;
                    let centerX = canvas.width / 2;
                    let centerY = canvas.height / 2;

                    for (let result of results) {
                        this.creatPieBorder(ctx, 3);
// ------ create pie -------
                        let sliceAngle = (result.count / total) * 2 * Math.PI;
                        let piesChartRadiusSize = 200;
                        ctx.beginPath();
                        ctx.save();
                        ctx.arc(centerX, centerY, piesChartRadiusSize, currentAngle, currentAngle + sliceAngle);
                        currentAngle += sliceAngle;
                        ctx.lineTo(centerX, centerY);
                        ctx.fillStyle = result.color;
                        ctx.fill();
// ------- text position
                        let middleAngle = currentAngle + (-0.5 * sliceAngle);
                        let pieTextPosition = 160;
                        let textX = Math.cos(middleAngle) * pieTextPosition + centerX;
                        let textY = Math.sin(middleAngle) * pieTextPosition + centerY;

                        this.creatPieBorder(ctx, 2);
                        this.textStyle(ctx, textX, textY);
                        this.textRotate(ctx, currentAngle);

// ------ text info print
                        ctx.fillText(result.keyName, 0, 0);
                        ctx.restore();

                    }
                } else {
                    alert('error');
                }
// ===============================================================END NEW CODE==================================================================

                ctx.save();
                ctx.beginPath();


                ctx.restore();
                let canvasUrl = '';
                canvasUrl = canvas.toDataURL();

                try {
                    mergeImages([
                        {src: canvasUrl, x: 0, y: 0},
                        // {src: this.avatar, x: 0, y: 0},
                        this.moreRelation ? {
                            src: '/images/gray_' + dotname + '.png',
                            x: xmPos,
                            y: ymPos
                        } : {src: '/images/aaa.png', x: 0, y: 0}])
                        .then(b64 => {
                            this.avatar = b64;
                            elementOptions.classes = this.addClasses();
                            elementOptions.css["background-image"] = b64;
                            resolve(elementOptions);
                        }).catch(() => {

                        elementOptions.css["background-image"] = this.avatar;
                        console.log("mergeImage ERROR");
                        resolve(elementOptions);

                    });
                } catch (error) {
                    console.error(error);
                    mergeImages([{
                        src: canvasUrl,
                        x: xPos,
                        y: yPos
                    }, this.moreRelation ? {
                        src: '/images/gray_' + dotname + '.png',
                        x: xmPos,
                        y: ymPos
                    } : {src: '/images/aaa.png', x: 0, y: 0}])
                        .then(b64 => {
                            this.b64 = b64;
                            elementOptions.classes = this.addClasses();
                            elementOptions.css["background-image"] = b64;
                            resolve(elementOptions);
                        }).catch(() => {
                        console.log("mergeImage ERROR");
                        resolve(elementOptions);
                    });
                }
            };

            img.src = this.avatarOriginal;
            img.onerror = (error) => {
                resolve(elementOptions);
                console.log(error);
            };
        }).catch((error) => {
            console.log("getCyNodeError", error);
        });
    }

// ========================================= new =========================================
    creatPieBorder(ctx, borderLineWidth) {
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = borderLineWidth;
        ctx.stroke();
    }

    textStyle(ctx, textX, textY) {
        let pieTextFontSize = 27;
        ctx.font = `900 ${pieTextFontSize - this.currentResultsLength}pt Calibri`;
        ctx.fillStyle = "white";
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.translate(textX, textY);
    }

    textRotate(ctx, currentAngle) {
        let pieFontRotatePercent = this.currentResultsLength * 19 / 100;
        if (this.currentResultsLength === 1) {
            ctx.rotate(currentAngle + Math.PI / 2);
        } else if (this.currentResultsLength >= 3) {
            ctx.rotate(currentAngle + pieFontRotatePercent);
        } else {
            ctx.rotate(currentAngle);
        }
    }

// =====================================================================================================

    addClasses() {
        let classes = this.isMainNode ? 'mainNode' : Utils.isNotNullOrUndefined(this.pie) ? 'pie' : '';
        return this.endpoint ? classes + " endpoint" : classes;
    }

    setPosition(position) {
        this.position = position;
    }

    hasPie() {
        return Utils.isNotNullOrUndefined(this.pie);
    }

    isMore() {
        return this.service;
    }

    isEndpoint() {
        return this.endpoint;
    }
}