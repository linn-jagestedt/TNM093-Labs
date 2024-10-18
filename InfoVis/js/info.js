// https://stackoverflow.com/questions/9268645/creating-a-table-linked-to-a-csv-file
// Set the dimensions and margins of the graph
function info(data) {

	var margin = { top: 10, right: 40, bottom: 10, left: 60 },
		width = $('div.info-container').width(),
		height = $('div.info-container').height();

	var info_svg = d3.select("info-container")
		.append("svg")
		.attr('viewBox', '0 0 ' + (
			width + margin.left + margin.right)
			+ ' ' + (height + margin.top + margin.bottom))
		.attr('width', '100%')
		.attr('height', height)
		.attr('preserveAspectRatio', 'none')
		.append('g')
		.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

	var file = "data/SocialScience.csv";

	d3.csv(file, function (data) {
		var columns = ["Region", "Inkomst", "Skattesats",
			"H. studerande", "Medelålder", "Lgh i flerbostadshus",
			"Inflyttade", "Utflyttade", "Folkmängd"];

		var table = d3.select("#info-container").append("table")
			.attr('class', 'table-striped table-hover');
		var thead = table.append("thead");
		var tbody = table.append("tbody");

		// Append the header row
		thead.append("tr")
			.selectAll("th")
			.data(columns)
			.enter()
			.append("th")
			.attr('class', 'font-size')
			.text(function (column) { return column; });

		// Create a row for each object in the data
		var rows = tbody.selectAll("tr")
			.data(data)
			.enter()
			.append("tr");

		// Create a cell in each row for each column
		var cells = rows.selectAll("td")
			.data(function (row) {
				return columns.map(function (column) {
					return { column: column, value: row[column] };
				});
			})
			.enter()
			.append("td")
			.text(function (d) { return d.value; })

			/**
			*  Final Task -- call the two function below.
			*/
			

		function selectValues(param) {
			pc.selectLine(param.value)
			sp.selectDot(param.value)
		}
		function resetSelectedValues(params) {
			pc.resetSelectLine()
			sp.resetSelectDot()
		}
	});
}