# GraphTV - Website

## Build Instructions

1. Clone repository
2. Enter `semantic/`
3. `npm install`
	* Will automatically build the Semantic UI config files ([semantic/src](semantic/src)) into CSS/JS ([htdocs/assets/semantic](htdocs/assets/semantic))
4. Modify the first line of [htdocs/assets/js/master.js](htdocs/assets/js/master.js) so that `apiEndpointHostname` is set to the API endpoint hostname (usually beginning with `api.`)
5. Optional: If you're doing modifications or development work this is where you make changes and test.
	* Any Semantic UI changes (under [semantic](semantic)) must be compiled with `gulp build` from the [semantic](semantic) directory.
	* Quick docker command for a local nginx instance: `docker run -v /path/to/graphtv/website/htdocs:/usr/share/nginx/html:ro -p 80:80 -d nginx nginx-debug -g 'daemon off;'`
6. Upload to your S3 bucket using `aws s3 sync htdocs/ s3://bucket-name/ --delete`. Recommend testing with `--dryrun` as well.
7. Invalidate caches in CloudFront (Note: Invalidating `/*` doesn't cost extra, it just may impact users until files are cached again)

## Build Status

Coming soon!

## Credits

GraphTV Icon by [freepik](https://www.freepik.com).

## License

GraphTV is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

GraphTV is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with GraphTV.  If not, see <http://www.gnu.org/licenses/>.
