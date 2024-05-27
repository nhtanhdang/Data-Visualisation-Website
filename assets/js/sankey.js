// Declare global variables
let sankeyData, graph, svg, sankey, formatNumber, format, color;

// Load and process the data
d3.csv("data/sankey_data.csv").then(function(data) {
    data.forEach(function(d) {
      d.source = d.source;
      d.target = d.target;
      d.value = parseFloat(d.value);
    });

    // Wait for DOM content to load
    document.addEventListener('DOMContentLoaded', () => {
      // Get the continent, country, and year select elements
      const continentSelect = document.getElementById('sankey-continent-select');
      const countrySelect = document.getElementById('sankey-country-select');
      const yearSelect = document.getElementById('sankey-year-select');
      const foodSelect = document.getElementById('sankey-food-select');

      // Set up event listener for continent selection
      continentSelect.addEventListener('change', () => {
        // Update country dropdown based on selected continent
        updateCountryDropdown(continentSelect, countrySelect);
      });

      // Initial render with default values
      processData(data, yearSelect, countrySelect, continentSelect, foodSelect);
      renderSankey();

      // Set up event listener for window resize
      window.addEventListener('resize', () => {
        processData(data, yearSelect, countrySelect, continentSelect, foodSelect);
        renderSankey();
      });

      // Set up event listener for filter button click
      const filterButton = document.getElementById('sankeyFilterButton');
      filterButton.addEventListener('click', () => {
        processData(data, yearSelect, countrySelect, continentSelect, foodSelect);
        renderSankey();
      });

    });
  }).catch(error => {
    console.error('Error loading data:', error);
});


function updateCountryDropdown(continentSelect, countrySelect) {
  // Country options based on selected continent
  const countryOptions = {
    'Asia': ['India', 'Japan', 'Indonesia', 'Israel'],
    'Africa': ['South Africa'],
    'Australia': ['Australia', 'New Zealand'],
    'Western Europe': ['Austria', 'Belgium', 'France', 'Germany', 'Ireland', 'Luxembourg', 'Netherlands', 'Switzerland'],
    'Eastern Europe': ['Czechia', 'Hungary', 'Poland', 'Estonia', 'Slovenia', 'Latvia', 'Lithuania', 'Romania', 'Bulgaria', 'Croatia'],
    'Northern Europe': ['Denmark', 'Finland', 'Iceland', 'Norway', 'Sweden'],
    'Southern Europe': ['Greece', 'Italy', 'Portugal', 'Spain'],
    'North America': ['Canada', 'Mexico', 'Costa Rica'],
    'South America': ['Brazil', 'Chile', 'Colombia', 'Argentina', 'Peru']
  };

  // Clear existing country options
  countrySelect.innerHTML = '';

  const selectedContinent = continentSelect.value;

 // Clear existing country options
  countrySelect.innerHTML = '';

  // Add "All" option
  const allOption = document.createElement('option');
  allOption.value = 'all';
  allOption.text = 'All';
  countrySelect.add(allOption);

  // Add new country options based on selected continent
  countryOptions[selectedContinent].forEach(country => {
    const option = document.createElement('option');
    option.value = country.toLowerCase();
    option.text = country;
    countrySelect.add(option);
  });
}

// Function to process the data
function processData(data, yearSelect, countrySelect, continentSelect, foodSelect) {
  const desiredYear = yearSelect.value.toLowerCase();
  const desiredContinent = continentSelect.value.toLowerCase();
  const desiredCountry = countrySelect.value.toLowerCase();
  const desiredFoodGroup = foodSelect.value.toLowerCase();


  sankeyData = { nodes: [], links: [] };

 if (desiredCountry == 'all') {
    data.forEach(function(d) {
    // Check if the target field includes the desired year and continent
    if (d.target.includes(desiredYear) 
        && d.target.toLowerCase().includes(desiredContinent)
        && desiredFoodGroup.includes(d.source.toLowerCase()) 
    ) {
      sankeyData.nodes.push({ name: d.source });
      sankeyData.nodes.push({ name: d.target });
      sankeyData.links.push({ source: d.source, target: d.target, value: +d.value });
    }
  }); } else {
    data.forEach(function(d) {
      const targetParts = d.target.split('-');
      // Check if the target field includes the desired year and country
      if (d.target.includes(desiredYear) 
          && targetParts[1].toLowerCase().includes(desiredCountry)
          && desiredFoodGroup.includes(d.source.toLowerCase()) 
        ) {
        sankeyData.nodes.push({ name: d.source });
        sankeyData.nodes.push({ name: d.target });
        sankeyData.links.push({ source: d.source, target: d.target, value: +d.value });
      }
  }); }


  

  // Remove duplicate nodes
  sankeyData.nodes = Array.from(
    d3.group(sankeyData.nodes, (d) => d.name),
    ([value]) => value
  );

  // Convert node names to indices
  sankeyData.links.forEach(function(d, i) {
    sankeyData.links[i].source = sankeyData.nodes.indexOf(sankeyData.links[i].source);
    sankeyData.links[i].target = sankeyData.nodes.indexOf(sankeyData.links[i].target);
  });

  // Convert nodes to objects
  sankeyData.nodes.forEach(function(d, i) {
    sankeyData.nodes[i] = { name: d };
  });
}

// Function to render the Sankey diagram
function renderSankey() {
  d3.select('#sankey').selectAll('*').remove();

  // Set up dimensions and margins
  const container = d3.select('#sankey');
  const width = container.node().getBoundingClientRect().width;
  const height = container.node().getBoundingClientRect().height;
  const margin = { top: 20, right: 20, bottom: 40, left: 40 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Format variables
  formatNumber = d3.format(",.0f"); // zero decimal places
  format = function(d) { return formatNumber(d); };
  color = d3.scaleOrdinal(d3.schemeTableau10);

  // Append SVG and group
  svg = d3.select("#sankey").append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  // Set the Sankey diagram properties
  sankey = d3.sankey()
    .nodeWidth(36)
    .nodePadding(40)
    .size([innerWidth, innerHeight]);

  // Calculate the layout
  graph = sankey(sankeyData);

  // Render links
  const link = svg.append("g")
    .selectAll(".link")
    .data(graph.links)
    .enter().append("path")
    .attr("class", "link")
    .attr("d", d3.sankeyLinkHorizontal())
    .attr("stroke-width", (d) => d.width)
    .on('mouseover', function(event, d) {

      // Show the tooltip
      tooltip
        .style('opacity', 1)
        .html( function() {
          if (d.source.name == 'Fat' | d.source.name == 'Protein') {
            return `${d.source.name}: ${format(d.value)} grams`;
          } else {
            return `${d.source.name}: ${format(d.value)} kilograms`;
          }
        })
        .style('left', `${event.pageX + 10}px`)
        .style('top', `${event.pageY - 28}px`);
    })
    .on('mouseout', function() {
      // Hide the tooltip
      tooltip.style('opacity', 0);
    });

  // Render nodes
  const node = svg.append("g")
    .selectAll(".node")
    .data(graph.nodes)
    .enter().append("g")
    .attr("class", "node");

  // Add node rectangles
  node.append("rect")
    .attr("x", (d) => d.x0)
    .attr("y", (d) => d.y0)
    .attr("height", (d) => d.y1 - d.y0)
    .attr("width", sankey.nodeWidth())
    .style("fill", (d) => {
      d.color = color(d.name.replace(/ .*/, ""));
      return d.color;
    })
    .append("title")
    .text((d) => `${d.name}\n${format(d.value)}`);

  // Add node labels
  node.append("text")
    .attr("x", (d) => (d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6))
    .attr("y", (d) => (d.y1 + d.y0) / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", (d) => (d.x0 < width / 2 ? "start" : "end"))
    .text((d) => d.name);

  // Create a tooltip container
  const tooltip = d3.select('body')
    .append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0)
    .style('position', 'absolute')
    .style('background-color', 'rgba(0, 0, 0, 0.8)')
    .style('color', 'white')
    .style('padding', '5px')
    .style('border-radius', '5px')
    .style('pointer-events', 'none');
}

