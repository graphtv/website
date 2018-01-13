$(document).ready(function() {
	$('.ui.search').search({
		apiSettings: {
			url: 'https://api.graphtv-dev.spectralcoding.com/search/{query}'
		},
		selectFirstResult: true,
		showNoResults: true,
		type: 'shows',
		templates: {
			shows: function (response) {
				html = '';
				response.results.forEach(function(curShow) {
					html += '<a class="result"><div class="content"><div class="title">' + curShow['t'] + '</div>' + 
						'<div class="description ui three column grid">' +
						'<div class="column">' + curShow['y'] + '</div>' +
						'<div class="column">' + curShow['r'] + '/10</div>' +
						'<div class="column">' + curShow['v'].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' Votes</div>' +
						'</div></div></a>';
				});
				return html;
			}
		},
		onSelect: function (result, response) {
			console.log("On Select:")
			console.log(result);
			console.log(response);
			$('#search_content').transition('fade out');
			$('#chart_content').transition('fade in');
		},
	});
});
