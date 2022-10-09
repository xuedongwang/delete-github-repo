const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const marked = require('marked');


const md = fs.readFileSync(path.join(__dirname, '../README.md'), 'utf-8');
const tpl = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf-8');

let template = ejs.compile(tpl, {});
const ret = template({
  content: marked.parse(md)
});

console.log(ret);

fs.writeFileSync(path.join(__dirname, '../docs/index.html'), ret)