$(document).ready(function() {
	$('.ui.search').search({
		apiSettings: {
			url: 'https://api.graphtv-dev.spectralcoding.com/search/{query}'
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
		onSelect: function (result, response) {
			console.log("On Select:")
			console.log(result);
			console.log(response);
			$('#chart_show_name').html(result['t']);
			$('#search_row').transition({
				animation: 'fade out',
				onComplete: function() {
					// We want to eventually change the page URL and then go directly to the
					// graph when that page is pulled up. How to we serve the homepage
					// from any URL that doesn't have static content (such as images/js/css)?
					// Maybe we just have to do like https://hostname/?q=[id]
					// window.history.pushState("", "", '/' + result['i']);
					console.log("done!");
					$('#main_column').css("max-width", "1500px");
					$('#chart_row').transition('fade in');
				}
			});
		},
	});
	// Start temp code to auto-transition during debugging
	search_result = {
        'i': '3N6z',
        'r': 9.5,
        't': 'Breaking Bad',
        'v': 1049294,
        'y': '2008-2013'
    }
	$('#search_row').transition({
		animation: 'fade out',
		onComplete: function() {
			$('#main_column').css("max-width", "1500px");
			$('#chart_row').html('<h1 id="chart_show_name">Breaking Bad</h1>' +
				'<div id="highcharts" style="height:600px;"></div>');
			show_chart(search_result);
			$('#chart_row').transition('fade in');
		}
	});
	// End temp code
	function get_ratings(search_result) {
		//console.log('Search Result:');
		//console.log(search_result);
		$.ajax({
			url: 'https://api.graphtv-dev.spectralcoding.com/show/' + search_result['i'] + '/ratings',
			success: function(ratings_data) {
				season_colors = [
					'#B03060',
					'#FE9A76',
					'#FFD700',
					'#32CD32',
					'#016936',
					'#008080',
					'#0E6EB8',
					'#EE82EE',
					'#B413EC',
					'#FF1493',
					'#A52A2A',
					'#A0A0A0',
					'#000000'
				]
				//console.log('Ratings Data:');
				//console.log(ratings_data);
				ep_list = ratings_data.l
				series_obj = {}
				// Get the objects into an unordered object:
				// show_series[season][episode] = ratings
				Object.keys(ep_list).forEach(function(ep_id) {
					//console.log(ep_id, ep_list[ep_id]);
					ep_data = ep_list[ep_id];
					if (!series_obj.hasOwnProperty(ep_data.s)) {
						series_obj[ep_data.s] = {}
					}
					// Maybe need something here incase r is -1 or missing?
					series_obj[ep_data.s][ep_data.e] = ep_data;
				});
				//console.log(series_obj);
				// Create a list of seasons (we can't assume IMDB will have every season)
				seasons = []
				for (k in series_obj) {
					if (series_obj.hasOwnProperty(k)) {
						seasons.push(k);
					}
				}
				seasons.sort(function(a, b){return a-b});
				//console.log(seasons);
				point_num = 0;
				data_by_ep_num = {}
				seasons.forEach(function(cur_season) {
					ordered_eps = []
					//console.log("Season: " + cur_season);
					// Create a list of episodes (we can't assume IMDB will have every episode)
					episodes = []
					for (k in series_obj[cur_season]) {
						if (series_obj[cur_season].hasOwnProperty(k)) {
							episodes.push(k);
						}
					}
					episodes.sort(function(a, b){return a-b});
					//console.log("Episodes: ");
					//console.log(episodes);
					episodes.forEach(function(cur_episode) {
						ordered_eps.push([point_num, series_obj[cur_season][cur_episode].r])
						data_by_ep_num[point_num] = series_obj[cur_season][cur_episode]
						//console.log(point_num + ' - S' + cur_season + 'E' + cur_episode);
						point_num++;
					});
					//console.log(ordered_eps);
					window.chart.addSeries({
						data: ordered_eps,
						color: season_colors[cur_season]
					});
					start_x = ordered_eps[0][0];
					start_y = ss.linearRegressionLine(ss.linearRegression(ordered_eps))(start_x);
					end_x = ordered_eps[ordered_eps.length - 1][0];
					end_y = ss.linearRegressionLine(ss.linearRegression(ordered_eps))(end_x);
					window.chart.addSeries({
						type: 'line',
						data: [[start_x, start_y], [end_x, end_y]],
						color: season_colors[cur_season]
					});
				});
				window.all_eps = data_by_ep_num;
				// Put the objects in order and series-ify them:
			},
			cache: false
		});
	}
	function show_chart(result) {
		window.chart = new Highcharts.Chart({
			chart: {
				renderTo: 'highcharts',
				events: {
					load: get_ratings(search_result)
				},
				type: 'scatter',
				zoomType: 'xy'
			},
			title: {
				text: 'Height Versus Weight of 507 Individuals by Gender'
			},
			subtitle: {
				text: 'Source: Heinz  2003'
			},
			xAxis: {
				title: {
					enabled: true,
					text: 'Episode Number'
				},
				startOnTick: true,
				endOnTick: true,
				showLastLabel: true
			},
			yAxis: {
				title: {
					text: 'Episode Rating'
				}
			},
			legend: {
				layout: 'vertical',
				align: 'left',
				verticalAlign: 'top',
				x: 100,
				y: 70,
				floating: true,
				backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF',
				borderWidth: 1
			},
			plotOptions: {
				line: {
					marker: {
						enabled: false
					},
					states: {
						hover: {
							lineWidth: 0
						}
					},
					enableMouseTracking: false
				},
				scatter: {
					marker: {
						symbol: 'circle',
						radius: 5,
						states: {
							hover: {
								enabled: true,
								lineColor: 'rgb(100,100,100)'
							}
						}
					},
					states: {
						hover: {
							marker: {
								enabled: false
							}
						}
					}
				}
			},
			tooltip: {
				formatter: function() {
					show_obj = window.all_eps[this.x];
					season_str = ((show_obj.s < 10) ? '0' + show_obj.s : show_obj.s)
					episode_str = ((show_obj.e < 10) ? '0' + show_obj.e : show_obj.e)
					return 'S' + season_str + 'E' + episode_str + ': ' + show_obj.t;
				}
			}
		});
	};
});
