// Load the external data
Promise.all([
    d3.json('assets/json/countries.json'), // Ensure this is the path to your TopoJSON file
    d3.csv('data/data.csv') // Ensure this is the path to your CSV data
]).then(function([mapData, csvData]) {
    csvData.forEach(function(d) {
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

    const svg = d3.select('#map').append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .style('display', 'block');

    let width, height, projection, path;

    // Update dimensions function
    function updateDimensions() {
        width = document.getElementById('map').clientWidth;
        height = document.getElementById('map').clientHeight;
        projection = d3.geoMercator().fitSize([width, height], mapData);
        path = d3.geoPath().projection(projection);
        svg.attr('width', width).attr('height', height);
    }

    updateDimensions();

    // Set up event listener for window resize
    window.addEventListener('resize', () => {
        updateDimensions();
        updateMap()
    });

    // Tooltip setup
    const tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0)
        .style('position', 'absolute')
        .style('padding', '10px')
        .style('background', 'rgba(0, 0, 0, 0.8)')
        .style('color', 'white')
        .style('pointer-events', 'none');

    // Process CSV data
    let dataByCountryYear = {};
    csvData.forEach(d => {
        const key = `${d.Country}-${d.Year}`;
        dataByCountryYear[key] = d; // Store whole data row
    });

    // Define continent coordinates and scales for zooming
    const continents = {
        'All': { center: [0, 0], scale: 130 }, // Default view
        'Australia': { center: [134.491000, -25.732887], scale: 500 },
        'Europe': { center: [9.2551, 54.5260], scale: 500 },
        'Asia': { center: [70.6197, 34.0479], scale: 300 },
        'North America': { center: [-101.0000, 41.0000], scale: 500 },
        'South America': { center: [-58.3816, -34.6037], scale: 400 },
        'Africa': { center: [21.7587, 0], scale: 500 }
    };

    // Update map function
    function updateMap() {

        const selectedYear = document.getElementById('map-year-select').value;
        const selectedDataType = document.querySelector('input[name="data"]:checked').value;
        const selectedContinent = document.querySelector('input[name="continent"]:checked').value;

        // Set projection based on selected continent
        const center = continents[selectedContinent].center;
        const scale = continents[selectedContinent].scale;
        projection = d3.geoMercator().scale(scale).center(center).translate([width / 2, height / 2]);
        path = d3.geoPath().projection(projection);

        svg.selectAll('.country')
            .data(mapData.features)
            .join('path')
            .attr('class', 'country')
            .attr('d', path)
            .attr('fill', d => {
                const data = dataByCountryYear[`${d.properties.name}-${selectedYear}`];
                return data ? getColor(data[selectedDataType], selectedDataType) : '#ccc';
            })
            .attr('stroke', 'white')
            .on('mouseover', function(event, d) {
                svg.selectAll('.country').style('opacity', 0.5); // Make all countries more transparent
                d3.select(this).style('opacity', 1).classed('active', true); // Highlight the hovered country

                const key = `${d.properties.name}-${selectedYear}`;
                const data = dataByCountryYear[key];
                if (data) {
                    tooltip.style('opacity', 1)
                        .html(`Country: ${d.properties.name}<br>Year: ${data.Year}<br>${selectedDataType}: ${data[selectedDataType]}`)
                        .style('left', `${event.pageX + 20}px`)
                        .style('top', `${event.pageY + 20}px`);
                }
            })
            .on('mouseout', function() {
                svg.selectAll('.country').style('opacity', 1); // Reset opacity when mouse leaves
                d3.select(this).classed('active', false);
                tooltip.style('opacity', 0);
            });

        // Refresh map
        svg.selectAll('.country')
            .transition()
            .attr('d', path);
    }

    // Set initial values and update the map initially
    document.getElementById('continent-all').checked = true;
    document.getElementById('year-2020').checked = true;
    document.getElementById('data-fat').checked = true;
    updateMap(); // Load the map with initial settings
  

    // Display button event listener
    document.getElementById('display').addEventListener('click', updateMap);


// Function to get color based on data type and value
function getColor(value, type) {
    const scales = {
        'Fat': d3.scaleSequential(d3.interpolateBlues).domain([d3.min(csvData, d => d.Fat), d3.max(csvData, d => d.Fat)]),
        'Protein': d3.scaleSequential(d3.interpolateReds).domain([d3.min(csvData, d => d.Protein), d3.max(csvData, d => d.Protein)]),
        'Fruit': d3.scaleSequential(d3.interpolateOranges).domain([d3.min(csvData, d => d.Fruit), d3.max(csvData, d => d.Fruit)]),
        'Sugar': d3.scaleSequential(d3.interpolatePurples).domain([d3.min(csvData, d => d.Sugar), d3.max(csvData, d => d.Sugar)]),
        'Veg': d3.scaleSequential(d3.interpolateGreens).domain([d3.min(csvData, d => d.Veg), d3.max(csvData, d => d.Veg)]),
        'Obesity': d3.scaleSequential(d3.interpolateWarm).domain([d3.max(csvData, d => d.Obesity), d3.min(csvData, d => d.Obesity)]) //swap min, max to make lighter color represent lower rate 
    };
    return scales[type](value);
}

});
