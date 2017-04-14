// NOTE: numerico Additions at bottom of file
var numerico = numerico || {};
// BEGIN numerico Additions
jQuery.noConflict();
var $j = jQuery;
// END numerico Additions
// ----- Bubble
var numerico = numerico || {};
var placeLabels= function(d){
		    d.svg.append("text").attr("x",100).attr("y",90).text("SEP")
			d.svg.append("text").attr("x",280).attr("y",90).text("SS")
			d.svg.append("text").attr("x",410).attr("y",90).text("SEDESOL")
			d.svg.append("text").attr("x",530).attr("y",90).text("SAGARPA")
			d.svg.append("text").attr("x",679).attr("y",90).text("SCT")
			
			d.svg.append("text").attr("x",100).attr("y",400).text("SEGOB")
			d.svg.append("text").attr("x",280).attr("y",400).text("SEMARNAT")
			d.svg.append("text").attr("x",410).attr("y",400).text("SHCP")
			d.svg.append("text").attr("x",530).attr("y",400).text("SE")
			d.svg.append("text").attr("x",679).attr("y",400).text("CONACYT")
			
			d.svg.append("text").attr("x",820).attr("y",180).text("OTROS")
		};
var placeLabelsSalarial= function(d){
		    d.svg.append("text").attr("x",80).attr("y",540).text("SEP")
			d.svg.append("text").attr("x",210).attr("y",540).text("SS")
			d.svg.append("text").attr("x",290).attr("y",540).text("SEDESOL")
			d.svg.append("text").attr("x",390).attr("y",540).text("SAGARPA")
			d.svg.append("text").attr("x",480).attr("y",540).text("SCT")
			d.svg.append("text").attr("x",560).attr("y",540).text("SEGOB")
			d.svg.append("text").attr("x",625).attr("y",540).text("SEMARNAT")
			d.svg.append("text").attr("x",730).attr("y",540).text("SHCP")
			d.svg.append("text").attr("x",780).attr("y",540).text("SE")
			d.svg.append("text").attr("x",810).attr("y",540).text("CONACYT")
			
			d.svg.append("text").attr("x",900).attr("y",540).text("OTROS")

		};		
// ----- Begin Bubble Chart -----
var numerico = numerico || {};


numerico.Chart = function() {
    return {
        $j: jQuery,
        //defaults
        width: 970,
        height: 850,
        groupPadding: 10,
        totalValue: 9613490,
        deficitValue: 901000,
        // CONST
        relevant: "relevant",
        DISCRETIONARY: "Discretionary",
        NET_INTEREST: "Net interest",
        //will be calculated later
        boundingRadius: null,
        maxRadius: null,
        centerX: null,
        centerY: null,
        scatterPlotY: null,
        //d3 settings
        defaultGravity: 0.1,
        defaultCharge: function(d) {
            if (d.value < 0) {
                return 0
            } else {
                return -Math.pow(d.radius, 2.0) / 8
            };
        },
        links: [],
        nodes: [],
        positiveNodes: [],
        force: {},
        svg: {},
        circle: {},
        gravity: null,
        charge: null,
        changeTickValues: [-100,-75,-50,-25,0,25,50,75,100,125,150],
        categorizeChange: function(c) {
			
			c=c-0.03				
			if (c < -0.5) {
                return -2;
            } else if (c <= -0.051) {
                return -1;
            } else if (c < 0.05){
                return 0;
            } else if (c <= 0.5) {
                return 1;
			}else {
                return 2;
            }  
						
            },
        fillColor: d3.scale.ordinal()
            .domain([-2, -1, 0, 1, 2,3])
            .range([ "#D63431", "#E85D75", "#FFFFFF", "#84DCC6", "#64C98D","#F3F9BD"]),
        strokeColor: d3.scale.ordinal()
            .domain([ -2, -1, 0, 1, 2,3])
            .range(["#555", "#555", "#555", "#555", "#555", "#555"]),
        getFillColor: null,
        getStrokeColor: null,
        pFormat: d3.format("+.1f"),
        pctFormat: function() {
            return false
        },
        tickChangeFormat: d3.format("+"),
        simpleFormat: d3.format(","),
        simpleDecimal: d3.format(",.2f"),
        bigFormat: function(n) {
            return numerico.formatNumber(n * 100)
        },
        nameFormat: function(n) {
            return n
        },
        discretionFormat: function(d) {
            if (d == 'Discretionary' || d == 'relevant') {
                return d + " spending"
            } else {
                return d
            }
        },
		
	
		rScale: d3.scale.pow().exponent(0.5).domain([0, 80000]).range([1, 55]),
        //rScale: d3.scale.pow().exponent(0.5).domain([20, 1000000]).range([1, 90]),
        radiusScale: null,
        changeScale: d3.scale.sqrt().domain([-100,150]).range([510,90]),
        sizeScale: d3.scale.linear().domain([0, 110]).range([0, 1]),
        groupScale: {},
        //data settings
        currentYearDataColumn: 'budget_2013',
        previousYearDataColumn: 'budget_2012',
        data: numerico.budget_array_data,
        categoryPositionLookup: {},
        categoriesList: [],
        init: function() {
            var that = this;
            this.scatterPlotY = this.changeScale(0);
            this.pctFormat = function(p) {
                if (p === Infinity || p === -Infinity) {
                    return "N.A."
                } else {
                    return that.pFormat(p)
                }
            }
            this.radiusScale = function(n) {
                return that.rScale(Math.abs(n));
            };
            this.getStrokeColor = function(d) {
                // if (d.isNegative) {
                //   return "#333"
                // }
                return that.strokeColor(d.changeCategory);
            };
            this.getFillColor = function(d) {
                return that.fillColor(d.changeCategory);
            };
            this.boundingRadius = this.radiusScale(this.totalValue);
            this.centerX = this.width / 2;
            this.centerY = 300;
            numerico.category_data.sort(function(a, b) {
                return b['total'] - a['total'];
            });
            //calculates positions of the category clumps
            //it is probably overly complicated
            var columns = [4, 7, 9, 9]
            rowPadding = [150, 100, 90, 80, 70],
                rowPosition = [220, 450, 600, 720, 817],
                rowOffsets = [130, 80, 60, 45, 48]
            currentX = 0,
                currentY = 0;
            for (var i = 0; i < numerico.category_data.length; i++) {
                var t = 0,
                    w, numInRow = -1,
                    positionInRow = -1,
                    currentRow = -1,
                    cat = numerico.category_data[i]['label'];
                // calc num in this row
                for (var j = 0; j < columns.length; j++) {
                    if (i < (t + columns[j])) {
                        numInRow = columns[j];
                        positionInRow = i - t;
                        currentRow = j;
                        break;
                    };
                    t += columns[j];
                };
                if (numInRow === -1) {
                    numInRow = numerico.category_data.length - d3.sum(columns);
                    currentRow = columns.length;
                    positionInRow = i - d3.sum(columns)
                };
                numerico.category_data[i].row = currentRow;
                numerico.category_data[i].column = positionInRow;
                w = (this.width - 2 * rowPadding[currentRow]) / (numInRow - 1)
                currentX = w * positionInRow + rowPadding[currentRow];
                currentY = rowPosition[currentRow];
                this.categoriesList.push(cat);
                this.categoryPositionLookup[cat] = {
                    x: currentX,
                    y: currentY,
                    w: w * 0.9,
                    offsetY: rowOffsets[currentRow],
                    numInRow: numInRow,
                    positionInRow: positionInRow
                }
            };
            this.groupScale = d3.scale.ordinal().domain(this.categoriesList).rangePoints([0, 1]);
            // Builds the nodes data array from the original data
            for (var i = 0; i < this.data.length; i++) {
                var n = this.data[i];
                var out = {
                    sid: n['id'],
                    radius: this.radiusScale(n[this.currentYearDataColumn]),
                    group: n['department'],
                    change: n['change']-.03,
                    changeCategory: this.categorizeChange(n['change']),
                    value: n[this.currentYearDataColumn],
                    name: n['name'],
                    discretion: n['discretion'],
                    isNegative: (n[this.currentYearDataColumn] < 0),
                    positions: n.positions,
                    x: Math.random() * 1000,
                    y: Math.random() * 1000,
					salario: n['salario2015']
                }
                if (n.positions.total) {
                    out.x = n.positions.total.x + (n.positions.total.x - (that.width / 2)) * 0.5;
                    out.y = n.positions.total.y + (n.positions.total.y - (150)) * 0.5;
                };
                if ((n[this.currentYearDataColumn] > 0) !== (n[this.previousYearDataColumn] > 0)) {
                    out.change = "N.A.";
                    out.changeCategory = 3;
                };
                this.nodes.push(out)
            };
            this.nodes.sort(function(a, b) {
                return Math.abs(b.value) - Math.abs(a.value);
            });
            for (var i = 0; i < this.nodes.length; i++) {
                if (!this.nodes[i].isNegative) {
                    this.positiveNodes.push(this.nodes[i])
                }
            };
            this.svg = d3.select("#numerico-chartCanvas").append("svg:svg").attr("width", this.width);
            for (var i = 0; i < this.changeTickValues.length; i++) {
                d3.select("#numerico-discretionaryOverlay").append("div").html("<p>" + this.tickChangeFormat(this.changeTickValues[i]) + "%</p>").style("top", this.changeScale(this.changeTickValues[i])+9 + 'px').classed('numerico-discretionaryTick', true).classed('numerico-discretionaryZeroTick', (this.changeTickValues[i] === 0))
            };
			
            d3.select("#numerico-scaleKey").append("circle").attr('r', this.radiusScale(200)).attr('class', "numerico-scaleKeyCircle").attr('cx', 48).attr('cy', 50);
            d3.select("#numerico-scaleKey").append("circle").attr('r', this.radiusScale(15000)).attr('class', "numerico-scaleKeyCircle").attr('cx', 48).attr('cy', 50);
            d3.select("#numerico-scaleKey").append("circle").attr('r', this.radiusScale(60000)).attr('class', "numerico-scaleKeyCircle").attr('cx', 48).attr('cy', 50);
			
            // This is the every circle
            this.circle = this.svg.selectAll("circle").data(this.nodes, function(d) {
                return d.sid;
            });
            this.circle.enter().append("svg:circle").attr("r", function(d) {
                return 0;
            }).style("fill", function(d) {
                    return that.getFillColor(d);
                }).style("stroke-width", 1).attr('id', function(d) {
                    return 'numerico-circle' + d.sid
                }).style("stroke", function(d) {
                    return that.getStrokeColor(d);
                }).on("mouseover", function(d, i) {
                    var el = d3.select(this)
                    var xpos = Number(el.attr('cx'))
                    var ypos = (el.attr('cy') - d.radius - 10)
                    el.style("stroke", "#000").style("stroke-width", 2);
                    d3.select("#numerico-tooltip").style('top', ypos + "px").style('left', xpos + "px").style('display', 'block').classed('numerico-plus', (d.changeCategory > 0)).classed('numerico-minus', (d.changeCategory < 0));

                    d3.select("#numerico-tooltip .numerico-name").html(that.nameFormat(d.name))
					if(d.change!=="N.A.") d3.select("#numerico-tooltip .numerico-discretion").text("Variación porcentual real "+(d.change*100).toFixed(0)+"%")
					else d3.select("#numerico-tooltip .numerico-discretion").text("Nuevo programa");
                    d3.select("#numerico-tooltip .numerico-department").text(d.group)
                    d3.select("#numerico-tooltip .numerico-value").text(d.value.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")+" mdp")




                }).on("mouseout", function(d, i) {
                    d3.select(this).style("stroke-width", 1).style("stroke", function(d) {
                        return that.getStrokeColor(d);
                    })
                    d3.select("#numerico-tooltip").style('display', 'none')
                });
            this.circle.transition().duration(1000).attr("r", function(d) {
                return d.radius
            })
        },
        getCirclePositions: function() {
            var that = this
            var circlePositions = {};
            this.circle.each(function(d) {
                circlePositions[d.sid] = {
                    x: Math.round(d.x),
                    y: Math.round(d.y)
                }
            })
            return JSON.stringify(circlePositions)
        },
        start: function() {
            var that = this;
            this.force = d3.layout.force().nodes(this.nodes).size([this.width, this.height])
            // this.circle.call(this.force.drag)
        },
        totalLayout: function() {
            var that = this;
			this.svg.selectAll("text").remove()
            this.force.gravity(-0.01).charge(that.defaultCharge).friction(0.9).on("tick", function(e) {
                that.circle.each(that.totalSort(e.alpha)).each(that.buoyancy(e.alpha)).attr("cx", function(d) {
                    return d.x;
                }).attr("cy", function(d) {
                        return d.y;
                    });
            }).start();
        },
        relevantLayout: function() {
            var that = this;
			this.svg.selectAll("text").remove()
            this.force.gravity(0).friction(0.9).charge(that.defaultCharge).on("tick", function(e) {
                that.circle.each(that.relevantSort(e.alpha)).each(that.buoyancy(e.alpha)).attr("cx", function(d) {
                    return d.x;
                }).attr("cy", function(d) {
                        return d.y;
                    });
            }).start();
			
			placeLabels(this);
			window.scrollBy(0, 200);
			
        },
        discretionaryLayout: function() {
            var that = this;
			this.svg.selectAll("text").remove()
            this.force.gravity(0).charge(0).friction(0.2).on("tick", function(e) {
                that.circle.each(that.discretionarySort(e.alpha)).attr("cx", function(d) {
                    return d.x;
                }).attr("cy", function(d) {
                        return d.y;
                    });
            }).start();
			placeLabelsSalarial(this);
			window.scrollBy(0, 200);
        },
        departmentLayout: function() {
            var that = this;
            this.force.gravity(0).charge(1).friction(0).on("tick", function(e) {
                that.circle
                    // .each(that.departmentSort(e.alpha))
                    // .each(that.collide(0.5))
                    .each(that.staticDepartment(e.alpha)).attr("cx", function(d) {
                        return d.x;
                    }).attr("cy", function(d) {
                        return d.y;
                    });
            }).start();
        },
        //
        //
        //
        comparisonLayout: function() {
            var that = this;
            this.force.gravity(0).charge(that.defaultCharge).friction(0.9).on("tick", function(e) {
                that.circle.each(that.comparisonSort(e.alpha)).attr("cx", function(d) {
                    return d.x;
                }).attr("cy", function(d) {
                        return d.y;
                    });
            }).start();
        },
        // ----------------------------------------------------------------------------------------
        // FORCES
        // ----------------------------------------------------------------------------------------
        totalSort: function(alpha) {
            var that = this;
            return function(d) {
                var targetY = that.centerY;
                var targetX = that.width / 2;
                if (d.isNegative) {
                    if (d.changeCategory > 0) {
                        d.x = -200
                    } else {
                        d.x = 1100
                    }
                }
                // if (d.positions.total) {
                // if (d.positions.total) {
                //   targetX = d.positions.total.x
                //   targetY = d.positions.total.y
                // };
                d.y = d.y + (targetY - d.y) * (that.defaultGravity + 0.02) * alpha
                d.x = d.x + (targetX - d.x) * (that.defaultGravity + 0.02) * alpha
            };
        },
        buoyancy: function(alpha) {
            var that = this;
            return function(d) {
                // d.y -= 1000 * alpha * alpha * alpha * d.changeCategory
                // if (d.changeCategory >= 0) {
                //   d.y -= 1000 * alpha * alpha * alpha
                // } else {
                //   d.y += 1000 * alpha * alpha * alpha
                // }
                var targetY = that.centerY - (d.changeCategory / 3) * that.boundingRadius
                d.y = d.y + (targetY - d.y) * (that.defaultGravity) * alpha * alpha * alpha * 100
            };
        },
        relevantSort: function(alpha) {
            var that = this;
            return function(d) {
                var targetY = that.centerY;
                var targetX = 0;
                if (d.isNegative) {
                    if (d.changeCategory > 0) {
                        d.x = -200
                    } else {
                        d.x = 1100
                    }
                    return;
                }
	
	var all_labels=["sep","salud","sedesol","gobernacion","sct","sagarpa","semar","sedatu","semarnat","pgr","shcp","conacyt","economia","sre","sectur","stps","sener","tribunalesagrarios","sfp","comisionenergia","comisionhidrocarburos","sedena"	]	
				switch(d.group) {
					case "sep":
						targetX = 245;
						targetY = 250;
						break;
					case "salud":
						targetX = 350;
						targetY = 250;
						break;
					case "sedesol":
						targetX = 450;
						targetY = 250;
						break;
					case "sagarpa":
						targetX = 550;
						targetY = 250;
						break;
					case "sct":
						targetX = 650;
						targetY = 250;
						break;		
					case "gobernacion":
						targetX = 240;
						targetY = 410;
						break;
					case "semarnat":
						targetX = 350;
						targetY = 410;
						break;
					case "shcp":
						targetX = 450;
						targetY = 400;
						break;
					case "economia":
						targetX = 550;
						targetY =400;
						break;
					case "conacyt":
						targetX = 650;
						targetY = 420;
						break;
					default:
						targetX = 770;
						targetY = 290;
				}
				
                d.y = d.y + (targetY - d.y) * (that.defaultGravity) * alpha * 1.1
                d.x = d.x + (targetX - d.x) * (that.defaultGravity) * alpha * 1.1
            };
        },
        discretionarySort: function(alpha) {
            var that = this;
            return function(d) {
				
    
               var yScale= d3.scale.sqrt().domain([-1,1.5]).range([510,90]);
			   var targetY = 1000;
			   if(d.change<1.5) targetY =yScale(d.change);
			   if(d.change>1.5) targetY =yScale(1.5);
				
                var targetX = Math.random()*that.width;
                
				switch(d.group) {
					case "sep":
						targetX = 100;
						break;
					case "salud":
						targetX =220;
						break;
					case "sedesol":
						targetX = 320;
						break;
					case "sagarpa":
						targetX = 410;
						break;
					case "sct":
						targetX = 500;
						break;		
					case "gobernacion":
						targetX = 580;
						break;
					case "semarnat":
						targetX = 660;
						break;
					case "shcp":
						targetX = 730;
						break;
					case "economia":
						targetX = 790;
						break;
					case "conacyt":
						targetX = 840;
						break;
						
					default:
						targetX = 910;
				}
				
                d.y = d.y + (targetY - d.y) * Math.sin(Math.PI * (1 - alpha * 10)) * 0.2;
                d.x = d.x + (targetX - d.x) * Math.sin(Math.PI * (1 - alpha * 10)) * 0.2;
            };
        },

        
       
        collide: function(alpha) {
            var that = this;
            var padding = 6;
            var quadtree = d3.geom.quadtree(this.nodes);
            return function(d) {
                var r = d.radius + that.maxRadius + padding,
                    nx1 = d.x - r,
                    nx2 = d.x + r,
                    ny1 = d.y - r,
                    ny2 = d.y + r;
                quadtree.visit(function(quad, x1, y1, x2, y2) {
                    if (quad.point && (quad.point !== d) && (d.group === quad.point.group)) {
                        var x = d.x - quad.point.x,
                            y = d.y - quad.point.y,
                            l = Math.sqrt(x * x + y * y),
                            r = d.radius + quad.point.radius;
                        if (l < r) {
                            l = (l - r) / l * alpha;
                            d.x -= x *= l;
                            d.y -= y *= l;
                            quad.point.x += x;
                            quad.point.y += y;
                        }
                    }
                    return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
                });
            };
        }
    }
};
// Choose Menue
var numerico = numerico || {};
var $j = jQuery;
numerico.ChooseList = function(node, changeCallback) {
    this.container = $j(node);
    this.selectedNode = null;
    this.currentIndex = null;
    this.onChange = changeCallback;
    this.elements = this.container.find('li');
    this.container.find('li').on('click', $j.proxy(this.onClickHandler, this));
    this.selectByIndex(0);
};
numerico.ChooseList.prototype.onClickHandler = function(evt) {
    evt.preventDefault();
    this.selectByElement(evt.currentTarget);
};
numerico.ChooseList.prototype.selectByIndex = function(i) {
    this.selectByElement(this.elements[i])
};
numerico.ChooseList.prototype.selectByElement = function(el) {
    if (this.selectedNode) {
        $j(this.selectedNode).removeClass("selected");
    };
    $j(el).addClass("selected");
    for (var i = 0; i < this.elements.length; i++) {
        if (this.elements[i] === el) {
            this.currentIndex = i;
        }
    };
    this.selectedNode = el;
    this.onChange(this);
};
/********************************
 ** FILE: base.js
 ********************************/
var $j = jQuery;
numerico.filename = function(index) {
    var tabs = ["total", "relevant", "discretionary", "department"];
    return tabs[index];
}
$j("#save").click(function() {
    $j.ajax({
        type: "POST",
        url: "/save",
        data: {
            'filename': numerico.filename(numerico.mainNav.currentIndex),
            'contents': numerico.c.getCirclePositions()
        }
    });
})
numerico.ready = function() {
    var that = this;
    numerico.c = new numerico.Chart();
    numerico.c.init();
    numerico.c.start();
    this.highlightedItems = [];
    var currentOverlay = undefined;

    numerico.mainNav = new numerico.ChooseList($j(".numerico-navigation"), onMainChange);

    function onMainChange(evt) {
        var tabIndex = evt.currentIndex
        if (this.currentOverlay !== undefined) {
            this.currentOverlay.hide();
        };
        if (tabIndex === 0) {
            numerico.c.totalLayout();
            this.currentOverlay = $j("#numerico-totalOverlay");
            this.currentOverlay.delay(300).fadeIn(500);
            $j("#numericoChartFrame").css({
                'height': 545
            });
        } else if (tabIndex === 1) {
            numerico.c.relevantLayout();
            this.currentOverlay = $j("#numerico-relevantOverlay");
            this.currentOverlay.delay(300).fadeIn(500);
            $j("#numericoChartFrame").css({
                'height': 545
            });
        } else if (tabIndex === 2) {
            numerico.c.discretionaryLayout();
            this.currentOverlay = $j("#numerico-discretionaryOverlay");
            this.currentOverlay.delay(300).fadeIn(500);
            $j("#numericoChartFrame").css({
                'height': 545
            });
        }  
    }
}
if ( !! document.createElementNS && !! document.createElementNS('http://www.w3.org/2000/svg', "svg").createSVGRect) {
    $j(document).ready($j.proxy(numerico.ready, this));
} else {
    $j("#numericoChartFrame").hide();
    // $j("#numerico-error").show();
}