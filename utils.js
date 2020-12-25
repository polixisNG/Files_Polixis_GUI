import lodash from "lodash";

import PolixisRoutes from "./routes";
import {isNullOrUndefined} from "util";
import {API} from "./api";
import {getNextAvatar, IconPosition} from "./constants";


const Utils = {
        getSelectedNodes: nodes => {
            let selectedNodes = [];

            nodes.forEach(node => {
                if (node.checked) {
                    selectedNodes.push(node);
                } else {
                    for (let i = 0; i < node.subnodes.length; i++) {
                        const subnode = node.subnodes[i];
                        if (subnode.checked) {
                            selectedNodes.push(node);
                            break;
                        }
                    }
                }
            });

            return selectedNodes;
        },
        getMainNodes: nodes => {
            let count = 0;
            const mainNodes = nodes
                .filter(node => node.properties['#PIE'] && !node.checked)
                .filter(node => {
                    if (count < 6 && (node.subnodes.length === 0 || node.subnodes.filter(subnode => subnode.checked).length === 0)) {
                        count++;
                        return true;
                    } else {
                        return false;
                    }
                })
                .filter((node, index) => index < 5);
            return {
                mainNodes,
                showDots: count === 6
            };
        },
        getSunctionNodes: nodes => {
            let sunctionNodes = [];
            nodes.forEach(node => {
                if (node.show['Sanctions']) {
                    sunctionNodes.push(node);
                }
            });

            return sunctionNodes;
        },
        getPepNodes: nodes => {
            let pepNodes = [];
            nodes.forEach(node => {
                if (node.show['PEP'] || node.show['Pep'] || node.show['pep']) {
                    pepNodes.push(node);
                }
            });

            return pepNodes;
        },
        getInfoNodes: nodes => {
            let infoNodes = [];
            nodes.forEach(node => {
                if (!(lodash.isNull(node.properties['#PIE']) || lodash.isUndefined(node.properties['#PIE'])) && node.properties['#PIE'].indexOf('INFO') !== -1) {
                    infoNodes.push(node);
                }
            });

            return infoNodes;
        },
        getClosedNodes: nodes => {
            let closedNodes = [];
            nodes.forEach(node => {
                if (!(lodash.isNull(node.properties['#PIE']) || lodash.isUndefined(node.properties['#PIE'])) && node.properties['#PIE'].indexOf('CLOSED') !== -1) {
                    closedNodes.push(node);
                }

            });

            return closedNodes;
        },
        getNodesByCountry: (nodes, selectCountry) => {
            let newNodes = [];

            if (selectCountry.length > 0) {
                nodes.forEach(node => {
                    let nodeAllCountry = [];
                    Object.keys(node.country).forEach(key => {
                        node.country[key].forEach(_country => {
                            if (nodeAllCountry.indexOf(_country.countryName) === -1) nodeAllCountry.push(_country.countryName);
                        });
                    });
                    let isCountrySelectedInThisNode = nodeAllCountry.filter(_country => {
                        return selectCountry.indexOf(_country) !== -1;
                    }).length > 0;
                    if (isCountrySelectedInThisNode) newNodes.push(node);
                });
            } else {
                newNodes = nodes;
            }

            return newNodes;

        },
        getNodesByDate: (nodes, date) => {
            let nodesByDate = [];
            nodes.forEach(node => {
                if (Object.keys(node.date).find(key => node.date[key].find(_data => _data.indexOf(date) !== -1))) {
                    nodesByDate.push(node);
                }
            });

            return nodesByDate;
        },

        cloneNodes: nodes => {
            return nodes.map(node => {
                const clonedNode = Object.assign({}, node);
                clonedNode.subnodes = Utils.cloneSubnodes(node.subnodes);

                return clonedNode;
            });
        },

        cloneSubnodes: subnodes => {
            return subnodes.map(subnode => {
                return Object.assign({}, subnode);
            });
        },

        inputPlaceholder: type => {
            if (type === "person") {
                return "First name, last name, middle name";
            } else {
                return "Company name";
            }
        },

        createSearchQuery: (keyword, type, options = null, node = null) => {

            let qry = {
                q: keyword,
                type: type.toLowerCase(),
                options: JSON.stringify(options),
                node
            };
            let searchRequest = Object.assign({}, {"keyword": keyword}, {"type": type}, options);
            sessionStorage.setItem("searchRequest", JSON.stringify(searchRequest));
            sessionStorage.setItem("locaionStateForNodeInQueue", JSON.stringify(qry));

            let query = keyword;
            query += "&type=" + type;
            if (!isNullOrUndefined(options)) {
                query += "&options=" + options;
            }

            let search = "?q=" + new Date().getTime();
            return {pathname: PolixisRoutes.App.Search, search: search, state: qry};
        },

        getNodeImage: (node) => {
            if (isNullOrUndefined(node.image)) {
                if (node.nodeType === "PERSON") {
                    if (isNullOrUndefined(node.gender)) {
                        return "/images/node_avatar.png";
                    } else {
                        return getNextAvatar(node.gender);
                    }
                } else if (node.nodeType === "ORGANIZATION") {
                    return "/images/node_company.png";
                } else {
                    return "/images/undetermined.png";
                }
            } else {
                if (node.image.startsWith("http")) {
                    return API.BASE_URL + "/ardis/v1/public/getImage?url=" + node.image;
                }

//-----------------------------------------------------------------------
                else if (node.image.startsWith("../")) {
                    const fullPath = node.image.replace("..", API.BASE_URL);
                    return fullPath;
                }
//
                else {
                    return node.image;
                }
            }
        },
        makeCanvasImage: (pies, img) => {

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 140;
            canvas.height = 140;

            if (Utils.isNotNullOrUndefined(pies) || pies.length) {

                let total = pies.reduce((sum, {count}) => sum + count, 0);
                let currentAngle = 0.5 * Math.PI;
                let centerX = canvas.width / 2;
                let centerY = canvas.height / 2;

                for (let result of pies) {
                    Utils.creatPieBorder(ctx, 3);
                    let sliceAngle = (result.count / total) * 2 * Math.PI; // create pie
                    let piesChartRadiusSize = canvas.width / 2;
                    ctx.beginPath();
                    ctx.save();
                    ctx.arc(centerX, centerY, piesChartRadiusSize, currentAngle, currentAngle + sliceAngle);
                    ctx.lineTo(centerX, centerY);
                    ctx.fillStyle = result.color;
                    ctx.fill();

                    let middleAngle = currentAngle + (0.5 * sliceAngle);
                    let pieTextPosition = 50;
                    let textX = Math.cos(middleAngle) * pieTextPosition + centerX;
                    let textY = Math.sin(middleAngle) * pieTextPosition + centerY;
                    // let cText = result.text.split("").join(String.fromCharCode(8201)); // latter spacing
                    Utils.creatPieBorder(ctx, 2);
                    Utils.textStyle(ctx, textX, textY, pies.length);
                    // Utils.textRotate(ctx, currentAngle, pies.length);
                    Utils.drawTextAlongArc(ctx, result.text, textX, textY, 20, currentAngle);
                    // ctx.fillText(result.text, 0, 0);
                    currentAngle += sliceAngle;
                    ctx.restore();
                }
            } else {
                canvas.width = 140;
                canvas.height = 140;
                ctx.save();
                ctx.beginPath();
                ctx.arc(0, 0, 140, 0, 140);
                ctx.drawImage(img, 0, 0, 140, 140);
            }
            Utils.createCenterImageCanvas(ctx, canvas, img);
            let canvasUrl = '';
            canvasUrl = canvas.toDataURL();
            return canvasUrl;
        },

        drawTextAlongArc: (ctx, str, textX, textY, radius, angle) => {
            ctx.save();
            ctx.translate(textX, textY);
            ctx.rotate(-1 * angle / 2);
            ctx.rotate(-1 * (angle / str.length) / 2);
            for (let n = 0; n < str.length; n++) {
                ctx.rotate(angle / str.length);
                ctx.save();
                ctx.translate(0, -1 * radius);
                ctx.fillText(str[n], 0, 0);

                ctx.restore();

            }
            ctx.restore();
        },
        createCenterImageCanvas: (ctx, canvas, avatarImg) => {
            let arcRadiusSize = 32 * canvas.width / 100;
            let startAngle = 0;
            let endAngle = Math.PI * 2.2;
            let drawX = 17 * canvas.width / 100;
            let drawY = 17 * canvas.width / 100;
            let dWidth = 66 * canvas.width / 100;
            let dHeight = 66 * canvas.width / 100;
            ctx.beginPath();
            ctx.arc(canvas.width / 2, canvas.width / 2, arcRadiusSize, startAngle, endAngle);
            ctx.fill();
            ctx.save();
            ctx.clip();
            ctx.drawImage(avatarImg, drawX, drawY, dWidth, dHeight);
            ctx.closePath();
        },
        creatPieBorder: (ctx, borderLineWidth) => {
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = borderLineWidth;
            ctx.stroke();
        },
        textStyle: (ctx, textX, textY, len) => {
            ctx.font = `${10 - len}pt Calibri`;
            ctx.fillStyle = "#ffffff";
            ctx.textBaseline = "middle";
            ctx.textAlign = "center";
            // ctx.translate(textX, textY);
        },
        textRotate: (ctx, currentAngle, len) => {
            let pieFontRotatePercent = len * 19 / 100;
            if (len === 1) {
                ctx.rotate(currentAngle + Math.PI / 2);
            } else if (len === 2) {
                ctx.rotate(currentAngle);
            } else {
                ctx.rotate(currentAngle + pieFontRotatePercent);
            }
        },
        isNullOrUndefined: (obj) => {
            return lodash.isNull(obj) || lodash.isUndefined(obj);
        },

        isNotNullOrUndefined: (obj) => {
            return !Utils.isNullOrUndefined(obj);
        },
        uniq: (arr) => {
            return lodash.uniqBy(arr, 'id');
        },
        getCoordinatesByPostion: (coordinates, position = IconPosition.TopRight) => {
            let x = coordinates.x;
            let y = coordinates.y;

            switch (position) {
                case IconPosition.TopRight:
                    return {x: x + 43, y: y - 43};

                case IconPosition.TopLeft:
                    return {x: x - 43, y: y - 43};

                case IconPosition.BottomRight:
                    return {x: x + 43, y: y + 43};

                case IconPosition.BottomLeft:
                    return {x: x - 43, y: y + 43};

                case IconPosition.Top:
                    return {x: x, y: y - 43};

                case IconPosition.Right:
                    return {x: x + 43, y: y};

                case IconPosition.Bottom:
                    return {x: x, y: y + 43};

                case IconPosition.Left:
                    return {x: x - 43, y: y};

                default:
                    return coordinates;
            }
        },

        isMobile: () => {
            return $(window).width() < 480;
        },

        isMiddleDevice: () => {
            return $(window).width() > 481 && $(window).width() < 900;
        },
        isMiddleLargeDevice: () => {
            return $(window).width() > 899 && $(window).width() < 1800;
        },
        isLargeDevice: () => {
            return $(window).width() > 1799;
        }
    }
;

export default Utils;