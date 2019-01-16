$(document).ready(function() {
    d3.csv("data/data.csv", function(data) {

        //Initial call to basic choropleth map on page load
        drawChoroplethPopulation();

        //check value of checkbox and call draw map functions
        var populationCheck = document.getElementById("dataswitch");
        $('#dataswitch').change(function() {
            if (populationCheck.checked == true) {
                drawChoroplethPopulation();
            } 
            else {
                drawChoroplethDensity();
            }
        })
        var mapCheck = document.getElementById("mapswitch");
        $('#mapswitch').change(function(){
            if(mapCheck.checked == true ) {
                $('#dataswitch').prop('disabled',false);
                $('#dataswitch').prop('checked',true);
                drawChoroplethPopulation();
            }
            else{
                $('#dataswitch').prop('checked',false);
                $('#dataswitch').prop('disabled',true);
                drawBubbleMap();
            } 
        })

        // function to create population choropleth map
        function drawChoroplethPopulation() {

            //clear svg after switching a map
            d3.select("#map")
                .selectAll("*")
                .remove();
            d3.select("#pie")
                .selectAll("*")
                .remove();
            d3.select("#pie2")
                .selectAll("*")
                .remove();

            // Create Choropleth datamap using population
            var world = new Datamap({
                element: document.getElementById('map'),
                scope: 'world',
                geographyConfig: {
                    popupTemplate: function(geo, data) {
                        return data && data.Population_thousands && "<div class='hoverinfo'><strong>" + geo.properties.name + "<br>Total Population(in thousands):" + data.Population_thousands + "</strong></div>";
                    },
                    highlightOnHover: true,
                    highlightFillColor: function(data) {
                        if (data.fillKey) {
                            return 'grey';
                        }
                        return 'blue';
                    },
                    highlightBorderColor: 'black',
                    highlightBorderWidth: 1,
                    popupOnHover: true,
                    borderColor: '#fff',
                    borderWidth: 0.5,
                    borderOpacity: 1
                },
                dataUrl: 'data/data.csv',
                dataType: 'csv',
                data: {},
                fills: {
                    'Lowest': '#aed6f1',
                    'Low': '#5dade2',
                    'Medium': '#3498db',
                    'High': '#2874a6',
                    'Highest': ' #1b4f72',
                    defaultFill: '#dddddd'
                },
                done: function(datamap) {
                    datamap.svg.selectAll('.datamaps-subunit').on('click', function(geo) {

                        //Get index of the country clicked to map data with dataset
                        var index;
                        for (var i = 0; i < data.length; i++) {
                            if (data[i].id == geo.id)
                                index = i;
                        }

                        //Array to store Economy and employment data from dataset
                        var newDataEconomy = [];
                        var newDataEmployment = [];
                        newDataEconomy = [{
                                "Name": "Agriculture",
                                "Value": data[index].Economy_Agriculture
                            },
                            {
                                "Name": "Industry",
                                "Value": data[index].Economy_Industry
                            },
                            {
                                "Name": "Services",
                                "Value": data[index].Economy_Services
                            }
                        ];

                        newDataEmployment = [{
                                "Name": "Agriculture",
                                "Value": data[index].Employment_Agriculture
                            },
                            {
                                "Name": "Industry",
                                "Value": data[index].Employment_Industry
                            },
                            {
                                "Name": "Services",
                                "Value": data[index].Employment_Services
                            }
                        ];

                        //Define scale of the donut chart
                        var width = 200;
                        var height = 200;
                        var outradius = Math.min(width, height) / 2;
                        var inradius = 66;
                        var legendSize = 11;
                        var legendSpace = 3;

                        //Define color scale
                        var color = d3.scale.category10();

                        d3.select("#pie")
                            .selectAll("*")
                            .remove();

                        d3.select("#pie2")
                            .selectAll("*")
                            .remove();

                        //Define svg elements
                        var svg = d3.select('#pie')
                            .append('svg')
                            .attr('width', width)
                            .attr('height', height)
                            .append('g')
                            .attr('transform', 'translate(' + (width / 2) + ',' + (height / 2) + ')');

                        //Define radius for donut
                        var arc = d3.svg.arc()
                            .outerRadius(outradius)
                            .innerRadius(inradius);

                        //Divide donut with value of objects
                        var pie = d3.layout.pie()
                            .value(function(d, i) {
                                return d.Value;
                            })
                            .sort(null)
                            .padAngle(.02);

                        //Fill donut with distinct colors of keys from object 
                        var path = svg.selectAll('path')
                            .data(pie(newDataEconomy))
                            .enter()
                            .append('path')
                            .attr('d', arc)
                            .attr('fill', function(d, i) {
                                return color(d.data.Name);
                            })
                            .each(function(d) {
                                this._current = d;
                            });

                        //Donut animation on load
                        path.transition()
                            .duration(1000)
                            .attrTween('d', function(d) {
                                var interpolate = d3.interpolate({
                                    startAngle: 0,
                                    endAngle: 0
                                }, d);
                                return function(t) {
                                    return arc(interpolate(t));
                                };
                            });

                        //Plot donut labels    
                        var text = svg.selectAll('text')
                            .data(pie(newDataEconomy))
                            .enter()
                            .append("text")
                            .transition()
                            .duration(200)
                            .attr("transform", function(d) {
                                return "translate(" + arc.centroid(d) + ")";
                            })
                            .attr("dy", ".4em")
                            .attr("text-anchor", "middle")
                            .text(function(d) {
                                return d.data.Value + "%";
                            })
                            .style({
                                fill: '#fff',
                                'font-size': '10px'
                            });

                        //Display key legends for donut chart
                        var legend = svg.selectAll('.legend')
                            .data(color.domain())
                            .enter()
                            .append('g')
                            .attr('class', 'legend')
                            .attr('transform', function(d, i) {
                                var height = legendSize + legendSpace;
                                var offset = height * color.domain().length / 2;
                                var horiz = -3 * legendSize;
                                var vert = i * height - offset;
                                return 'translate(' + horiz + ',' + vert + ')';
                            });

                        legend.append('rect')
                            .attr('width', legendSize)
                            .attr('height', legendSize)
                            .style('fill', color)
                            .style('stroke', color)
                            .on('click', function(label) {
                                var rect = d3.select(this);
                                var enabled = true;
                                var totalEnabled = d3.sum(newDataEconomy.map(function(d) {
                                    return (d.enabled) ? 1 : 0;
                                }));
                            });

                        legend.append('text')
                            .attr('x', legendSize + legendSpace)
                            .attr('y', legendSize - legendSpace)
                            .text(function(d) {
                                return d;
                            })

                        var svg = d3.select('#pie2')
                            .append('svg')
                            .attr('width', width)
                            .attr('height', height)
                            .append('g')
                            .attr('transform', 'translate(' + (width / 2) + ',' + (height / 2) + ')');


                        var arc = d3.svg.arc()
                            .outerRadius(outradius)
                            .innerRadius(inradius);

                        var pie = d3.layout.pie()
                            .value(function(d, i) {
                                return d.Value;
                            })
                            .sort(null)
                            .padAngle(.02);

                        var path = svg.selectAll('path')
                            .data(pie(newDataEmployment))
                            .enter()
                            .append('path')
                            .attr('d', arc)
                            .attr('fill', function(d, i) {
                                return color(d.data.Name);
                            })
                            .each(function(d) {
                                this._current = d;
                            });

                        path.transition()
                            .duration(1000)
                            .attrTween('d', function(d) {
                                var interpolate = d3.interpolate({
                                    startAngle: 0,
                                    endAngle: 0
                                }, d);
                                return function(t) {
                                    return arc(interpolate(t));
                                };
                            });

                        var text = svg.selectAll('text')
                            .data(pie(newDataEmployment))
                            .enter()
                            .append("text")
                            .transition()
                            .duration(200)
                            .attr("transform", function(d) {
                                return "translate(" + arc.centroid(d) + ")";
                            })
                            .attr("dy", ".4em")
                            .attr("text-anchor", "middle")
                            .text(function(d) {
                                return d.data.Value + "%";
                            })
                            .style({
                                fill: '#fff',
                                'font-size': '10px'
                            });


                        var legend = svg.selectAll('.legend')
                            .data(color.domain())
                            .enter()
                            .append('g')
                            .attr('class', 'legend')
                            .attr('transform', function(d, i) {
                                var height = legendSize + legendSpace;
                                var offset = height * color.domain().length / 2;
                                var horiz = -3 * legendSize;
                                var vert = i * height - offset;
                                return 'translate(' + horiz + ',' + vert + ')';
                            });

                        legend.append('rect')
                            .attr('width', legendSize)
                            .attr('height', legendSize)
                            .style('fill', color)
                            .style('stroke', color)
                            .on('click', function(label) {
                                var rect = d3.select(this);
                                var enabled = true;
                                var totalEnabled = d3.sum(newDataEmployment.map(function(d) {
                                    return (d.enabled) ? 1 : 0;
                                }));
                            });

                        legend.append('text')
                            .attr('x', legendSize + legendSpace)
                            .attr('y', legendSize - legendSpace)
                            .text(function(d) {
                                return d;
                            });
                    });
                }
            });
        }

        // function to create density choropleth map
        function drawChoroplethDensity() {
            d3.select("#map")
                .selectAll("*")
                .remove();
            d3.select("#pie")
                .selectAll("*")
                .remove();
            d3.select("#pie2")
                .selectAll("*")
                .remove();


            var world = new Datamap({
                element: document.getElementById('map'),
                scope: 'world',
                geographyConfig: {
                    popupTemplate: function(geo, data) {
                        return data && data.Population_density && "<div class='hoverinfo'><strong>" + geo.properties.name + "<br>Population Density(Per square km): " + data.Population_density + "</strong></div>";
                    },
                    highlightOnHover: true,
                    highlightFillColor: function(data) {
                        if (data.fillKey) {
                            return 'grey';
                        }
                        return 'blue';
                    },
                    highlightBorderColor: 'black',
                    highlightBorderWidth: 1,
                    popupOnHover: true,
                    borderColor: '#fff',
                    borderWidth: 0.5,
                    borderOpacity: 1
                },
                dataUrl: 'data/data_density.csv',
                dataType: 'csv',
                data: {},
                fills: {
                    'Lowest': '#E59866',
                    'Low': '#DC7633',
                    'Medium': '#BA4A00',
                    'High': '#873600',
                    'Highest': '#6E2C00',
                    defaultFill: '#dddddd'
                },
                done: function(datamap) {
                    datamap.svg.selectAll('.datamaps-subunit').on('click', function(geo) {
                        var index;
                        for (var i = 0; i < data.length; i++) {
                            if (data[i].id == geo.id)
                                index = i;
                        }
                        console.log(data[index]);

                        var newDataEconomy = [];
                        var newDataEmployment = [];
                        newDataEconomy = [{
                                "Name": "Agriculture",
                                "Value": data[index].Economy_Agriculture
                            },
                            {
                                "Name": "Industry",
                                "Value": data[index].Economy_Industry
                            },
                            {
                                "Name": "Services",
                                "Value": data[index].Economy_Services
                            }
                        ];

                        newDataEmployment = [{
                                "Name": "Agriculture",
                                "Value": data[index].Employment_Agriculture
                            },
                            {
                                "Name": "Industry",
                                "Value": data[index].Employment_Industry
                            },
                            {
                                "Name": "Services",
                                "Value": data[index].Employment_Services
                            }
                        ];

                        var width = 200;
                        var height = 200;
                        var outradius = Math.min(width, height) / 2;
                        var inradius = 66;
                        var legendSize = 11;
                        var legendSpace = 3;

                        var color = d3.scale.category10();

                        d3.select("#pie")
                            .selectAll("*")
                            .remove();

                        d3.select("#pie2")
                            .selectAll("*")
                            .remove();

                        var svg = d3.select('#pie')
                            .append('svg')
                            .attr('width', width)
                            .attr('height', height)
                            .append('g')
                            .attr('transform', 'translate(' + (width / 2) + ',' + (height / 2) + ')');


                        var arc = d3.svg.arc()
                            .outerRadius(outradius)
                            .innerRadius(inradius);

                        var pie = d3.layout.pie()
                            .value(function(d, i) {
                                return d.Value;
                            })
                            .sort(null)
                            .padAngle(.02);

                        var path = svg.selectAll('path')
                            .data(pie(newDataEconomy))
                            .enter()
                            .append('path')
                            .attr('d', arc)
                            .attr('fill', function(d, i) {
                                return color(d.data.Name);
                            })
                            .each(function(d) {
                                this._current = d;
                            });

                        path.transition()
                            .duration(1000)
                            .attrTween('d', function(d) {
                                var interpolate = d3.interpolate({
                                    startAngle: 0,
                                    endAngle: 0
                                }, d);
                                return function(t) {
                                    return arc(interpolate(t));
                                };
                            });

                        var text = svg.selectAll('text')
                            .data(pie(newDataEconomy))
                            .enter()
                            .append("text")
                            .transition()
                            .duration(200)
                            .attr("transform", function(d) {
                                return "translate(" + arc.centroid(d) + ")";
                            })
                            .attr("dy", ".4em")
                            .attr("text-anchor", "middle")
                            .text(function(d) {
                                return d.data.Value + "%";
                            })
                            .style({
                                fill: '#fff',
                                'font-size': '10px'
                            });

                        var legend = svg.selectAll('.legend')
                            .data(color.domain())
                            .enter()
                            .append('g')
                            .attr('class', 'legend')
                            .attr('transform', function(d, i) {
                                var height = legendSize + legendSpace;
                                var offset = height * color.domain().length / 2;
                                var horiz = -3 * legendSize;
                                var vert = i * height - offset;
                                return 'translate(' + horiz + ',' + vert + ')';
                            });

                        legend.append('rect')
                            .attr('width', legendSize)
                            .attr('height', legendSize)
                            .style('fill', color)
                            .style('stroke', color)
                            .on('click', function(label) {
                                var rect = d3.select(this);
                                var enabled = true;
                                var totalEnabled = d3.sum(newDataEconomy.map(function(d) {
                                    return (d.enabled) ? 1 : 0;
                                }));
                            });

                        legend.append('text')
                            .attr('x', legendSize + legendSpace)
                            .attr('y', legendSize - legendSpace)
                            .text(function(d) {
                                return d;
                            })

                        var svg = d3.select('#pie2')
                            .append('svg')
                            .attr('width', width)
                            .attr('height', height)
                            .append('g')
                            .attr('transform', 'translate(' + (width / 2) + ',' + (height / 2) + ')');


                        var arc = d3.svg.arc()
                            .outerRadius(outradius)
                            .innerRadius(inradius);

                        var pie = d3.layout.pie()
                            .value(function(d, i) {
                                return d.Value;
                            })
                            .sort(null)
                            .padAngle(.02);

                        var path = svg.selectAll('path')
                            .data(pie(newDataEmployment))
                            .enter()
                            .append('path')
                            .attr('d', arc)
                            .attr('fill', function(d, i) {
                                return color(d.data.Name);
                            })
                            .each(function(d) {
                                this._current = d;
                            });

                        path.transition()
                            .duration(1000)
                            .attrTween('d', function(d) {
                                var interpolate = d3.interpolate({
                                    startAngle: 0,
                                    endAngle: 0
                                }, d);
                                return function(t) {
                                    return arc(interpolate(t));
                                };
                            });

                        var text = svg.selectAll('text')
                            .data(pie(newDataEmployment))
                            .enter()
                            .append("text")
                            .transition()
                            .duration(200)
                            .attr("transform", function(d) {
                                return "translate(" + arc.centroid(d) + ")";
                            })
                            .attr("dy", ".4em")
                            .attr("text-anchor", "middle")
                            .text(function(d) {
                                return d.data.Value + "%";
                            })
                            .style({
                                fill: '#fff',
                                'font-size': '10px'
                            });


                        var legend = svg.selectAll('.legend')
                            .data(color.domain())
                            .enter()
                            .append('g')
                            .attr('class', 'legend')
                            .attr('transform', function(d, i) {
                                var height = legendSize + legendSpace;
                                var offset = height * color.domain().length / 2;
                                var horiz = -3 * legendSize;
                                var vert = i * height - offset;
                                return 'translate(' + horiz + ',' + vert + ')';
                            });

                        legend.append('rect')
                            .attr('width', legendSize)
                            .attr('height', legendSize)
                            .style('fill', color)
                            .style('stroke', color)
                            .on('click', function(label) {
                                var rect = d3.select(this);
                                var enabled = true;
                                var totalEnabled = d3.sum(newDataEmployment.map(function(d) {
                                    return (d.enabled) ? 1 : 0;
                                }));
                            });

                        legend.append('text')
                            .attr('x', legendSize + legendSpace)
                            .attr('y', legendSize - legendSpace)
                            .text(function(d) {
                                return d;
                            });
                    });
                }
            });
        }

        function drawBubbleMap() {

            var bubbleDensity = [];
            var rad = 0;
            for(var i = 0 ; i < data.length; i++)
            {
                if(data[i].Population_density > 1000)
                    rad=20;
                else if(data[i].Population_density > 400)
                    rad=15;
                else if(data[i].Population_density > 100)
                    rad=10;
                else if(data[i].Population_density > 50)
                    rad=5;
                else if(data[i].Population_density >= 0)
                    rad=3;
                bubbleDensity.push({centered: data[i].id , density : data[i].Population_density , radius : rad, fillKey: data[i].Country})
            }

            d3.select("#map")
                .selectAll("*")
                .remove();
            d3.select("#pie")
                .selectAll("*")
                .remove();
            d3.select("#pie2")
                .selectAll("*")
                .remove();

            var bubble_map = new Datamap({
                element: document.getElementById("map"),
                scope : 'world',
                geographyConfig: {
                    highlightOnHover: false,
                    highlightFillColor: function(data) {
                        if (data.fillKey) {
                            return 'white';
                        }
                        return 'blue';
                    },
                    highlightBorderColor: 'grey',
                    highlightBorderWidth: 1,
                    popupOnHover: false,
                    borderColor: '#dbdbdb',
                    borderWidth: 0.5,
                    borderOpacity: 1
                },
                dataUrl: 'data/data_density.csv',
                dataType: 'csv',
                data: {},
                fills: {
                    defaultFill: '#2c3e50'
                },
            });
            bubble_map.bubbles(bubbleDensity, 
            {
                popupTemplate: function(geo, data) {
                    return '<div class="hoverinfo" > Country: ' + data.fillKey + '<br>Density: ' + data.density + '</div>'
                }
            });
        }
    });
});