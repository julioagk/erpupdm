const { PDFParse } = require('pdf-parse');
const fs = require('fs');

async function test() {
  const parser = new PDFParse();
  console.log(parser.load);
}
test();
