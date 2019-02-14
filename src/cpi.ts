import * as assert from 'assert';
import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as glob from 'glob';
import * as path from 'path';
import * as ts from 'typescript';
import { transformer } from './transformer';

const printer = ts.createPrinter();
const tmpName = '.cpi.ts';

const configJson = fs.readFileSync('cpiconfig.json', 'utf-8');
assert(configJson, 'cpiconfig.json must have!');
const config = JSON.parse(configJson);
assert(config.rootDir, 'cpiconfig.rootDir must have!');
assert(config.outDir, 'cpiconfig.outDit must have!');
assert(config.controllers, 'cpiconfig.controllers must have!');

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

const controllers = config.controllers
    .map((patten: string) => glob.sync(patten, { cwd: config.rootDir }))
    .reduce((acc, cur) => acc.concat(cur), []);

controllers.forEach((c: string) => {
    const code = fs.readFileSync(path.join(config.rootDir, c), 'utf-8');
    const source = ts.createSourceFile('controller.ts', code, ts.ScriptTarget.ES2016, true);
    const result = ts.transform(source, [transformer]);
    const transformedSourceFile = result.transformed[0];
    const resultCode = printer.printFile(transformedSourceFile);
    fse.outputFileSync(path.join(config.rootDir, `${c}${tmpName}`), resultCode);
});

const compilerHost = ts.createCompilerHost(compilerOptions);
const program = ts.createProgram(
    controllers.map((f: string) => path.join(config.rootDir, `${f}${tmpName}`)),
    compilerOptions,
    compilerHost);

program.emit(undefined, (
    fileName,
    data,
    writeByteOrderMark,
    onError,
    sourceFiles) => {
    compilerHost.writeFile(fileName.replace('.ts.cpi', ''), data, writeByteOrderMark, onError, sourceFiles);
}, undefined, undefined, undefined);
controllers.forEach((c: string) => fse.removeSync(path.join(config.rootDir, `${c}${tmpName}`)));
const pkg = {
    name: config.name,
    version: config.version,
    description: config.description,
};
fse.outputFileSync(path.join(config.outDir, 'package.json'), JSON.stringify(pkg, undefined, '  '));
