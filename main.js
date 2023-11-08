let svg = d3.select("#svg");
let keyframeIndex = 0;
let chart;
let chartWidth;
let chartHeight;
let xScale;
let yScale;
const width = 1440;
const height = 750;

let keyframes = [
    {
        activeVerse: 1,
        activeLines: [1,2,3,4], 
        svgUpdate: () => drawDisplacementLineChart(displacementData) 
    },
    {
        activeVerse: 2,
        activeLines: [1,2,3,4], 
        svgUpdate: () => drawPieChart(octSevenData) 
    },
    {
        activeVerse: 3,
        activeLines: [1,2,3,4], 
        svgUpdate: () => drawBarChart(deathsData) 
    },
    {
        activeVerse: 4,
        activeLines: [1,2], 
        svgUpdate: () => drawBarChart(deathsData) 
    }
]

// Initialise two global variables to store the data when it is loaded
let octSevenData;
let displacementData;
let deathsData;

// You have to use the async keyword so that javascript knows that this function utilises promises and may not return immediately
async function loadData() {
    
    await d3.json("data/octSeven.json").then(data => {
        
        octSevenData = data;
    });

    await d3.json("data/displacement.json").then(data => {
        displacementData = data;
    });

    await d3.json("data/deaths.json").then(data => {
        deathsData = data;
    });
}

function drawPieChart(data) {
    // Clear the current SVG content
    svg.selectAll("*").remove();

    // Set the dimensions and margins of the graph
    const width = 600; // Updated dimensions
    const height = 500;
    const margin = { top: 50, right: 30, bottom: 30, left: 20 }; // Added margins
    const radius = Math.min(width - margin.left - margin.right, height - margin.top - margin.bottom) / 2;

    // Move the center of the pie chart to the center of the SVG content area
    const g = svg.append("g")
                 .attr("transform", `translate(${margin.left + radius},${margin.top + radius})`);

    // Create a custom color scale
    const color = d3.scaleOrdinal()
                    .domain(data.map(d => d.category))
                    .range(["#FFFFFF", "#009736", "#000000", "#EE2A35"]); // Custom colors for each category

    // Calculate the total count for percentage calculation
    const totalCount = d3.sum(data, d => d.count);

    // Generate the pie
    const pie = d3.pie()
                  .value(d => d.count)(data);

    // Generate the arcs
    const arc = d3.arc()
                  .innerRadius(0)
                  .outerRadius(radius);

    // Function to choose the text color based on slice color for better visibility
    const textColor = (color) => {
        // A simple threshold to determine if the color is light or dark
        return (color === "#FFFFFF" || color === "#009736") ? "#000000" : "#FFFFFF";
    };

    // Append arcs for the pie slices
    const slices = g.selectAll(".arc")
                    .data(pie)
                    .enter().append("g")
                    .attr("class", "arc");

    slices.append("path")
          .attr("d", arc)
          .attr("fill", d => color(d.data.category));

    // Append text labels inside the pie slices
    slices.append("text")
          .attr("transform", d => `translate(${arc.centroid(d)})`)
          .attr("dy", "0.35em")
          .attr("text-anchor", "middle")
          .style("fill", d => textColor(color(d.data.category)))
          .text(d => `${((d.data.count / totalCount) * 100).toFixed(1)}%`);

    // Draw the chart title in the center of the SVG
    svg.append("text")
       .attr("x", (width / 2))
       .attr("y", margin.top / 2)
       .attr("text-anchor", "middle")
       .style("font-size", "18px")
       .style("fill", "#FFFFDD")
       .text("Injuries and Fatalities from the October 7th, 2023 Bombing");

    // Append the legend on the right side of the SVG
    const legendG = svg.selectAll(".legend")
                      .data(color.domain())
                      .enter().append("g")
                      .attr("class", "legend")
                      .attr("transform", (d, i) => `translate(${width - margin.right - 150},${margin.top + i * 20})`);

    legendG.append("rect")
          .attr("width", 18)
          .attr("height", 18)
          .attr("fill", color);

    legendG.append("text")
          .attr("x", 24)
          .attr("y", 9)
          .attr("dy", ".35em")
          .style("fill", "#FFFFDD")
          .text(d => d);
}

function drawBarChart(data) {
    // Clear the current svg content
    svg.selectAll("*").remove();
    
    // Set up margins and graph width/height
    const width = 600; // Updated dimensions
    const height = 500;
    const margin = {top: 30, right: 30, bottom: 70, left: 40};
    chartWidth = width - margin.left - margin.right;
    chartHeight = height - margin.top - margin.bottom;
    
    // Append a new group element to svg with the appropriate transformations
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Create the yScale for the vertical axis
    yScale = d3.scaleLinear()
               .domain([0, d3.max(data, d => d.count)])
               .range([chartHeight, 0]);

    // Create the xScale for the horizontal axis
    xScale = d3.scaleBand()
               .domain(data.map(d => d.category))
               .range([0, chartWidth])
               .padding(0.1);

    // Define the tooltip for the bar chart
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // Append the bars for the bar chart
    g.selectAll(".bar")
     .data(data)
     .enter().append("rect")
     .attr("class", "bar")
     .attr("x", d => xScale(d.category))
     .attr("y", d => yScale(d.count))
     .attr("width", xScale.bandwidth())
     .attr("height", d => chartHeight - yScale(d.count))
     .on("mouseover", function(event, d) {
        tooltip.transition()
            .duration(200)
            .style("opacity", .9);
        tooltip.html(`Fatalities: ${d.count}`)
            .style("left", (event.pageX) + "px")
            .style("top", (event.pageY - 28) + "px");
     })
     .on("mouseout", function(d) {
        tooltip.transition()
            .duration(500)
            .style("opacity", 0);
     });

    // Add the x-axis
    g.append("g")
     .attr("transform", `translate(0,${chartHeight})`)
     .call(d3.axisBottom(xScale))
     .selectAll("text")
       .attr("transform", "translate(-10,0)rotate(-45)")
       .style("text-anchor", "end");

    // Add the y-axis
    g.append("g")
     .call(d3.axisLeft(yScale));

    // Add a title to the chart
    svg.append("text")
        .attr("x", (width / 2))             
        .attr("y", margin.top / 2)
        .attr("text-anchor", "middle")  
        .attr("fill", "#FFFFDD")
        .style("font-size", "18px")   
        .text("Palestinian Fatalities Before Oct. 7th Bombings");
}

async function initialise() {

    await loadData();
    console.log(displacementData);
    initialiseSVG(displacementData);
    drawKeyframe(keyframeIndex);

    makeRedClickable();
}

function makeRedBarHoverable() {
    // Select the bar associated with the "red" value
    const redBar = chart.select(".bar").filter(d => d.colour === "Red");

    // Add a click event listener to toggle the class
    redBar.on("click", function() {
        // Toggle the 'red-text' class to color the 'red' word in the poem
        const isRed = d3.selectAll(".red-word").classed("red-text");
        d3.selectAll(".red-word").classed("red-text", !isRed);
    });
};

function drawDisplacementLineChart(data) {
    svg.attr("width", 600);
    svg.attr("height", 500);

    // Clear the current SVG content
    svg.selectAll("*").remove();

    // Set the dimensions and margins of the graph
    const margin = {top: 10, right: 30, bottom: 30, left: 60},
          width = 600 - margin.left - margin.right,
          height = 500 - margin.top - margin.bottom;

    // Append a group element to the SVG with the appropriate transformation
    const chartGroup = svg.append("g")
                          .attr("transform", `translate(${margin.left},${margin.top})`);

    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);      
        
    // Convert 'Year' strings to integers
    data.forEach(function(d) {
        d.Year = parseInt(d.Year, 10); // Convert year from string to integer
    });    

    // Add X axis
    const x = d3.scaleLinear()
                .domain(d3.extent(data, d => d.Year))
                .range([0, width]);
                
    chartGroup.append("g")
              .attr("transform", `translate(0,${height})`)
              .call(d3.axisBottom(x));

    // Add Y axis
    const y = d3.scaleLinear()
                .domain([0, d3.max(data, d => +d.count)])
                .range([height, 0]);
    
    chartGroup.append("g")
              .call(d3.axisLeft(y));

    // Add the line
    const line = d3.line()
                   .x(d => x(d.Year))
                   .y(d => y(d.count));

    chartGroup.append("path")
              .datum(data)
              .attr("fill", "none")
              .attr("stroke", "#FFFFDD")
              .attr("stroke-width", 1.5)
              .attr("d", line);

    // Add a transparent overlay for the tooltip
    chartGroup.append("rect")
              .attr("class", "overlay")
              .attr("width", width)
              .attr("height", height)
              .style("fill", "none")
              .style("pointer-events", "all")
              .on("mousemove", mousemove)
              .on("mouseout", function() {
                  tooltip.style("opacity", 0);
              });

    function mousemove(event) {
        const [mouseX, mouseY] = d3.pointer(event),
              x0 = x.invert(mouseX),
              i = d3.bisector(d => d.Year).left(data, x0, 1),
              d0 = data[i - 1],
              d1 = data[i] || d0,
              d = x0 - d0.Year > d1.Year - x0 ? d1 : d0,
              lineY = y(d.count);

        // Check if mouseY is within a certain range from lineY
        if (Math.abs(mouseY - lineY) <= 10) { // 10 is the sensitivity range; adjust as needed
            tooltip.html(`Displaced: ${d.count}`)
                   .style("left", (event.pageX) + "px")
                   .style("top", (event.pageY - 28) + "px")
                   .style("opacity", .9);
        } else {
            tooltip.style("opacity", 0);
        }
    }

    // Add chart title
    chartGroup.append("text")
              .attr("x", (width / 2))             
              .attr("y", margin.top / 2)
              .attr("text-anchor", "middle")  
              .style("font-size", "18px") 
              .style("text-decoration", "bold")  
              .style("fill", "#FFFFDD")
              .text("Palestinian Displacement (2009-2023)");     
    
    // Add chart subtitle for min value
    chartGroup.append("text")
              .attr("x", (width / 6))             
              .attr("y", margin.top / 2 + 30)
              .attr("text-anchor", "middle")  
              .style("font-size", "18px") 
              .style("text-decoration", "bold")  
              .style("fill", "#FFFFDD")
              .text("Min: 12000");  
    
    // Add chart subtitle for max value
    chartGroup.append("text")
              .attr("x", (width / 6))             
              .attr("y", margin.top / 2 + 50)
              .attr("text-anchor", "middle")  
              .style("font-size", "18px") 
              .style("text-decoration", "bold")  
              .style("fill", "#FFFFDD")
              .text("Max: 423000"); 
}     

document.getElementById("forward-button").addEventListener("click", forwardClicked);
document.getElementById("backward-button").addEventListener("click", backwardClicked);

function forwardClicked() {
    if (keyframeIndex < keyframes.length - 1) {
      keyframeIndex++;
      drawKeyframe(keyframeIndex);
    }
  }
  
  function backwardClicked() {
    if (keyframeIndex > 0) {
      keyframeIndex--;
      drawKeyframe(keyframeIndex);
    }
  }

  function initialiseSVG(data) {

        const rightColumn = d3.select('.right-column');
    
        // Get the width of the right column to set the SVG width
        const rightColumnWidth = rightColumn.node().getBoundingClientRect().width-30;
    
        // Define the SVG height, which could be a fixed size or dynamically calculated
        const svgHeight = 800; // for example, you can adjust this based on your layout
    
    
        // Set the dimensions and margins of the graph
        const margin = {top: 10, right: 30, bottom: 30, left: 60},
            width = rightColumnWidth - margin.left - margin.right,
            height = svgHeight - margin.top - margin.bottom;
    
        // Append the svg object to the body of the page
        const svg = d3.select("#svg")
          .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
          .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
    
        // Add X axis --> it is a date format
        const x = d3.scaleBand()
          .domain(data.map(d => d.Year))
          .range([0, width])
          .padding(0.1);
    
        svg.append("g")
          .attr("transform", `translate(0,${height})`)
          .call(d3.axisBottom(x));
    
        // Add Y axis
        const y = d3.scaleLinear()
          .domain([0, d3.max(data, d => +d.count)])
          .range([height, 0]);
        
        svg.append("g")
          .call(d3.axisLeft(y));
    
        // Add the line
        svg.append("path")
          .datum(data)
          .attr("fill", "none")
          .attr("stroke", "steelblue")
          .attr("stroke-width", 1.5)
          .attr("d", d3.line()
            .x(d => x(d.Year) + x.bandwidth() / 2) // center the line in the band
            .y(d => y(d.count))
          );    
}    

function drawKeyframe(kfi) {
    let kf = keyframes[kfi];

    resetActiveLines();
    updateActiveVerse(kf.activeVerse);

    for (line of kf.activeLines) {
        updateActiveLine(kf.activeVerse, line);
    }

    // We need to check if their is an svg update function defined or not
    if(kf.svgUpdate){
        // If there is we call it like this
        kf.svgUpdate();
    }
}

  function resetActiveLines() {
    // Reset the active-line class for all of the lines
    d3.selectAll(".line").classed("active-line", false);
  }
    
  function updateActiveLine(vid, lid) {
    // Select the correct verse
    let thisVerse = d3.select("#verse" + vid);
    // Update the class list of the relevant lines
    thisVerse.select("#line" + lid).classed("active-line", true);
  }

  function updateActiveVerse(id) {
    // Reset the current active verse - in some scenarios you may want to have more than one active verse, but I will leave that as an exercise for you to figure out
    d3.selectAll(".verse").classed("active-verse", false);

    // Update the class list of the desired verse so that it now includes the class "active-verse"
    d3.select("#verse" + id).classed("active-verse", true);

    // Scroll the column so the chosen verse is centred
    scrollLeftColumnToActiveVerse(id);
}

function scrollLeftColumnToActiveVerse(id) {
    var leftColumn = document.querySelector(".left-column-content");
    var activeVerse = document.getElementById("verse" + id);
    var verseRect = activeVerse.getBoundingClientRect();
    var leftColumnRect = leftColumn.getBoundingClientRect();
    var desiredScrollTop = verseRect.top + leftColumn.scrollTop - leftColumnRect.top - (leftColumnRect.height - verseRect.height) / 2;
    leftColumn.scrollTo({
        top: desiredScrollTop,
        behavior: 'smooth'
    })
}

initialise();