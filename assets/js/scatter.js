// Load data from CSV file
d3.csv('data/data.csv').then(data => {

  data.forEach(function(d) {
    d.Country = d.Country;
    d.Year = parseInt(d.Year);
    d.Fat = parseFloat(d.Fat);
    d.Protein = parseFloat(d.Protein);
    d.Fruit = parseFloat(d.Fruit);
    d.Sugar = parseFloat(d.Sugar);
    d.Veg = parseFloat(d.Veg);
    d.Obesity = parseFloat(d.Obesity);
    d.Continent = d.Continent;
    d.ObesityRateCategory = d.ObesityRateCategory;
  });

  // Wait for DOM content to load
  document.addEventListener('DOMContentLoaded', () => {
    // Get the continent and country select elements
    const continentSelect = document.getElementById('continent-select');
    const countrySelect = document.getElementById('country-select');
    const foodSelect = document.getElementById('food-select');

    // Set up event listener for continent selection
    continentSelect.addEventListener('change', () => {
      // Update country dropdown based on selected continent
      updateCountryDropdown(continentSelect, countrySelect);
    });

    // Default graph
    filterScatterPlot(data, continentSelect, countrySelect, foodSelect);

    // Set up event listener for window resize
    window.addEventListener('resize', () => {
      filterScatterPlot(data, continentSelect, countrySelect, foodSelect);
    });

    // Set up event listener for filter button click
    const filterButton = document.getElementById('filterButton');
    filterButton.addEventListener('click', () => {
      filterScatterPlot(data, continentSelect, countrySelect, foodSelect);
    });

  });
}).catch(error => {
  console.error('Error loading data:', error);
});

// Set up event listeners for filtering
function filterScatterPlot(data, continentSelect, countrySelect, foodSelect) {
    const selectedContinent = continentSelect.value.toLowerCase();
    const selectedCountry = countrySelect.value.toLowerCase();
    const selectedFood = foodSelect.value;

    const filteredData = data.filter(d => {
      const country = d.Country.toLowerCase();
      const continent = d.Continent.toLowerCase();
      if (selectedCountry == 'all') {
        return continent === selectedContinent;
      }
      else {
        return country === selectedCountry;
      }
    });

    // Update the visualization with the filtered data
    createScatterPlot(filteredData, selectedFood);
}

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

// Create the scatter plot visualization
function createScatterPlot(data, selectedFood) {
  // Remove existing SVG elements
  d3.select('#scatterplot').selectAll('*').remove();

  // Define a color palette
  const palette = d3.scaleOrdinal(d3.schemeTableau10);

  // Get the dimensions of the container
  const container = d3.select('#scatterplot');
  const width = container.node().getBoundingClientRect().width;
  const height = container.node().getBoundingClientRect().height;

  // Set up margins
  const margin = { top: 100, right: 60, bottom: 80, left: 80 };

  // Calculate the inner dimensions of the plot
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Set up scales
  const x = d3.scaleLinear()
    .range([0, innerWidth])
    .domain(d3.extent(data, d => d.Year));
  const y = d3.scaleLinear()
    .range([innerHeight, 0])
    .domain([d3.min(data, d => d[selectedFood]), d3.max(data, d => d[selectedFood])]);

  // Create the SVG container
  const svg = container.append('svg')
    .attr('width', width)
    .attr('height', height);

  // Add X and Y axes
  const xAxis = svg.append('g')
    .attr('transform', `translate(${margin.left}, ${innerHeight + margin.top})`)
    .call(d3.axisBottom(x).tickFormat(d3.format('d')));
  const yAxis = svg.append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)
    .call(d3.axisLeft(y));

  // Add X and Y axis labels
  svg.append('text')
    .attr('class', 'scatter-label')
    .attr('x', width / 2)
    .attr('y', height - margin.bottom / 2)
    .attr('text-anchor', 'middle')
    .text('Year');
  svg.append('text')
    .attr('class', 'scatter-label')
    .attr('x', -height / 2)
    .attr('y', margin.left / 4)
    .attr('text-anchor', 'middle')
    .attr('transform', 'rotate(-90)')
    .text(function() {
      if (selectedFood == 'Protein' | selectedFood == 'Fat' ) {
        return selectedFood + ' (grams)';
      } 
      else if (selectedFood == 'Veg') {
        return  'Vegetables (kilograms)';
      } 
      else {
        return selectedFood + ' (kilograms)';
      }
      
    });

  // Create the scatter plot
  const countries = [...new Set(data.map(d => d.Country))];
  
  // Define a mapping between obesity rate categories and dot sizes
  const sizeMapping = {
    'Low': 5,
    'Medium': 10,
    'High': 15
  };
  
  /// Create the lines connecting consecutive data points
  const line = d3.line()
  .x(d => x(d.Year))
  .y(d => y(d[selectedFood]));

  const linesGroup = svg.append('g')
  .attr('transform', `translate(${margin.left}, ${margin.top})`);

  const lines = linesGroup.selectAll('.line')
  .data(countries)
  .join('path')
  .attr('class', 'line')
  .attr('d', country => line(data.filter(d => d.Country === country)))
  .attr('stroke', country => palette(countries.indexOf(country)));

  // Draw dots after lines
  const dotsGroup = svg.append('g')
  .attr('transform', `translate(${margin.left}, ${margin.top})`);

  const dots = dotsGroup.selectAll('.dot')
  .data(data)
  .join('circle')
  .attr('class', 'dot')
  .attr('cx', d => x(d.Year))
  .attr('cy', d => y(d[selectedFood]))
  .attr('r', d => sizeMapping[d.ObesityRateCategory])
  .attr('fill', d => palette(countries.indexOf(d.Country)))
  .attr('opacity', 0.95)
  .on('mouseover', function(event, d) {
    // Show the tooltip
    tooltip
      .style('opacity', 1)
      .html( function() {
          if (selectedFood == 'Protein' | selectedFood == 'Fat' ) {
            return `Country: ${d.Country}<br>Year: ${d.Year}<br>${selectedFood}: ${d[selectedFood]}g<br>Obesity Rate: ${d.Obesity}%`;
          } 
          else {
            return `Country: ${d.Country}<br>Year: ${d.Year}<br>${selectedFood}: ${d[selectedFood]}kg<br>Obesity Rate: ${d.Obesity}%`;
          }
        })
      .style('left', `${event.pageX + 10}px`)
      .style('top', `${event.pageY - 28}px`);
  })
  .on('mouseout', function() {
    // Hide the tooltip
    tooltip.style('opacity', 0);
  });

  // Add a legend
    const legend = svg.append('g')
    .attr('transform', `translate(${margin.left + 20}, ${margin.top / 2})`);

    const legendItems = legend.selectAll('.legend')
    .data(countries)
    .join('g')
    .attr('class', 'legend')
    .attr('transform', (d, i) => {
      const row = Math.floor(i / (countries.length / 3)); // Calculate the row index
      const col = i % (countries.length / 3); // Calculate the column index
      return `translate(${col * 100}, ${row * 20})`;
    });

    legendItems
    .call(g => g.append('circle')
      .attr('r', 5)
      .attr('fill', (d, i) => palette(i)))
    .call(g => g.append('text')
      .attr('class', 'legend-text')
      .attr('x', 10)
      .attr('y', 5)
      .text(d => d));
      
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