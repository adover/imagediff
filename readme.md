# Image diffing tool
Uses [Ubers Image Diff](https://github.com/uber-archive/image-diff), [CSV Parse](https://www.npmjs.com/package/csv-parse) and [Google Chrome Headless](https://developers.google.com/web/updates/2017/04/headless-chrome).

## Usage
Clone down the repo and run `npm install` from the root. Then open up `src/imageDiff.js` and modify the config options between the comments. 

*Also ensure that the path to Chrome in the `package.json` file is correct.*

To run, place a csv file in the root folder with the same name as in the config, and then run `npm start:diff`.
