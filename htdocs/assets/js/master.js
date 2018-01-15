var apiEndpointHostname = 'api.graphtv-dev.spectralcoding.com';
var getUrlParameter = function getUrlParameter(sParam) {
	var sPageURL = decodeURIComponent(window.location.search.substring(1)),
		sURLVariables = sPageURL.split('&'),
		sParameterName,
		i;

	for (i = 0; i < sURLVariables.length; i++) {
		sParameterName = sURLVariables[i].split('=');

		if (sParameterName[0] === sParam) {
			return sParameterName[1] === undefined ? true : sParameterName[1];
		}
	}
};
$(document).ready(function() {
	activateProperPage();
	function activateProperPage() {
		// Still seems to be some bugs with Microsoft Edge
		// properly managing titles. Chrome 64 and Firefox 57 work
		q_value = getUrlParameter('q');
		if (q_value) {
			if (q_value == 'about') {
				fadeAll(function() {
					document.title = 'GraphTV :: About';
					$('#about_page').transition('fade in');
				});
			} else if (q_value == 'popular') {
				fadeAll(function() {
					document.title = 'GraphTV :: Popular Shows';
					$('#popular_page').transition('fade in');
				});
			} else {
				fadeAll(function() {
					// We're linking directly to a show page
					$.ajax({
						url: 'https://' + apiEndpointHostname + '/show/' + q_value + '/ratings',
						success: function(ratings_data) {
							switchToChart(
								-1,
								ratings_data.t,
								ratings_data.y,
								ratings_data.r,
								ratings_data.v,
								ratings_data
							);
						},
						cache: false
					});
				});
			}
		} else {
			fadeAll(function() {
				// Viewing the default page
				document.title = 'GraphTV :: Graph Your Favorite TV Shows';
				$('#search_page').transition('fade in');
				$('#search_input').focus();
			});
		}
	}
	$(window).on("popstate", function(e) {
		activateProperPage();
	});
	function fadeAll(onHidden) {
		oneWasVisible = false;
		if ($('#search_page').transition('is visible')) {
			$('#search_page').transition({
				animation: 'fade out',
				onComplete: function() {
					$('#search_input').val('');
					onHidden();
				}
			});
			oneWasVisible = true;
		}
		if ($('#chart_page').transition('is visible')) {
			$('#chart_page').transition({
				animation: 'fade out',
				onComplete: function() {
					resetChart();
					onHidden();
				}
			});
			oneWasVisible = true;
		}
		if ($('#about_page').transition('is visible')) {
			$('#about_page').transition({
				animation: 'fade out',
				onComplete: function() {
					onHidden();
				}
			});
			oneWasVisible = true;
		}
		if ($('#popular_page').transition('is visible')) {
			$('#popular_page').transition({
				animation: 'fade out',
				onComplete: function() {
					onHidden();
				}
			});
			oneWasVisible = true;
		}
		if (!oneWasVisible) {
			// Ensure that the code always gets run even if no
			// pages actually needed to get faded.
			onHidden();
		}
	}
	$('#graphtv_logo_link').click(function(){
		fadeAll(function() {
			// Set the page URL to the show URL
			window.history.pushState("", "", '/');
			document.title = 'GraphTV :: Graph Your Favorite TV Shows';
			$('#search_page').transition('fade in');
			$('#search_input').focus();
		});
	});
	$('#about_link').click(function(){
		fadeAll(function() {
			// Set the page URL to the show URL
			window.history.pushState("", "", '/?q=about');
			document.title = 'GraphTV :: About';
			$('#about_page').transition('fade in');
		});
	});
	$('#popular_link').click(function(){
		fadeAll(function() {
			// Set the page URL to the show URL
			window.history.pushState("", "", '/?q=popular');
			document.title = 'GraphTV :: Popular Shows';
			$('#popular_page').transition('fade in');
		});
	});
	$('#chart_scale_tip a').click(function(event){
		if (event.target.innerText == '[ Scale 0 to 10 ]') {
			$('#chart_scale_tip a').html("[ Automatic Scaling ]");
			window.chart.yAxis[0].update({ min: 0 });
		} else {
			$('#chart_scale_tip a').html("[ Scale 0 to 10 ]");
			window.chart.yAxis[0].update({ min: null });
		}
	});
	$('.ui.search').search({
		apiSettings: {
			url: 'https://' + apiEndpointHostname + '/search/{query}'
		},
		selectFirstResult: true,
		showNoResults: true,
		minCharacters: 3,
		type: 'shows',
		templates: {
			shows: function (response) {
				html = '';
				response.results.forEach(function(curShow) {
					if (curShow['r'] != -1) {
						rating = curShow['r'] + '/10';
					} else {
						rating = 'No Rating';
					}
					html += '<a class="result"><div class="content"><div class="title">' + curShow['t'] + '</div>' +
						'<div class="description ui three column grid">' +
						'<div class="column">' + curShow['y'] + '</div>' +
						'<div class="column">' + rating + '</div>' +
						'<div class="column">' + curShow['v'].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' Votes</div>' +
						'</div></div></a>';
				});
				return html;
			}
		},
		onSelect: function (search_result, response) {
			switchToChart(
				search_result.i,
				search_result.t,
				search_result.y,
				search_result.r,
				search_result.v,
				null
			);
		},
	});
	function switchToChart(show_id, title, years, ratings, votes, show_data) {
		fadeAll(function() {
			$('#chart_page #chart_show_title').html(title);
			$('#chart_page #chart_show_year').html(years);
			$('#chart_page #chart_show_rating').html(ratings + '/10 (' + votes.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' Votes)');
			// Set the page URL to the show URL
			if (show_id != -1) {
				if (getUrlParameter('q') != show_id) {
					window.history.pushState("", "", '/?q=' + show_id);
				}
				document.title = 'GraphTV :: ' + title;
			}
			resetChart();
			getRatings(show_id, show_data);
			$('#chart_page').transition('fade in');
		});
	}
	function getRatings(show_id, show_data) {
		if (show_id == -1) {
			chartRatings(show_data);
		} else {
			// We don't have it, so load it from the API
			$.ajax({
				url: 'https://' + apiEndpointHostname + '/show/' + show_id + '/ratings',
				success: function(ratings_data) {
					chartRatings(ratings_data);
				},
				cache: false
			});
		}
	}
	function chartRatings(ratings_data) {
		// Radius for the episode with the most votes
		large_radius = 10;
		// Radius for the episode with the least votes
		small_radius = 3;
		// How many episodes before we reduce the radius size bt 25% (repeats)?
		radius_reducer = 200;
		// Radiuses could be smaller than small_radius due to radius_reducer... Absolute minimum?
		minimum_radius = 1;
		// Stack Exchange (CrossValidated): “Best” series of colors to use for differentiating series in publication-quality plots
		// https://stats.stackexchange.com/questions/118033/best-series-of-colors-to-use-for-differentiating-series-in-publication-quality
		// Recommends Cynthia Brewer's ColorBrewer2
		// http://colorbrewer2.org/#type=qualitative&scheme=Paired&n=10
		// I just swapped the light/dark versions so dark is first.
		// If there are more series than season_colors it will use season_colors_many
		// and then loop through them.
		season_colors = ['#1f78b4','#33a02c','#e31a1c','#ff7f00','#6a3d9a']
		season_colors_bands = ['#a6cee3','#b2df8a','#fb9a99','#fdbf6f','#cab2d6'];
		// Lighter Immediately After
		//season_colors_many = ['#1f78b4','#a6cee3','#33a02c','#b2df8a','#e31a1c','#fb9a99','#ff7f00','#fdbf6f','#6a3d9a','#cab2d6'];
		// Lighter Offset By 1
		//season_colors_many = ['#1f78b4','#cab2d6','#33a02c','#a6cee3','#e31a1c','#b2df8a','#ff7f00','#fb9a99','#6a3d9a','#fdbf6f'];
		// Lighter Offset By 2
		//season_colors_many = ['#1f78b4','#fdbf6f','#33a02c','#cab2d6','#e31a1c','#a6cee3','#ff7f00','#b2df8a','#6a3d9a','#fb9a99'];
		// Same Colors Just Looped More
		season_colors_many = season_colors
		range_radius = large_radius - small_radius;
		ep_list = ratings_data.l
		point_count = 0
		series_obj = {}
		// Get the objects into an unordered object:
		// show_series[season][episode] = ratings
		least_votes = -1
		most_votes = -1
		Object.keys(ep_list).forEach(function(ep_id) {
			ep_data = ep_list[ep_id];
			// If there is no rating then we don't chart it.
			if (ep_data.hasOwnProperty('r')) {
				if (!series_obj.hasOwnProperty(ep_data.s)) {
					series_obj[ep_data.s] = {}
				}
				series_obj[ep_data.s][ep_data.e] = ep_data;
				if (least_votes == -1 || least_votes > ep_data.v) { least_votes = ep_data.v }
				if (most_votes == -1 || most_votes < ep_data.v) { most_votes = ep_data.v }
				point_count++;
			}
		});
		gap_votes = most_votes - least_votes;
		// For point sizes and plot band titles
		reduction_level = Math.floor(point_count / radius_reducer)
		marker_size_mult = Math.pow(0.9, reduction_level);
		// BUG: Going to have to figure something out for this...
		// https://graphtv-dev.spectralcoding.com/?q=gDt
		if (reduction_level < 2) {
			season_abbrev = 'Season ';
		} else if (reduction_level < 3) {
			season_abbrev = 'Sea ';
		} else {
			season_abbrev = 'S';
		}
		// Create a list of seasons (we can't assume IMDB will have every season)
		seasons = []
		for (k in series_obj) {
			if (series_obj.hasOwnProperty(k)) {
				seasons.push(k);
			}
		}
		seasons.sort(function(a, b){return a-b});
		if (seasons.length > season_colors.length) {
			season_colors = season_colors_many;
		}
		point_num = 1;
		data_by_ep_num = {}
		seasons.forEach(function(cur_season) {
			// Ordered Episodes for Season Data Points
			ordered_eps = []
			// XY Coordinate List for Linear Regression for Season Trend Line
			x_y_coords = []
			// Create a list of episodes (we can't assume IMDB will have every episode)
			episodes = []
			for (k in series_obj[cur_season]) {
				if (series_obj[cur_season].hasOwnProperty(k)) {
					episodes.push(k);
				}
			}
			episodes.sort(function(a, b){return a-b});
			episodes.forEach(function(cur_episode) {
				cur_ep_obj = series_obj[cur_season][cur_episode]
				x_y_coords.push([point_num, cur_ep_obj.r]);
				pct_size = (cur_ep_obj.v - least_votes) / gap_votes;
				// Get the default Marker Radius
				marker_radius = small_radius + (range_radius * pct_size)
				// Reduce the marker size based on the amount of episodes.
				// Value is the same as marker_radius if less than
				// radius_reducer shows
				marker_radius = (marker_radius * marker_size_mult).toFixed(2);
				ordered_eps.push({
					x: point_num,
					y: cur_ep_obj.r,
					marker: { radius: Math.max(marker_radius, minimum_radius) }
				});
				data_by_ep_num[point_num] = series_obj[cur_season][cur_episode]
				point_num++;
			});
			// Add the point for the episode
			// Color here takes the zero-indexed season number and gets a color
			// based on the index (looping around the color list using modulo)
			window.chart.addSeries({
				data: ordered_eps,
				color: season_colors[(cur_season - 1) % season_colors.length]
			}, false);
			// Use linear regression to calculate (X1, Y1), (X2, Y2) points
			// for the season trend line
			start_x = x_y_coords[0][0];
			start_y = ss.linearRegressionLine(ss.linearRegression(x_y_coords))(start_x);
			end_x = x_y_coords[x_y_coords.length - 1][0];
			end_y = ss.linearRegressionLine(ss.linearRegression(x_y_coords))(end_x);
			// Add the season trend line
			window.chart.addSeries({
				type: 'line',
				data: [[start_x, start_y], [end_x, end_y]],
				color: season_colors[(cur_season - 1) % season_colors.length]
			}, false);
			window.chart.xAxis[0].addPlotBand({
				// The 0.5 here starts it half-way between the previous season's
				// last episode and the current season's first episode
				from: point_num - x_y_coords.length - 0.5,
				// This should actually be point_num - 1 + 0.5, but simplified below
				to: point_num - 0.5,
				label: {
					text: season_abbrev + cur_season,
					verticalAlign: 'bottom'
				}
				// Playing with some code to add plot bands...
				// Works, but not sure if we want it...
				//color: season_colors_bands[(cur_season - 1) % season_colors.length],
				// And vertical lines between the seasons...
				//borderColor: '#000000',
				//borderWidth: 1,
			});
		});
		window.all_eps = data_by_ep_num;
		window.chart.redraw();
	}
	function resetChart() {
		window.chart = new Highcharts.Chart({
			chart: {
				renderTo: 'highcharts',
				type: 'scatter',
				zoomType: 'xy'
			},
			credits: {
				enabled: false
			},
			title: { text: '' },
			xAxis: {
				labels: { enabled: false },
				minorTicks: false,
				tickColor: 'transparent',
				title: { enabled: false, }
			},
			yAxis: {
				title: { text: 'Episode Rating' },
				max: 10
			},
			legend: { enabled: false },
			plotOptions: {
				line: {
					marker: { enabled: false },
					states: {
						hover: { lineWidth: 0 }
					},
					enableMouseTracking: false
				},
				scatter: {
					marker: {
						symbol: 'circle',
						states: {
							hover: {
								enabled: true,
								lineColor: 'rgb(100,100,100)'
							}
						}
					},
					states: {
						hover: {
							marker: { enabled: false }
						}
					},
				},
				series: { turboThreshold: 50000 }
			},
			tooltip: {
				formatter: function() {
					show_obj = window.all_eps[this.x];
					season_str = ((show_obj.s < 10) ? '0' + show_obj.s : show_obj.s)
					episode_str = ((show_obj.e < 10) ? '0' + show_obj.e : show_obj.e)
					return '<b>S' + season_str + 'E' + episode_str + ': ' + show_obj.t + '</b><br />' +
					show_obj.r + ' - ' + show_obj.v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' Votes';
				}
			}
		});
	}
});
