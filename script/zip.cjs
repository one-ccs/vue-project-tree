const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const packageJson = require('../package.json');


const sourceDir = path.resolve(__dirname, '../dist');
const outputFile = path.resolve(__dirname, `../release/${packageJson.name}_${packageJson.version}.zip`);


if (!fs.existsSync(sourceDir)) {
    console.error(`dist 目录 "${sourceDir}" 不存在`);
    process.exit(1);
}

const output = fs.createWriteStream(outputFile);
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
    console.log(`压缩完成: ${archive.pointer()} bytes`);
});

archive.on('error', (err) => {
    throw err;
});

archive.pipe(output);
archive.directory(sourceDir, false);
archive.finalize();
