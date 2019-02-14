import * as assert from 'assert';
import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as glob from 'glob';
import * as path from 'path';
import * as ts from 'typescript';
import { transformer } from './transformer';

const configJson = fs.readFileSync('cpiconfig.json', 'utf-8');
assert(configJson, 'cpiconfig.json must have!');
const config = JSON.parse(configJson);
assert(config.rootDir, 'cpiconfig.rootDir must have!');
assert(config.outDir, 'cpiconfig.outDit must have!');
assert(config.files, 'cpiconfig.files must have!');

const compilerOptions = {
    module: ts.ModuleKind.CommonJS,
    declaration: true,
    noImplicitAny: false,
    noLib: false,
    allowSyntheticDefaultImports: true,
    emitDecoratorMetadata: true,
    experimentalDecorators: true,
    target: ts.ScriptTarget.ES2015,
    outDir: config.outDir,
    rootDir: config.rootDir,
};

const files = config.files
    .map((patten: string) => glob.sync(patten, { cwd: config.rootDir }))
    .reduce((acc, cur) => acc.concat(cur), []);

const compilerHost = ts.createCompilerHost(compilerOptions);
const program = ts.createProgram(files.map((f: string) => path.join(config.rootDir, f)), compilerOptions, compilerHost);

program.emit(undefined, (
    fileName,
    data,
    writeByteOrderMark,
    onError,
    sourceFiles) => {
    if (!isOutput(fileName)) {
        return;
    }
    compilerHost.writeFile(fileName, data, writeByteOrderMark, onError, sourceFiles);
}, undefined, undefined, {
        before: [
            transformer,
        ],
    });
const pkg = {
    name: config.name,
    version: config.version,
    description: config.description,
};
fse.outputFileSync(path.join(config.outDir, 'package.json'), JSON.stringify(pkg, undefined, '  '));

function isOutput(file: string) {
    const list = files.slice(0);
    while (list.length) {
        const item = list.pop();
        if (file.replace(/(\.d)?\.(ts|js)$/, '.ts').endsWith(item)) {
            return true;
        }
    }
}
