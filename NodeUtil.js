
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


            img.onload = () => {

                let canvasUrl = Utils.makeCanvasImage(pies, img);

                try {
                    margeImages([
                        {src: canvasUrl, x: 0, y: 0},
                        // {src: this.avatar, x:32,y:32,width:"50px"},
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
                    margeImages([
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