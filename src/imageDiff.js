console.log('--------------------------');
console.log('        IMAGEDIFF         ');
console.log('        by adover         ');
console.log('--------------------------');

const CDP = require('chrome-remote-interface');
const file = require('fs');
const screenshotFolder = 'screenshots';
const url = 'https://www.wellingtonnz.com';
const format = 'jpeg';
const viewportWidth = 1440;
const viewportHeight = 900;
const delay = 0;
const fullPage = true;
const parse = require('csv-parse');

/**
 * Configuration options
 */

const inputFile = 'input.csv';
const host = {
  staging: 'http://staging',
  production: 'http://production'
}

const viewports = {
  mobile: {
    width: 320,
    height: 480
  },
  desktop: {
    width: 1024,
    height: 768    
  }
}

/**
 * End configuration options
 */

const imageDiff = require('image-diff');

class ImageDiffTool {

  constructor() {
    this.csvData = [];
    this.readCSV();
  }

  async readCSV() {

    if(inputFile){

      const stream = file.createReadStream(inputFile).pipe(parse({ delimiter : ',' }));

      stream
        .on('data', data => {

          const prettyName = data[0].substr(1, data[0].length - 2).replace(/\//g, '_');

          this.csvData.push({
            name: prettyName,
            staging: host.staging + data[0],
            production: host.production + data[0],
            result: {}
          });

        })
        .on('end', () => {

          if(this.csvData.length > 0) {
            return this.generateScreenShots(this.csvData);
          }

          throw new Error('This didn\'t work');

        })
        .on('error', err => {

          throw new Error(err);

        })

    }
    
  }

  async generateScreenShots(data) {

    for(let i of data){

      await this.doCDP(i.staging, `${i.name}_desktop_staging`, viewports.desktop);
      await this.doCDP(i.production, `${i.name}_desktop_production`, viewports.desktop);

      await this.doCDP(i.staging, `${i.name}_mobile_staging`, viewports.mobile);
      await this.doCDP(i.production, `${i.name}_mobile_production`, viewports.mobile);

      this.doImageDiff(i.name, viewports);
    }

  } 

  doCDP(url, filename, viewport) {

    return new Promise((resolve, reject) => {

      CDP(async (client) => {
        
        // extract domains
        const {DOM, Emulation, Network, Page, Runtime} = client;
         
        await Page.enable();
        await DOM.enable();
        await Network.enable();

        const deviceMetrics = {
          width: viewport.width,
          height: viewport.height,
          deviceScaleFactor: 0,
          mobile: false,
          fitWindow: false
        }

        await Emulation.setDeviceMetricsOverride(deviceMetrics);
        await Emulation.setVisibleSize({width: viewport.width, height: viewport.height});
        await Page.navigate({url});

        Page.loadEventFired(async () => {

          setTimeout(async function() {

            const screenshot = await Page.captureScreenshot({fromSurface: true});
            const buffer = new Buffer(screenshot.data, 'base64');

            file.writeFile(`${screenshotFolder}/${filename}.png`, buffer, 'base64', function(err) {
              if(err){
                console.log(err);
              }else{
                console.log(`Screenshot saved to ${screenshotFolder}/${filename}.png`)
                resolve();
              }

              client.close();

            })

          }, 0)

        })

      }).on('error', err => {
        console.error(err);
      });

    });

  }

  doImageDiff(filename) {

    console.log(`Processing diff of ${filename}.png`);

    for(let vp in viewports){
      imageDiff({
        actualImage: `${screenshotFolder}/${filename}_${vp}_staging.png`,
        expectedImage: `${screenshotFolder}/${filename}_${vp}_production.png`,
        diffImage: `${screenshotFolder}/${filename}_${vp}_DIFF.png`,
      }, function (err, imagesAreSame) {
        if(err) console.log(err);

        console.log(imagesAreSame);

      });
    }

  }

}

const imageDiffTool = new ImageDiffTool();