import mergeImages from 'merge-images';

import Utils from "../utils";

export default class Node {
    constructor(nodeData = null) {

        if (Utils.isNotNullOrUndefined(nodeData)) {
            this.ardisId = nodeData.ardisId;
            this.category = Utils.isNullOrUndefined(nodeData.category) ? null : nodeData.category.map(item => {
                let newItem = item.startsWith("#") ? item.substr(1) : item;
                if (newItem.toLowerCase().startsWith("shareholding")) newItem = "shareholding";
                return newItem.toLowerCase();
            });
            this.id = nodeData.id.replace(/(\.)|(,)/g, '_');
            this.isMainNode = nodeData.isMainNode;
            this.moreRelation = Utils.isNullOrUndefined(nodeData.moreRelations) ? null : nodeData.moreRelations;
            this.pie = null;
            this.subnodeIdList = nodeData.subnodeIDList;
            this.title = nodeData.title;
            this.avatarOriginal = Utils.getNodeImage(nodeData);
            this.avatar = Utils.getNodeImage(nodeData);
            this.avatarMerged = Utils.getNodeImage(nodeData);
            this.hasImage = !Utils.isNullOrUndefined(nodeData.image);
            this.endpoint = !Utils.isNullOrUndefined(nodeData.endpoint) ? true : false;
            this.b64 = '';
            this.type = nodeData.nodeType;
            this.fromFirstLayer = false;
            this.parentPos = Utils.isNotNullOrUndefined(nodeData.parentPos) ? {
                x: nodeData.parentPos.x,
                y: nodeData.parentPos.y
            } : {x: Math.random() * 1000, y: Math.random() * 1000};

            this.filterEles = this.category || [];

            Object.keys(nodeData).forEach((dataKey) => {
                if (dataKey === 'pie') {

                    if (Utils.isNullOrUndefined(this.pie)) {
                        this.pie = {};
                    }
                    this.pie = nodeData[dataKey];
                    let pieKeys = Object.keys(nodeData[dataKey]);
                    this.filterEles = this.filterEles.concat(pieKeys);

                }
                if (dataKey === 'service') {
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
            let pies = [];
            let xmPos = 95;
            let ymPos = 250;
            let dotName = 'dots_md';

            if (Utils.isNotNullOrUndefined(this.pie) || this.pie !== null) {
                Object.keys(this.pie).forEach(pieItem => {
                    let pie = this.pie[pieItem];
                    pies.push({text: pieItem.toUpperCase(), color: pie.color, count: 1});
                });
                xmPos = 40;
                ymPos = 85;
                dotName = 'dots_sm';

            } else if (this.hasImage) {
                xmPos = 95;
                ymPos = 250;
                dotName = 'dots_md';

            }

            let img = new Image();
            img.crossOrigin = "Anonymous";
            let avatarImage = new Image();

            img.onload = () => {
                avatarImage.crossOrigin = "Anonymous";
                avatarImage.src = this.avatar;
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = 130;
                canvas.height = 130;

                if (Utils.isNotNullOrUndefined(this.pie) || this.pie !== null) {
                    this.currentResultsLength = pies.length;
                    let total = pies.reduce((sum, {count}) => sum + count, 0);
                    let currentAngle = -0.5 * Math.PI;
                    let centerX = canvas.width / 2;
                    let centerY = canvas.height / 2;

                    for (let result of pies) {
                        this.creatPieBorder(ctx, 3);
                        let sliceAngle = (result.count / total) * 2 * Math.PI; // create pie
                        let piesChartRadiusSize = canvas.width / 2;
                        ctx.beginPath();
                        ctx.save();
                        ctx.arc(centerX, centerY, piesChartRadiusSize, currentAngle, currentAngle + sliceAngle);
                        currentAngle += sliceAngle;
                        ctx.lineTo(centerX, centerY);
                        ctx.fillStyle = result.color;
                        ctx.fill();

                        let middleAngle = currentAngle + (-0.5 * sliceAngle); // text position
                        let pieTextPosition = 39 * canvas.width / 100;
                        let textX = Math.cos(middleAngle) * pieTextPosition + centerX;
                        let textY = Math.sin(middleAngle) * pieTextPosition + centerY;

                        this.creatPieBorder(ctx, 2);
                        this.textStyle(ctx, textX, textY);
                        this.textRotate(ctx, currentAngle);
                        // let cText = result.text.split("").join(String.fromCharCode(8201)); // latter spacing
                        ctx.fillText(result.text, 0, 0);
                        ctx.restore();
                    }
                } else {
                    canvas.width = 300; // destination canvas size
                    canvas.height = 300;
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(0, 0, 300, 0, 300);
                    ctx.drawImage(img, 0, 0, 300, 300);
                }
                this.createCenterImageCanvas(ctx, canvas, avatarImage, canvas.width);
                let canvasUrl = '';
                canvasUrl = canvas.toDataURL();
                try {
                    mergeImages([
                        {src: canvasUrl, x: 0, y: 0},
                        this.moreRelation ? {
                            src: '/images/gray_' + dotName + '.png',
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
                    mergeImages([
                        {src: canvasUrl, x: 0, y: 0},
                        this.moreRelation ? {
                            src: '/images/gray_' + dotName + '.png',
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

    createCenterImageCanvas(ctx, canvas, avatarImage, percentToCanvas) {
        let arcRadiusSize = 32 * percentToCanvas / 100;
        let startAngle = 0;
        let endAngle = Math.PI * 2.2;
        let drawX = 17 * percentToCanvas / 100;
        let drawY = 17 * percentToCanvas / 100;
        let dWidth = 66 * percentToCanvas / 100;
        let dHeight = 66 * percentToCanvas / 100;
        ctx.beginPath();
        ctx.arc(percentToCanvas / 2, percentToCanvas / 2, arcRadiusSize, startAngle, endAngle);
        ctx.fill();
        ctx.save();
        ctx.clip();
        ctx.drawImage(avatarImage, drawX, drawY, dWidth, dHeight);
        ctx.closePath();
        ctx.restore();
    }

    creatPieBorder(ctx, borderLineWidth) {
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = borderLineWidth;
        ctx.stroke();
    }

    textStyle(ctx, textX, textY) {
        ctx.font = `${11 - this.currentResultsLength}pt Calibri`;
        ctx.fillStyle = "#ffffff";
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.translate(textX, textY);
    }

    textRotate(ctx, currentAngle) {
        let pieFontRotatePercent = this.currentResultsLength * 18 / 100;
        if (this.currentResultsLength === 1) {
            ctx.rotate(currentAngle + Math.PI / 2);
        } else if (this.currentResultsLength >= 3) {
            ctx.rotate(currentAngle + pieFontRotatePercent);
        } else {
            ctx.rotate(currentAngle);
        }
    }

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